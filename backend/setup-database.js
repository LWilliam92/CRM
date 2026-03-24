const { Pool } = require('pg');

// Connect to default postgres database to create peerhub
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'postgres' // Connect to default database first
});

async function setupDatabase() {
  try {
    console.log('Connecting to PostgreSQL...');
    
    // Create the database
    await pool.query('CREATE DATABASE peerhub');
    console.log('✅ Database "peerhub" created successfully!');
    
    // Close connection
    await pool.end();
    
    // Now connect to the new database and create tables
    const peerhubPool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'password',
      database: 'peerhub'
    });
    
    console.log('Creating tables...');
    
    // Create tables
    await peerhubPool.query(`
      CREATE TABLE contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await crmPool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await crmPool.query(`
      CREATE TABLE campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        type VARCHAR(20),
        message TEXT,
        recipients INTEGER,
        status VARCHAR(20),
        recipients_file VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert admin user
    await peerhubPool.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Admin', 'admin@crm.com', '$2b$10$Gpc7odmbfvBng.VLtjeNPuj1VlC3lbUTF69PXaSTcCw2aQSYoBy7m', 'admin')
    `);
    
    console.log('✅ Tables created successfully!');
    console.log('✅ Admin user inserted!');
    console.log('\n🎉 PeerHub database setup complete!');
    console.log('Login credentials:');
    console.log('  Email: admin@crm.com');
    console.log('  Password: password');
    
    await peerhubPool.end();
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✅ Database "peerhub" already exists!');
      console.log('You can now start the server with: npm start');
    } else {
      console.error('❌ Error setting up database:', error.message);
    }
    await pool.end();
  }
}

setupDatabase();
