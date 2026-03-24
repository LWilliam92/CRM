-- Add Facebook integration columns to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source_campaign VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS facebook_lead_id VARCHAR(100);

-- Create Facebook lead logs table
CREATE TABLE IF NOT EXISTS facebook_lead_logs (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(100) NOT NULL,
  contact_id INTEGER REFERENCES contacts(id),
  campaign_name VARCHAR(100),
  ad_name VARCHAR(100),
  action VARCHAR(20) NOT NULL, -- created, updated
  lead_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_facebook_lead_id ON contacts(facebook_lead_id);
CREATE INDEX IF NOT EXISTS idx_facebook_lead_logs_lead_id ON facebook_lead_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_facebook_lead_logs_created_at ON facebook_lead_logs(created_at);

-- Update existing contacts to have 'manual' as source
UPDATE contacts SET source = 'manual' WHERE source IS NULL;
