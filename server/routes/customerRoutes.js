import express from 'express';
import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getCustomers)
  .post(protect, createCustomer);

router
  .route('/:id')
  .get(protect, getCustomerById)
  .put(protect, authorizeRoles('Admin', 'Sales Manager'), updateCustomer)
  .delete(protect, authorizeRoles('Admin'), deleteCustomer);

export default router;
