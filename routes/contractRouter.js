const express = require('express');
const router = express.Router();
const Contract = require('../models/contractModel'); // Adjust path as needed
const ServiceCommission = require('../models/serviceCommissionModel'); // Adjust path as needed
const User = require('../models/userModel'); // Adjust path as needed
const Pipeline = require('../models/pipelineModel'); // Adjust path as needed
const LeadType = require('../models/leadTypeModel'); // Adjust path as needed
const Source = require('../models/sourceModel'); // Adjust path as needed
const Product = require('../models/productModel'); // Adjust path as needed
const { isAuth } = require('../utils');

 

// Get all contracts
router.get('/', isAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Fetch contracts and populate the necessary fields
        const contracts = await Contract.find({ selected_users: userId })
            .populate('client_id', 'name') // Only populate the client's name
            .populate('lead_type', 'name') // Only populate lead type name
            .populate('pipeline_id', 'name') // Only populate pipeline name
            .populate('source_id', 'name') // Only populate source name
            .populate('products', 'name') // Only populate product name
            .populate('created_by', 'name') // Only populate creator's name
            .populate('selected_users', 'name') // Only populate selected users' names
            .populate({
                path: 'service_commission_id', 
                populate: [
                    { path: 'hodsale', select: 'name' },
                    { path: 'salemanager', select: 'name' },
                    { path: 'coordinator', select: 'name' },
                    { path: 'team_leader', select: 'name' },
                    { path: 'salesagent', select: 'name' },
                    { path: 'team_leader_one', select: 'name' },
                    { path: 'sale_agent_one', select: 'name' },
                    { path: 'salemanagerref', select: 'name' },
                    { path: 'agentref', select: 'name' },
                    { path: 'ts_hod', select: 'name' },
                    { path: 'ts_team_leader', select: 'name' },
                    { path: 'tsagent', select: 'name' },
                    { path: 'marketingmanager', select: 'name' },
                    { path: 'marketing_team_leader', select: 'name' },
                    { path: 'other_name', select: 'name' }
                ] // Populate the necessary user-related fields
            });

        res.status(200).json(contracts);
    } catch (error) {
        console.error('Error fetching contracts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/update-stage/:id', isAuth, async (req, res) => {
    try {
        const { id } = req.params; 
        const { contract_stage } = req.body;

        // Validate input
        if (!contract_stage) {
            return res.status(400).json({ error: 'Contract stage is required' });
        }

        // Find and update the contract
        const contract = await Contract.findById(id);
        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        contract.contract_stage = contract_stage;
        await contract.save();

        res.status(200).json({ message: 'Contract stage updated successfully', contract });
    } catch (error) {
        console.error('Error updating contract stage:', error);
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
