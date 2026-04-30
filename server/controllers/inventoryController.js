import InventoryItem from '../models/InventoryItem.js';

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
export const getInventory = async (req, res, next) => {
  try {
    const inventory = await InventoryItem.find({});
    res.json(inventory);
  } catch (error) {
    next(error);
  }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private
export const createInventoryItem = async (req, res, next) => {
  try {
    const { name, type, quantity, unit, minimumStock } = req.body;

    const item = new InventoryItem({
      name,
      type,
      quantity,
      unit,
      minimumStock,
    });

    const createdItem = await item.save();
    res.status(201).json(createdItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Update stock level
// @route   PUT /api/inventory/:id/stock
// @access  Private
export const updateStock = async (req, res, next) => {
  try {
    const { quantity, action } = req.body; // action: 'add' or 'subtract'
    const item = await InventoryItem.findById(req.params.id);

    if (item) {
      if (action === 'add') {
        item.quantity += Number(quantity);
      } else if (action === 'subtract') {
        if (item.quantity < quantity) {
          res.status(400);
          throw new Error('Insufficient stock');
        }
        item.quantity -= Number(quantity);
      } else {
        item.quantity = Number(quantity); // Set absolute
      }

      const updatedItem = await item.save();
      res.json(updatedItem);
    } else {
      res.status(404);
      throw new Error('Inventory Item not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory by ID
// @route   GET /api/inventory/:id
// @access  Private
export const getInventoryById = async (req, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404);
      throw new Error('Inventory Item not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update inventory item details
// @route   PUT /api/inventory/:id
// @access  Private
export const updateInventoryItem = async (req, res, next) => {
  try {
    const { name, type, quantity, unit, minimumStock } = req.body;
    const item = await InventoryItem.findById(req.params.id);

    if (item) {
      item.name = name || item.name;
      item.type = type || item.type;
      item.quantity = quantity !== undefined ? Number(quantity) : item.quantity;
      item.unit = unit || item.unit;
      item.minimumStock = minimumStock !== undefined ? Number(minimumStock) : item.minimumStock;

      const updatedItem = await item.save();
      res.json(updatedItem);
    } else {
      res.status(404);
      throw new Error('Inventory Item not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
export const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (item) {
      await item.deleteOne();
      res.json({ message: 'Item removed' });
    } else {
      res.status(404);
      throw new Error('Inventory Item not found');
    }
  } catch (error) {
    next(error);
  }
};
