const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const productStageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  product_id: {
    type: Schema.Types.ObjectId,
    ref: 'Product',  
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true  
});

const ProductStage = mongoose.model('ProductStage', productStageSchema);
module.exports = ProductStage;