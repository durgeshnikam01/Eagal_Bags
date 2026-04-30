import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  productSpec: {
    size: { type: String, required: true }, // e.g., "24x36 inches"
    weight: { type: Number, required: true }, // e.g., 60 grams
    lamination: { type: Boolean, default: false },
    printing: { type: String }, // e.g., "1 color logo"
  },
  quantity: { type: Number, required: true }, // number of bags
  unitPrice: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Customer',
    },
    orderItems: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'In Production', 'Completed', 'Dispatched'],
      default: 'Pending',
    },
    type: {
      type: String,
      enum: ['Quotation', 'Sales Order'],
      default: 'Quotation',
    },
    deliveryDate: {
      type: Date,
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
