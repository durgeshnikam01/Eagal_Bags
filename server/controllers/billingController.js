import Invoice from '../models/Invoice.js';

export const getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({})
      .populate('order', 'totalAmount status')
      .populate('customer', 'name email address phone');
    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const { order, customer, subTotal, gstAmount, totalAmount, dueDate } = req.body;
    
    // Generate unique invoice number: INV-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Invoice.countDocuments({ createdAt: { $gte: new Date().setHours(0,0,0,0) } });
    const invoiceNumber = `INV-${datePart}-${(count + 1).toString().padStart(4, '0')}`;

    const invoice = new Invoice({
      invoiceNumber,
      order,
      customer,
      subTotal,
      gstAmount,
      totalAmount,
      dueDate,
      createdBy: req.user._id,
    });
    const createdInvoice = await invoice.save();
    res.status(201).json(createdInvoice);
  } catch (error) {
    next(error);
  }
};

export const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status, paidDate } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (invoice) {
      invoice.status = status;
      if (status === 'Paid') invoice.paidDate = paidDate || Date.now();
      const updatedInvoice = await invoice.save();
      res.json(updatedInvoice);
    } else {
      res.status(404);
      throw new Error('Invoice not found');
    }
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (invoice) {
      await invoice.deleteOne();
      res.json({ message: 'Invoice removed' });
    } else {
      res.status(404);
      throw new Error('Invoice not found');
    }
  } catch (error) {
    next(error);
  }
};
