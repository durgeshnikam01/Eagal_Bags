import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['Raw Material', 'Work In Progress', 'Finished Goods'],
      required: true,
    },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true }, // e.g., 'kg', 'units', 'meters'
    minimumStock: { type: Number, default: 0 }, // For low stock alerts
  },
  {
    timestamps: true,
  }
);

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
export default InventoryItem;
