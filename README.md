# MCMS Backend

A vanilla Node.js backend for the MCMS Construction Management System. Built with Prisma, PostgreSQL, WebSockets, and Nodemailer.

## Features

- **Authentication**: JWT-based auth with RBAC (Role-Based Access Control).
- **Database**: PostgreSQL with Prisma ORM.
- **Real-time**: WebSocket server for live updates and notifications.
- **Email**: Transactional emails using Nodemailer (Welcome, Notifications, Confirmations).
- **PWA Support**: Manifest and offline sync endpoints.
- **REST API**: Standardized API for all entities (Projects, Users, Vendors, etc.).

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- SMTP Server (e.g., Gmail) for emails

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env` (already created during initialization) and ensure the following variables are set:

   ```env
   DATABASE_URL="postgresql://postgres:1234@localhost:5432/mcms?schema=public"
   PORT=3000
   JWT_SECRET="your-super-secret-key-change-in-production"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USERNAME="your-email@gmail.com"
   SMTP_PASSWORD="your-app-password"
   FRONTEND_URL="http://localhost:3000"
   ```

3. **Database Setup**

   ```bash
   # Run migrations
   npx prisma migrate deploy

   # (Optional) Seed database
   npm run db:seed
   ```

## Running the Server

- **Development Mode**

  ```bash
  npm start
  ```

  Or nicely with:

  ```bash
  node server.js
  ```

- **Production Mode**
  ```bash
  npm start
  ```
  (Ensure `NODE_ENV=production` is set in your environment)

## API Documentation

The API is available at `http://localhost:3000/api/v1`.

### Core Endpoints

- **Auth**: `/api/v1/auth` (login, register, me)
- **Users**: `/api/v1/users`
- **Projects**: `/api/v1/projects`
- **Vendors**: `/api/v1/vendors`
- **Contracts**: `/api/v1/contracts`
- **Tasks**: `/api/v1/tasks` (Gantt chart data)
- **Assets**: `/api/v1/assets` (Equipment tracking)
- **Requisitions**: `/api/v1/requisitions`
- **Daily Logs**: `/api/v1/daily-logs`
- **Issues**: `/api/v1/issues`
- **Procurement**: `/api/v1/procurement`

### Real-time (WebSocket)

Connect to `ws://localhost:3000`.

- authenticate with JWT: `{ "type": "authenticate", "payload": { "token": "..." } }`
- Listen for events like `notification`, `project:updated`, etc.

## Testing

Run the included test hooks to verify the backend:

```bash
node tests/hooks.js
```

## Structure

- `src/config`: Configuration files (DB, Env, CORS)
- `src/controllers`: Request handlers
- `src/services`: Business logic
- `src/routes`: API route definitions
- `src/middlewares`: Auth, Validation, Error handling
- `src/realtime`: WebSocket server and handlers
- `src/emails`: Email templates and sender
- `src/pwa`: Offline sync and manifest
