const express = require('express');
const router = express.Router();
const DealStage = require('../models/dealStageModel'); // Adjust the path to your model

// @route   POST /api/deal-stages
// @desc    Create a new Deal Stage
// @access  Public or Private depending on your setup
router.post('/', async (req, res) => {
    try {
        const { name, created_by, order } = req.body;

        // Validation (you can expand it as per your requirements)
        if (!name || !order) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        // Create new DealStage
        const newDealStage = new DealStage({
            name,
            created_by,
            order
        });

        const savedDealStage = await newDealStage.save();
        res.status(201).json(savedDealStage);
    } catch (error) {
        console.error('Error creating deal stage:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/deal-stages
// @desc    Get all Deal Stages
// @access  Public or Private depending on your setup
router.get('/', async (req, res) => {
    try {
        const dealStages = await DealStage.find();
        res.json(dealStages);
    } catch (error) {
        console.error('Error fetching deal stages:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/deal-stages/:id
// @desc    Get Deal Stage by ID
// @access  Public or Private depending on your setup
router.get('/:id', async (req, res) => {
    try {
        const dealStage = await DealStage.findById(req.params.id);
        if (!dealStage) {
            return res.status(404).json({ msg: 'Deal stage not found' });
        }
        res.json(dealStage);
    } catch (error) {
        console.error('Error fetching deal stage by ID:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/deal-stages/:id
// @desc    Update Deal Stage by ID
// @access  Public or Private depending on your setup
router.put('/:id', async (req, res) => {
    try {
        const { name, created_by, order } = req.body;

        let dealStage = await DealStage.findById(req.params.id);
        if (!dealStage) {
            return res.status(404).json({ msg: 'Deal stage not found' });
        }

        // Update fields if provided
        if (name) dealStage.name = name;
        if (created_by) dealStage.created_by = created_by;
        if (order) dealStage.order = order;

        const updatedDealStage = await dealStage.save();
        res.json(updatedDealStage);
    } catch (error) {
        console.error('Error updating deal stage:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/deal-stages/:id
// @desc    Delete Deal Stage by ID
// @access  Public or Private depending on your setup
router.delete('/:id', async (req, res) => {
    try {
        const dealStage = await DealStage.findById(req.params.id);
        if (!dealStage) {
            return res.status(404).json({ msg: 'Deal stage not found' });
        }

        await dealStage.remove();
        res.json({ msg: 'Deal stage removed' });
    } catch (error) {
        console.error('Error deleting deal stage:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
