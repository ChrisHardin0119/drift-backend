const express = require('express');
const db = require('../db');

const router = express.Router();

// Slugify function
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// All service data extracted from services.ts
const services = [
  { name: 'Netflix (Standard w/ Ads)', category: 'streaming', defaultPrice: 7.99, color: '#E50914' },
  { name: 'Netflix (Standard)', category: 'streaming', defaultPrice: 17.99, color: '#E50914' },
  { name: 'Netflix (Premium 4K)', category: 'streaming', defaultPrice: 24.99, color: '#E50914' },
  { name: 'Disney+ (Basic w/ Ads)', category: 'streaming', defaultPrice: 9.99, color: '#113CCF' },
  { name: 'Disney+ (Premium No Ads)', category: 'streaming', defaultPrice: 18.99, color: '#113CCF' },
  { name: 'Hulu (w/ Ads)', category: 'streaming', defaultPrice: 9.99, color: '#1CE783' },
  { name: 'Hulu (No Ads)', category: 'streaming', defaultPrice: 18.99, color: '#1CE783' },
  { name: 'Hulu + Live TV', category: 'streaming', defaultPrice: 82.99, color: '#1CE783' },
  { name: 'Disney+ & Hulu Bundle (w/ Ads)', category: 'streaming', defaultPrice: 12.99, color: '#113CCF' },
  { name: 'Disney+ & Hulu Bundle (No Ads)', category: 'streaming', defaultPrice: 19.99, color: '#113CCF' },
  { name: 'Disney+/Hulu/Max Bundle (w/ Ads)', category: 'streaming', defaultPrice: 19.99, color: '#113CCF' },
  { name: 'Disney+/Hulu/Max Bundle (No Ads)', category: 'streaming', defaultPrice: 32.99, color: '#113CCF' },
  { name: 'Max (Basic w/ Ads)', category: 'streaming', defaultPrice: 10.99, color: '#002BE7' },
  { name: 'Max (Standard)', category: 'streaming', defaultPrice: 18.49, color: '#002BE7' },
  { name: 'Max (Premium Ultimate)', category: 'streaming', defaultPrice: 22.99, color: '#002BE7' },
  { name: 'Apple TV+', category: 'streaming', defaultPrice: 12.99, color: '#000000' },
  { name: 'Peacock (Premium w/ Ads)', category: 'streaming', defaultPrice: 10.99, color: '#000000' },
  { name: 'Peacock (Premium Plus)', category: 'streaming', defaultPrice: 16.99, color: '#000000' },
  { name: 'Paramount+ (Essential w/ Ads)', category: 'streaming', defaultPrice: 8.99, color: '#0064FF' },
  { name: 'Paramount+ (w/ Showtime)', category: 'streaming', defaultPrice: 13.99, color: '#0064FF' },
  { name: 'YouTube Premium (Individual)', category: 'streaming', defaultPrice: 13.99, color: '#FF0000' },
  { name: 'YouTube Premium (Family)', category: 'streaming', defaultPrice: 22.99, color: '#FF0000' },
  { name: 'YouTube Premium (Student)', category: 'streaming', defaultPrice: 7.99, color: '#FF0000' },
  { name: 'YouTube Premium Lite (Ad-free only)', category: 'streaming', defaultPrice: 7.99, color: '#FF0000' },
  { name: 'Spotify Premium (Individual)', category: 'music', defaultPrice: 13.00, color: '#1DB954' },
  { name: 'Spotify Premium (Duo)', category: 'music', defaultPrice: 19.00, color: '#1DB954' },
  { name: 'Spotify Premium (Family)', category: 'music', defaultPrice: 22.00, color: '#1DB954' },
  { name: 'Spotify Premium (Student)', category: 'music', defaultPrice: 7.00, color: '#1DB954' },
  { name: 'Apple Music (Individual)', category: 'music', defaultPrice: 10.99, color: '#FA243C' },
  { name: 'Apple Music (Family)', category: 'music', defaultPrice: 16.99, color: '#FA243C' },
  { name: 'Apple Music (Student)', category: 'music', defaultPrice: 5.99, color: '#FA243C' },
  { name: 'YouTube Music (Individual)', category: 'music', defaultPrice: 10.99, color: '#FF0000' },
  { name: 'YouTube Music (Family)', category: 'music', defaultPrice: 16.99, color: '#FF0000' },
  { name: 'Tidal (Individual)', category: 'music', defaultPrice: 10.99, color: '#000000' },
  { name: 'Claude Pro', category: 'ai', defaultPrice: 20.00, color: '#D4A574' },
  { name: 'Claude Max 5x', category: 'ai', defaultPrice: 100.00, color: '#D4A574' },
  { name: 'Claude Max 20x', category: 'ai', defaultPrice: 200.00, color: '#D4A574' },
  { name: 'Claude Team (per user)', category: 'ai', defaultPrice: 30.00, color: '#D4A574' },
  { name: 'ChatGPT Go', category: 'ai', defaultPrice: 8.00, color: '#10A37F' },
  { name: 'ChatGPT Plus', category: 'ai', defaultPrice: 20.00, color: '#10A37F' },
  { name: 'ChatGPT Pro', category: 'ai', defaultPrice: 200.00, color: '#10A37F' },
  { name: 'ChatGPT Team (per user)', category: 'ai', defaultPrice: 30.00, color: '#10A37F' },
  { name: 'Gemini Advanced (Google)', category: 'ai', defaultPrice: 19.99, color: '#4285F4' },
  { name: 'Copilot Pro (Microsoft)', category: 'ai', defaultPrice: 20.00, color: '#0078D4' },
  { name: 'Perplexity Pro', category: 'ai', defaultPrice: 20.00, color: '#1FB8CD' },
  { name: 'Adobe Creative Cloud (All Apps)', category: 'productivity', defaultPrice: 59.99, color: '#FF0000' },
  { name: 'Adobe Photography Plan', category: 'productivity', defaultPrice: 9.99, color: '#FF0000' },
  { name: 'Microsoft 365 Personal', category: 'productivity', defaultPrice: 9.99, color: '#0078D4' },
  { name: 'Microsoft 365 Family', category: 'productivity', defaultPrice: 12.99, color: '#0078D4' },
  { name: 'Notion Plus', category: 'productivity', defaultPrice: 10.00, color: '#000000' },
  { name: 'Canva Pro', category: 'productivity', defaultPrice: 14.99, color: '#00C4CC' },
  { name: 'iCloud+ (50GB)', category: 'cloud', defaultPrice: 0.99, color: '#3693F3' },
  { name: 'iCloud+ (200GB)', category: 'cloud', defaultPrice: 2.99, color: '#3693F3' },
  { name: 'iCloud+ (2TB)', category: 'cloud', defaultPrice: 9.99, color: '#3693F3' },
  { name: 'Google One (100GB)', category: 'cloud', defaultPrice: 2.99, color: '#4285F4' },
  { name: 'Google One (2TB)', category: 'cloud', defaultPrice: 9.99, color: '#4285F4' },
  { name: 'Dropbox Plus', category: 'cloud', defaultPrice: 11.99, color: '#0061FF' },
  { name: 'Xbox Game Pass Core', category: 'gaming', defaultPrice: 9.99, color: '#107C10' },
  { name: 'Xbox Game Pass Standard', category: 'gaming', defaultPrice: 14.99, color: '#107C10' },
  { name: 'Xbox Game Pass Ultimate', category: 'gaming', defaultPrice: 19.99, color: '#107C10' },
  { name: 'PlayStation Plus Essential', category: 'gaming', defaultPrice: 9.99, color: '#003791' },
  { name: 'PlayStation Plus Extra', category: 'gaming', defaultPrice: 14.99, color: '#003791' },
  { name: 'PlayStation Plus Premium', category: 'gaming', defaultPrice: 17.99, color: '#003791' },
  { name: 'Nintendo Switch Online', category: 'gaming', defaultPrice: 3.99, color: '#E60012' },
  { name: 'Nintendo Switch Online + Expansion', category: 'gaming', defaultPrice: 4.17, color: '#E60012' },
  { name: 'NordVPN (monthly)', category: 'vpn', defaultPrice: 12.99, color: '#4687FF' },
  { name: 'ExpressVPN (monthly)', category: 'vpn', defaultPrice: 12.95, color: '#DA3940' },
  { name: 'X Premium (Basic)', category: 'social', defaultPrice: 3.00, color: '#000000' },
  { name: 'X Premium', category: 'social', defaultPrice: 8.00, color: '#000000' },
  { name: 'X Premium+', category: 'social', defaultPrice: 16.00, color: '#000000' },
  { name: 'LinkedIn Premium Career', category: 'social', defaultPrice: 29.99, color: '#0A66C2' },
  { name: 'LinkedIn Premium Business', category: 'social', defaultPrice: 59.99, color: '#0A66C2' },
  { name: 'Headspace', category: 'health', defaultPrice: 12.99, color: '#F47D31' },
  { name: 'Strava', category: 'health', defaultPrice: 11.99, color: '#FC4C02' },
  { name: 'Apple Fitness+', category: 'health', defaultPrice: 9.99, color: '#FA243C' },
];

// All historical changes extracted from historical.ts
const historicalChanges = [
  { id: 'netflix-jan-2025', service: 'Netflix', type: 'price_increase', severity: 'high', title: 'Netflix raises prices across all tiers', description: 'Netflix increased its ad-supported plan to /mo, Standard plan by .50/mo, and Premium plan by /mo.', impact: 'Up to /year more depending on your plan', oldValue: 'Standard: .49/mo, Premium: .99/mo', newValue: 'Standard: .99/mo, Premium: .99/mo', date: '2025-01-15' },
  { id: 'spotify-jan-2026', service: 'Spotify', type: 'price_increase', severity: 'high', title: 'Spotify raises prices for all Premium plans', description: 'Spotify increased Individual to /mo, Duo to /mo, Family to /mo, and Student to /mo.', impact: '-24/year more depending on your plan', oldValue: 'Individual: .99/mo, Family: .99/mo', newValue: 'Individual: /mo, Family: /mo', date: '2026-01-15' },
  { id: 'disney-oct-2025', service: 'Disney+', type: 'price_increase', severity: 'high', title: 'Disney+ raises prices on all plans', description: 'Ad-supported plan increased by  to .99/mo. Premium no-ads plan increased by  to .99/mo.', impact: '-36/year more', oldValue: 'Ad tier: .99/mo, Premium: .99/mo', newValue: 'Ad tier: .99/mo, Premium: .99/mo', date: '2025-10-01' },
  { id: 'peacock-jul-2025', service: 'Peacock', type: 'price_increase', severity: 'high', title: 'Peacock raises both tiers by /mo', description: 'Both Premium (.99/mo) and Premium Plus (.99/mo) plans increased by  per month.', impact: '/year more on either plan', oldValue: 'Premium: .99/mo, Plus: .99/mo', newValue: 'Premium: .99/mo, Plus: .99/mo', date: '2025-07-01' },
  { id: 'appletv-aug-2025', service: 'Apple TV+', type: 'price_increase', severity: 'medium', title: 'Apple TV+ jumps from .99 to .99', description: 'Apple TV+ increased its monthly subscription by , a 30% price hike.', impact: '/year more', oldValue: '.99/mo', newValue: '.99/mo', date: '2025-08-01' },
  { id: 'hbo-oct-2025', service: 'Max (HBO)', type: 'price_increase', severity: 'medium', title: 'Max raises prices /mo across all tiers', description: 'All Max plans increased by  per month or  annually.', impact: '/year more', oldValue: 'Ad tier: .99/mo', newValue: 'Ad tier: .99/mo', date: '2025-10-15' },
  { id: 'paramount-jan-2026', service: 'Paramount+', type: 'price_increase', severity: 'medium', title: 'Paramount+ raises both plans by ', description: 'Essential plan went from .99 to .99/mo and Premium from .99 to .99/mo.', impact: '/year more', oldValue: 'Essential: .99/mo, Premium: .99/mo', newValue: 'Essential: .99/mo, Premium: .99/mo', date: '2026-01-15' },
  { id: 'x-privacy-2026', service: 'X (Twitter)', type: 'policy_change', severity: 'high', title: 'X updates privacy policy — your data trains AI', description: 'X updated Terms of Service and Privacy Policy. New terms allow X to use your posts, interactions, and data to train AI models.', impact: 'Your content may be used for AI training without explicit opt-in', date: '2026-01-15' },
  { id: 'fakespot-shutdown-2025', service: 'Fakespot', type: 'feature_removal', severity: 'high', title: 'Fakespot shuts down completely', description: 'Fakespot, the popular fake review detection service, discontinued all services permanently after being acquired by Mozilla.', impact: 'No more fake review detection — millions of users lost access', date: '2025-07-01' },
  { id: 'hulu-bundle-2025', service: 'Hulu', type: 'price_increase', severity: 'medium', title: 'Hulu bundle prices increase', description: 'The Disney+, Hulu, and ESPN Select bundle rose to /mo, up from previous pricing.', impact: 'Bundle savings shrinking', oldValue: 'Bundle: ~/mo', newValue: 'Bundle: /mo', date: '2025-10-01' },
  { id: 'adobe-cancel-2025', service: 'Adobe Creative Cloud', type: 'policy_change', severity: 'high', title: 'Adobe early cancellation fees draw FTC complaint', description: 'Adobe faced FTC scrutiny over hidden early termination fees on annual plans billed monthly. Users reported fees up to + for canceling.', impact: 'Users locked into subscriptions with steep exit costs', date: '2025-03-01' },
  { id: 'notion-ai-2025', service: 'Notion', type: 'price_increase', severity: 'medium', title: 'Notion AI becomes mandatory add-on charge', description: 'Notion started bundling AI features into plans at higher price points, with the free tier becoming more limited.', impact: 'Free users get fewer features, paid plans cost more', date: '2025-04-01' },
  { id: 'youtube-premium-2025', service: 'YouTube Premium', type: 'price_increase', severity: 'medium', title: 'YouTube Premium family plan increases', description: 'YouTube Premium family plan price continued its upward trend, reaching .99/mo in several markets.', impact: 'Up to /year more for family plan subscribers', oldValue: 'Family: .99/mo', newValue: 'Family: .99/mo', date: '2025-01-01' },
  { id: 'chatgpt-pro-2025', service: 'ChatGPT', type: 'price_increase', severity: 'medium', title: 'ChatGPT Pro launches at $200/mo', description: 'OpenAI introduced ChatGPT Pro tier at $200/month with unlimited access to advanced models, while Plus remained $20/mo with increasing usage caps.', impact: 'Power users face steep pricing for unrestricted access', date: '2025-12-01' },
  { id: 'chatgpt-go-2026', service: 'ChatGPT', type: 'new_feature', severity: 'low', title: 'ChatGPT Go tier launches at $8/mo', description: 'OpenAI introduced a new Go tier at $8/month, slotting between Free and Plus. Limited features but more capacity than free.', impact: 'New budget option for casual AI users', date: '2026-02-01' },
  { id: 'claude-max-2026', service: 'Claude (Anthropic)', type: 'new_feature', severity: 'medium', title: 'Claude Max tiers launch: $100/mo and $200/mo', description: 'Anthropic introduced Claude Max 5x at $100/mo and Max 20x at $200/mo alongside the existing Pro at $20/mo. Max tiers include priority access, full Claude Code, and massively increased usage limits.', impact: 'Pro at $20, Max 5x at $100, Max 20x at $200 — power users now have options', oldValue: 'Pro only: $20/mo', newValue: 'Pro: $20, Max 5x: $100, Max 20x: $200/mo', date: '2026-01-01' },
  { id: 'claude-opus-2026', service: 'Claude (Anthropic)', type: 'new_feature', severity: 'low', title: 'Claude Opus 4.6 released — 1M token context window', description: 'Anthropic released Opus 4.6 with 1 million token context (beta), 128K max output, adaptive thinking, agent teams, and compaction for infinite conversations.', impact: 'Major capability upgrade for all paid tiers', date: '2026-02-05' },
  { id: 'disney-hulu-merge-2026', service: 'Disney+', type: 'feature_removal', severity: 'high', title: 'Hulu merges into Disney+ app — standalone Hulu app going away', description: 'Disney is folding the standalone Hulu app into Disney+ to create a single unified streaming app. Hulu content will live inside Disney+ going forward.', impact: 'Standalone Hulu subscribers will need to transition to Disney+ app', date: '2026-03-01' },
  { id: 'disney-bundle-hbomax-2025', service: 'Disney+/Hulu/Max Bundle', type: 'price_increase', severity: 'high', title: 'Disney+/Hulu/Max triple bundle prices increase', description: 'The ad-supported triple bundle went to $19.99/mo and the no-ads bundle to $32.99/mo. ESPN add-ons available: ESPN Select ($12.99) and ESPN Unlimited ($29.99).', impact: 'Bundle still saves 40%+ vs buying separately but costs rising', oldValue: 'Ad bundle: ~$17/mo, No-ad: ~$28/mo', newValue: 'Ad bundle: $19.99/mo, No-ad: $32.99/mo', date: '2025-10-01' },
  { id: 'max-tiers-2025', service: 'Max (HBO)', type: 'price_increase', severity: 'medium', title: 'Max expands to 3 tiers with price hikes across all', description: 'Max now has Basic w/ Ads ($10.99/mo), Standard ($18.49/mo), and Premium Ultimate ($22.99/mo). All tiers increased by $1-2/mo.', impact: 'No-ad viewers now pay $18.49-22.99/mo depending on quality', oldValue: 'Ad-Free: $15.99/mo, Ultimate: $19.99/mo', newValue: 'Standard: $18.49/mo, Ultimate: $22.99/mo', date: '2025-10-15' },
  { id: 'youtube-student-2026', service: 'YouTube Premium', type: 'policy_change', severity: 'medium', title: 'YouTube Premium auto-converts student plans to full price', description: 'Existing student memberships now automatically convert to individual Premium plans at full price ($13.99/mo). New student signups still get $7.99/mo.', impact: 'Students who had the discount may see a $6/mo increase without warning', oldValue: 'Student: $7.99/mo (auto-renewing)', newValue: 'Auto-converts to $13.99/mo after eligibility expires', date: '2026-01-01' },
  { id: 'youtube-lite-2026', service: 'YouTube Premium', type: 'new_feature', severity: 'low', title: 'YouTube Premium Lite launches — ad-free only at $7.99/mo', description: 'YouTube introduced a cheaper Lite tier at $7.99/mo that removes ads but does not include YouTube Music, downloads, or background play.', impact: 'Budget option for people who only want ad-free video', date: '2026-02-01' },
  { id: 'spotify-all-tiers-2026', service: 'Spotify', type: 'price_increase', severity: 'high', title: 'Spotify raises ALL Premium tiers simultaneously', description: 'Every Spotify tier went up: Individual $11.99 to $13, Duo $16.99 to $19, Family $19.99 to $22, Student $5.99 to $7. This is the third price increase in 18 months.', impact: '$12-24/year more per subscriber, third hike since mid-2023', oldValue: 'Individual: $11.99, Duo: $16.99, Family: $19.99, Student: $5.99', newValue: 'Individual: $13, Duo: $19, Family: $22, Student: $7', date: '2026-01-15' },
];
// POST /api/seed - Seed database with initial data
router.post('/seed', async (req, res) => {
  try {
    // Check secret key
    const seedKey = req.headers['x-seed-key'];
    const expectedKey = process.env.SEED_KEY || 'drift-seed-2024';
    
    if (seedKey !== expectedKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid seed key' });
    }

    let servicesInserted = 0;
    let changesInserted = 0;
    const serviceIdMap = {}; // Map service names to their database IDs

    // Insert services with ON CONFLICT DO UPDATE
    for (const service of services) {
      const slug = slugify(service.name);
      
      try {
        const result = await db.query(
          `INSERT INTO services (slug, name, category, current_price, billing_cycle, color)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (slug) DO UPDATE 
           SET name = EXCLUDED.name, 
               category = EXCLUDED.category, 
               current_price = EXCLUDED.current_price, 
               color = EXCLUDED.color
           RETURNING id, name`,
          [slug, service.name, service.category, service.defaultPrice, 'monthly', service.color]
        );
        
        if (result.rows && result.rows[0]) {
          serviceIdMap[service.name] = result.rows[0].id;
          servicesInserted++;
        }
      } catch (err) {
        console.error(`Error inserting service ${service.name}:`, err.message);
      }
    }

    // Insert historical changes, looking up service_id by name (partial match)
    for (const change of historicalChanges) {
      // Try exact match first, then partial match (e.g. "Netflix" matches "Netflix (Standard)")
      let serviceId = serviceIdMap[change.service];
      if (!serviceId) {
        const matchKey = Object.keys(serviceIdMap).find(k => k.startsWith(change.service + ' ') || k.startsWith(change.service + '(') || k === change.service);
        if (matchKey) serviceId = serviceIdMap[matchKey];
      }
      
      if (!serviceId) {
        console.warn(`Service not found for change: ${change.service}`);
        continue;
      }

      try {
        await db.query(
          `INSERT INTO changes (service_id, type, severity, title, description, impact, old_value, new_value, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [serviceId, change.type, change.severity, change.title, change.description, 
           change.impact, change.oldValue || null, change.newValue || null, change.date]
        );
        changesInserted++;
      } catch (err) {
        console.error(`Error inserting change ${change.id}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: 'Database seeded successfully',
      summary: {
        servicesInserted,
        changesInserted,
        totalServices: services.length,
        totalChanges: historicalChanges.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: 'Seed failed', details: err.message });
  }
});

module.exports = router;