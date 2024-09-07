const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const leadRouter = require('./routes/leadRouter')
const dealRouter = require('./routes/dealRouter')
const clientRouter = require('./routes/clientRouter')
const userRouter = require('./routes/userRouter')
const pipelineRouter = require('./routes/pipelineRouter')
const branchRouter = require('./routes/branchRouter')
const leadstageRouter = require('./routes/leadStageRouter')
const sourceRouter = require('./routes/sourceRouter')
const productstageRouter = require('./routes/productStageRouter')
const productsRouter = require('./routes/productRouter')
const leadtypesRouter = require('./routes/leadTypeRouter')
const dealstagesRouter = require('./routes/dealStageRouter')
require('dotenv').config();

const path = require('path');
const app = express();
const port = 2000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/newwithdeal', {
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('Error connecting to MongoDB:', err));

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json());
app.use('/lead_files', express.static(path.join(__dirname, 'lead_files')));
app.use('/images', express.static(path.join(__dirname, 'images')));


// All Routers
app.use('/api/clients', clientRouter);
app.use('/api/leads', leadRouter);
app.use('/api/deals', dealRouter);
app.use('/api/users', userRouter);
app.use('/api/pipelines', pipelineRouter);
app.use('/api/sources', sourceRouter);
app.use('/api/branch', branchRouter);
app.use('/api/leadstages', leadstageRouter);
app.use('/api/productstages', productstageRouter);
app.use('/api/products', productsRouter);
app.use('/api/leadtypes', leadtypesRouter);
app.use('/api/dealstages', dealstagesRouter);






// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
