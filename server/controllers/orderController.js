import Order from '../models/Order.js';

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).populate('customer', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new order (Quotation or Sales Order)
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const { customer, orderItems, totalAmount, type, deliveryDate } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    } else {
      const order = new Order({
        customer,
        orderItems,
        totalAmount,
        type,
        deliveryDate,
        createdBy: req.user._id,
      });

      const createdOrder = await order.save();
      res.status(201).json(createdOrder);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email phone address');

    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Convert Quotation to Sales Order
// @route   PUT /api/orders/:id/convert
// @access  Private
export const convertToSalesOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      if (order.type === 'Quotation') {
        order.type = 'Sales Order';
        const updatedOrder = await order.save();
        res.json(updatedOrder);
      } else {
        res.status(400);
        throw new Error('Order is already a Sales Order');
      }
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
export const updateOrder = async (req, res, next) => {
  try {
    const { customer, orderItems, totalAmount, type, status } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      order.customer = customer || order.customer;
      order.orderItems = orderItems || order.orderItems;
      order.totalAmount = totalAmount !== undefined ? totalAmount : order.totalAmount;
      order.type = type || order.type;
      order.status = status || order.status;

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.deleteOne();
      res.json({ message: 'Order removed' });
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};
