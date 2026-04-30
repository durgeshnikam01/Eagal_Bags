import express from 'express';
import {
  getQCRecords,
  createQCRecord,
} from '../controllers/qcController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getQCRecords)
  .post(protect, authorizeRoles('Admin', 'Production Manager'), createQCRecord);

export default router;
