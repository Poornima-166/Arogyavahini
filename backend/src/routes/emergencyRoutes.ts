import { Router } from 'express';
import {
  getEmergencies,
  getEmergencyById,
  createEmergency,
  acceptEmergency,
  updateEmergencyStatus,
} from '../controllers/emergencyController.js';

export const emergencyRoutes = Router();

emergencyRoutes.get('/', getEmergencies);
emergencyRoutes.get('/:id', getEmergencyById);
emergencyRoutes.post('/', createEmergency);
emergencyRoutes.post('/:id/accept', acceptEmergency);
emergencyRoutes.patch('/:id/status', updateEmergencyStatus);
