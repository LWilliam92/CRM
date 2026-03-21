const db = require('./config/db');

// Add recipients_file column to campaigns table
db.query('ALTER TABLE campaigns ADD COLUMN recipients_file VARCHAR(255)', (err, result) => {
  if (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column recipients_file already exists');
    } else {
      console.error('Error adding column:', err);
    }
  } else {
    console.log('Column recipients_file added successfully');
  }
  
  // Check table structure again
  db.query('DESCRIBE campaigns', (err, result) => {
    if (err) {
      console.error('Error:', err);
      process.exit(1);
    }
    console.log('Updated campaigns table structure:');
    console.table(result);
    process.exit(0);
  });
});
