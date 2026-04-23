const express = require('express');
const cors = require('cors');
require('dotenv').config();

const streamRoutes = require('./routes/stream');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Mount payment routes BEFORE express.json() so the webhook route can use express.raw()
app.use('/api/payment', paymentRoutes);

app.use(express.json());

// Routes
app.use('/api', streamRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Onix Pirate Streaming Backend running on port ${PORT}`);
    console.log(`📡 TMDB Integration: ${process.env.TMDB_API_KEY ? 'Active' : 'Missing Key'}`);
    console.log(`🔗 Prowlarr API: ${process.env.PROWLARR_URL ? 'Linked' : 'Missing URL'}`);
});
