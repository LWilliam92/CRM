const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./config/db");

const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contacts");
const campaignRoutes = require("./routes/campaigns");
const aiRoutes = require("./routes/ai");
const facebookRoutes = require("./routes/facebook");
const messengerRoutes = require("./routes/messenger");
const ticketsRoutes = require("./routes/tickets");
const settingsRoutes = require("./routes/settings");

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/facebook", facebookRoutes);
app.use("/api/messenger", messengerRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/settings", settingsRoutes);

// Dashboard statistics
app.get("/api/dashboard", (req, res) => {

    const data = {};

    db.query("SELECT COUNT(*) AS contacts FROM contacts", (err, result) => {

        if (err) return res.status(500).json(err);

        data.contacts = result.rows[0].contacts;

        db.query("SELECT COUNT(*) AS campaigns FROM campaigns", (err, result) => {

            if (err) return res.status(500).json(err);

            data.campaigns = result.rows[0].campaigns;

            db.query("SELECT COUNT(*) AS whatsapp FROM campaigns WHERE type='whatsapp'", (err, result) => {

                if (err) return res.status(500).json(err);

                data.whatsapp = result.rows[0].whatsapp;

                db.query("SELECT COUNT(*) AS sms FROM campaigns WHERE type='sms'", (err, result) => {

                    if (err) return res.status(500).json(err);

                    data.sms = result.rows[0].sms;

                    res.json(data);

                });

            });

        });

    });

});


// Start server
app.listen(5001, () => {
    console.log("CRM Server running on port 5001");
});