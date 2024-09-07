const express = require('express');
const router = express.Router();
const LeadType = require('../models/leadTypeModel'); // Adjust the path according to your project structure

// Create a new LeadType
router.post('/', async (req, res) => {
  try {
    const leadType = new LeadType({
      name: req.body.name,
      created_by: req.body.created_by,
    });
    await leadType.save();
    res.status(201).json(leadType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all LeadTypes
router.get('/get-all-leadtypes', async (req, res) => {
  try {
    const leadTypes = await LeadType.find();
    res.json(leadTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single LeadType by ID
router.get('/:id', async (req, res) => {
  try {
    const leadType = await LeadType.findById(req.params.id);
    if (!leadType) {
      return res.status(404).json({ message: 'LeadType not found' });
    }
    res.json(leadType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a LeadType by ID
router.put('/:id', async (req, res) => {
  try {
    const leadType = await LeadType.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        created_by: req.body.created_by,
        updated_at: Date.now(),
      },
      { new: true }
    );
    if (!leadType) {
      return res.status(404).json({ message: 'LeadType not found' });
    }
    res.json(leadType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a LeadType by ID
router.delete('/:id', async (req, res) => {
  try {
    const leadType = await LeadType.findByIdAndDelete(req.params.id);
    if (!leadType) {
      return res.status(404).json({ message: 'LeadType not found' });
    }
    res.json({ message: 'LeadType deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
