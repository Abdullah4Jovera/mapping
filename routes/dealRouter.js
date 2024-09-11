// routes/dealRouter.js
const express = require('express');
const router = express.Router();
const Deal = require('../models/dealModel'); // Adjust the path to your Deal model



router.get('/get-deals', async (req, res) => {
  try {
    const deals = await Deal.find()
      .populate('client_id', 'name email') // Populate client details
      .populate('created_by', 'name email') // Populate creator details
      .populate('pipeline_id', 'name') // Populate pipeline details
      .populate('lead_type', 'name') // Populate lead type details
      .populate('deal_stage', 'name') // Populate deal stage details
      .populate('source_id', 'name') // Populate source details
      .populate('products', 'name') // Populate products details
      .populate({
        path: 'service_commission_id',
        populate: [
          { path: 'hodsale', select: 'name email' },           // Populate hodsale user details
          { path: 'salemanager', select: 'name email' },       // Populate salemanager user details
          { path: 'coordinator', select: 'name email' },       // Populate coordinator user details
          { path: 'team_leader', select: 'name email' },       // Populate team_leader user details
          { path: 'salesagent', select: 'name email' },        // Populate sales agent user details
          { path: 'team_leader_one', select: 'name email' },   // Populate team_leader_one user details
          { path: 'sale_agent_one', select: 'name email' },    // Populate sale_agent_one user details
          { path: 'salemanagerref', select: 'name email' },    // Populate salemanagerref user details
          { path: 'agentref', select: 'name email' },          // Populate agentref user details
          { path: 'ts_hod', select: 'name email' },            // Populate ts_hod user details
          { path: 'ts_team_leader', select: 'name email' },    // Populate ts_team_leader user details
          { path: 'tsagent', select: 'name email' },           // Populate tsagent user details
          { path: 'marketingmanager', select: 'name email' },  // Populate marketingmanager user details
          { path: 'marketingagent', select: 'name email' }     // Populate marketingagent user details
        ]
      })
      .populate('activity_logs'); // Populate activity logs

    res.status(200).json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ message: 'Error fetching deals' });
  }
});

module.exports = router;
