// Drift Backend Server
// Serves the API and runs the scraper on a schedule
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const { runScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'Drift Backend API',
    version: '1.0.0',
    description: 'Subscription change tracking for the Drift app',
    endpoints: {
      services: '/api/services',
      changes: '/api/changes',
      recentChanges: '/api/changes/recent',
      stats: '/api/stats',
      categories: '/api/categories',
      health: '/api/health',
    },
  });
});

// Schedule scraper to run twice daily (6 AM and 6 PM UTC)
cron.schedule('0 6,18 * * *', () => {
  console.log('Running scheduled scrape...');
  runScraper().catch(err => console.error('Scheduled scrape failed:', err));
});

// Start server
app.listen(PORT, () => {
  console.log(`Drift backend running on port ${PORT}`);
  console.log(`Scraper scheduled: twice daily at 6 AM and 6 PM UTC`);
});
