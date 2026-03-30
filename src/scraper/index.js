// Drift Scraper: checks pricing pages and news feeds for subscription changes
// Covers: price changes, policy changes, feature removals, free tier changes, etc.
const cheerio = require('cheerio');
const db = require('../db');

// Helper: fetch a URL with a browser-like user agent
async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

// Helper: generate a simple hash of content to detect changes
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

// ---- PRICING PAGE SCRAPER ----
// Checks known pricing pages and extracts dollar amounts
async function scrapePricingPage(source) {
  try {
    const html = await fetchPage(source.url);
    const $ = cheerio.load(html);

    // Extract all dollar amounts from the page
    const text = $.text();
    const priceMatches = text.match(/\$\d+\.?\d{0,2}/g) || [];
    const prices = priceMatches.map(p => parseFloat(p.replace('$', '')));

    // Generate content hash to detect any page changes
    const contentHash = simpleHash(text.replace(/\s+/g, ' ').trim());

    return { prices, contentHash, raw: text.substring(0, 2000) };
  } catch (err) {
    console.error(`  Error scraping ${source.url}:`, err.message);
    return null;
  }
}

// ---- NEWS/RSS FEED CHECKER ----
// Monitors tech news feeds for subscription-related changes
const NEWS_FEEDS = [
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'rss' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'rss' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', type: 'rss' },
  { name: '9to5Mac', url: 'https://9to5mac.com/feed/', type: 'rss' },
  { name: '9to5Google', url: 'https://9to5google.com/feed/', type: 'rss' },
];

// Keywords that indicate subscription-related news
const CHANGE_KEYWORDS = [
  'price increase', 'price hike', 'raising prices', 'more expensive',
  'subscription', 'monthly fee', 'annual plan', 'billing',
  'privacy policy', 'terms of service', 'data collection', 'ai training',
  'feature removed', 'discontinue', 'shutting down', 'shut down',
  'free tier', 'free plan', 'paywall', 'ad-supported',
  'acquired by', 'acquisition', 'merger',
  'new plan', 'new tier', 'launches',
];

// Service names to match against
const SERVICE_NAMES = [
  'netflix', 'spotify', 'hulu', 'disney+', 'disney plus', 'max', 'hbo',
  'apple tv', 'apple music', 'apple one', 'peacock', 'paramount+', 'paramount plus',
  'youtube premium', 'youtube music', 'youtube tv',
  'chatgpt', 'openai', 'claude', 'anthropic', 'gemini', 'copilot', 'perplexity',
  'adobe', 'microsoft 365', 'notion', 'canva', 'figma',
  'xbox game pass', 'playstation plus', 'ps plus', 'nintendo',
  'amazon prime', 'audible', 'kindle unlimited',
  'doordash', 'uber one', 'grubhub', 'instacart',
  'twitter', 'x premium', 'linkedin', 'discord',
  'nordvpn', 'expressvpn', 'surfshark',
  'tinder', 'bumble', 'hinge',
  'icloud', 'google one', 'dropbox',
  'ring', 'nest', 'costco', 'walmart+',
  'starz', 'amc+', 'crunchyroll', 'discovery+',
  'headspace', 'calm', 'peloton', 'strava',
  'sling', 'fubo', 'philo', 'directv',
  'siriusxm', 'tidal',
  'shopify', 'squarespace', 'wix',
  'masterclass', 'coursera', 'skillshare', 'brilliant', 'duolingo',
  'medium', 'scribd',
];

async function checkNewsFeeds() {
  const newArticles = [];

  for (const feed of NEWS_FEEDS) {
    try {
      const xml = await fetchPage(feed.url);
      const $ = cheerio.load(xml, { xmlMode: true });

      const items = $('item, entry').slice(0, 20); // Check last 20 articles
      items.each((_, item) => {
        const title = $(item).find('title').text().toLowerCase();
        const description = ($(item).find('description, summary, content').text() || '').toLowerCase();
        const link = $(item).find('link').attr('href') || $(item).find('link').text();
        const pubDate = $(item).find('pubDate, published, updated').text();

        const combined = title + ' ' + description;

        // Check if it mentions a service we track AND contains change keywords
        const matchedService = SERVICE_NAMES.find(svc => combined.includes(svc));
        const matchedKeyword = CHANGE_KEYWORDS.find(kw => combined.includes(kw));

        if (matchedService && matchedKeyword) {
          newArticles.push({
            service: matchedService,
            title: $(item).find('title').text(),
            description: description.substring(0, 500),
            url: link,
            date: pubDate ? new Date(pubDate) : new Date(),
            source: feed.name,
            keyword: matchedKeyword,
          });
        }
      });
    } catch (err) {
      console.error(`  Error checking ${feed.name}:`, err.message);
    }
  }

  return newArticles;
}

// ---- CLASSIFY CHANGE TYPE ----
function classifyChange(article) {
  const text = (article.title + ' ' + article.description).toLowerCase();

  if (text.includes('price') && (text.includes('increase') || text.includes('hike') || text.includes('raise') || text.includes('more expensive'))) {
    return { type: 'price_increase', severity: 'high' };
  }
  if (text.includes('price') && (text.includes('decrease') || text.includes('lower') || text.includes('cheaper') || text.includes('cut'))) {
    return { type: 'price_decrease', severity: 'medium' };
  }
  if (text.includes('privacy') || text.includes('terms of service') || text.includes('data collection') || text.includes('ai training')) {
    return { type: 'policy_change', severity: 'high' };
  }
  if (text.includes('removed') || text.includes('discontinue') || text.includes('shutting down') || text.includes('shut down')) {
    return { type: 'feature_removal', severity: 'high' };
  }
  if (text.includes('free tier') || text.includes('free plan') || text.includes('paywall')) {
    return { type: 'free_tier_change', severity: 'medium' };
  }
  if (text.includes('acquired') || text.includes('acquisition') || text.includes('merger')) {
    return { type: 'acquisition', severity: 'medium' };
  }
  if (text.includes('new plan') || text.includes('new tier') || text.includes('launches') || text.includes('new feature')) {
    return { type: 'new_feature', severity: 'low' };
  }

  return { type: 'policy_change', severity: 'medium' };
}

// ---- MAIN SCRAPE FUNCTION ----
async function runScraper() {
  console.log(`[${new Date().toISOString()}] Starting Drift scraper...`);

  // 1. Check pricing pages for changes
  console.log('Checking pricing pages...');
  const sources = await db.query('SELECT ss.*, s.name as service_name, s.current_price FROM scrape_sources ss JOIN services s ON ss.service_id = s.id WHERE ss.enabled = true');

  let priceChanges = 0;
  for (const source of sources.rows) {
    const result = await scrapePricingPage(source);
    if (!result) continue;

    // If content hash changed, flag it for review
    if (source.last_hash && source.last_hash !== result.contentHash) {
      console.log(`  Page changed for ${source.service_name}: ${source.url}`);

      // Check if any scraped price differs from stored price
      const currentPrice = parseFloat(source.current_price);
      const nearMatch = result.prices.find(p => Math.abs(p - currentPrice) < 0.50 && p !== currentPrice);
      
      if (nearMatch) {
        console.log(`  PRICE CHANGE DETECTED: ${source.service_name} $${currentPrice} -> $${nearMatch}`);
        
        const changeType = nearMatch > currentPrice ? 'price_increase' : 'price_decrease';
        const severity = Math.abs(nearMatch - currentPrice) > 3 ? 'high' : 'medium';

        await db.query(
          `INSERT INTO price_history (service_id, old_price, new_price, source) VALUES ($1, $2, $3, $4)`,
          [source.service_id, currentPrice, nearMatch, source.url]
        );
        await db.query(
          `INSERT INTO changes (service_id, type, severity, title, description, impact, old_value, new_value, source_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [source.service_id, changeType, severity,
           `${source.service_name} ${changeType === 'price_increase' ? 'raises' : 'lowers'} price to $${nearMatch}/mo`,
           `${source.service_name} changed from $${currentPrice}/mo to $${nearMatch}/mo.`,
           `$${Math.abs((nearMatch - currentPrice) * 12).toFixed(0)}/year ${changeType === 'price_increase' ? 'more' : 'savings'}`,
           `$${currentPrice}/mo`, `$${nearMatch}/mo`, source.url]
        );
        await db.query(`UPDATE services SET current_price = $1, updated_at = NOW() WHERE id = $2`, [nearMatch, source.service_id]);
        priceChanges++;
      }
    }

    // Update hash and timestamp
    await db.query(
      `UPDATE scrape_sources SET last_hash = $1, last_scraped = NOW() WHERE id = $2`,
      [result.contentHash, source.id]
    );
  }
  console.log(`  Found ${priceChanges} price changes.`);

  // 2. Check news feeds for policy changes, feature removals, etc.
  console.log('Checking news feeds...');
  const articles = await checkNewsFeeds();
  console.log(`  Found ${articles.length} relevant articles.`);

  let newsChanges = 0;
  for (const article of articles) {
    // Find matching service in DB
    const svcResult = await db.query(
      `SELECT id FROM services WHERE LOWER(name) LIKE $1 LIMIT 1`,
      [`%${article.service}%`]
    );
    if (svcResult.rows.length === 0) continue;

    const serviceId = svcResult.rows[0].id;

    // Check if we already logged a similar change recently (avoid duplicates)
    const existing = await db.query(
      `SELECT id FROM changes WHERE service_id = $1 AND title ILIKE $2 AND detected_at > NOW() - INTERVAL '3 days'`,
      [serviceId, `%${article.title.substring(0, 50)}%`]
    );
    if (existing.rows.length > 0) continue;

    const { type, severity } = classifyChange(article);
    await db.query(
      `INSERT INTO changes (service_id, type, severity, title, description, source_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [serviceId, type, severity, article.title, article.description.substring(0, 1000), article.url]
    );
    newsChanges++;
    console.log(`  New change: [${type}] ${article.title}`);
  }
  console.log(`  Logged ${newsChanges} new changes from news.`);

  console.log(`[${new Date().toISOString()}] Scraper complete. ${priceChanges} price changes, ${newsChanges} news changes.`);
}

module.exports = { runScraper, checkNewsFeeds, scrapePricingPage };
