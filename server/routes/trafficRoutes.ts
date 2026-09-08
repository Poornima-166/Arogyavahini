/**
 * ==============================================================================
 * PROJECT: AROGYAVAHINI
 * MODULE:  Traffic Priority Express Routes
 * ==============================================================================
 * Exposes REST endpoints for traffic signals and ESP32 preemption control.
 */

import { Router } from 'express';
import { trafficController } from '../controllers/trafficController.js';

export const trafficRoutes = Router();

// Send traffic command (GREEN_ROUTE_A, GREEN_ROUTE_B, NORMAL_MODE)
trafficRoutes.post('/command', trafficController.sendCommand);

// Get current traffic signal state and recent priority history
trafficRoutes.get('/status', trafficController.getStatus);

// Get all smart intersections on emergency corridors
trafficRoutes.get('/junctions', trafficController.getJunctions);

// Evaluate GPS auto-preemption for approaching ambulance
trafficRoutes.post('/auto-preemption', trafficController.autoPreemption);

// Reset signals to normal mode
trafficRoutes.post('/reset', trafficController.reset);
