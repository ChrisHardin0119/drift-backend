// Seed script: reads service data from the Drift app's existing TS files and loads into DB
const fs = require('fs');
const path = require('path');
const db = require('./index');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function extractArrayFromTS(filePath, variableName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(`(?:export\\s+)?(?:const|let|var)\\s+${variableName}[^=]*=\\s*(\\[[\\s\\S]*?\\]);`, 'm');
  const match = content.match(regex);
  if (!match) throw new Error(`Could not find ${variableName} in ${filePath}`);
  // Clean up TS-specific syntax for eval
  let arrayStr = match[1]
    .replace(/\/\/.*$/gm, '')           // remove single-line comments
    .replace(/as\s+\w+(\[\])?/g, '')    // remove TS type assertions
    .replace(/:\s*HistoricalChange\[\]/g, ''); // remove type annotations
  return new Function(`return ${arrayStr}`)();
}

async function seed() {
  const client = await db.pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created.');

    // Read services from Drift app
    const driftAppPath = path.join(__dirname, '../../..', 'drift', 'data');
    const services = extractArrayFromTS(path.join(driftAppPath, 'services.ts'), 'popularServices');
    console.log(`Found ${services.length} services in drift app.`);

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

    // Read historical changes from Drift app
    const changes = extractArrayFromTS(path.join(driftAppPath, 'historical.ts'), 'historicalChanges');
    console.log(`Found ${changes.length} historical changes.`);

    // Insert historical changes
    for (const change of changes) {
      const result = await client.query(
        `SELECT id FROM services WHERE name ILIKE $1 LIMIT 1`,
        [`%${change.service}%`]
      );
      const serviceId = result.rows.length > 0 ? result.rows[0].id : null;

      if (serviceId) {
        await client.query(
          `INSERT INTO changes (service_id, type, severity, title, description, impact, old_value, new_value, effective_date, detected_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
          [serviceId, change.type, change.severity, change.title, change.description,
           change.impact || null, change.oldValue || null, change.newValue || null, change.date]
        );
      } else {
        console.log(`  Warning: no service match for "${change.service}"`);
      }
    }
    console.log(`Seeded ${changes.length} historical changes.`);
    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    client.release();
    await db.pool.end();
  }
}

seed();
