-- Drift Backend Database Schema
-- Stores subscription services, pricing history, and all types of changes

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  current_price DECIMAL(10,2),
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  color VARCHAR(7),
  icon_url TEXT,
  pricing_url TEXT,
  last_checked TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  detected_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS changes (
  id SERIAL PRIMARY KEY,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'price_increase', 'price_decrease', 'feature_removal', 
    'feature_addition', 'policy_change', 'free_tier_change',
    'new_feature', 'acquisition', 'shutdown'
  )),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  impact TEXT,
  old_value TEXT,
  new_value TEXT,
  source_url TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  effective_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scrape_sources (
  id SERIAL PRIMARY KEY,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  selector TEXT,
  scrape_type VARCHAR(30) DEFAULT 'pricing_page',
  last_scraped TIMESTAMP,
  last_hash TEXT,
  enabled BOOLEAN DEFAULT true
);

CREATE INDEX idx_changes_service ON changes(service_id);
CREATE INDEX idx_changes_type ON changes(type);
CREATE INDEX idx_changes_detected ON changes(detected_at DESC);
CREATE INDEX idx_price_history_service ON price_history(service_id);
CREATE INDEX idx_services_category ON services(category);
