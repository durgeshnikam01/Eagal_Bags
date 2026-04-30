import express from 'express';
import {
  getDispatches,
  createDispatch,
  updateDispatchStatus,
} from '../controllers/dispatchController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getDispatches)
  .post(protect, authorizeRoles('Admin', 'Inventory Manager'), createDispatch);

router.route('/:id/status')
  .put(protect, authorizeRoles('Admin', 'Inventory Manager'), updateDispatchStatus);

export default router;
