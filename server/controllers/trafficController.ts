/**
 * ==============================================================================
 * PROJECT: AROGYAVAHINI
 * MODULE:  Traffic Priority Controller
 * ==============================================================================
 * Handles traffic priority commands, manual overrides, and status queries.
 * Forwards commands to esp32Service to control IoT traffic LEDs over Wi-Fi.
 */

import { Request, Response } from 'express';
import {
  sendTrafficCommand,
  getTrafficSignalStatus,
  SMART_JUNCTIONS,
  evaluateApproachingPreemption,
} from '../services/esp32Service.js';

export const trafficController = {
  /**
   * POST /api/traffic-signals/command
   * Body: { command: 'GREEN_ROUTE_A' | 'GREEN_ROUTE_B' | 'NORMAL_MODE', junctionId?: string, emergencyId?: number, durationSeconds?: number }
   */
  async sendCommand(req: Request, res: Response) {
    try {
      const { command, junctionId, emergencyId, ambulanceId, durationSeconds, triggeredBy } = req.body;

      if (!command) {
        return res.status(400).json({ error: 'Command is required (GREEN_ROUTE_A, GREEN_ROUTE_B, or NORMAL_MODE)' });
      }

      if (!['GREEN_ROUTE_A', 'GREEN_ROUTE_B', 'NORMAL_MODE', 'RESTORE_NORMAL'].includes(command)) {
        return res.status(400).json({
          error: `Invalid command: ${command}. Allowed: GREEN_ROUTE_A, GREEN_ROUTE_B, NORMAL_MODE`,
        });
      }

      const result = await sendTrafficCommand(command, {
        junctionId,
        emergencyId,
        ambulanceId,
        durationSeconds: durationSeconds || 25,
        triggeredBy: triggeredBy || 'DASHBOARD_MANUAL_TRIGGER',
      });

      return res.json({
        success: true,
        message: result.message,
        mode: result.mode,
        hardwareStatus: result.hardwareStatus,
        junction: result.junction,
        state: result.state,
      });
    } catch (err: any) {
      console.error('[TrafficController] Error sending command:', err);
      return res.status(500).json({ error: err.message || 'Failed to send traffic command' });
    }
  },

  /**
   * GET /api/traffic-signals/status
   */
  async getStatus(req: Request, res: Response) {
    try {
      const data = await getTrafficSignalStatus();
      return res.json(data);
    } catch (err: any) {
      console.error('[TrafficController] Error getting status:', err);
      return res.status(500).json({ error: 'Failed to retrieve traffic signal status' });
    }
  },

  /**
   * GET /api/traffic-signals/junctions
   */
  async getJunctions(req: Request, res: Response) {
    return res.json({ junctions: SMART_JUNCTIONS });
  },

  /**
   * POST /api/traffic-signals/auto-preemption
   * Evaluates ambulance GPS against junctions and triggers preemption if approaching
   */
  async autoPreemption(req: Request, res: Response) {
    try {
      const { emergencyId, latitude, longitude, routeName } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'latitude and longitude are required' });
      }

      const result = await evaluateApproachingPreemption(
        Number(emergencyId) || 0,
        Number(latitude),
        Number(longitude),
        routeName || 'Route A Expressway'
      );

      return res.json(result);
    } catch (err: any) {
      console.error('[TrafficController] Error in autoPreemption:', err);
      return res.status(500).json({ error: err.message || 'Auto preemption check failed' });
    }
  },

  /**
   * POST /api/traffic-signals/reset
   * Quick restore to normal mode
   */
  async reset(req: Request, res: Response) {
    try {
      const result = await sendTrafficCommand('NORMAL_MODE', {
        triggeredBy: 'ADMIN_RESET_BUTTON',
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to reset traffic signals' });
    }
  },
};
