import express from 'express';
import {
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
  deleteInvoice
} from '../controllers/billingController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getInvoices)
  .post(protect, authorizeRoles('Admin', 'Sales Manager'), createInvoice);

router.route('/:id')
  .delete(protect, authorizeRoles('Admin', 'Sales Manager'), deleteInvoice);

router.route('/:id/status')
  .put(protect, authorizeRoles('Admin', 'Sales Manager'), updateInvoiceStatus);

export default router;
