import mongoose from 'mongoose';

const productionStageSchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ['Extrusion', 'Weaving', 'Lamination', 'Cutting', 'Printing'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending',
  },
  assignedTo: { type: String }, // e.g., Machine or Worker ID
  startedAt: { type: Date },
  completedAt: { type: Date },
});

const productionOrderSchema = new mongoose.Schema(
  {
    salesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    stages: [productionStageSchema],
    currentStage: {
      type: String,
      default: 'Extrusion',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Production', 'Completed'],
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

const ProductionOrder = mongoose.model('ProductionOrder', productionOrderSchema);
export default ProductionOrder;
