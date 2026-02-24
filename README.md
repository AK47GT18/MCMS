# MCMS Backend

A vanilla Node.js backend for the MCMS Construction Management System. Built with Prisma, PostgreSQL, WebSockets, and Nodemailer.

## Features

- **Authentication**: JWT-based auth with RBAC (Role-Based Access Control).
- **Database**: PostgreSQL with Prisma ORM.
- **Real-time**: WebSocket server for live updates and notifications.
- **Email**: Transactional emails using Nodemailer (Welcome, Notifications, Confirmations).
- **PWA Support**: Manifest and offline sync endpoints.
- **REST API**: Standardized API for all entities (Projects, Users, Vendors, etc.).

## Quick Start

For a detailed walkthrough on setting up the environment from scratch, please refer to the **[Installation & Setup Guide](./SETUP_GUIDE.md)**.

1.  **Clone & Install**

    ```bash
    npm install
    ```

2.  **Configure `.env`**
    Copy `.env.example` to `.env` and update your database credentials.

3.  **Database Setup**

    ```bash
    npx prisma db push
    ```

4.  **Launch**
    ```bash
    npm run dev
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
