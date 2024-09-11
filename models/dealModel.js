const mongoose = require('mongoose');
const { Schema } = mongoose;
const User = require('./userModel');
const DealActivityLog = require('./dealActivityLogModel');
const Pipeline = require('./pipelineModel');
const DealStage = require('../models/dealStageModel');
const LeadType = require('../models/leadTypeModel');
const ServiceCommission = require ('../models/serviceCommissionModel.js')
const dealSchema = new Schema({
    // is_transfer: {
    //     type: Boolean,
    //     default: false
    // },
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
    products: {
        type: Schema.Types.ObjectId,
        ref: 'Product', 
        required: true
    },
    contract_stage: {
        type: String,
        required: true
    },
    deal_stage: {
        type: Schema.Types.ObjectId,
        ref: 'DealStage',
        required: false
    },
    labels: [{
        type: String, // Changed to String
        default: null
    }],
    status: {
        type: String,
        enum: ['Active', 'Inactive'], // Adjust based on possible values
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
    contract_id: {
        type: Schema.Types.ObjectId,
        ref: 'Contract',

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
    activity_logs: [{
        type: Schema.Types.ObjectId,
        ref: 'DealActivityLog'
    }],
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
    delstatus: { type: Boolean, default: false },

});

// // Update timestamps before saving
// dealSchema.pre('save', function (next) {
//     if (this.isModified()) {
//         this.updated_at = Date.now();
//     }
//     next();
// });

module.exports = mongoose.model('Deal', dealSchema);
