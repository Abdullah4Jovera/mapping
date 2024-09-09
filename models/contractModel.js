const mongoose = require('mongoose');
const { Schema } = mongoose;
const User = require('./userModel');
// const ContractActivityLog = require('./contractActivityLogModel'); // Assuming you have this model
const Pipeline = require('./pipelineModel');
// const ContractStage = require('../models/contractStageModel'); // Adjust path as needed
const LeadType = require('../models/leadTypeModel');
const ServiceCommission = require ('../models/serviceCommissionModel.js');
const Source = require('../models/sourceModel'); // Adjust path as needed
const Product = require('../models/productModel'); // Adjust path as needed

const contractSchema = new Schema({
    is_transfer: {
        type: Boolean,
        default: false
    },
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    lead_type: {
        type: Schema.Types.ObjectId,
        ref: 'LeadType',
        required: true
    },
    pipeline_id: {
        type: Schema.Types.ObjectId,
        ref: 'Pipeline',
        required: true
    },
    source_id: {
        type: Schema.Types.ObjectId,
        ref: 'Source',
        required: true
    },
    products: [{
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }],
    contract_stage: {
        type: String,
        default: 'New'
    },
    labels: [{
        type: String,
        default: null
    }],
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        required: true
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lead_id: {
        type: Schema.Types.ObjectId,
        ref: 'Lead',
    },
    selected_users: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    is_active: {
        type: Boolean,
        default: false
    },
    service_commission_id: {
        type: Schema.Types.ObjectId,
        ref: 'ServiceCommission',
    },
    // activity_logs: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'ContractActivityLog'
    // }],
    date: {
        type: Date,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    delstatus: { 
        type: Boolean, 
        default: false 
    },
});

// Update timestamps before saving
contractSchema.pre('save', function (next) {
    if (this.isModified()) {
        this.updated_at = Date.now();
    }
    next();
});

module.exports = mongoose.model('Contract', contractSchema);
