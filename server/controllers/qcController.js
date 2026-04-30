import QCRecord from '../models/QCRecord.js';

export const getQCRecords = async (req, res, next) => {
  try {
    const records = await QCRecord.find({}).populate({
      path: 'productionOrder',
      populate: { path: 'salesOrder', select: '_id customer' }
    }).populate('inspectedBy', 'name');
    res.json(records);
  } catch (error) {
    next(error);
  }
};

export const createQCRecord = async (req, res, next) => {
  try {
    const record = new QCRecord({
      ...req.body,
      inspectedBy: req.user._id,
    });
    const createdRecord = await record.save();
    res.status(201).json(createdRecord);
  } catch (error) {
    next(error);
  }
};
