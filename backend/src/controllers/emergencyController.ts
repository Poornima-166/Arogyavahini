import { Request, Response, NextFunction } from 'express';
import { EmergencyRequestModel } from '../models/EmergencyRequest.js';
import { AmbulanceModel } from '../models/Ambulance.js';

export async function getEmergencies(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as any;
    const emergencies = await EmergencyRequestModel.findAll(status);
    res.json({ success: true, count: emergencies.length, data: emergencies });
  } catch (err) {
    next(err);
  }
}

export async function getEmergencyById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const emergency = await EmergencyRequestModel.findById(id);
    if (!emergency) {
      return res.status(404).json({ success: false, error: { message: 'Emergency request not found' } });
    }
    res.json({ success: true, data: emergency });
  } catch (err) {
    next(err);
  }
}

export async function createEmergency(req: Request, res: Response, next: NextFunction) {
  try {
    const { patient_name, emergency_type, location, latitude, longitude, phone } = req.body;
    if (!patient_name || !emergency_type || !location || latitude === undefined || longitude === undefined || !phone) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required emergency fields: patient_name, emergency_type, location, latitude, longitude, phone' },
      });
    }

    const emergency = await EmergencyRequestModel.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Emergency request created. Awaiting ambulance dispatch.',
      data: emergency,
    });
  } catch (err) {
    next(err);
  }
}

export async function acceptEmergency(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const { driver_id, ambulance_id } = req.body;

    if (!driver_id || !ambulance_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'driver_id and ambulance_id are required to accept an emergency' },
      });
    }

    const assigned = await EmergencyRequestModel.assignDriverAndAmbulance(id, driver_id, ambulance_id);
    if (!assigned) {
      return res.status(404).json({ success: false, error: { message: 'Emergency request not found' } });
    }

    // Set ambulance to BUSY
    await AmbulanceModel.updateStatus(ambulance_id, 'BUSY');

    res.json({
      success: true,
      message: 'Emergency accepted and ambulance assigned successfully',
      data: assigned,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEmergencyStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: { message: 'Status is required' } });
    }

    const updated = await EmergencyRequestModel.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Emergency request not found' } });
    }

    // If completed or cancelled, free the ambulance
    if (['COMPLETED', 'CANCELLED'].includes(status) && updated.ambulance_id) {
      await AmbulanceModel.updateStatus(updated.ambulance_id, 'AVAILABLE');
    }

    res.json({
      success: true,
      message: `Emergency status updated to ${status}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
