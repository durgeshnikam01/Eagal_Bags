import ProductionOrder from '../models/ProductionOrder.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import InventoryItem from '../models/InventoryItem.js';

// @desc    Get all production orders
// @route   GET /api/production
// @access  Private
export const getProductionOrders = async (req, res, next) => {
  try {
    const orders = await ProductionOrder.find({}).populate({
      path: 'salesOrder',
      populate: { path: 'customer', select: 'name' }
    });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a production order
// @route   POST /api/production
// @access  Private
export const createProductionOrder = async (req, res, next) => {
  try {
    const { salesOrder, stages } = req.body;

    const productionOrder = new ProductionOrder({
      salesOrder,
      stages: stages || [
        { stage: 'Extrusion', status: 'Pending' },
        { stage: 'Weaving', status: 'Pending' },
        { stage: 'Lamination', status: 'Pending' },
        { stage: 'Cutting', status: 'Pending' },
        { stage: 'Printing', status: 'Pending' }
      ],
      createdBy: req.user._id,
    });

    const createdOrder = await productionOrder.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Update stage status
// @route   PUT /api/production/:id/stage
// @access  Private
export const updateStageStatus = async (req, res, next) => {
  try {
    const { stage, stageName, status, assignedTo } = req.body;
    const finalStageName = stage || stageName;
    const productionOrder = await ProductionOrder.findById(req.params.id);

    if (productionOrder) {
      const stageObj = productionOrder.stages.find((s) => s.stage === finalStageName);
      if (stageObj) {
        stageObj.status = status;
        if (assignedTo) stageObj.assignedTo = assignedTo;
        if (status === 'Completed') stageObj.completedAt = Date.now();
        
        // Automated Inventory Deduction (BOM) when Extrusion starts
        if (finalStageName === 'Extrusion' && status === 'In Progress' && !stageObj.startedAt) {
          const order = await Order.findById(productionOrder.salesOrder).populate('orderItems.product');
          if (order) {
            for (const item of order.orderItems) {
              if (item.product && item.product.bom) {
                for (const bomItem of item.product.bom) {
                  const requiredQty = bomItem.quantityPerUnit * item.quantity;
                  const inventoryItem = await InventoryItem.findById(bomItem.material);
                  if (inventoryItem) {
                    if (inventoryItem.quantity < requiredQty) {
                      res.status(400);
                      throw new Error(`Insufficient inventory for ${inventoryItem.name}. Required: ${requiredQty}, Available: ${inventoryItem.quantity}`);
                    }
                    inventoryItem.quantity -= requiredQty;
                    await inventoryItem.save();
                  }
                }
              }
            }
          }
        }

        if (status === 'In Progress' && !stageObj.startedAt) stageObj.startedAt = Date.now();
        
        // Update current stage logic
        productionOrder.currentStage = finalStageName;
        
        // Check if all stages completed
        const allCompleted = productionOrder.stages.every((s) => s.status === 'Completed');
        if (allCompleted) {
          productionOrder.status = 'Completed';
          // Update the Sales Order status to Completed
          await Order.findByIdAndUpdate(productionOrder.salesOrder, { status: 'Completed' });
        } else {
          productionOrder.status = 'In Production';
        }

        const updatedOrder = await productionOrder.save();
        res.json(updatedOrder);
      } else {
        res.status(404);
        throw new Error('Stage not found');
      }
    } else {
      res.status(404);
      throw new Error('Production Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get production order by ID
// @route   GET /api/production/:id
// @access  Private
export const getProductionOrderById = async (req, res, next) => {
  try {
    const order = await ProductionOrder.findById(req.params.id).populate({
      path: 'salesOrder',
      populate: { path: 'customer', select: 'name' }
    });

    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error('Production Order not found');
    }
  } catch (error) {
    next(error);
  }
};
