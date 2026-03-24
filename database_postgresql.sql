CREATE DATABASE peerhub;
\c peerhub;

CREATE TABLE contacts (
 id SERIAL PRIMARY KEY,
 name VARCHAR(100),
 phone VARCHAR(20),
 email VARCHAR(100),
 category VARCHAR(50),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
 id SERIAL PRIMARY KEY,
 name VARCHAR(100),
 email VARCHAR(100) UNIQUE,
 password VARCHAR(255),
 role VARCHAR(50),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaigns (
 id SERIAL PRIMARY KEY,
 name VARCHAR(100),
 type VARCHAR(20),
 message TEXT,
 recipients INTEGER,
 status VARCHAR(20),
 recipients_file VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name,email,password,role)
VALUES (
'Admin',
'admin@crm.com',
'$2b$10$Gpc7odmbfvBng.VLtjeNPuj1VlC3lbUTF69PXaSTcCw2aQSYoBy7m',
'admin'
);

-- Default login credentials
-- email: admin@crm.com
-- password: password
