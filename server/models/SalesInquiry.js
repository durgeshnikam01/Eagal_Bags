import mongoose from 'mongoose';

const salesInquirySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    productType: { type: String, required: true }, // e.g., HDPE Woven Bag
    specs: {
      size: { type: String, required: true },
      weightCapacity: { type: String, required: true },
      lamination: { type: Boolean, default: false },
      printing: { type: String, default: 'None' },
    },
    quantity: { type: Number, required: true },
    status: {
      type: String,
      enum: ['New', 'Quoted', 'Converted', 'Cancelled'],
      default: 'New',
    },
    source: { type: String, default: 'Website' }, // WhatsApp, Phone, etc.
    notes: { type: String },
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

const SalesInquiry = mongoose.model('SalesInquiry', salesInquirySchema);
export default SalesInquiry;
