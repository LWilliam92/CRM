# MySQL to AWS PostgreSQL Migration Guide

## Overview
This guide walks you through migrating your CRM system from MySQL to AWS PostgreSQL.

## Prerequisites
- AWS account with RDS access
- Node.js and npm installed
- PostgreSQL client tools (psql)

## Migration Steps

### 1. Update Dependencies
```bash
cd backend
npm install pg
```

### 2. Set Up AWS RDS PostgreSQL
1. Go to AWS RDS Console
2. Create PostgreSQL database instance
3. Configure security groups to allow your IP address
4. Note the endpoint, username, and password

### 3. Configure Environment
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your AWS RDS credentials:
```env
DB_HOST=your-aws-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_USER=your-postgres-username
DB_PASSWORD=your-postgres-password
DB_NAME=crm_system
DB_SSL=true
```

### 4. Create Database Schema
```bash
# Connect to PostgreSQL and create database
psql -h YOUR_RDS_ENDPOINT -U YOUR_USER -d postgres -c "CREATE DATABASE crm_system;"

# Import the schema
psql -h YOUR_RDS_ENDPOINT -U YOUR_USER -d crm_system -f database_postgresql.sql
```

### 5. Start the Application
```bash
cd backend
npm install
npm start
```

## Key Changes Made

### Database Configuration
- **Before**: MySQL connection with `mysql2`
- **After**: PostgreSQL connection pooling with `pg`
- Added SSL support for AWS RDS
- Environment-based configuration

### SQL Syntax Changes
- **Parameters**: `?` → `$1, $2, $3...`
- **Auto-increment**: `AUTO_INCREMENT` → `SERIAL`
- **Result handling**: `result` → `result.rows`
- **Insert ignore**: `INSERT IGNORE` → `INSERT ... ON CONFLICT DO NOTHING`
- **Insert ID**: `result.insertId` → `result.rows[0].id` (with RETURNING)

### Schema Changes
- Updated `database.sql` to PostgreSQL syntax
- Created `database_postgresql.sql` with proper PostgreSQL types

## Testing the Migration

### 1. Basic Connection Test
```bash
node -e "const db = require('./config/db'); console.log('Connected successfully!');"
```

### 2. API Testing
```bash
# Test authentication
curl -X POST http://localhost:5000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"password"}'

# Test contacts endpoint
curl http://localhost:5000/api/contacts

# Test campaigns endpoint  
curl http://localhost:5000/api/campaigns
```

## Troubleshooting

### Connection Issues
- Check AWS security group allows your IP
- Verify SSL settings in `.env`
- Ensure PostgreSQL port 5432 is open

### Query Issues
- All parameters now use `$1, $2...` syntax
- Results are in `result.rows` array
- Use `RETURNING id` for insert operations

### Performance Tips
- PostgreSQL connection pooling is configured
- Consider adding indexes for frequently queried columns
- Monitor RDS performance metrics

## Benefits of PostgreSQL
- Better performance for complex queries
- Advanced JSON support with JSONB
- Full-text search capabilities
- Better concurrency handling
- AWS managed service with automatic backups

## Rollback Plan
If you need to rollback to MySQL:
1. Restore original `package.json` (mysql2)
2. Restore original `config/db.js`
3. Use original `database.sql`
4. Update all query syntax back to MySQL format

## Support
For issues during migration:
1. Check AWS RDS logs
2. Verify network connectivity
3. Review PostgreSQL error messages
4. Test with local PostgreSQL first
