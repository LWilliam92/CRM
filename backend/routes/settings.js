const router = require("express").Router();
const db = require("../config/db");

// Get Facebook settings
router.get("/facebook", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Get Facebook Lead Ads settings
    const leadAdsQuery = `
      SELECT page_id, page_name, verify_token 
      FROM facebook_pages 
      WHERE is_active = true 
      LIMIT 1
    `;

    // Get Facebook Messenger settings
    const messengerQuery = `
      SELECT page_id, page_name, page_access_token, verify_token 
      FROM facebook_pages 
      WHERE is_active = true 
      LIMIT 1
    `;

    Promise.all([
      new Promise((resolve, reject) => {
        db.query(leadAdsQuery, (err, result) => {
          if (err) reject(err);
          else resolve(result.rows[0] || {});
        });
      }),
      new Promise((resolve, reject) => {
        db.query(messengerQuery, (err, result) => {
          if (err) reject(err);
          else resolve(result.rows[0] || {});
        });
      })
    ]).then(([leadAdsSettings, messengerSettings]) => {
      res.json({
        leadAds: {
          appId: process.env.FACEBOOK_APP_ID || '',
          appSecret: process.env.FACEBOOK_APP_SECRET || '',
          accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
          adAccountId: process.env.FACEBOOK_AD_ACCOUNT_ID || '',
          webhookUrl: `${req.protocol}://${req.get('host')}/api/facebook/webhook`,
          verifyToken: leadAdsSettings.verify_token || '',
          ...leadAdsSettings
        },
        messenger: {
          pageId: messengerSettings.page_id || '',
          pageName: messengerSettings.page_name || '',
          pageAccessToken: messengerSettings.page_access_token || '',
          webhookUrl: `${req.protocol}://${req.get('host')}/api/messenger/webhook`,
          verifyToken: messengerSettings.verify_token || '',
          ...messengerSettings
        }
      });
    }).catch(error => {
      console.error("Error fetching Facebook settings:", error);
      res.status(500).json({ message: "Error fetching Facebook settings" });
    });

  } catch (error) {
    console.error("Facebook settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update Facebook Lead Ads settings
router.post("/facebook/lead-ads", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { appId, appSecret, accessToken, adAccountId, verifyToken } = req.body;

    // Validate required fields
    if (!appId || !appSecret || !accessToken || !verifyToken) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Update or insert Facebook page configuration
    const upsertQuery = `
      INSERT INTO facebook_pages (page_id, page_name, page_access_token, verify_token, is_active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (page_id) 
      DO UPDATE SET 
        page_name = EXCLUDED.page_name,
        page_access_token = EXCLUDED.page_access_token,
        verify_token = EXCLUDED.verify_token,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
    `;

    db.query(
      upsertQuery,
      [`lead_ads_${appId}`, 'Facebook Lead Ads', accessToken, verifyToken],
      (err, result) => {
        if (err) {
          console.error("Error saving Facebook Lead Ads settings:", err);
          return res.status(500).json({ message: "Error saving settings" });
        }

        res.json({ message: "Facebook Lead Ads settings saved successfully" });
      }
    );

  } catch (error) {
    console.error("Facebook Lead Ads settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update Facebook Messenger settings
router.post("/facebook/messenger", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { pageId, pageName, pageAccessToken, verifyToken } = req.body;

    // Validate required fields
    if (!pageId || !pageName || !pageAccessToken || !verifyToken) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Update or insert Facebook page configuration
    const upsertQuery = `
      INSERT INTO facebook_pages (page_id, page_name, page_access_token, verify_token, is_active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (page_id) 
      DO UPDATE SET 
        page_name = EXCLUDED.page_name,
        page_access_token = EXCLUDED.page_access_token,
        verify_token = EXCLUDED.verify_token,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
    `;

    db.query(
      upsertQuery,
      [pageId, pageName, pageAccessToken, verifyToken],
      (err, result) => {
        if (err) {
          console.error("Error saving Facebook Messenger settings:", err);
          return res.status(500).json({ message: "Error saving settings" });
        }

        res.json({ message: "Facebook Messenger settings saved successfully" });
      }
    );

  } catch (error) {
    console.error("Facebook Messenger settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Test Facebook connection
router.post("/facebook/test-connection", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { type, settings } = req.body;

    if (type === 'lead-ads') {
      // Test Facebook Lead Ads API connection
      const { appId, accessToken } = settings;
      
      if (!appId || !accessToken) {
        return res.status(400).json({ message: "App ID and Access Token are required for testing" });
      }

      try {
        // Test Facebook Graph API
        const testResponse = await axios.get(
          `https://graph.facebook.com/v18.0/${appId}?access_token=${accessToken}`
        );

        if (testResponse.data.id) {
          res.json({ 
            success: true, 
            message: "Facebook Lead Ads connection successful!",
            data: testResponse.data
          });
        } else {
          res.json({ 
            success: false, 
            message: "Invalid Facebook App ID or Access Token" 
          });
        }
      } catch (apiError) {
        console.error("Facebook API test error:", apiError.response?.data || apiError.message);
        res.status(400).json({ 
          success: false, 
          message: "Facebook API connection failed",
          error: apiError.response?.data || apiError.message
        });
      }

    } else if (type === 'messenger') {
      // Test Facebook Messenger API connection
      const { pageId, pageAccessToken } = settings;
      
      if (!pageId || !pageAccessToken) {
        return res.status(400).json({ message: "Page ID and Page Access Token are required for testing" });
      }

      try {
        // Test Facebook Page access
        const testResponse = await axios.get(
          `https://graph.facebook.com/v18.0/${pageId}?access_token=${pageAccessToken}`
        );

        if (testResponse.data.id) {
          res.json({ 
            success: true, 
            message: "Facebook Messenger connection successful!",
            data: testResponse.data
          });
        } else {
          res.json({ 
            success: false, 
            message: "Invalid Facebook Page ID or Access Token" 
          });
        }
      } catch (apiError) {
        console.error("Facebook Messenger API test error:", apiError.response?.data || apiError.message);
        res.status(400).json({ 
          success: false, 
          message: "Facebook Messenger API connection failed",
          error: apiError.response?.data || apiError.message
        });
      }
    } else {
      res.status(400).json({ message: "Invalid connection type" });
    }

  } catch (error) {
    console.error("Facebook connection test error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get general settings
router.get("/general", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Return general CRM settings
    res.json({
      companyName: process.env.COMPANY_NAME || 'Your Company',
      timezone: process.env.TIMEZONE || 'UTC',
      dateFormat: process.env.DATE_FORMAT || 'MM/DD/YYYY',
      currency: process.env.CURRENCY || 'USD',
      emailNotifications: process.env.EMAIL_NOTIFICATIONS === 'true'
    });

  } catch (error) {
    console.error("General settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update general settings
router.post("/general", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { companyName, timezone, dateFormat, currency, emailNotifications } = req.body;

    // In a real app, save these to database or environment
    console.log("Updating general settings:", req.body);

    res.json({ message: "General settings updated successfully" });

  } catch (error) {
    console.error("General settings update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
