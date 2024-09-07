const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Deal = require('../models/dealModel');
const User = require('../models/userModel');
const Client = require('../models/clientModel');
const Lead = require('../models/leadModel');
const ServiceCommission = require('../models/serviceCommissionModel');
const DealActivityLog = require('../models/dealActivityLogModel');
const Pipeline = require('../models/pipelineModel'); // Assuming you have a Pipeline model
const Source = require('../models/sourceModel'); // Assuming you have a Source model
const LeadType = require('../models/leadTypeModel');
const Product = require('../models/productModel'); 
const DealStage = require('../models/dealStageModel');
// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/newwithdeal', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Load JSON file helper
const loadJSON = (filePath) => {
    const fullPath = path.join(__dirname, '../data', filePath);
    const rawData = fs.readFileSync(fullPath);
    return JSON.parse(rawData);
};

const dealStagesData = loadJSON('deal_stages.json');
const findOrCreateDealStage = async (dealStageName) => {
    try {
        let dealStage = await DealStage.findOne({ name: dealStageName });
        if (!dealStage) {
            dealStage = new DealStage({
                name: dealStageName,
                created_at: new Date(),
                updated_at: new Date(),
            });
            await dealStage.save();
        }
        return dealStage._id;
    } catch (error) {
        console.error(`Error finding or creating deal stage ${dealStageName}:`, error);
        throw error;
    }
};
// Function to create or find a pipeline
const findOrCreatePipeline = async (pipelineData) => {
    try {
        let pipeline = await Pipeline.findOne({ name: pipelineData.name });
        if (!pipeline) {
            pipeline = new Pipeline({
                name: pipelineData.name,
                created_by: pipelineData.created_by,
                created_at: new Date(pipelineData.created_at),
                updated_at: new Date(pipelineData.updated_at),
            });
            await pipeline.save();
        }
        return pipeline._id;
    } catch (error) {
        console.error('Error finding or creating pipeline:', error);
        throw error;
    }
};
const findOrCreateLeadType = async (leadTypeData) => {
    try {
        let leadType = await LeadType.findOne({ name: leadTypeData.name });
        if (!leadType) {
            leadType = new LeadType({
                name: leadTypeData.name,
                created_by: leadTypeData.created_by,
                created_at: new Date(leadTypeData.created_at),
                updated_at: new Date(leadTypeData.updated_at),
            });
            await leadType.save();
        }
        return leadType._id;
    } catch (error) {
        console.error('Error finding or creating leadType:', error);
        throw error;
    }
};

const leadTypesData = loadJSON('lead_types.json');
// Function to create or find a source
const findOrCreateSource = async (sourceData) => {
    try {
        const leadTypeData = leadTypesData.find(leadType => leadType.id === sourceData.lead_type_id);

        if (!leadTypeData) {
            throw new Error(`Lead type with ID ${sourceData.lead_type_id} not found in leadTypesData.`);
        }

        const leadTypeId = await findOrCreateLeadType(leadTypeData);

        let source = await Source.findOne({ name: sourceData.name });
        if (!source) {
            source = new Source({
                name: sourceData.name,
                lead_type_id: leadTypeId, 
                created_by: sourceData.created_by,
                created_at: new Date(sourceData.created_at),
                updated_at: new Date(sourceData.updated_at),
            });
            await source.save();
        }
        return source._id;
    } catch (error) {
        console.error('Error finding or creating source:', error);
        throw error;
    }
};

// Function to map user data and get role
const mapUserData = (userJson, pipelinesMap) => {
    const pipelineId = pipelinesMap.get(userJson.pipeline);
    const role = `${pipelineId}_${userJson.type}`;
    return {
        name: userJson.name,
        email: userJson.email,
        password: userJson.password,
        image: userJson.avatar,
        role: role,
        branch: userJson.branch || 'Abu Dhabi',
        permissions: [],
        delStatus: userJson.delete_status === '1',
        verified: userJson.is_email_verified === '1',
    };
};

// Find or create a user
const findOrCreateUser = async (userData, pipelinesMap) => {
    try {
        const mappedUserData = mapUserData(userData, pipelinesMap);
        const { email } = mappedUserData;

        const user = await User.findOneAndUpdate(
            { email },
            mappedUserData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return user._id;
    } catch (error) {
        console.error('Error finding or creating user:', error);
        throw error;
    }
};

// Find or create a client
const findOrCreateClient = async (clientData) => {
    try {
        let client = await Client.findOne({ phone: clientData.phone });
        if (!client) {
            client = new Client({
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                created_at: new Date(clientData.created_at),
                updated_at: new Date(clientData.updated_at),
            });
            await client.save();
        }
        return client._id;
    } catch (error) {
        console.error('Error finding or creating client:', error);
        throw error;
    }
};

// Find a lead by client ID
const findLeadByClientId = async (clientId) => {
    try {
        const lead = await Lead.findOne({ client: clientId });
        return lead ? lead._id : null;
    } catch (error) {
        console.error('Error finding lead by client ID:', error);
        throw error;
    }
};

// Function to create deal activity log
const createDealActivityLog = async (userId, dealId, logType, remark) => {
    try {
        const activityLog = new DealActivityLog({
            user_id: userId,
            deal_id: dealId,
            log_type: logType,
            remark: JSON.stringify(remark),
            created_at: new Date(),
            updated_at: new Date(),
        });
        const savedActivityLog = await activityLog.save();
        return savedActivityLog._id;
    } catch (error) {
        console.error('Error creating deal activity log:', error);
        throw error;
    }
};
const findOrCreateProduct = async (productName) => {
    try {
        let product = await Product.findOne({ name: productName });
        if (!product) {
            product = new Product({
                name: productName,
            });
            await product.save();
        }
        return product._id;
    } catch (error) {
        console.error('Error finding or creating product:', error);
        throw error;
    }
};

const mapDealStages = async () => {
    const dealStagesMap = new Map();
    for (const dealStageData of dealStagesData) {
        const dealStageId = await findOrCreateDealStage(dealStageData.name);
        dealStagesMap.set(dealStageData.id, dealStageId);
    }
    return dealStagesMap;
};

const loadDeals = async () => {
    try {
        const deals = loadJSON('deals.json');
        const usersData = loadJSON('users.json');
        const clientsData = loadJSON('clients.json');
        const pipelinesData = loadJSON('pipelines.json');
        const sourcesData = loadJSON('sources.json');
        const productsData = loadJSON('products.json');
        const labelsData = loadJSON('labels.json');
        const leadTypesData = loadJSON('lead_types.json');
        const serviceCommissionsData = loadJSON('service_commissions.json');
        const dealActivitiesData = loadJSON('deal_activity.json');
        const dealStagesData = loadJSON('deal_stages.json');
        
        const labelsMap = new Map(labelsData.map(label => [label.id, label.name]));
        const dealStagesMap = await mapDealStages();

        const leadTypesMap = new Map();
        for (const leadTypeData of leadTypesData) {
            const leadTypeId = await findOrCreateLeadType(leadTypeData);
            leadTypesMap.set(leadTypeData.id, leadTypeId);
        }

        const pipelinesMap = new Map();
        for (const pipelineData of pipelinesData) {
            const pipelineId = await findOrCreatePipeline(pipelineData);
            pipelinesMap.set(pipelineData.id, pipelineId);
        }

        const sourcesMap = new Map();
        for (const sourceData of sourcesData) {
            const sourceId = await findOrCreateSource(sourceData);
            sourcesMap.set(sourceData.id, sourceId);
        }

        const productsMap = new Map();
        for (const productData of productsData) {
            const productId = await findOrCreateProduct(productData.name);
            productsMap.set(productData.id, productId);
        }

        for (const deal of deals) {
            const clientData = clientsData.find(client => client.id === deal.client_id);
            if (!clientData) {
                console.error(`Client with ID ${deal.client_id} not found in clients.json.`);
                continue;
            }
            const clientId = await findOrCreateClient(clientData);

            const userData = usersData.find(user => user.id === deal.created_by);
            if (!userData) {
                console.error(`User with ID ${deal.created_by} not found in users.json.`);
                continue;
            }
            const userId = await findOrCreateUser(userData, pipelinesMap);

            const leadId = await findLeadByClientId(clientId);
            if (!leadId) {
                console.error(`No lead found for client ID ${clientId}.`);
                continue;
            }
            const lead = await Lead.findById(leadId).populate('selected_users');
            const selectedUsers = lead.selected_users.map(user => user._id);

            // If deal stage is not found, set it to null
            const dealStageId = dealStagesMap.get(lead.deal_stage) || null;
            const isTransfer = deal.contract_stage === 'cm_signed';
            const serviceCommission = serviceCommissionsData.find(sc => sc.id === deal.service_commission_id);
            if (!serviceCommission) {
                console.error(`No service commission found for deal ID ${deal.id}. Skipping deal creation.`);
                continue; // Skip this deal and go to the next one
            }
            const transformedDeal = {
                is_transfer: isTransfer,
                client_id: clientId,
                lead_type: leadTypesMap.get(deal.lead_type),
                pipeline_id: pipelinesMap.get(deal.pipeline_id) || deal.pipeline_id,
                source_id: sourcesMap.get(deal.sources) || deal.sources,
                products: productsMap.get(deal.products) || deal.products,
                contract_stage: deal.contract_stage,
                labels: deal.labels ? deal.labels.split(',').map(labelId => labelsMap.get(labelId.trim()) || 'Unknown') : [],
                status: deal.status,
                created_by: userId,
                is_active: deal.is_active === '1' ? true : false,
                lead_id: leadId,
                deal_stage: dealStageId, // Set deal_stage to the found ID or null
                selected_users: selectedUsers,
                date: new Date(deal.date),
                created_at: new Date(deal.created_at),
                updated_at: new Date(deal.updated_at),
                activity_logs: []
            };

            // Insert the Deal into MongoDB
            const newDeal = await Deal.create(transformedDeal);

            await ServiceCommission.create({
                deal_id: newDeal._id,
                commission_amount: serviceCommission.commission_amount,
                service_amount: serviceCommission.service_amount,
                created_at: new Date(serviceCommission.created_at),
                updated_at: new Date(serviceCommission.updated_at),
            });

            // Log deal activity and collect activity log IDs
            const activityLogs = dealActivitiesData.filter(activity => activity.deal_id === deal.id);
            const activityLogIds = [];
            for (const activity of activityLogs) {
                const activityLogId = await createDealActivityLog(userId, newDeal._id, activity.log_type, activity.remark);
                activityLogIds.push(activityLogId);
            }
        }
    } catch (error) {
        console.error('Error loading deals:', error);
        throw error;
    }
};

// Run load deals function
loadDeals();

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
