// Seed script: loads schema + all services + historical changes into the database
const fs = require('fs');
const path = require('path');
const db = require('./index');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const services = SERVICES_PLACEHOLDER;

const historicalChanges = HISTORICAL_PLACEHOLDER;

async function seed() {
  const client = await db.pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created.');

    // Insert services
    for (const svc of services) {
      const slug = slugify(svc.name);
      await client.query(
        `INSERT INTO services (slug, name, category, current_price, billing_cycle, color)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (slug) DO UPDATE SET current_price = $4, updated_at = NOW()`,
        [slug, svc.name, svc.category, svc.defaultPrice, 'monthly', svc.color]
      );
    }
    console.log(`Seeded ${services.length} services.`);

    // Insert historical changes
    for (const change of historicalChanges) {
      // Find the service by matching name prefix
      const result = await client.query(
        `SELECT id FROM services WHERE name ILIKE $1 LIMIT 1`,
        [`%${change.service}%`]
      );
      const serviceId = result.rows.length > 0 ? result.rows[0].id : null;
      
      if (serviceId) {
        await client.query(
          `INSERT INTO changes (service_id, type, severity, title, description, impact, old_value, new_value, effective_date, detected_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
           ON CONFLICT DO NOTHING`,
          [serviceId, change.type, change.severity, change.title, change.description,
           change.impact || null, change.oldValue || null, change.newValue || null, change.date]
        );
      } else {
        console.log(`  Warning: no service match for "${change.service}"`);
      }
    }
    console.log(`Seeded ${historicalChanges.length} historical changes.`);
    console.log('Done!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    client.release();
    await db.pool.end();
  }
}

seed();
