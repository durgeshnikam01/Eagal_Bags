import Dispatch from '../models/Dispatch.js';
import Order from '../models/Order.js';

export const getDispatches = async (req, res, next) => {
  try {
    const dispatches = await Dispatch.find({}).populate('order', '_id customer totalAmount');
    res.json(dispatches);
  } catch (error) {
    next(error);
  }
};

export const createDispatch = async (req, res, next) => {
  try {
    const { order, carrier, trackingId, vehicleNumber } = req.body;
    
    // Generate unique dispatch number: DSP-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Dispatch.countDocuments({ createdAt: { $gte: new Date().setHours(0,0,0,0) } });
    const dispatchNumber = `DSP-${datePart}-${(count + 1).toString().padStart(4, '0')}`;

    const dispatch = new Dispatch({
      order,
      dispatchNumber,
      carrier,
      trackingId,
      vehicleNumber,
      createdBy: req.user._id,
    });
    const createdDispatch = await dispatch.save();
    
    // Update Sales Order status
    await Order.findByIdAndUpdate(order, { status: 'Dispatched' });

    res.status(201).json(createdDispatch);
  } catch (error) {
    next(error);
  }
};

export const updateDispatchStatus = async (req, res, next) => {
  try {
    const { status, receivedBy } = req.body;
    const dispatch = await Dispatch.findById(req.params.id);
    if (dispatch) {
      dispatch.status = status;
      if (receivedBy) dispatch.receivedBy = receivedBy;
      const updatedDispatch = await dispatch.save();
      res.json(updatedDispatch);
    } else {
      res.status(404);
      throw new Error('Dispatch record not found');
    }
  } catch (error) {
    next(error);
  }
};
