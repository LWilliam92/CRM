const fs = require('fs');
const db = require('./config/db');

async function updateFacebookSchema() {
  try {
    console.log('🔄 Updating database schema for Facebook integration...');

    // Read the SQL file
    const sqlFile = fs.readFileSync('../database_facebook_updates.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlFile
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await new Promise((resolve, reject) => {
          db.query(statement, (err, result) => {
            if (err) {
              // Ignore "already exists" errors
              if (err.code === '42701' || err.code === '42P16') {
                console.log('✅ Column/table already exists');
                resolve();
              } else {
                console.error('❌ Error:', err.message);
                reject(err);
              }
            } else {
              console.log('✅ Success');
              resolve();
            }
          });
        });
      }
    }

    console.log('🎉 Facebook integration schema updated successfully!');
    
    // Close connection
    db.end();
    
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    process.exit(1);
  }
}

updateFacebookSchema();
