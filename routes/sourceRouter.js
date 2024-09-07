const express = require('express');
const router = express.Router();
const Source = require('../models/sourceModel');
const { isAuth } = require('../utils');

router.get('/:leadTypeId', async (req, res) => {
    try {
        const { leadTypeId } = req.params;

        const sources = await Source.find({ lead_type_id: leadTypeId })
            .populate('lead_type_id', 'name') // Populate lead_type_id with name field from LeadType model
            .exec();

        if (sources.length === 0) {
            return res.status(404).json({ message: 'No sources found for the given Lead Type ID' });
        }

        res.status(200).json(sources);
    } catch (error) {
        console.error('Error fetching sources by Lead Type ID:', error);
        res.status(500).json({ message: 'Error fetching sources' });
    }
});
// Route to get all sources
router.get('/get-sources',  async (req, res) => {
    try {
        const sources = await Source.find()
            .populate('lead_type_id', 'name') // Populate lead_type_id with name field from LeadType model
            .exec();
        res.status(200).json(sources);
    } catch (error) {
        console.error('Error fetching sources:', error);
        res.status(500).json({ message: 'Error fetching sources' });
    }
});

// Route to create a new source
router.post('/create-source', isAuth, async (req, res) => {
    try {
        const { name, lead_type_id, delstatus } = req.body;

        // Validate required fields
        if (!name || !lead_type_id) {
            return res.status(400).json({ message: 'Name and Lead Type ID are required' });
        }

        // Create new source
        const newSource = new Source({
            name,
            lead_type_id,
            created_by: req.user._id, // Assuming the user ID is available in req.user
            delstatus
        });

        // Save the new source to the database
        await newSource.save();

        res.status(201).json(newSource);
    } catch (error) {
        console.error('Error creating source:', error);
        res.status(500).json({ message: 'Error creating source' });
    }
});

module.exports = router;
