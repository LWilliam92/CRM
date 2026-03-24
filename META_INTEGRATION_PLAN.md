# Facebook/Meta Integration Plan

## Current Status
- Campaign system supports WhatsApp/SMS types but no actual integration
- Dashboard tracks campaign types but no real messaging
- Missing Meta Business Suite connectivity

## Required Integrations

### 1. WhatsApp Business API
```
- WhatsApp Business API client
- Message templates and sending
- Webhook for incoming messages
- Media upload for images/documents
```

### 2. Instagram Graph API
```
- Instagram Business account connection
- Direct messaging
- Post scheduling and publishing
- Story creation
```

### 3. Facebook Lead Ads
```
- Facebook Lead Ads webhook
- Automatic lead import to CRM
- Lead form mapping
```

### 4. Meta Authentication
```
- OAuth 2.0 flow for Facebook/Meta
- Access token management
- Permissions handling
```

## Implementation Steps

### Phase 1: WhatsApp Business API
1. Set up Meta for Developers account
2. Create WhatsApp Business app
3. Configure webhook endpoints
4. Implement message sending
5. Add media upload functionality

### Phase 2: Instagram Integration
1. Instagram Basic Display API setup
2. Instagram Graph API for Business
3. Direct messaging functionality
4. Content publishing features

### Phase 3: Facebook Lead Ads
1. Facebook Marketing API setup
2. Lead Ads webhook configuration
3. Auto-import to CRM contacts
4. Lead nurturing workflows

## Required Dependencies
```json
{
  "axios": "^1.6.0",
  "express": "^4.19.2",
  "dotenv": "^16.3.1",
  "node-cron": "^3.0.3",
  "multer": "^2.1.1"
}
```

## Environment Variables Needed
```env
# Meta App Credentials
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_WEBHOOK_VERIFY_TOKEN=your_verify_token

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_URL=your_webhook_url

# Instagram API
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_BUSINESS_ID=your_business_id

# Facebook Lead Ads
FACEBOOK_ACCESS_TOKEN=your_facebook_token
FACEBOOK_AD_ACCOUNT_ID=your_ad_account_id
```

## Database Schema Updates
```sql
-- Meta integrations table
CREATE TABLE meta_integrations (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(20) NOT NULL, -- whatsapp, instagram, facebook
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  account_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message logs
CREATE TABLE message_logs (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  platform VARCHAR(20) NOT NULL,
  message_type VARCHAR(20), -- text, image, document
  recipient_phone VARCHAR(20),
  recipient_id VARCHAR(100),
  message_content TEXT,
  media_url VARCHAR(500),
  status VARCHAR(20), -- sent, delivered, read, failed
  meta_message_id VARCHAR(100),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instagram posts
CREATE TABLE instagram_posts (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  media_type VARCHAR(20), -- image, video, carousel
  caption TEXT,
  media_urls TEXT[], -- Array of media URLs
  instagram_post_id VARCHAR(100),
  status VARCHAR(20),
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints Needed

### WhatsApp Endpoints
```
POST /api/whatsapp/send-message
POST /api/whatsapp/send-media
GET  /api/whatsapp/webhook
POST /api/whatsapp/webhook
```

### Instagram Endpoints
```
POST /api/instagram/post
POST /api/instagram/story
POST /api/instagram/direct-message
GET  /api/instagram/media
```

### Facebook Endpoints
```
POST /api/facebook/lead-ads/webhook
GET  /api/facebook/lead-ads/forms
POST /api/facebook/ad-campaigns
```

## Implementation Priority
1. **High Priority**: WhatsApp Business API (most requested)
2. **Medium Priority**: Facebook Lead Ads integration
3. **Low Priority**: Instagram posting features

## Estimated Timeline
- WhatsApp Business API: 2-3 weeks
- Facebook Lead Ads: 1-2 weeks  
- Instagram Integration: 2-4 weeks

## Cost Considerations
- WhatsApp Business API: Free tier (1000 messages/month) + paid tiers
- Instagram Graph API: Free with rate limits
- Facebook Marketing API: Free tier available
