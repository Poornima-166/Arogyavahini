import { Request, Response, NextFunction } from 'express';
import { AmbulanceModel } from '../models/Ambulance.js';

export async function getAmbulances(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as any;
    const ambulances = await AmbulanceModel.findAll(status);
    res.json({ success: true, count: ambulances.length, data: ambulances });
  } catch (err) {
    next(err);
  }
}

export async function getAmbulanceById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const ambulance = await AmbulanceModel.findById(id);
    if (!ambulance) {
      return res.status(404).json({ success: false, error: { message: 'Ambulance not found' } });
    }
    res.json({ success: true, data: ambulance });
  } catch (err) {
    next(err);
  }
}

export async function registerAmbulance(req: Request, res: Response, next: NextFunction) {
  try {
    const { vehicle_number, base_location, current_latitude, current_longitude } = req.body;
    if (!vehicle_number || !base_location || current_latitude === undefined || current_longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required ambulance parameters: vehicle_number, base_location, current_latitude, current_longitude' },
      });
    }

    const existing = await AmbulanceModel.findByVehicleNumber(vehicle_number);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { message: `Ambulance with vehicle number ${vehicle_number} already exists` },
      });
    }

    const ambulance = await AmbulanceModel.create(req.body);
    res.status(201).json({ success: true, message: 'Ambulance registered', data: ambulance });
  } catch (err) {
    next(err);
  }
}

export async function updateAmbulanceLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const { latitude, longitude, address } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Latitude and longitude are required' },
      });
    }

    const updated = await AmbulanceModel.updateLocation(id, latitude, longitude, address);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Ambulance not found' } });
    }
    res.json({ success: true, message: 'Location updated', data: updated });
  } catch (err) {
    next(err);
  }
}

export async function updateAmbulanceStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: { message: 'Status is required' } });
    }

    const updated = await AmbulanceModel.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Ambulance not found' } });
    }
    res.json({ success: true, message: 'Status updated', data: updated });
  } catch (err) {
    next(err);
  }
}
