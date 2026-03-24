const router = require("express").Router()
const db = require("../config/db")
const multer = require("multer")
const csv = require("csv-parser")
const fs = require("fs")
const path = require("path")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Function to replace variables in message template
function processMessageTemplate(template, recipient) {
  let processedMessage = template;
  
  // Replace common variables
  processedMessage = processedMessage.replace(/\{name\}/g, recipient.name || '');
  processedMessage = processedMessage.replace(/\{phone\}/g, recipient.phone || '');
  processedMessage = processedMessage.replace(/\{email\}/g, recipient.email || '');
  
  // Handle case-insensitive variables
  processedMessage = processedMessage.replace(/\{Name\}/g, recipient.name || '');
  processedMessage = processedMessage.replace(/\{Phone\}/g, recipient.phone || '');
  processedMessage = processedMessage.replace(/\{Email\}/g, recipient.email || '');
  
  return processedMessage;
}

// GET campaigns
router.get("/", (req,res)=>{

db.query(
"SELECT * FROM campaigns ORDER BY created_at DESC",
(err,result)=>{
if(err) throw err
res.json(result.rows)
})

})

// CREATE campaign with file upload
router.post("/", upload.single('recipientsFile'), (req,res)=>{
console.log('Campaign creation request received');
console.log('Body:', req.body);
console.log('File:', req.file);

const {name,type,message,importToContacts} = req.body
const filePath = req.file ? req.file.path : null;

if (!filePath) {
  console.log('Error: No file uploaded');
  return res.status(400).json({message: "Recipients file is required"});
}

if (!name || !type || !message) {
  console.log('Error: Missing required fields', { name, type, message: message ? 'provided' : 'missing' });
  return res.status(400).json({message: "Campaign name, type, and message are required"});
}

// Parse CSV file and process recipients
const recipients = [];
const processedMessages = [];

fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => {
    console.log('Processing row:', row);
    if (row.name && row.phone) {
      const recipient = {
        name: row.name,
        phone: row.phone,
        email: row.email || ''
      };
      
      // Process message template for this recipient
      const processedMessage = processMessageTemplate(message, recipient);
      
      recipients.push(recipient);
      processedMessages.push({
        recipient: recipient,
        message: processedMessage
      });
    }
  })
  .on('end', () => {
    console.log(`Processed ${recipients.length} recipients`);
    
    if (recipients.length === 0) {
      return res.status(400).json({message: "No valid recipients found in CSV file"});
    }
    
    // Insert campaign
    db.query(
      "INSERT INTO campaigns (name,type,message,recipients,recipients_file) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [name,type,message,recipients.length, req.file.filename],
      (err,result)=>{
        if(err) {
          console.error("Error inserting campaign:", err);
          return res.status(500).json({message: "Error creating campaign: " + err.message});
        }
        
        console.log('Campaign inserted successfully:', result.rows[0].id);
        
        // Insert contacts into contacts table only if importToContacts is true
        const shouldImportContacts = importToContacts === 'true' || importToContacts === true;
        console.log('Should import contacts:', shouldImportContacts);
        
        if (shouldImportContacts && recipients.length > 0) {
          const contactValues = recipients.map(r => [r.name, r.phone, r.email, 'lead']);
          const placeholders = contactValues.map((_, index) => `($${index * 4 + 1},$${index * 4 + 2},$${index * 4 + 3},$${index * 4 + 4})`).join(',');
          const values = contactValues.flat();
          
          db.query(
            `INSERT INTO contacts (name, phone, email, category) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
            values,
            (contactErr) => {
              if (contactErr) {
                console.error("Error inserting contacts:", contactErr);
              } else {
                console.log('Contacts inserted successfully as leads');
              }
            }
          );
        } else {
          console.log('Skipping contact import as requested');
        }
        
        res.json({
          message:"Campaign created successfully",
          recipients: recipients.length,
          campaignId: result.rows[0].id,
          sampleMessages: processedMessages.slice(0, 3) // Return first 3 processed messages as examples
        });
      }
    );
  })
  .on('error', (error) => {
    console.error("Error reading CSV:", error);
    res.status(500).json({message: "Error processing file: " + error.message});
  });

})

module.exports = router