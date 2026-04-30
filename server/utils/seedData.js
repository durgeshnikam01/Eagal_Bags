import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import ProductionOrder from '../models/ProductionOrder.js';
import InventoryItem from '../models/InventoryItem.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Invoice from '../models/Invoice.js';
import Dispatch from '../models/Dispatch.js';
import QCRecord from '../models/QCRecord.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Customer.deleteMany();
    await Order.deleteMany();
    await ProductionOrder.deleteMany();
    await InventoryItem.deleteMany();
    await Product.deleteMany();
    await Vendor.deleteMany();
    await PurchaseOrder.deleteMany();
    await Invoice.deleteMany();
    await Dispatch.deleteMany();
    await QCRecord.deleteMany();

    console.log('Data cleared!');

    // Create Admin User
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@eagle.com',
      password: 'password123',
      role: 'Admin',
    });

    // Create Customers
    const customer1 = await Customer.create({
      name: 'Global Packaging Ltd',
      email: 'contact@globalpkg.com',
      phone: '+91 9876543210',
      address: 'Industrial Area, Mumbai',
      companyName: 'Global Packaging',
      gstNumber: '27AAAAA0000A1Z5',
    });

    // Create Inventory Items
    const hdpe = await InventoryItem.create({ name: 'HDPE Granules', type: 'Raw Material', quantity: 5000, unit: 'kg', minimumStock: 1000 });
    const ink = await InventoryItem.create({ name: 'Ink (Blue)', type: 'Raw Material', quantity: 50, unit: 'kg', minimumStock: 10 });

    // Create Product with BOM
    const product1 = await Product.create({
      name: 'Standard HDPE Bag',
      category: 'HDPE Bag',
      size: '24x36',
      weight: 65,
      bom: [{ material: hdpe._id, quantityPerUnit: 0.065 }],
      createdBy: admin._id
    });

    // Create Sales Order (Pending)
    const order1 = await Order.create({
      customer: customer1._id,
      orderItems: [{ 
        product: product1._id,
        productSpec: { size: '24x36', weight: 65, lamination: true, printing: '2 color' }, 
        quantity: 10000, 
        unitPrice: 12.5 
      }],
      totalAmount: 125000,
      type: 'Sales Order',
      status: 'Pending',
      createdBy: admin._id
    });

    // Create Invoice
    await Invoice.create({
      invoiceNumber: 'INV-20260429-0001',
      order: order1._id,
      customer: customer1._id,
      subTotal: 125000,
      gstAmount: 22500,
      totalAmount: 147500,
      status: 'Unpaid',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: admin._id
    });

    // Create Vendor & PO
    const vendor1 = await Vendor.create({ name: 'Reliance Polymers', phone: '+91 22 12345678', address: 'Jamtara, Gujarat', email: 'sales@reliance.com' });
    await PurchaseOrder.create({
      vendor: vendor1._id,
      items: [{ materialName: 'HDPE Granules', quantity: 1000, unit: 'kg', unitPrice: 95 }],
      totalAmount: 95000,
      status: 'Pending',
      createdBy: admin._id
    });

    console.log('Database seeded with comprehensive ERP data!');
    process.exit();
  } catch (error) {
    console.error('Error seeding database', error);
    process.exit(1);
  }
};

seedData();
