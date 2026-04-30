import mongoose from 'mongoose';

const bomItemSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  },
  quantityPerUnit: {
    type: Number,
    required: true, // e.g., 0.065 kg (65g) of HDPE per bag
  },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true }, // e.g., "HDPE Bag", "BOPP Bag"
    size: { type: String, required: true },
    weight: { type: Number, required: true }, // in grams
    bom: [bomItemSchema],
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

const Product = mongoose.model('Product', productSchema);
export default Product;
