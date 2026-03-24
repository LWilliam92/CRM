# Install PostgreSQL on Windows

## Option 1: Download Installer (Recommended)
1. Go to https://www.postgresql.org/download/windows/
2. Download the latest version (16.x recommended)
3. Run the installer with default settings
4. Set password: `password` (matches your .env)
5. Ensure port 5432 is selected

## Option 2: Use Docker (Fastest)
```bash
# Install Docker Desktop first
docker run --name postgres-crm -e POSTGRES_PASSWORD=password -e POSTGRES_DB=crm_system -p 5432:5432 -d postgres:16
```

## Option 3: Use Cloud (AWS RDS)
1. Go to AWS RDS Console
2. Create PostgreSQL instance
3. Update .env with AWS credentials
4. Comment out localhost settings

## After Installation
Test connection:
```bash
cd backend
npm install
npm start
```

## Default Login (if using local install)
- Host: localhost
- Port: 5432
- Database: crm_system
- Username: postgres
- Password: password
