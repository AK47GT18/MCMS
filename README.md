# MCMS - Road Construction Management System

MCMS (Mkaka Construction Management System) is a comprehensive, production-ready platform designed to manage the full lifecycle of road construction projects. It integrates project planning, contract management, real-time logging, asset tracking, and financial oversight into a centralized system.

## 🚀 Key Features

-   **Project Management**: Full lifecycle tracking from planning to completion.
-   **Road Estimation Engine**: Automated cost estimation based on Malawi 2025 RCMS Master Reference.
-   **Contract & Milestone Tracking**: Manage vendor contracts, versions, and payment milestones.
-   **Fleet & Asset Management**: Track heavy machinery, maintenance records, and fuel levels.
-   **Field Operations**: Daily logs, headcount tracking, weather reports, and SOS alerts.
-   **Financial Oversight**: Requisitions, budget change requests, and transaction logging.
-   **Governance & Safety**: Safety incident reporting, whistleblower reports, and comprehensive audit logs.
-   **Role-Based Access**: Specialized dashboards for Project Managers, Finance Directors, Field Supervisors, and more.

## 🛠 Tech Stack

-   **Frontend**: Vanilla HTML/JavaScript with CSS (Modern UI components).
-   **Backend**: Node.js with built-in HTTP server and routing.
-   **Database**: PostgreSQL with **Prisma ORM**.
-   **Security**: JWT Authentication, Bcrypt password hashing, and Rate Limiting.
-   **Communication**: Automated email notifications via Nodemailer.

## 📖 Setup Instructions

### 1. Prerequisites
- **Node.js**: v18+
- **PostgreSQL**: v14+
- **Git**

### 2. Installation
```bash
git clone <repository-url>
cd MCMS
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mcms?schema=public"
JWT_SECRET="your-super-secret-key"
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-email"
SMTP_PASS="your-password"
```

### 4. Database Migration
```bash
# Sync the schema to your database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed initial data (Roles, Projects, Users)
npm run db:seed
```

### 5. Running the App
```bash
# Development mode (Server + Client with Browser-Sync)
npm run dev

# Production mode
npm start
```
-   **Backend API**: `http://localhost:3000/api/v1`
-   **Frontend**: `http://localhost:3001`

## 📂 Project Structure Overview

-   `/src`: Core backend logic.
    -   `/controllers`: API request handlers.
    -   `/services`: Business logic and database interactions.
    -   `/routes`: API endpoint definitions.
-   `/components`: Reusable frontend UI modules.
-   `/prisma`: Database schema (`schema.prisma`) and seed data.
-   `/public`: Static assets and document uploads.
-   `server.js`: Application entry point.

## 🛡 Security & Audit
All critical actions (suspensions, deletions, budget changes) are logged in the `AuditLog` table, capturing the user, timestamp, IP address, and specific changes made.

---
© 2026 MCMS Solutions. All rights reserved.
