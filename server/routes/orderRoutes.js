import express from 'express';
import {
  getOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
  convertToSalesOrder,
  updateOrder,
  deleteOrder,
} from '../controllers/orderController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getOrders)
  .post(protect, authorizeRoles('Admin', 'Sales Manager'), createOrder);

router
  .route('/:id')
  .get(protect, getOrderById)
  .put(protect, authorizeRoles('Admin', 'Sales Manager'), updateOrder)
  .delete(protect, authorizeRoles('Admin'), deleteOrder);

router.route('/:id/status').put(protect, authorizeRoles('Admin', 'Sales Manager', 'Production Manager'), updateOrderStatus);
router.route('/:id/convert').put(protect, authorizeRoles('Admin', 'Sales Manager'), convertToSalesOrder);

export default router;
