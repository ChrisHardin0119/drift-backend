// Run the scraper manually: node src/scraper/run.js
require('dotenv').config();
const { runScraper } = require('./index');
const db = require('../db');

runScraper()
  .then(() => {
    console.log('Scraper finished.');
    return db.pool.end();
  })
  .catch((err) => {
    console.error('Scraper failed:', err);
    db.pool.end();
    process.exit(1);
  });
