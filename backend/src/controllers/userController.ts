import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User.js';

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const role = req.query.role as any;
    const users = await UserModel.findAll(role);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function registerUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role, phone, blood_type, allergies, medical_notes } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: name, email, password, role' },
      });
    }

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { message: 'A user with this email address already exists' },
      });
    }

    const newUser = await UserModel.create({
      name,
      email,
      password,
      role,
      phone,
      blood_type,
      allergies,
      medical_notes,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function loginUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required' },
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
    }

    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      message: 'Login successful',
      data: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await UserModel.update(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
