import { Router } from 'express';
import {
  getAmbulances,
  getAmbulanceById,
  registerAmbulance,
  updateAmbulanceLocation,
  updateAmbulanceStatus,
} from '../controllers/ambulanceController.js';

export const ambulanceRoutes = Router();

ambulanceRoutes.get('/', getAmbulances);
ambulanceRoutes.get('/:id', getAmbulanceById);
ambulanceRoutes.post('/', registerAmbulance);
ambulanceRoutes.patch('/:id/location', updateAmbulanceLocation);
ambulanceRoutes.patch('/:id/status', updateAmbulanceStatus);
