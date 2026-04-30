import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
  },
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, required: true },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Vendor',
    },
    items: [purchaseOrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Received', 'Cancelled'],
      default: 'Pending',
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

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
export default PurchaseOrder;
