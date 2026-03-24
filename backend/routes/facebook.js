const router = require("express").Router();
const db = require("../config/db");
const crypto = require("crypto");

// Facebook Lead Ads webhook verification
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
    console.log("Facebook webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    console.log("Facebook webhook verification failed");
    res.sendStatus(403);
  }
});

// Handle Facebook Lead Ads webhook events
router.post("/webhook", (req, res) => {
  const data = req.body;

  // Check if this is a lead generation event
  if (data.object === "page") {
    data.entry.forEach(entry => {
      entry.changes.forEach(change => {
        if (change.field === "leadgen") {
          const leadData = change.value;
          console.log("New Facebook lead received:", leadData);
          
          // Process the lead data
          processFacebookLead(leadData);
        }
      });
    });
    
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// Process Facebook lead data and save to CRM
async function processFacebookLead(leadData) {
  try {
    const { ad_name, campaign_name, leadgen_export_data, created_time } = leadData;
    
    // Extract lead information
    const leadInfo = leadgen_export_data[0] || {};
    
    // Map Facebook lead fields to CRM contact fields
    const contactData = {
      name: `${leadInfo.first_name || ''} ${leadInfo.last_name || ''}`.trim() || leadInfo.full_name || 'Facebook Lead',
      email: leadInfo.email || '',
      phone: leadInfo.phone_number || leadInfo.phone || '',
      category: 'lead',
      source: 'facebook',
      source_campaign: campaign_name || ad_name || 'Facebook Campaign',
      facebook_lead_id: leadData.lead_id,
      created_at: new Date(created_time)
    };

    // Check if contact already exists (by email or phone)
    const existingContact = await findExistingContact(contactData.email, contactData.phone);
    
    if (existingContact) {
      console.log(`Contact already exists: ${existingContact.id} - updating Facebook lead info`);
      await updateContactWithFacebookLead(existingContact.id, contactData);
    } else {
      console.log(`Creating new contact from Facebook lead: ${contactData.name}`);
      await createContactFromFacebookLead(contactData);
    }

    // Log the lead import
    await logFacebookLeadImport(leadData, contactData, existingContact ? 'updated' : 'created');

  } catch (error) {
    console.error("Error processing Facebook lead:", error);
  }
}

// Find existing contact by email or phone
function findExistingContact(email, phone) {
  return new Promise((resolve, reject) => {
    const query = email && phone 
      ? "SELECT * FROM contacts WHERE email = $1 OR phone = $2 LIMIT 1"
      : email 
      ? "SELECT * FROM contacts WHERE email = $1 LIMIT 1"
      : "SELECT * FROM contacts WHERE phone = $1 LIMIT 1";
    
    const params = email && phone ? [email, phone] : email ? [email] : [phone];
    
    db.query(query, params, (err, result) => {
      if (err) reject(err);
      else resolve(result.rows[0] || null);
    });
  });
}

// Create new contact from Facebook lead
function createContactFromFacebookLead(contactData) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO contacts (name, email, phone, category, source, source_campaign, facebook_lead_id, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    
    const params = [
      contactData.name,
      contactData.email,
      contactData.phone,
      contactData.category,
      contactData.source,
      contactData.source_campaign,
      contactData.facebook_lead_id,
      contactData.created_at
    ];
    
    db.query(query, params, (err, result) => {
      if (err) reject(err);
      else resolve(result.rows[0]);
    });
  });
}

// Update existing contact with Facebook lead information
function updateContactWithFacebookLead(contactId, contactData) {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE contacts 
      SET source = COALESCE($1, source), 
          source_campaign = COALESCE($2, source_campaign),
          facebook_lead_id = COALESCE($3, facebook_lead_id),
          category = CASE 
            WHEN category = 'general' THEN 'lead' 
            ELSE category 
          END
      WHERE id = $4
    `;
    
    const params = [
      contactData.source,
      contactData.source_campaign,
      contactData.facebook_lead_id,
      contactId
    ];
    
    db.query(query, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// Log Facebook lead import for analytics
function logFacebookLeadImport(leadData, contactData, action) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO facebook_lead_logs (lead_id, contact_id, campaign_name, ad_name, action, lead_data, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    const params = [
      leadData.lead_id,
      contactData.id || null,
      leadData.campaign_name || '',
      leadData.ad_name || '',
      action,
      JSON.stringify(leadData),
      new Date()
    ];
    
    db.query(query, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// Get Facebook lead statistics
router.get("/stats", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Get Facebook lead statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_leads,
        COUNT(CASE WHEN DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_leads,
        COUNT(CASE WHEN DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as month_leads,
        source_campaign,
        COUNT(*) as campaign_leads
      FROM contacts 
      WHERE source = 'facebook'
      GROUP BY source_campaign
      ORDER BY campaign_leads DESC
    `;

    db.query(statsQuery, (err, result) => {
      if (err) {
        console.error("Error fetching Facebook stats:", err);
        return res.status(500).json({ message: "Error fetching Facebook statistics" });
      }

      const stats = {
        totalLeads: result.rows.reduce((sum, row) => sum + parseInt(row.total_leads), 0),
        todayLeads: result.rows.reduce((sum, row) => sum + parseInt(row.today_leads), 0),
        weekLeads: result.rows.reduce((sum, row) => sum + parseInt(row.week_leads), 0),
        monthLeads: result.rows.reduce((sum, row) => sum + parseInt(row.month_leads), 0),
        campaignBreakdown: result.rows.map(row => ({
          campaign: row.source_campaign,
          leads: parseInt(row.campaign_leads)
        }))
      };

      res.json(stats);
    });

  } catch (error) {
    console.error("Facebook stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get recent Facebook leads
router.get("/leads", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { limit = 50, offset = 0 } = req.query;

    const leadsQuery = `
      SELECT id, name, email, phone, category, source_campaign, facebook_lead_id, created_at
      FROM contacts 
      WHERE source = 'facebook'
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    db.query(leadsQuery, [parseInt(limit), parseInt(offset)], (err, result) => {
      if (err) {
        console.error("Error fetching Facebook leads:", err);
        return res.status(500).json({ message: "Error fetching Facebook leads" });
      }

      res.json({
        leads: result.rows,
        total: result.rows.length
      });
    });

  } catch (error) {
    console.error("Facebook leads error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
