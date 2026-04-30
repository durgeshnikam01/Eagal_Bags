import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    companyName: { type: String },
    gstNumber: { type: String },
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
