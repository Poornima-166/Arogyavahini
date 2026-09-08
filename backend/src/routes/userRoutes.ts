import { Router } from 'express';
import {
  getUsers,
  getUserById,
  registerUser,
  loginUser,
  updateUserProfile,
} from '../controllers/userController.js';

export const userRoutes = Router();

userRoutes.get('/', getUsers);
userRoutes.get('/:id', getUserById);
userRoutes.post('/register', registerUser);
userRoutes.post('/login', loginUser);
userRoutes.put('/:id', updateUserProfile);
