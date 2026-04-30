import express from 'express';
import {
  getProductionOrders,
  createProductionOrder,
  updateStageStatus,
  getProductionOrderById,
} from '../controllers/productionController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getProductionOrders)
  .post(protect, authorizeRoles('Admin', 'Production Manager'), createProductionOrder);

router.route('/:id').get(protect, getProductionOrderById);
router.route('/:id/stage').put(protect, authorizeRoles('Admin', 'Production Manager'), updateStageStatus);

export default router;
