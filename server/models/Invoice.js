import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    subTotal: { type: Number, required: true },
    gstAmount: { type: Number, required: true }, // e.g., 18% GST
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Unpaid', 'Paid', 'Partial'],
      default: 'Unpaid',
    },
    dueDate: { type: Date },
    paidDate: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
