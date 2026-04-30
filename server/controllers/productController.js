import Product from '../models/Product.js';

export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).populate('bom.material', 'name unit');
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, category, size, weight, bom } = req.body;
    const product = new Product({
      name,
      category,
      size,
      weight,
      bom,
      createdBy: req.user._id,
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { name, category, size, weight, bom } = req.body;
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.category = category || product.category;
      product.size = size || product.size;
      product.weight = weight || product.weight;
      product.bom = bom || product.bom;
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};
