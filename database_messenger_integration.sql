-- Facebook Messenger Integration & Ticket Management Schema for PeerHub

-- Tickets table for managing customer inquiries
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(100),
  facebook_psid VARCHAR(100), -- Facebook Page-Scoped ID
  facebook_user_id VARCHAR(100),
  subject TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  source VARCHAR(20) DEFAULT 'messenger' -- messenger, email, phone, web
);

-- Messages table for conversation history
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- customer, agent
  sender_id INTEGER, -- Reference to user if agent, or PSID if customer
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, location
  content TEXT,
  media_url VARCHAR(500),
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  facebook_message_id VARCHAR(100)
);

-- Ticket assignments and status changes log
CREATE TABLE IF NOT EXISTS ticket_activity_log (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- created, assigned, status_changed, message_sent, resolved
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Facebook Page configurations
CREATE TABLE IF NOT EXISTS facebook_pages (
  id SERIAL PRIMARY KEY,
  page_id VARCHAR(50) UNIQUE NOT NULL,
  page_name VARCHAR(100),
  page_access_token TEXT,
  verify_token VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Canned responses for quick replies
CREATE TABLE IF NOT EXISTS canned_responses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100),
  content TEXT,
  category VARCHAR(50),
  created_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_facebook_psid ON tickets(facebook_psid);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_activity_log_ticket_id ON ticket_activity_log(ticket_id);

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(NEW.created_at, 'YYMMDD') || '-' || LPAD(NEW.id::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default canned responses
INSERT INTO canned_responses (title, content, category) VALUES
('Welcome Message', 'Hello! Welcome to PeerHub support. How can I help you today?', 'greeting'),
('Acknowledgment', 'Thank you for reaching out. I''ll look into this and get back to you shortly.', 'acknowledgment'),
('Resolution', 'I''m glad we could resolve this for you. Is there anything else I can help with?', 'resolution'),
('Escalation', 'I''m escalating this to our senior team. You should hear back within 24 hours.', 'escalation')
ON CONFLICT DO NOTHING;

-- Create a default Facebook page configuration (will need to be updated with real values)
INSERT INTO facebook_pages (page_id, page_name, verify_token) VALUES
('default_page', 'Default Facebook Page', 'your_verify_token_here')
ON CONFLICT (page_id) DO NOTHING;
