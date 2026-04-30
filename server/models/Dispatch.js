import mongoose from 'mongoose';

const dispatchSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    dispatchNumber: { type: String, required: true, unique: true },
    carrier: { type: String, required: true }, // e.g., "VRL Logistics"
    trackingId: { type: String },
    vehicleNumber: { type: String },
    dispatchedDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['In Transit', 'Delivered', 'Returned'],
      default: 'In Transit',
    },
    receivedBy: { type: String },
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

const Dispatch = mongoose.model('Dispatch', dispatchSchema);
export default Dispatch;
