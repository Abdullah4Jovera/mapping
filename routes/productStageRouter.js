const express = require('express');
const ProductStage = require('../models/productStageModel');
const router = express.Router();
const Product = require('../models/productModel')
// Get all product stages
router.get('/get-all-productstages', async (req, res) => {
    try {
      // Fetch all product stages, sorted by the 'order' field, and populate the 'product_id' field with details from the Product model
      const productStages = await ProductStage.find()
        .sort({ order: 1 })
        .populate('product_id', 'name') // Populate with fields 'name' and 'description' from Product model
        .exec();
  
      res.status(200).json(productStages);
    } catch (error) {
      console.error('Error getting product stages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

// Get all stages of a specific product
router.get('/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const productStages = await ProductStage.find({ product_id: productId });
    if (!productStages.length) {
      return res.status(404).json({ error: 'Product stages not found' });
    }
    res.json(productStages);
  } catch (error) {
    console.error('Error getting product stages for product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new product stage
router.post('/', async (req, res) => {
  const { name, product_id, order } = req.body;

  try {
    const newProductStage = new ProductStage({
      name,
      product_id,
      order,
      created_at: new Date(),
      updated_at: new Date(),
    });
    await newProductStage.save();
    res.status(201).json(newProductStage);
  } catch (error) {
    console.error('Error creating product stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an existing product stage
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, product_id, order } = req.body;

  try {
    const updatedProductStage = await ProductStage.findByIdAndUpdate(
      id,
      { name, product_id, order, updated_at: new Date() },
      { new: true }
    );

    if (!updatedProductStage) {
      return res.status(404).json({ error: 'Product stage not found' });
    }

    res.json(updatedProductStage);
  } catch (error) {
    console.error('Error updating product stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a product stage
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProductStage = await ProductStage.findByIdAndDelete(id);

    if (!deletedProductStage) {
      return res.status(404).json({ error: 'Product stage not found' });
    }

    res.json({ message: 'Product stage deleted successfully' });
  } catch (error) {
    console.error('Error deleting product stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;