import express from 'express';
import {
  getVendors,
  createVendor,
  getPurchaseOrders,
  createPurchaseOrder,
  updatePOStatus,
} from '../controllers/purchaseController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/vendors')
  .get(protect, getVendors)
  .post(protect, authorizeRoles('Admin', 'Inventory Manager'), createVendor);

router.route('/orders')
  .get(protect, getPurchaseOrders)
  .post(protect, authorizeRoles('Admin', 'Inventory Manager'), createPurchaseOrder);

router.route('/orders/:id/status')
  .put(protect, authorizeRoles('Admin', 'Inventory Manager'), updatePOStatus);

export default router;
