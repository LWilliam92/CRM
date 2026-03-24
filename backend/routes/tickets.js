const router = require("express").Router();
const db = require("../config/db");

// Get all tickets with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { 
      status = 'open', 
      assigned_to, 
      priority, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT t.*, u.name as assigned_agent_name,
             COUNT(m.id) as message_count,
             MAX(m.created_at) as last_message_at
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN messages m ON t.id = m.ticket_id
    `;
    
    const params = [];
    const conditions = [];

    // Add filters
    if (status && status !== 'all') {
      conditions.push(`t.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (assigned_to && assigned_to !== 'all') {
      conditions.push(`t.assigned_to = $${params.length + 1}`);
      params.push(assigned_to);
    }
    
    if (priority && priority !== 'all') {
      conditions.push(`t.priority = $${params.length + 1}`);
      params.push(priority);
    }
    
    if (search) {
      conditions.push(`(t.customer_name ILIKE $${params.length + 1} OR t.subject ILIKE $${params.length + 1} OR t.ticket_number ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += `
      GROUP BY t.id, u.name
      ORDER BY t.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(parseInt(limit), offset);

    db.query(query, params, (err, result) => {
      if (err) {
        console.error("Error fetching tickets:", err);
        return res.status(500).json({ message: "Error fetching tickets" });
      }

      // Get total count for pagination
      let countQuery = "SELECT COUNT(*) as total FROM tickets t";
      if (conditions.length > 0) {
        countQuery += ` WHERE ${conditions.join(' AND ')}`;
      }

      db.query(countQuery, params.slice(0, -2), (err, countResult) => {
        if (err) {
          console.error("Error counting tickets:", err);
          return res.status(500).json({ message: "Error counting tickets" });
        }

        res.json({
          tickets: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].total),
            pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
          }
        });
      });
    });

  } catch (error) {
    console.error("Tickets fetch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single ticket with messages
router.get("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const ticketId = req.params.id;

    // Get ticket details
    const ticketQuery = `
      SELECT t.*, u.name as assigned_agent_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1
    `;

    db.query(ticketQuery, [ticketId], (err, ticketResult) => {
      if (err) {
        console.error("Error fetching ticket:", err);
        return res.status(500).json({ message: "Error fetching ticket" });
      }

      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const ticket = ticketResult.rows[0];

      // Get messages for this ticket
      const messagesQuery = `
        SELECT m.*, u.name as agent_name
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'agent'
        WHERE m.ticket_id = $1
        ORDER BY m.created_at ASC
      `;

      db.query(messagesQuery, [ticketId], (err, messagesResult) => {
        if (err) {
          console.error("Error fetching messages:", err);
          return res.status(500).json({ message: "Error fetching messages" });
        }

        // Get activity log
        const activityQuery = `
          SELECT tal.*, u.name as user_name
          FROM ticket_activity_log tal
          LEFT JOIN users u ON tal.user_id = u.id
          WHERE tal.ticket_id = $1
          ORDER BY tal.created_at DESC
          LIMIT 20
        `;

        db.query(activityQuery, [ticketId], (err, activityResult) => {
          if (err) {
            console.error("Error fetching activity log:", err);
            return res.status(500).json({ message: "Error fetching activity log" });
          }

          res.json({
            ticket,
            messages: messagesResult.rows,
            activity: activityResult.rows
          });
        });
      });
    });

  } catch (error) {
    console.error("Ticket fetch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update ticket
router.put("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const ticketId = req.params.id;
    const { status, priority, assigned_to, subject, notes } = req.body;

    // Get current ticket for logging changes
    const currentTicket = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM tickets WHERE id = $1", [ticketId], (err, result) => {
        if (err || result.rows.length === 0) {
          reject(new Error("Ticket not found"));
        } else {
          resolve(result.rows[0]);
        }
      });
    });

    // Build update query
    const updates = [];
    const params = [];
    let updateQuery = "UPDATE tickets SET updated_at = CURRENT_TIMESTAMP";

    if (status && status !== currentTicket.status) {
      updates.push('status');
      params.push(status);
      updateQuery += `, status = $${params.length}`;
    }

    if (priority && priority !== currentTicket.priority) {
      updates.push('priority');
      params.push(priority);
      updateQuery += `, priority = $${params.length}`;
    }

    if (assigned_to && assigned_to !== currentTicket.assigned_to) {
      updates.push('assigned_to');
      params.push(assigned_to);
      updateQuery += `, assigned_to = $${params.length}`;
    }

    if (subject && subject !== currentTicket.subject) {
      updates.push('subject');
      params.push(subject);
      updateQuery += `, subject = $${params.length}`;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No changes provided" });
    }

    updateQuery += ` WHERE id = $${params.length + 1}`;
    params.push(ticketId);

    db.query(updateQuery, params, (err, result) => {
      if (err) {
        console.error("Error updating ticket:", err);
        return res.status(500).json({ message: "Error updating ticket" });
      }

      // Log changes
      const userId = req.body.user_id; // Should come from authenticated user
      updates.forEach(update => {
        const oldValue = update === 'assigned_to' ? currentTicket[update] : currentTicket[update];
        const newValue = req.body[update];
        
        logTicketActivity(ticketId, userId, 'status_changed', oldValue.toString(), newValue.toString(), notes);
      });

      res.json({ message: "Ticket updated successfully" });
    });

  } catch (error) {
    console.error("Ticket update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Assign ticket to agent
router.post("/:id/assign", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const ticketId = req.params.id;
    const { agentId, notes } = req.body;

    if (!agentId) {
      return res.status(400).json({ message: "Agent ID is required" });
    }

    // Update ticket assignment
    db.query(
      "UPDATE tickets SET assigned_to = $1, status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [agentId, ticketId],
      (err, result) => {
        if (err) {
          console.error("Error assigning ticket:", err);
          return res.status(500).json({ message: "Error assigning ticket" });
        }

        // Log assignment
        logTicketActivity(ticketId, agentId, 'assigned', null, agentId.toString(), notes);

        res.json({ message: "Ticket assigned successfully" });
      }
    );

  } catch (error) {
    console.error("Ticket assignment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Resolve ticket
router.post("/:id/resolve", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const ticketId = req.params.id;
    const { resolution_notes, agentId } = req.body;

    // Update ticket status to resolved
    db.query(
      "UPDATE tickets SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [ticketId],
      (err, result) => {
        if (err) {
          console.error("Error resolving ticket:", err);
          return res.status(500).json({ message: "Error resolving ticket" });
        }

        // Log resolution
        logTicketActivity(ticketId, agentId, 'status_changed', 'open/in_progress', 'resolved', resolution_notes);

        res.json({ message: "Ticket resolved successfully" });
      }
    );

  } catch (error) {
    console.error("Ticket resolution error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get ticket statistics
router.get("/stats/dashboard", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tickets,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_tickets,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_tickets,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_tickets,
        COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned_tickets
      FROM tickets
    `;

    db.query(statsQuery, (err, result) => {
      if (err) {
        console.error("Error fetching ticket stats:", err);
        return res.status(500).json({ message: "Error fetching ticket statistics" });
      }

      const stats = result.rows[0];

      // Get agent performance stats
      const agentStatsQuery = `
        SELECT u.name, COUNT(t.id) as assigned_tickets, 
               COUNT(CASE WHEN t.status = 'resolved' THEN 1 END) as resolved_tickets
        FROM users u
        LEFT JOIN tickets t ON u.id = t.assigned_to
        WHERE u.role = 'agent' OR u.role = 'admin'
        GROUP BY u.id, u.name
        ORDER BY assigned_tickets DESC
      `;

      db.query(agentStatsQuery, (err, agentResult) => {
        if (err) {
          console.error("Error fetching agent stats:", err);
          return res.status(500).json({ message: "Error fetching agent statistics" });
        }

        res.json({
          ...stats,
          agent_performance: agentResult.rows
        });
      });
    });

  } catch (error) {
    console.error("Ticket stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get canned responses
router.get("/canned-responses", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { category } = req.query;

    let query = "SELECT * FROM canned_responses WHERE is_active = true";
    const params = [];

    if (category) {
      query += " AND category = $1";
      params.push(category);
    }

    query += " ORDER BY title";

    db.query(query, params, (err, result) => {
      if (err) {
        console.error("Error fetching canned responses:", err);
        return res.status(500).json({ message: "Error fetching canned responses" });
      }

      res.json(result.rows);
    });

  } catch (error) {
    console.error("Canned responses error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Log ticket activity (helper function)
function logTicketActivity(ticketId, userId, action, oldValue, newValue, notes) {
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

module.exports = router;
