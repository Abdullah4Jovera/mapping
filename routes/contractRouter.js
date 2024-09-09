const express = require('express');
const router = express.Router();
const Contract = require('../models/contractModel'); // Adjust path as needed
const ServiceCommission = require('../models/serviceCommissionModel'); // Adjust path as needed
const User = require('../models/userModel'); // Adjust path as needed
const Pipeline = require('../models/pipelineModel'); // Adjust path as needed
const LeadType = require('../models/leadTypeModel'); // Adjust path as needed
const Source = require('../models/sourceModel'); // Adjust path as needed
const Product = require('../models/productModel'); // Adjust path as needed



// Get all contracts
router.get('/', async (req, res) => {
    try {
        const contracts = await Contract.find()
            .populate('client_id')
            .populate('lead_type')
            .populate('pipeline_id')
            .populate('source_id')
            .populate('products')
            .populate('created_by')
            .populate('lead_id')
            .populate('selected_users')
            .populate('service_commission_id'); // Ensure to populate service commissions

        res.status(200).json(contracts);
    } catch (error) {
        console.error('Error fetching contracts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a single contract by ID
router.get('/:id', async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id)
            .populate('client_id')
            .populate('lead_type')
            .populate('pipeline_id')
            .populate('source_id')
            .populate('products')
            .populate('created_by')
            .populate('lead_id')
            .populate('selected_users')
            .populate('service_commission_id'); // Ensure to populate service commissions

        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.status(200).json(contract);
    } catch (error) {
        console.error('Error fetching contract:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a contract by ID
router.put('/:id', async (req, res) => {
    try {
        const {
            is_transfer,
            client_id,
            lead_type,
            pipeline_id,
            source_id,
            products,
            contract_stage,
            labels,
            status,
            created_by,
            lead_id,
            selected_users,
            is_active,
            date
        } = req.body;

        const updatedContract = await Contract.findByIdAndUpdate(
            req.params.id,
            {
                is_transfer,
                client_id,
                lead_type,
                pipeline_id,
                source_id,
                products,
                contract_stage,
                labels,
                status,
                created_by,
                lead_id,
                selected_users,
                is_active,
                date
            },
            { new: true }
        );

        if (!updatedContract) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.status(200).json(updatedContract);
    } catch (error) {
        console.error('Error updating contract:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a contract by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedContract = await Contract.findByIdAndDelete(req.params.id);

        if (!deletedContract) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.status(200).json({ message: 'Contract deleted successfully' });
    } catch (error) {
        console.error('Error deleting contract:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Example route for handling Service Commissions
router.get('/:id/service-commission', async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id)
            .populate('service_commission_id');

        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.status(200).json(contract.service_commission_id);
    } catch (error) {
        console.error('Error fetching service commission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
