import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getInquiries, createInquiry, getQuotations, createQuotation, updateQuotationStatus } from '../controllers/salesController.js';

const router = express.Router();

router.route('/inquiries').get(protect, getInquiries).post(protect, createInquiry);
router.route('/quotations').get(protect, getQuotations).post(protect, createQuotation);
router.route('/quotations/:id/status').put(protect, updateQuotationStatus);

export default router;
