const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/littlebeadsbeads')
  .then(async () => {
    console.log('MongoDB connected');
    // Sync indexes: drop stale indexes (e.g. removed key/code unique constraints)
    const models = mongoose.modelNames().map(name => mongoose.model(name));
    await Promise.all(models.map(m => m.syncIndexes()));
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/settings', require('./routes/settings'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/series', require('./routes/series'));
app.use('/api/products', require('./routes/products'));
app.use('/api/semi-products', require('./routes/semiProducts'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/stock-logs', require('./routes/stockLogs'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/export', require('./routes/export'));
app.use('/api/import', require('./routes/import'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve frontend static files (production build)
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get(/^\/(?!api|uploads).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
