import express from 'express';
import {
  getInventory,
  createInventoryItem,
  updateStock,
  getInventoryById,
  updateInventoryItem,
  deleteInventoryItem,
} from '../controllers/inventoryController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getInventory)
  .post(protect, authorizeRoles('Admin', 'Inventory Manager'), createInventoryItem);

router
  .route('/:id')
  .get(protect, getInventoryById)
  .put(protect, authorizeRoles('Admin', 'Inventory Manager'), updateInventoryItem)
  .delete(protect, authorizeRoles('Admin'), deleteInventoryItem);

router.route('/:id/stock').put(protect, authorizeRoles('Admin', 'Inventory Manager', 'Production Manager'), updateStock);

export default router;
