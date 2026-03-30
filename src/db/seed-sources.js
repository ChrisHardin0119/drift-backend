// Seeds the scrape_sources table with known pricing page URLs
const db = require('./index');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const PRICING_URLS = [
  { match: 'Netflix', urls: ['https://help.netflix.com/en/node/24926'] },
  { match: 'Disney+', urls: ['https://www.disneyplus.com/'] },
  { match: 'Hulu', urls: ['https://www.hulu.com/welcome'] },
  { match: 'Max', urls: ['https://www.max.com/'] },
  { match: 'Peacock', urls: ['https://www.peacocktv.com/'] },
  { match: 'Paramount+', urls: ['https://www.paramountplus.com/'] },
  { match: 'Apple TV+', urls: ['https://tv.apple.com/'] },
  { match: 'Spotify', urls: ['https://www.spotify.com/us/premium/'] },
  { match: 'Apple Music', urls: ['https://www.apple.com/apple-music/'] },
  { match: 'YouTube Premium', urls: ['https://www.youtube.com/premium'] },
  { match: 'YouTube Music', urls: ['https://music.youtube.com/music_premium'] },
  { match: 'ChatGPT', urls: ['https://openai.com/chatgpt/pricing/'] },
  { match: 'Claude', urls: ['https://www.anthropic.com/pricing'] },
  { match: 'Gemini', urls: ['https://one.google.com/about/plans'] },
  { match: 'Copilot', urls: ['https://www.microsoft.com/en-us/store/b/copilotpro'] },
  { match: 'Perplexity', urls: ['https://www.perplexity.ai/pro'] },
  { match: 'Adobe', urls: ['https://www.adobe.com/creativecloud/plans.html'] },
  { match: 'Microsoft 365', urls: ['https://www.microsoft.com/en-us/microsoft-365/compare-all-plans'] },
  { match: 'Xbox Game Pass', urls: ['https://www.xbox.com/en-US/xbox-game-pass'] },
  { match: 'PlayStation Plus', urls: ['https://www.playstation.com/en-us/ps-plus/'] },
  { match: 'NordVPN', urls: ['https://nordvpn.com/pricing/'] },
  { match: 'ExpressVPN', urls: ['https://www.expressvpn.com/order'] },
  { match: 'iCloud', urls: ['https://www.apple.com/icloud/'] },
  { match: 'Google One', urls: ['https://one.google.com/about/plans'] },
  { match: 'Dropbox', urls: ['https://www.dropbox.com/plans'] },
  { match: 'Notion', urls: ['https://www.notion.so/pricing'] },
  { match: 'Canva', urls: ['https://www.canva.com/pricing/'] },
  { match: 'Discord', urls: ['https://discord.com/nitro'] },
  { match: 'X Premium', urls: ['https://x.com/i/premium_sign_up'] },
  { match: 'LinkedIn', urls: ['https://www.linkedin.com/premium/products/'] },
  { match: 'Amazon Prime', urls: ['https://www.amazon.com/amazonprime'] },
  { match: 'YouTube TV', urls: ['https://tv.youtube.com/welcome/'] },
  { match: 'Sling', urls: ['https://www.sling.com/'] },
  { match: 'Fubo', urls: ['https://www.fubo.tv/welcome'] },
  { match: 'Ring', urls: ['https://ring.com/protect-plans'] },
  { match: 'Crunchyroll', urls: ['https://www.crunchyroll.com/welcome'] },
  { match: 'Headspace', urls: ['https://www.headspace.com/subscriptions'] },
  { match: 'Calm', urls: ['https://www.calm.com/subscribe'] },
  { match: 'DoorDash', urls: ['https://www.doordash.com/dashpass/'] },
  { match: 'Tinder', urls: ['https://tinder.com/feature/subscription-tiers'] },
  { match: 'Figma', urls: ['https://www.figma.com/pricing/'] },
  { match: 'Shopify', urls: ['https://www.shopify.com/pricing'] },
];

async function seedSources() {
  const client = await db.pool.connect();
  try {
    for (const entry of PRICING_URLS) {
      const result = await client.query(
        `SELECT id FROM services WHERE name ILIKE $1 LIMIT 1`,
        [`%${entry.match}%`]
      );
      if (result.rows.length === 0) {
        console.log(`  No service found matching "${entry.match}"`);
        continue;
      }
      const serviceId = result.rows[0].id;
      for (const url of entry.urls) {
        await client.query(
          `INSERT INTO scrape_sources (service_id, url, scrape_type) VALUES ($1, $2, 'pricing_page')
           ON CONFLICT DO NOTHING`,
          [serviceId, url]
        );
      }
      console.log(`  Added ${entry.urls.length} source(s) for "${entry.match}"`);
    }
    console.log('Scrape sources seeded!');
  } catch (err) {
    console.error('Error seeding sources:', err);
  } finally {
    client.release();
    await db.pool.end();
  }
}

seedSources();
