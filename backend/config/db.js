const { Pool } = require("pg");

const db = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "crm_system",
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

db.connect(err => {
 if (err) {
   console.error("PostgreSQL connection error:", err);
   throw err;
 }
 console.log("PostgreSQL Connected");
});

module.exports = db;