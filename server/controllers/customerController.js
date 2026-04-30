import Customer from '../models/Customer.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({});
    res.json(customers);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address, companyName, gstNumber } = req.body;

    const customer = new Customer({
      name,
      email,
      phone,
      address,
      companyName,
      gstNumber,
    });

    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
      res.json(customer);
    } else {
      res.status(404);
      throw new Error('Customer not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address, companyName, gstNumber } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (customer) {
      customer.name = name || customer.name;
      customer.email = email || customer.email;
      customer.phone = phone || customer.phone;
      customer.address = address || customer.address;
      customer.companyName = companyName || customer.companyName;
      customer.gstNumber = gstNumber || customer.gstNumber;

      const updatedCustomer = await customer.save();
      res.json(updatedCustomer);
    } else {
      res.status(404);
      throw new Error('Customer not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
      await customer.deleteOne();
      res.json({ message: 'Customer removed' });
    } else {
      res.status(404);
      throw new Error('Customer not found');
    }
  } catch (error) {
    next(error);
  }
};
