import express from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getProducts)
  .post(protect, authorizeRoles('Admin', 'Production Manager'), createProduct);

router
  .route('/:id')
  .put(protect, authorizeRoles('Admin', 'Production Manager'), updateProduct)
  .delete(protect, authorizeRoles('Admin'), deleteProduct);

export default router;
