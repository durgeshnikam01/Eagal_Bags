import mongoose from 'mongoose';

const qcRecordSchema = new mongoose.Schema(
  {
    productionOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionOrder',
      required: true,
    },
    inspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalQuantity: { type: Number, required: true },
    passedQuantity: { type: Number, required: true },
    rejectedQuantity: { type: Number, required: true },
    defectsFound: [{ type: String }], // e.g., ['Printing Blur', 'Sealing Issue']
    status: {
      type: String,
      enum: ['Pending', 'Passed', 'Failed', 'Partial'],
      default: 'Pending',
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

const QCRecord = mongoose.model('QCRecord', qcRecordSchema);
export default QCRecord;
