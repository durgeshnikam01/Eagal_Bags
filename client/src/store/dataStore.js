import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Initial data for a rich demo experience
const initialData = {
  customers: [
    { _id: 'c1', name: 'Global Packaging Ltd', email: 'contact@globalpkg.com', phone: '+91 9876543210', address: 'Industrial Area, Mumbai', companyName: 'Global Packaging', gstNumber: '27AAAAA0000A1Z5' },
    { _id: 'c2', name: 'Maruti Polymers', email: 'info@maruti.com', phone: '+91 9988776655', address: 'GIDC, Ahmedabad', companyName: 'Maruti Poly', gstNumber: '24BBBBB1111B1Z2' },
    { _id: 'c3', name: 'Reliance Retail Logistics', email: 'logistics@reliance.com', phone: '+91 22 44556677', address: 'Navi Mumbai', companyName: 'Reliance', gstNumber: '27CCCCC2222C1Z3' },
    { _id: 'c4', name: 'Adani Agri Fresh', email: 'procurement@adani.com', phone: '+91 79 11223344', address: 'Mundra, Gujarat', companyName: 'Adani', gstNumber: '24DDDDD3333D1Z4' },
    { _id: 'c5', name: 'Tata Chemicals Store', email: 'supply@tata.com', phone: '+91 20 55667788', address: 'Pune, Maharashtra', companyName: 'Tata', gstNumber: '27EEEEE4444E1Z9' }
  ],
  inventory: [
    { _id: 'i1', name: 'HDPE Virgin Resin (Grade A)', type: 'Raw Material', quantity: 12500, unit: 'kg', minimumStock: 2000 },
    { _id: 'i2', name: 'Masterbatch White', type: 'Additive', quantity: 450, unit: 'kg', minimumStock: 50 },
    { _id: 'i3', name: 'UV Stabilizer', type: 'Additive', quantity: 120, unit: 'kg', minimumStock: 20 },
    { _id: 'i4', name: 'PP Woven Fabric 60GSM', type: 'WIP', quantity: 4500, unit: 'm', minimumStock: 1000 },
    { _id: 'i5', name: 'BOPP Lamination Film', type: 'Raw Material', quantity: 800, unit: 'kg', minimumStock: 100 },
    { _id: 'i6', name: 'Finished Bags 50kg', type: 'Finished Good', quantity: 25000, unit: 'pcs', minimumStock: 5000 }
  ],
  products: [
    { _id: 'p1', name: 'HDPE Woven Bag 50kg', category: 'Woven Bag', size: '24x36', weight: 65, lamination: 'None' },
    { _id: 'p2', name: 'Laminated BOPP Bag', category: 'Premium Bag', size: '22x34', weight: 85, lamination: 'BOPP' },
    { _id: 'p3', name: 'Sugar Bag (Inner Liner)', category: 'Industrial', size: '25x40', weight: 110, lamination: 'PE Liner' }
  ],
  orders: [
    { 
      _id: 'o1', 
      customer: { _id: 'c1', name: 'Global Packaging Ltd' }, 
      orderItems: [{ 
        product: { name: 'HDPE Woven Bag 50kg' }, 
        quantity: 50000, 
        unitPrice: 14.50,
        productSpec: { size: '24x36', weight: 65, lamination: true, printing: '2 Color' }
      }],
      totalAmount: 725000,
      type: 'Sales Order',
      status: 'In Production',
      createdAt: '2026-04-25T10:30:00Z'
    },
    { 
      _id: 'o2', 
      customer: { _id: 'c4', name: 'Adani Agri Fresh' }, 
      orderItems: [{ 
        product: { name: 'Sugar Bag (Inner Liner)' }, 
        quantity: 100000, 
        unitPrice: 18.20,
        productSpec: { size: '25x40', weight: 110, lamination: false, printing: 'None' }
      }],
      totalAmount: 1820000,
      type: 'Sales Order',
      status: 'Pending',
      createdAt: '2026-04-28T14:20:00Z'
    },
    { 
      _id: 'o3', 
      customer: { _id: 'c2', name: 'Maruti Polymers' }, 
      orderItems: [{ 
        product: { name: 'Laminated BOPP Bag' }, 
        quantity: 15000, 
        unitPrice: 22.00,
        productSpec: { size: '22x34', weight: 85, lamination: true, printing: 'BOPP Multi' }
      }],
      totalAmount: 330000,
      type: 'Quotation',
      status: 'Pending',
      createdAt: '2026-05-01T09:15:00Z'
    }
  ],
  production: [
    { 
      _id: 'pr1', 
      salesOrder: { _id: 'o1', customer: { name: 'Global Packaging Ltd' }, orderItems: [{ quantity: 50000 }] }, 
      product: 'HDPE Woven Bag 50kg', 
      quantity: 50000, 
      status: 'In Production', 
      progress: 65, 
      currentStage: 'Weaving',
      stages: [
        { stage: 'Extrusion', status: 'Completed', assignedTo: 'EX-01 (Amit Kumar)' },
        { stage: 'Weaving', status: 'In Progress', assignedTo: 'WV-04 (Rajesh Shah)' },
        { stage: 'Lamination', status: 'Pending' },
        { stage: 'Cutting', status: 'Pending' },
        { stage: 'Printing', status: 'Pending' }
      ]
    },
    { 
      _id: 'pr2', 
      salesOrder: { _id: 'o2', customer: { name: 'Adani Agri Fresh' }, orderItems: [{ quantity: 100000 }] }, 
      product: 'Sugar Bag', 
      quantity: 100000, 
      status: 'Queued', 
      progress: 0, 
      currentStage: 'Extrusion',
      stages: [
        { stage: 'Extrusion', status: 'Pending' },
        { stage: 'Weaving', status: 'Pending' },
        { stage: 'Lamination', status: 'Pending' },
        { stage: 'Cutting', status: 'Pending' },
        { stage: 'Printing', status: 'Pending' }
      ]
    }
  ],
  vendors: [
    { _id: 'v1', name: 'Reliance Petrochemicals', contact: 'Rajesh Shah', email: 'rajesh@reliance.com' },
    { _id: 'v2', name: 'Indian Oil Corp', contact: 'Sanjay Kumar', email: 'sanjay@ioc.in' }
  ],
  purchaseOrders: [
    { _id: 'po1', vendor: 'Reliance Petrochemicals', items: [{ name: 'HDPE Resin', qty: 25000, price: 98 }], total: 2450000, status: 'Received' },
    { _id: 'po2', vendor: 'Indian Oil Corp', items: [{ name: 'Masterbatch White', qty: 1000, price: 145 }], total: 145000, status: 'Ordered' }
  ],
  invoices: [
    { _id: 'inv1', orderId: 'o1', customer: 'Global Packaging Ltd', amount: 725000, status: 'Partially Paid', date: '2026-04-26' },
    { _id: 'inv2', orderId: 'o4', customer: 'Tata Chemicals', amount: 450000, status: 'Paid', date: '2026-04-20' }
  ],
  qc: [
    { _id: 'qc1', batchId: 'B-901', product: 'HDPE Bag', result: 'Pass', parameters: { strength: 'High', weight: 'Exact' } }
  ],
  dispatch: [
    { _id: 'd1', dispatchNumber: 'DISP-2026-001', order: { _id: 'o1', customer: { _id: 'c1', name: 'Global Packaging Ltd', address: 'Industrial Area, Mumbai', gstNumber: '27AAAAA0000A1Z5' }, totalAmount: 725000 }, status: 'Delivered', date: '2026-04-26' },
    { _id: 'd2', dispatchNumber: 'DISP-2026-002', order: { _id: 'o2', customer: { _id: 'c4', name: 'Adani Agri Fresh', address: 'Mundra, Gujarat', gstNumber: '24DDDDD3333D1Z4' }, totalAmount: 1820000 }, status: 'Delivered', date: '2026-04-28' },
    { _id: 'd3', dispatchNumber: 'DISP-2026-003', order: { _id: 'o5', customer: { _id: 'c5', name: 'Tata Chemicals', address: 'Pune, MH', gstNumber: '27EEEEE4444E1Z9' }, totalAmount: 450000 }, status: 'Shipped', date: '2026-05-01' }
  ]
};

const useDataStore = create(
  persist(
    (set, get) => ({
      ...initialData,

      // Generic CRUD helpers
      addItem: (collection, item) => {
        const newItem = { 
          ...item, 
          _id: Math.random().toString(36).substr(2, 9), 
          invoiceNumber: item.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
          createdAt: new Date().toISOString() 
        };
        set((state) => ({
          [collection]: [...state[collection], newItem]
        }));
        return newItem;
      },

      updateItem: (collection, id, updates) => set((state) => ({
        [collection]: state[collection].map((item) => item._id === id ? { ...item, ...updates } : item)
      })),

      deleteItem: (collection, id) => set((state) => ({
        [collection]: state[collection].filter((item) => item._id !== id)
      })),

      // Special actions
      convertOrder: (id) => {
        const order = get().orders.find(o => o._id === id);
        if (order) {
          get().updateItem('orders', id, { type: 'Sales Order', status: 'Confirmed' });
        }
      }
    }),
    {
      name: 'eagle-erp-storage', // name of the item in localStorage
    }
  )
);

export default useDataStore;
