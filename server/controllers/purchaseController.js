import Vendor from '../models/Vendor.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import InventoryItem from '../models/InventoryItem.js';

// Vendor Controllers
export const getVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find({});
    res.json(vendors);
  } catch (error) {
    next(error);
  }
};

export const createVendor = async (req, res, next) => {
  try {
    const vendor = new Vendor(req.body);
    const createdVendor = await vendor.save();
    res.status(201).json(createdVendor);
  } catch (error) {
    next(error);
  }
};

// Purchase Order Controllers
export const getPurchaseOrders = async (req, res, next) => {
  try {
    const pos = await PurchaseOrder.find({}).populate('vendor', 'name email phone');
    res.json(pos);
  } catch (error) {
    next(error);
  }
};

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const { vendor, items, totalAmount } = req.body;
    const po = new PurchaseOrder({
      vendor,
      items,
      totalAmount,
      createdBy: req.user._id,
    });
    const createdPo = await po.save();
    res.status(201).json(createdPo);
  } catch (error) {
    next(error);
  }
};

export const updatePOStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    if (po) {
      const oldStatus = po.status;
      po.status = status;

      // Automated Stock Increase (GRN) when PO is Received
      if (status === 'Received' && oldStatus !== 'Received') {
        for (const item of po.items) {
          if (item.material) {
            const inventoryItem = await InventoryItem.findById(item.material);
            if (inventoryItem) {
              inventoryItem.quantity += item.quantity;
              await inventoryItem.save();
            }
          }
        }
      }

      const updatedPo = await po.save();
      res.json(updatedPo);
    } else {
      res.status(404);
      throw new Error('Purchase Order not found');
    }
  } catch (error) {
    next(error);
  }
};
