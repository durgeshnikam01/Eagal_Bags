import SalesInquiry from '../models/SalesInquiry.js';
import Quotation from '../models/Quotation.js';

export const getInquiries = async (req, res, next) => {
  try {
    const inquiries = await SalesInquiry.find({}).populate('customer', 'name companyName phone');
    res.json(inquiries);
  } catch (error) {
    next(error);
  }
};

export const createInquiry = async (req, res, next) => {
  try {
    const inquiry = new SalesInquiry({
      ...req.body,
      createdBy: req.user._id,
    });
    const createdInquiry = await inquiry.save();
    res.status(201).json(createdInquiry);
  } catch (error) {
    next(error);
  }
};

export const getQuotations = async (req, res, next) => {
  try {
    const quotations = await Quotation.find({}).populate('customer', 'name companyName').populate('inquiry');
    res.json(quotations);
  } catch (error) {
    next(error);
  }
};

export const createQuotation = async (req, res, next) => {
  try {
    const { inquiryId, unitPrice, validUntil, terms } = req.body;
    const inquiry = await SalesInquiry.findById(inquiryId);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    const count = await Quotation.countDocuments();
    const qNumber = `QTN-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const totalAmount = inquiry.quantity * unitPrice;

    const quotation = new Quotation({
      inquiry: inquiryId,
      quotationNumber: qNumber,
      customer: inquiry.customer,
      unitPrice,
      totalAmount,
      validUntil,
      terms,
      createdBy: req.user._id,
    });

    const createdQuotation = await quotation.save();
    
    // Update inquiry status
    inquiry.status = 'Quoted';
    await inquiry.save();

    res.status(201).json(createdQuotation);
  } catch (error) {
    next(error);
  }
};

export const updateQuotationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    quotation.status = status;
    await quotation.save();

    res.json(quotation);
  } catch (error) {
    next(error);
  }
};
