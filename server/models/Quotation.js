import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema(
  {
    inquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesInquiry',
      required: true,
    },
    quotationNumber: { type: String, required: true, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    taxRate: { type: Number, default: 18 }, // GST
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected'],
      default: 'Sent',
    },
    terms: { type: String },
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

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
