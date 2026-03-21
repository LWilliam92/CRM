# CRM Backend API

A Node.js Express API for CRM system with MySQL database.

## Features

- User authentication with JWT
- Contact management
- Campaign management (SMS/WhatsApp)
- Dashboard statistics
- RESTful API endpoints

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up MySQL database:
```bash
mysql -u root -p < database.sql
```

3. Update database configuration in `config/db.js` if needed.

## Usage

Start the server:
```bash
npm start
```

Server runs on port 5000.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create new contact

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create new campaign

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Database Schema

- **users**: User authentication and roles
- **contacts**: Customer contact information
- **campaigns**: Marketing campaigns (SMS/WhatsApp)

## Default Admin

Email: admin@crm.com
Password: password

## Technologies

- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcryptjs for password hashing
