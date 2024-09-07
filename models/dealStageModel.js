const mongoose = require('mongoose');

const dealStageSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true,
        trim: true
    },
    created_by: {
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'User', // Assuming 'User' model exists and is referenced here
        type: String,
        // required: true
    },
    order: {
        type: String,
        default: 0,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now,
        required: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Middleware to automatically update the `updated_at` field on save
dealStageSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

const DealStage = mongoose.model('DealStage', dealStageSchema);

module.exports = DealStage;
