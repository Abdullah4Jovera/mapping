const express = require('express');
const Product = require('../models/productModel'); // Adjust the path as necessary
const router = express.Router();

// Create a new product
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        // Validate that the name is provided
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const newProduct = new Product({ name });
        await newProduct.save();

        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Get all products
router.get('/get-all-products', async (req, res) => {
    try {
        const products = await Product.find(); // Sort by most recent
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update a product by ID
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;

        // Validate that the name is provided
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Delete a product by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;
