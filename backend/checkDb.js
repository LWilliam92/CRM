const db = require('./config/db');

db.query('DESCRIBE campaigns', (err, result) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('Campaigns table structure:');
  console.table(result);
  process.exit(0);
});
