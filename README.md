# Drift Backend

Backend API and scraper for the Drift subscription tracking app.

## What it does
- Stores 160+ subscription services and their current prices
- Scrapes pricing pages twice daily to detect price changes
- Monitors tech news feeds for policy changes, feature removals, acquisitions, etc.
- Serves a REST API that the Drift mobile app calls

## API Endpoints
- `GET /api/services` — All tracked services
- `GET /api/changes` — Recent changes feed
- `GET /api/changes/recent` — Last 7 days of changes
- `GET /api/stats` — Dashboard statistics
- `GET /api/health` — Health check

## Deploy to Railway
1. Push to GitHub
2. Connect repo in Railway dashboard
3. Add PostgreSQL plugin
4. Railway auto-detects Node.js and runs `npm start`
