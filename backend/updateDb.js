const db = require('./config/db');

// Add recipients_file column to campaigns table
db.query('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS recipients_file VARCHAR(255)', (err, result) => {
  if (err) {
    console.error('Error adding column:', err);
    process.exit(1);
  } else {
    console.log('Column recipients_file added successfully (or already exists)');
  }
  
  // Check table structure again
  db.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'campaigns\'', (err, result) => {
    if (err) {
      console.error('Error:', err);
      process.exit(1);
    }
    console.log('Updated campaigns table structure:');
    console.table(result.rows);
    process.exit(0);
  });
});
