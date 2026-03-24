const router = require("express").Router();
const db = require("../config/db");
const axios = require("axios");

// Facebook Messenger webhook verification
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Get verify token from database
  db.query("SELECT verify_token FROM facebook_pages WHERE is_active = true LIMIT 1", (err, result) => {
    if (err || result.rows.length === 0) {
      console.log("No active Facebook page configuration found");
      return res.sendStatus(403);
    }

    const verifyToken = result.rows[0].verify_token;

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Facebook Messenger webhook verified successfully");
      res.status(200).send(challenge);
    } else {
      console.log("Facebook Messenger webhook verification failed");
      res.sendStatus(403);
    }
  });
});

// Handle Facebook Messenger webhook events
router.post("/webhook", (req, res) => {
  const data = req.body;

  if (data.object === "page") {
    data.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message && event.sender.id) {
          handleIncomingMessage(event);
        } else if (event.postback) {
          handlePostback(event);
        } else if (event.delivery) {
          handleDeliveryConfirmation(event);
        } else if (event.read) {
          handleReadConfirmation(event);
        }
      });
    });
    
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// Handle incoming messages from Facebook Messenger
async function handleIncomingMessage(event) {
  try {
    const senderId = event.sender.id;
    const messageId = event.message.mid;
    const messageText = event.message.text;
    const attachments = event.message.attachments || [];

    console.log(`Received message from ${senderId}: ${messageText || 'Media message'}`);

    // Find or create ticket for this customer
    const ticket = await findOrCreateTicket(senderId, event);

    // Store the message in database
    await storeMessage(ticket.id, 'customer', senderId, messageText, attachments, messageId);

    // Update ticket status if it was closed
    if (ticket.status === 'closed') {
      await updateTicketStatus(ticket.id, 'open');
    }

    // Send auto-reply if this is the first message and no agent is assigned
    if (!ticket.assigned_to) {
      await sendAutoReply(senderId, ticket.id);
    }

    // Mark message as read
    await markMessageAsRead(senderId, messageId);

  } catch (error) {
    console.error("Error handling incoming message:", error);
  }
}

// Find existing ticket or create new one
async function findOrCreateTicket(senderId, event) {
  return new Promise((resolve, reject) => {
    // First, try to find existing open ticket
    db.query(
      "SELECT * FROM tickets WHERE facebook_psid = $1 AND status IN ('open', 'in_progress') ORDER BY created_at DESC LIMIT 1",
      [senderId],
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        if (result.rows.length > 0) {
          resolve(result.rows[0]);
        } else {
          // Create new ticket
          const customerName = event.message?.quick_reply?.payload ? 
            `Customer ${senderId}` : `Facebook Customer ${senderId}`;
          
          db.query(
            `INSERT INTO tickets (customer_name, facebook_psid, subject, source) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [customerName, senderId, "New conversation from Facebook Messenger", "messenger"],
            (err, result) => {
              if (err) {
                reject(err);
              } else {
                // Log ticket creation
                logTicketActivity(result.rows[0].id, null, 'created', null, 'New ticket from Facebook Messenger');
                resolve(result.rows[0]);
              }
            }
          );
        }
      }
    );
  });
}

// Store message in database
async function storeMessage(ticketId, senderType, senderId, content, attachments, messageId) {
  return new Promise((resolve, reject) => {
    let messageType = 'text';
    let mediaUrl = null;
    let messageContent = content;

    // Handle attachments
    if (attachments && attachments.length > 0) {
      const attachment = attachments[0];
      messageType = attachment.type;
      mediaUrl = attachment.payload.url;
      
      if (messageType === 'image') {
        messageContent = '📷 Image';
      } else if (messageType === 'video') {
        messageContent = '🎥 Video';
      } else if (messageType === 'audio') {
        messageContent = '🎵 Audio';
      } else if (messageType === 'file') {
        messageContent = '📎 File';
      }
    }

    db.query(
      `INSERT INTO messages (ticket_id, sender_type, sender_id, message_type, content, media_url, facebook_message_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [ticketId, senderType, senderId, messageType, messageContent, mediaUrl, messageId],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.rows[0]);
        }
      }
    );
  });
}

// Send auto-reply to customer
async function sendAutoReply(senderId, ticketId) {
  try {
    // Get active canned response for auto-reply
    db.query(
      "SELECT content FROM canned_responses WHERE category = 'greeting' AND is_active = true LIMIT 1",
      (err, result) => {
        if (err || result.rows.length === 0) {
          console.log("No auto-reply available");
          return;
        }

        const autoReplyText = result.rows[0].content;
        sendFacebookMessage(senderId, autoReplyText, ticketId);
      }
    );
  } catch (error) {
    console.error("Error sending auto-reply:", error);
  }
}

// Send message via Facebook Messenger API
async function sendFacebookMessage(recipientId, messageText, ticketId) {
  try {
    // Get active Facebook page access token
    const pageResult = await new Promise((resolve, reject) => {
      db.query("SELECT page_access_token FROM facebook_pages WHERE is_active = true LIMIT 1", (err, result) => {
        if (err || result.rows.length === 0) {
          reject(new Error("No active Facebook page found"));
        } else {
          resolve(result.rows[0]);
        }
      });
    });

    const pageAccessToken = pageResult.page_access_token;

    const messageData = {
      recipient: { id: recipientId },
      message: { text: messageText }
    };

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`,
      messageData
    );

    // Store the sent message in database
    if (response.data.message_id) {
      await storeMessage(ticketId, 'agent', null, messageText, null, response.data.message_id);
    }

    console.log(`Message sent to ${recipientId}: ${messageText}`);
    return response.data;

  } catch (error) {
    console.error("Error sending Facebook message:", error.response?.data || error.message);
    throw error;
  }
}

// Mark message as read
async function markMessageAsRead(senderId, messageId) {
  try {
    const pageResult = await new Promise((resolve, reject) => {
      db.query("SELECT page_access_token FROM facebook_pages WHERE is_active = true LIMIT 1", (err, result) => {
        if (err || result.rows.length === 0) {
          reject(new Error("No active Facebook page found"));
        } else {
          resolve(result.rows[0]);
        }
      });
    });

    const pageAccessToken = pageResult.page_access_token;

    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`,
      {
        recipient: { id: senderId },
        sender_action: "mark_seen"
      }
    );

    console.log(`Message marked as read: ${messageId}`);

  } catch (error) {
    console.error("Error marking message as read:", error);
  }
}

// Update ticket status
async function updateTicketStatus(ticketId, newStatus, userId = null) {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [newStatus, ticketId],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          logTicketActivity(ticketId, userId, 'status_changed', null, newStatus);
          resolve(result.rows[0]);
        }
      }
    );
  });
}

// Log ticket activity
function logTicketActivity(ticketId, userId, action, oldValue, newValue, notes = null) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO ticket_activity_log (ticket_id, user_id, action, old_value, new_value, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [ticketId, userId, action, oldValue, newValue, notes],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.rows[0]);
        }
      }
    );
  });
}

// Handle postback (quick replies, buttons)
function handlePostback(event) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;
  
  console.log(`Received postback from ${senderId}: ${payload}`);
  
  // Handle different postback actions
  switch(payload) {
    case 'GET_STARTED':
      sendAutoReply(senderId, null);
      break;
    case 'TALK_TO_HUMAN':
      // Create ticket or escalate to human agent
      findOrCreateTicket(senderId, event);
      break;
    default:
      console.log(`Unhandled postback: ${payload}`);
  }
}

// Handle delivery confirmation
function handleDeliveryConfirmation(event) {
  const messageId = event.delivery.mids[0];
  console.log(`Message delivered: ${messageId}`);
  
  // Update message status in database
  db.query(
    "UPDATE messages SET is_read = true WHERE facebook_message_id = $1",
    [messageId],
    (err, result) => {
      if (err) {
        console.error("Error updating message delivery status:", err);
      }
    }
  );
}

// Handle read confirmation
function handleReadConfirmation(event) {
  const watermark = event.read.watermark;
  console.log(`Messages read up to: ${new Date(watermark)}`);
}

// API endpoint to send reply from agent interface
router.post("/send-reply", async (req, res) => {
  try {
    const { ticketId, message, agentId } = req.body;

    if (!ticketId || !message || !agentId) {
      return res.status(400).json({ message: "Ticket ID, message, and agent ID are required" });
    }

    // Get ticket details
    const ticket = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM tickets WHERE id = $1", [ticketId], (err, result) => {
        if (err || result.rows.length === 0) {
          reject(new Error("Ticket not found"));
        } else {
          resolve(result.rows[0]);
        }
      });
    });

    // Send message via Facebook
    await sendFacebookMessage(ticket.facebook_psid, message, ticketId);

    // Update ticket status to in_progress if it was open
    if (ticket.status === 'open') {
      await updateTicketStatus(ticketId, 'in_progress', agentId);
    }

    // Assign ticket to agent if not already assigned
    if (!ticket.assigned_to) {
      await new Promise((resolve, reject) => {
        db.query(
          "UPDATE tickets SET assigned_to = $1 WHERE id = $2",
          [agentId, ticketId],
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              logTicketActivity(ticketId, agentId, 'assigned', null, agentId.toString());
              resolve();
            }
          }
        );
      });
    }

    res.json({ message: "Reply sent successfully" });

  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ message: "Error sending reply" });
  }
});

module.exports = router;
