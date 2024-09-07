
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Lead = require('../models/leadModel'); 
const { isAuth, hasRole } = require('../utils');
const Client = require('../models/clientModel');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const ProductStage = require('../models/productStageModel');

/// Transfer Lead 
router.put('/transfer-lead/:id', isAuth, async (req, res) => {
    try {
        const leadId = req.params.id;
        const { pipeline, branch, product_stage, products } = req.body;

        // Ensure required fields are provided
        if (!pipeline || !branch || !product_stage || !products) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const branchId = new mongoose.Types.ObjectId(String(branch));
        const productStageId = new mongoose.Types.ObjectId(String(product_stage));
        const pipelineId = new mongoose.Types.ObjectId(String(pipeline));
        const productId = new mongoose.Types.ObjectId(String(products)); // Single ObjectId for products

        // Check if the lead exists
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        // Validate product_stage
        const validProductStage = await ProductStage.findById(productStageId);
        if (!validProductStage) {
            return res.status(400).json({ message: 'Invalid product stage' });
        }

        // Add products
        lead.products = productId;

        // Find users based on roles and the same pipeline and branch
        const ceoUsers = await User.find({ role: 'CEO' }).select('_id');
        const superadminUsers = await User.find({ role: 'superadmin' }).select('_id');
        const mdUsers = await User.find({ role: 'MD' }).select('_id');

        // Find Manager and HOD users associated with the new pipeline and branch
        const managerAndHodUsers = await User.find({
            role: { $in: ['Manager', 'HOD'] },
            pipeline: pipelineId,
            branch: branchId
        }).select('_id');

        // Find HOD users from the previous pipeline and previous branch
        const previousPipelineId = lead.pipeline_id; // Previous pipeline
        const previousBranchId = lead.branch; // Previous branch

        const previousPipelineHodUsers = await User.find({
            role: 'HOD',
            pipeline: previousPipelineId,
            branch: previousBranchId
        }).select('_id');

        // Get the original creator of the lead (created_by)
        const createdByUserId = lead.created_by.toString();

        // Combine all selected user IDs, including HOD users from the previous pipeline and branch
        const newSelectedUserIds = [
            req.user._id.toString(), // Include the currently authenticated user
            createdByUserId, // Include the lead's creator
            ...previousPipelineHodUsers.map(user => user._id.toString()), // HOD users from previous pipeline and branch
            ...ceoUsers.map(user => user._id.toString()),
            ...superadminUsers.map(user => user._id.toString()),
            ...mdUsers.map(user => user._id.toString()),
            ...managerAndHodUsers.map(user => user._id.toString())
        ];

        // Function to filter unique user IDs
        const getUniqueUserIds = (userIds) => {
            const uniqueUserMap = {};
            userIds.forEach(id => {
                if (!uniqueUserMap[id]) {
                    uniqueUserMap[id] = true;
                }
            });
            return Object.keys(uniqueUserMap);
        };

        // Merge selected users, ensuring there are no duplicates
        lead.selected_users = getUniqueUserIds(newSelectedUserIds);

        // Update the pipeline, branch, and product_stage
        lead.pipeline_id = pipelineId;
        lead.branch = branchId;
        lead.product_stage = productStageId;

        // Save the updated lead
        await lead.save();

        res.status(200).json({ message: 'Lead transferred successfully', lead });
    } catch (error) {
        console.error('Error transferring lead:', error);
        res.status(500).json({ message: 'Error transferring lead' });
    }
});


// New route to move lead (Update pipeline, branch, product_stage)
router.put('/move-lead/:id', isAuth, async (req, res) => {
    try {
        const leadId = req.params.id;
        const { pipeline, branch, product_stage } = req.body;

        // Ensure required fields are provided
        if (!pipeline || !branch || !product_stage) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const branchId = new mongoose.Types.ObjectId(String(branch));
        const productStageId = new mongoose.Types.ObjectId(String(product_stage));
        const pipelineId = new mongoose.Types.ObjectId(String(pipeline));

        // Check if the lead exists
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        // Validate product_stage
        const validProductStage = await ProductStage.findById(productStageId);
        if (!validProductStage) {
            return res.status(400).json({ message: 'Invalid product stage' });
        }

        // If pipeline or branch has changed, reset selected_users and assign new users
        if (String(lead.pipeline_id) !== String(pipelineId) || String(lead.branch) !== String(branchId)) {
            // Remove all selected users
            lead.selected_users = [];

            // Fetch new users based on pipeline and branch
            const ceoUsers = await User.find({ role: 'CEO' }).select('_id');
            const superadminUsers = await User.find({ role: 'superadmin' }).select('_id');
            const mdUsers = await User.find({ role: 'MD' }).select('_id');

            // Find users with roles Manager and HOD associated with the same pipeline and branch
            const managerAndHodUsers = await User.find({
                role: { $in: ['Manager', 'HOD'] },
                pipeline: pipelineId,
                branch: branchId // Ensure users are from the same branch
            }).select('_id');

            // Include created_by user from the lead
            const createdByUserId = lead.created_by ? lead.created_by.toString() : null;

            // Combine all selected user IDs
            const allSelectedUserIds = [
                req.user._id.toString(), // Include the currently authenticated user
                createdByUserId, // Include the created_by user if it exists
                ...ceoUsers.map(user => user._id.toString()),
                ...superadminUsers.map(user => user._id.toString()),
                ...mdUsers.map(user => user._id.toString()),
                ...managerAndHodUsers.map(user => user._id.toString())
            ].filter(Boolean); // Filter out any null or undefined values

            // Function to filter unique user IDs
            const getUniqueUserIds = (userIds) => {
                const uniqueUserMap = {};
                userIds.forEach(id => {
                    if (!uniqueUserMap[id]) {
                        uniqueUserMap[id] = true;
                    }
                });
                return Object.keys(uniqueUserMap);
            };

            // Filter out duplicate IDs and update the lead's selected_users
            lead.selected_users = getUniqueUserIds(allSelectedUserIds);
        }

        // Update the pipeline, branch, and product_stage
        lead.pipeline_id = pipelineId;
        lead.branch = branchId;
        lead.product_stage = productStageId;

        // Save the updated lead
        await lead.save();

        res.status(200).json({ message: 'Lead moved successfully', lead });
    } catch (error) {
        console.error('Error moving lead:', error);
        res.status(500).json({ message: 'Error moving lead' });
    }
});


// router.get('/', isAuth, async (req, res) => {
//     try {
//         const userId = req.user._id; // Extract the authenticated user's ID

//         // Find leads where the authenticated user is in the selected_users array
//         const leads = await Lead.find({ selected_users: userId })
//             .populate('client created_by selected_users pipeline_id  stage product_stage lead_type source products branch');

//         res.status(200).json(leads);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// });
router.get('/single-lead/:id' , async (req, res) => {
    try {
        const { id } = req.params; // Extract lead ID from request parameters

        // Validate the ID format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid lead ID format' });
        }

        // Find the lead by ID and populate only the 'name' field for related documents
        const lead = await Lead.findById(id)
            .populate({
                path: 'client',
                select: 'name email phone'
            })
            .populate({
                path: 'created_by',
                select: 'name'
            })
            .populate({
                path: 'selected_users',
                select: 'name'
            })
            .populate({
                path: 'pipeline_id',
                select: 'name'
            })
            .populate({
                path: 'product_stage',
                select: 'name'
            })
            .populate({
                path: 'lead_type',
                select: 'name'
            })
            .populate({
                path: 'source',
                select: 'name'
            })
            .populate({
                path: 'products',
                select: 'name'
            })
            .populate({
                path: 'branch',
                select: 'name'
            });

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


// Update product_stage of a lead
router.put('/update-product-stage/:leadId', isAuth, async (req, res) => {
    const { leadId } = req.params;
    const { newProductStageId } = req.body;

    if (!newProductStageId) {
        return res.status(400).json({ message: 'New product_stage ID is required' });
    }

    try {
        // Find and validate the new product_stage
        const newProductStage = await ProductStage.findById(newProductStageId);
        if (!newProductStage) {
            return res.status(404).json({ message: 'Product stage not found' });
        }

        // Find the lead
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        // Check if the user is authorized to update this lead
        if (!lead.selected_users.includes(req.user._id)) {
            return res.status(403).json({ message: 'You are not authorized to update this lead' });
        }

        // Update the product_stage of the lead
        lead.product_stage = newProductStageId;
        lead.updated_at = Date.now();

        await lead.save();

        // Optionally log this update in an Activity Log
        // const activityLog = new ActivityLog({
        //     action: 'Updated product_stage',
        //     lead: leadId,
        //     updated_by: req.user._id,
        //     details: { product_stage: newProductStageId },
        // });
        // await activityLog.save();

        res.status(200).json({ message: 'Product stage updated successfully', lead });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
router.put('/edit-lead/:id', isAuth, async (req, res) => {
    try {
        const { 
            clientPhone, 
            clientName, 
            clientEmail, 
            product_stage,  
            lead_type, 
            pipeline,
            products, 
            source, 
            description,
            branch,
            selected_users
        } = req.body;
      
        const leadId = req.params.id;
        const branchId = new mongoose.Types.ObjectId(String(branch));
        const productStageId = new mongoose.Types.ObjectId(String(product_stage));
        const leadTypeId = new mongoose.Types.ObjectId(String(lead_type));
        const pipelineId = new mongoose.Types.ObjectId(String(pipeline));
        const sourceId = new mongoose.Types.ObjectId(String(source));
        const productId = new mongoose.Types.ObjectId(String(products)); // Single ObjectId

        // Check for product_stage validity
        const validProductStage = await ProductStage.findById(productStageId);
        if (!validProductStage) {
            return res.status(400).json({ message: 'Invalid product stage' });
        }

        let client = await Client.findOne({ phone: clientPhone });
        if (!client) {
            // Create new client if not found
            const defaultPassword = '123'; 
            const hashedPassword = await bcrypt.hash(defaultPassword, 10); 

            client = new Client({
                phone: clientPhone,
                name: clientName || '',
                email: clientEmail || '',
                password: hashedPassword,
            });
            await client.save();
        } else {
            // Update existing client with new information if provided
            if (clientName) client.name = clientName;
            if (clientEmail) client.email = clientEmail;
            await client.save();
        }

        // Convert selected_users to ObjectId format and then to string
        const selectedUserIds = selected_users.map(user => {
            
            try {
                return new mongoose.Types.ObjectId(String(user));
            } catch (error) {
                console.error('Invalid user ID:', user);
                return null;
            }
        }).filter(id => id !== null); // Filter out invalid IDs

        // Find users with specific roles
        const ceoUsers = await User.find({ role: 'CEO' }).select('_id');
        const superadminUsers = await User.find({ role: 'superadmin' }).select('_id');
        const mdUsers = await User.find({ role: 'MD' }).select('_id');

        // Find users with roles Manager and HOD associated with the same pipeline_id
        const managerAndHodUsers = await User.find({
            role: { $in: ['Manager', 'HOD'] },
            pipeline: pipelineId
        }).select('_id'); 

        // Combine all selected user IDs
        const allSelectedUserIds = [
            req.user._id.toString(), // Include the currently authenticated user
            ...selectedUserIds,
            ...ceoUsers.map(user => user._id.toString()),
            ...superadminUsers.map(user => user._id.toString()),
            ...mdUsers.map(user => user._id.toString()),
            ...managerAndHodUsers.map(user => user._id.toString())
        ];

        // Function to filter unique user IDs
        const getUniqueUserIds = (userIds) => {
            const uniqueUserMap = {};
            userIds.forEach(id => {
                if (!uniqueUserMap[id]) {
                    uniqueUserMap[id] = true;
                }
            });
            return Object.keys(uniqueUserMap);
        };

        // Filter out duplicate IDs
        const uniqueUserIds = getUniqueUserIds(allSelectedUserIds);

        // Update lead
        const updatedLead = await Lead.findByIdAndUpdate(
            leadId,
            {
                client: client._id,
                updated_by: req.user._id,
                selected_users: uniqueUserIds,
                pipeline_id: pipelineId,
                lead_type: leadTypeId,
                source: sourceId,
                product_stage: productStageId,
                products: productId,
                description,
                branch: branchId
            },
            { new: true } // Return the updated lead
        );

        if (!updatedLead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        res.status(200).json(updatedLead);
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ message: 'Error updating lead' });
    }
});



router.get('/get-leads', isAuth, async (req, res) => { 
    try {
        const userId = req.user._id;
        // const { _id: userId, branch: userBranch, selected_users: userSelectedUsers = [], products: userProduct } = req.user;
        const { page = 1, limit = 2000 } = req.query;
        // console.log(userProduct);
        // Building the query object
        // let leadsQuery = {};

        // // Filter based on selected users
        // if (userSelectedUsers.length > 0) {
        //     leadsQuery.selected_users = { $in: userSelectedUsers };
        // } else {
        //     leadsQuery.selected_users = userId;
        // }

        // // Filter based on branch
        // if (userBranch !== null) {
        //     leadsQuery.branch = userBranch;
        // }

        // // Filter based on the product in req.user
        // if (userProduct) {  // If userProduct is not null, add the filter
        //     leadsQuery.products = userProduct;  // Assuming 'products' is a field in the leads schema
        // }

        // Fetch leads with the built query
        const leads = await Lead.find({ selected_users: userId })
            .populate('branch', 'name')
            .populate('pipeline_id', 'name')
            .populate('stage', 'name')
            .populate('lead_type', 'name')
            .populate({
                path: 'source',
                populate: {
                    path: 'lead_type_id',
                    select: 'name created_by'
                }
            })
            .populate('created_by', 'name email')
            .populate('client', 'name email')
            .populate('selected_users', 'name email')
            .populate({
                path: 'activity_logs',
                populate: {
                    path: 'user_id',
                    select: 'name email'
                }
            })
            .populate({
                path: 'files',
                select: 'file_name file_path created_at updated_at'
            })
            .populate({
                path: 'stage',
                populate: {
                    path: 'pipeline_id',  
                    select: 'name created_by'  
                }
            })
            .populate({
                path: 'product_stage',
                populate: {
                    path: 'product_id',  // Populate the Product details in ProductStage
                    select: 'name'  
                }
            })
            .populate('products', 'name')  // Populate the Product details directly from the 'products' field
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();

        // Update file paths for each lead
        leads.forEach(lead => {
            if (lead.files) {
                lead.files.forEach(file => {
                    file.file_path = `${file.file_path}`;
                });
            }
        });

        // Calculate total leads and pages
        const totalLeads = await Lead.countDocuments();
        const totalPages = Math.ceil(totalLeads / limit);

        res.status(200).json({
            leads,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ message: 'Error fetching leads' });
    }
});


// Route to create a new lead
router.post('/create-lead', isAuth, async (req, res) => {
    try {
        const { 
            clientPhone, 
            clientName, 
            clientEmail, 
            product_stage,  
            lead_type, 
            pipeline,
            products, // Single ObjectId
            source, 
            description ,
            branch
        } = req.body;

        // Check for missing required fields
        if (!product_stage || !lead_type || !source) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const branchId = new mongoose.Types.ObjectId(String(branch));
        const productStageId = new mongoose.Types.ObjectId(String(product_stage));
        const leadTypeId = new mongoose.Types.ObjectId(String(lead_type));
        const pipelineId = new mongoose.Types.ObjectId(String(pipeline));
        const sourceId = new mongoose.Types.ObjectId(String(source));
        const productId = new mongoose.Types.ObjectId(String(products)); // Single ObjectId

        // Check for product_stage validity
        const validProductStage = await ProductStage.findById(productStageId);
        if (!validProductStage) {
            return res.status(400).json({ message: 'Invalid product stage' });
        }

        let client = await Client.findOne({ phone: clientPhone });
        if (!client) {
            // Create new client if not found
            const defaultPassword = '123'; 
            const hashedPassword = await bcrypt.hash(defaultPassword, 10); 

            client = new Client({
                phone: clientPhone,
                name: clientName || '',
                email: clientEmail || '',
                password: hashedPassword,
            });
            await client.save();
        } else {
            // Update existing client with new information if provided
            if (clientName) client.name = clientName;
            if (clientEmail) client.email = clientEmail;
            await client.save();
        }

        // Get selected_users from request or default to empty array
        const initialSelectedUsers = req.body.selected_users || [];

        // Extract user IDs from initialSelectedUsers and keep user objects
        const initialUserIds = initialSelectedUsers.map(user => user._id.toString());

        // Find users with specific roles
        const ceoUsers = await User.find({ role: 'CEO' }).select('_id');
        const superadminUsers = await User.find({ role: 'superadmin' }).select('_id');
        const mdUsers = await User.find({ role: 'MD' }).select('_id');

        // Find users with roles Manager and HOD associated with the same pipeline_id
        const managerAndHodUsers = await User.find({
            role: { $in: ['Manager', 'HOD'] },
            pipeline: pipelineId,
            branch: branchId // Ensure users are from the same branch
        }).select('_id'); 

        // Combine all selected user IDs
        const allSelectedUserIds = [
            req.user._id.toString(), // Include the currently authenticated user
            ...initialUserIds,
            ...ceoUsers.map(user => user._id.toString()),
            ...superadminUsers.map(user => user._id.toString()),
            ...mdUsers.map(user => user._id.toString()),
            ...managerAndHodUsers.map(user => user._id.toString())
        ];

        // Function to filter unique user IDs
        const getUniqueUserIds = (userIds) => {
            const uniqueUserMap = {};
            userIds.forEach(id => {
                if (!uniqueUserMap[id]) {
                    uniqueUserMap[id] = true;
                }
            });
            return Object.keys(uniqueUserMap);
        };

        // Filter out duplicate IDs
        const uniqueUserIds = getUniqueUserIds(allSelectedUserIds);

        // Create new lead
        const newLead = new Lead({
            client: client._id, 
            created_by: req.user._id,
            selected_users: uniqueUserIds, 
            pipeline_id: pipelineId, 
            lead_type: leadTypeId,
            source: sourceId,
            product_stage: productStageId,
            products: productId, 
            description,
            branch: branchId
        });

        // Save lead to the database
        await newLead.save();

        res.status(201).json(newLead);
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ message: 'Error creating lead' });
    }
});

/////Edit Lead

// router.put('/edit-lead/:id', isAuth, async (req, res) => {
//     try {
//         const leadId = req.params.id;
//         const {
//             clientPhone, 
//             clientName, 
//             clientEmail, 
//             pipeline_id, 
//             stage, 
//             lead_type, 
//             source, 
//             products, 
//             description, 
//             branch, 
//             delstatus,
//             selected_users = []
//         } = req.body;

//         // Validate required fields
//         if (!pipeline_id || !stage || !lead_type || !source) {
//             return res.status(400).json({ message: 'Missing required fields' });
//         }

//         // Find the lead by ID
//         let lead = await Lead.findById(leadId);
//         if (!lead) {
//             return res.status(404).json({ message: 'Lead not found' });
//         }

//         // Update client details if provided
//         if (clientPhone) {
//             let client = await Client.findOne({ phone: clientPhone });
//             if (!client) {
//                 // Create new client if not found
//                 const defaultPassword = '123'; // Default password
//                 const hashedPassword = await bcrypt.hash(defaultPassword, 10); // Hash the default password

//                 client = new Client({
//                     phone: clientPhone,
//                     name: clientName || '', // Default to empty string if not provided
//                     email: clientEmail || '',
//                     password: hashedPassword, // Set the hashed default password
//                     // You may want to add default values or additional fields here
//                 });
//                 await client.save();
//                 lead.client = client._id; // Assign newly created client
//             } else {
//                 // Update existing client with new information if provided
//                 if (clientName) client.name = clientName;
//                 if (clientEmail) client.email = clientEmail;
//                 await client.save();
//                 lead.client = client._id; // Ensure lead is linked to the correct client
//             }
//         }

//         // Find users with specific roles (CEO, Superadmin, MD)
//         const ceoUsers = await User.find({ role: 'CEO' }).select('_id');
//         const superadminUsers = await User.find({ role: 'superadmin' }).select('_id');
//         const mdUsers = await User.find({ role: 'MD' }).select('_id');

//         // Find users with roles Manager and HOD associated with the same pipeline_id
//         const managerAndHodUsers = await User.find({
//             role: { $in: ['Manager', 'HOD'] },
//             pipeline: pipeline_id // Match pipeline field in User with pipeline_id
//         }).select('_id'); 

//         // Combine all selected user IDs and ensure uniqueness
//         const allSelectedUserIds = [
//             ...new Set([
//                 req.user._id, // Include the currently authenticated user
//                 ...selected_users,
//                 ...ceoUsers.map(user => user._id),
//                 ...superadminUsers.map(user => user._id),
//                 ...mdUsers.map(user => user._id),
//                 ...managerAndHodUsers.map(user => user._id)
//             ])
//         ];

//         // Update the lead
//         lead.pipeline_id = pipeline_id;
//         lead.stage = stage;
//         lead.lead_type = lead_type;
//         lead.source = source;
//         lead.products = products;
//         lead.description = description;
//         lead.branch = branch;
//         lead.delstatus = delstatus;
//         lead.selected_users = allSelectedUserIds;

//         // Save updated lead
//         await lead.save();

//         res.status(200).json(lead);
//     } catch (error) {
//         console.error('Error updating lead:', error);
//         res.status(500).json({ message: 'Error updating lead' });
//     }
// });

router.get('/get-all-leads', async (req, res) => {
    try {
        const { page = 1, limit = 1000, pipeline_id, branch_id } = req.query;  
        const skip = (page - 1) * limit;

       
        let query = {};
        if (pipeline_id) {
            query['pipeline_id'] = pipeline_id;
        }
        if (branch_id) {
            query['branch'] = branch_id;
        }

        const leads = await Lead.find(query)
            .populate('pipeline_id', 'name created_by') 
            .populate('subpipeline_id', 'name') 
            .populate('stage', 'name order') 
            .populate('lead_type', 'name') 
            .populate('source', 'name') 
            .populate('created_by', 'name email') 
            .populate('client', 'name email') 
            .populate('selected_users', 'name email') 
            .populate({
                path: 'activity_logs',
                populate: {
                    path: 'user_id',
                    select: 'name email'
                }
            }) 
            .populate({
                path: 'files',
                select: 'file_name file_path created_at updated_at'
            }) 
            .populate('branch', 'name') 
            .skip(skip)
            .limit(parseInt(limit))
            .exec();

     
        const totalLeads = await Lead.countDocuments(query);
        const totalPages = Math.ceil(totalLeads / limit);

        
        leads.forEach(lead => {
            if (lead.files) {
                lead.files.forEach(file => {
                    file.file_path = `${file.file_path}`;
                });
            }
        });

        res.status(200).json({
            leads,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ message: 'Error fetching leads' });
    }
});


module.exports = router;
