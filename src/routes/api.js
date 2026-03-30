const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/services — list all services, optionally filter by category
router.get('/services', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM services ORDER BY category, name';
    let params = [];
    if (category) {
      query = 'SELECT * FROM services WHERE category = $1 ORDER BY name';
      params = [category];
    }
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// GET /api/services/:slug — get a single service with its price history
router.get('/services/:slug', async (req, res) => {
  try {
    const svc = await db.query('SELECT * FROM services WHERE slug = $1', [req.params.slug]);
    if (svc.rows.length === 0) return res.status(404).json({ error: 'Service not found' });

    const history = await db.query(
      'SELECT * FROM price_history WHERE service_id = $1 ORDER BY detected_at DESC LIMIT 50',
      [svc.rows[0].id]
    );
    const changes = await db.query(
      'SELECT * FROM changes WHERE service_id = $1 ORDER BY detected_at DESC LIMIT 20',
      [svc.rows[0].id]
    );

    res.json({ ...svc.rows[0], priceHistory: history.rows, changes: changes.rows });
  } catch (err) {
    console.error('Error fetching service:', err);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// GET /api/changes — recent changes feed (the main feed for the app)
router.get('/changes', async (req, res) => {
  try {
    const { type, severity, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT c.*, s.name as service_name, s.category, s.color, s.slug as service_slug
      FROM changes c
      JOIN services s ON c.service_id = s.id
    `;
    const conditions = [];
    const params = [];

    if (type) {
      params.push(type);
      conditions.push(`c.type = $${params.length}`);
    }
    if (severity) {
      params.push(severity);
      conditions.push(`c.severity = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    params.push(parseInt(limit));
    query += ` ORDER BY c.detected_at DESC LIMIT $${params.length}`;
    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching changes:', err);
    res.status(500).json({ error: 'Failed to fetch changes' });
  }
});

// GET /api/changes/recent — last 7 days of changes (dashboard widget)
router.get('/changes/recent', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, s.name as service_name, s.category, s.color, s.slug as service_slug
      FROM changes c
      JOIN services s ON c.service_id = s.id
      WHERE c.detected_at >= NOW() - INTERVAL '7 days'
      ORDER BY c.detected_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching recent changes:', err);
    res.status(500).json({ error: 'Failed to fetch recent changes' });
  }
});

// GET /api/stats — dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [priceHikes, policyChanges, totalServices] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM changes WHERE type = 'price_increase' AND detected_at >= NOW() - INTERVAL '30 days'`),
      db.query(`SELECT COUNT(*) FROM changes WHERE type = 'policy_change' AND detected_at >= NOW() - INTERVAL '30 days'`),
      db.query(`SELECT COUNT(*) FROM services`),
    ]);
    res.json({
      priceHikes30d: parseInt(priceHikes.rows[0].count),
      policyChanges30d: parseInt(policyChanges.rows[0].count),
      totalServices: parseInt(totalServices.rows[0].count),
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/categories — list all categories with service counts
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT category, COUNT(*) as service_count 
      FROM services GROUP BY category ORDER BY category
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/health — health check
router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
