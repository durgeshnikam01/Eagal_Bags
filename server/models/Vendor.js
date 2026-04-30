import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    materialsSupplied: [{ type: String }], // e.g., ['HDPE', 'Ink', 'Lamination Film']
  },
  {
    timestamps: true,
  }
);

const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;
