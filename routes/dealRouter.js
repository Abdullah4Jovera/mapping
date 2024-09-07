// routes/dealRouter.js
const express = require('express');
const router = express.Router();
const Deal = require('../models/dealModel'); // Adjust the path to your Deal model



router.get('/get-deals', async (req, res) => {
  try {
    const deals = await Deal.find()
      .populate('client_id', 'name email') // Populate client details
      .populate('created_by', 'name email') // Populate creator details
      .populate('pipeline_id', 'name') // Populate creator details
      .populate('lead_type', 'name') // Populate creator details
      .populate('deal_stage', 'name') // Populate creator details
      .populate('source_id', 'name') // Populate creator details
      .populate('products', 'name') // Populate creator details






    // Check if lead_id and activity_logs are populated
    deals.forEach(deal => {
      if (!deal.lead_id) {
        console.warn('Lead not found for deal:', deal._id);
      } else if (!deal.lead_id.activity_logs) {
        console.warn('Activity logs not found for lead:', deal.lead_id._id);
      }
    });

    res.status(200).json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ message: 'Error fetching deals' });
  }
});

module.exports = router;
