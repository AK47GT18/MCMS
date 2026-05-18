<div align="center">

# 🏗️ MRCMS — Mkaka Road Construction Management System

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-FF6B35?style=for-the-badge&logo=socketdotio&logoColor=white)](#)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#)

**A full-stack enterprise platform for managing construction projects, field operations, fleet logistics, procurement, budgeting, and compliance — all from a single dashboard.**

[Getting Started](#-quick-start) · [Features](#-features) · [API Reference](#-api-endpoints) · [Environment Variables](#-environment-variables)

---

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Default Accounts](#-default-accounts)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Available Scripts](#-available-scripts)
- [Troubleshooting](#-troubleshooting)

---

## 🔭 Overview

MRCMS is a **role-based construction management platform** built with a vanilla Node.js backend (zero frameworks) and a modular vanilla JS frontend. It supports **8 distinct user roles**, each with their own dashboard, and covers the full project lifecycle — from budget estimation and contract management to daily field logs and equipment tracking.

> **Built for:** Construction companies managing multiple road/civil works projects with distributed field teams.

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 18+ (vanilla `http`/`https` — no Express) |
| **Database** | PostgreSQL 15+ |
| **ORM** | Prisma 5.22 |
| **Auth** | JWT (jsonwebtoken + bcryptjs) |
| **Real-Time** | WebSocket (ws) |
| **Email** | Nodemailer (SMTP/Gmail) |
| **File Upload** | Multer |
| **PDF Reports** | PDFKit |
| **Push Notifications** | Web Push (VAPID) |
| **Validation** | Zod |
| **Scheduling** | node-cron |
| **Frontend** | Vanilla HTML/CSS/JS (SPA-style, component-based) |
| **Maps** | Leaflet.js + Geocoder |
| **Dev Tools** | Nodemon, Browser-Sync, Concurrently |

---

## ✨ Features

### 🎯 Role-Based Dashboards
| Role | Key Capabilities |
|---|---|
| **Project Manager** | Project oversight, task scheduling (Gantt), daily log approval, budget control |
| **Finance Director** | Requisition review, budget change requests, procurement approvals, financial reports |
| **Field Supervisor** | Daily log submission, GPS-verified check-in, material usage tracking, safety reports |
| **Contract Administrator** | Contract lifecycle, vendor management, milestone tracking, variation orders |
| **Equipment Coordinator** | Fleet management, vehicle rental contracts, asset dispatch, maintenance records |
| **Operations Manager** | Cross-project analytics, resource allocation, whistleblower case management |
| **Managing Director** | Executive dashboard, KPIs, system-wide reports |
| **System Technician** | User management, audit logs, system configuration |

### 📊 Core Modules
- 🗂️ **Project Management** — Multi-phase projects with Gantt scheduling
- 📝 **Daily Field Logs** — GPS-verified submissions with photo evidence
- 💰 **Budget & Finance** — Real-time budget tracking with fraud detection
- 📄 **Contract Management** — Versioned contracts with milestone payments
- 🚜 **Fleet & Equipment** — Vehicle rentals, asset tracking, maintenance logs
- 📦 **Inventory & Procurement** — Material tracking, requisitions, replenishment
- 🔒 **Safety & Compliance** — Incident reporting, whistleblower system, audit trails
- 🛣️ **Road Cost Estimation** — Layer-by-layer cost calculator with material pricing
- 📈 **52+ Analytical Reports** — Exportable reports across all modules
- 🔔 **Real-Time Notifications** — WebSocket + Push notifications
- 📱 **PWA Support** — Installable, offline-capable mobile experience

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **PostgreSQL** | 15+ | [postgresql.org/download](https://www.postgresql.org/download/windows/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/AK47GT18/MCMS.git
cd MCMS

# 2. Install dependencies
npm install

# 3. Create environment file
copy .env.example .env
# ✏️ Edit .env — set your PostgreSQL password (see Environment Variables below)

# 4. Generate Prisma client
npx prisma generate

# 5. Push schema to database (creates all tables)
npx prisma db push

# 6. Seed demo data
npx prisma db seed

# 7. Start development server
npm run dev
```

> 🌐 Open **https://localhost:3000** in your browser
>
> ⚠️ You'll see an SSL warning — click **Advanced → Proceed to localhost** (self-signed cert, normal for dev)

---

## 🔐 Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
# ──────────────────────────────────────────────
# DATABASE
# ──────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/mcms?schema=public"

# ──────────────────────────────────────────────
# JWT AUTHENTICATION
# ──────────────────────────────────────────────
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRY="24h"

# ──────────────────────────────────────────────
# PASSWORD RESET
# ──────────────────────────────────────────────
PASSWORD_RESET_EXPIRY_MINUTES=10

# ──────────────────────────────────────────────
# SMTP EMAIL (Gmail Example)
# ──────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# ──────────────────────────────────────────────
# APP SETTINGS
# ──────────────────────────────────────────────
FRONTEND_URL="http://localhost:3000"
USE_HTTPS=true
OPEN_BROWSER=false
PORT=3000

# ──────────────────────────────────────────────
# VAPID KEYS (Push Notifications)
# ──────────────────────────────────────────────
VAPID_PUBLIC_KEY=BI1d_UCNCH1OVelzTnZoOt39dHD6Dk-zlADHULx1JBY8HQl07joAeX-HjbmDQfBY5Hq8yA5MS5qW0u4CNGAlIpc
VAPID_PRIVATE_KEY=wK1nmDRhZrz5ZkzTL-kL024i3GFfkw9LhQyTLb1_bRU
```

### 🔑 Key Breakdown

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string. Replace `YOUR_PASSWORD` with your PG password |
| `JWT_SECRET` | ✅ Yes | Secret key for signing auth tokens. Use a long random string in production |
| `JWT_EXPIRY` | No | Token expiration time (default: `24h`) |
| `PASSWORD_RESET_EXPIRY_MINUTES` | No | Password reset link validity (default: `10`) |
| `SMTP_HOST` | No | SMTP server for emails (default: `smtp.gmail.com`) |
| `SMTP_PORT` | No | SMTP port (default: `587`) |
| `SMTP_USERNAME` | No | Email address for sending notifications |
| `SMTP_PASSWORD` | No | Gmail App Password (**not** your login password — [generate here](https://myaccount.google.com/apppasswords)) |
| `FRONTEND_URL` | No | Base URL for email links (default: `http://localhost:3000`) |
| `USE_HTTPS` | No | Enable HTTPS with self-signed cert (default: `true`) |
| `OPEN_BROWSER` | No | Auto-open browser on start (default: `false`) |
| `PORT` | No | Server port (default: `3000`) |
| `VAPID_PUBLIC_KEY` | No | Web Push public key (pre-generated, can keep default) |
| `VAPID_PRIVATE_KEY` | No | Web Push private key (pre-generated, can keep default) |

> [!TIP]
> **Gmail App Password Setup:** Go to [Google App Passwords](https://myaccount.google.com/apppasswords) → Enable 2-Step Verification → Generate an App Password for "Mail" → Use that 16-character code as `SMTP_PASSWORD`.

---

## 🗄️ Database Setup

### Create the Database

```sql
-- Using psql CLI
psql -U postgres
CREATE DATABASE mcms;
\q
```

Or use **pgAdmin** → Right-click Databases → Create → Name: `mcms`

### Schema Management

```bash
# Generate Prisma Client (required after clone)
npx prisma generate

# Push schema to database (creates/syncs all tables)
npx prisma db push

# Create a formal migration (for production)
npx prisma migrate dev --name init

# Open visual database browser
npx prisma studio
```

### Seed Demo Data

```bash
npx prisma db seed
```

This populates the database with sample projects, users, contracts, tasks, and more.

---

## 👥 Default Accounts

After running `npx prisma db seed`, these accounts are available:

| Role | Email | Password |
|---|---|---|
| 🟦 Project Manager | `pm@mcms.dev` | `Password@1` |
| 🟩 Finance Director | `fd@mcms.dev` | `Password@1` |
| 🟧 Field Supervisor | `fs@mcms.dev` | `Password@1` |
| 🟪 Contract Administrator | `ca@mcms.dev` | `Password@1` |
| 🟫 Equipment Coordinator | `ec@mcms.dev` | `Password@1` |
| 🟥 Operations Manager | `om@mcms.dev` | `Password@1` |
| ⬛ Managing Director | `md@mcms.dev` | `Password@1` |
| 🟨 System Technician | `st@mcms.dev` | `Password@1` |

> [!IMPORTANT]
> Change the default password `Password@1` in production environments.

---

## 📁 Project Structure

```
MCMS/
├── server.js                  # Main entry point (HTTP/HTTPS + routing)
├── main.js                    # Frontend SPA controller
├── index.html                 # Landing page / SPA shell
├── style.css                  # Global styles
├── package.json               # Dependencies & scripts
├── .env.example               # Environment template
├── nodemon.json               # Dev server config
│
├── prisma/
│   ├── schema.prisma          # Database schema (30+ models)
│   ├── seed.js                # Main seeder
│   ├── seed-data.js           # Seed data definitions
│   ├── seed-resources.js      # Resource seed data
│   ├── seedFleet.js           # Fleet/vehicle seed data
│   └── migrations/            # Prisma migrations
│
├── src/
│   ├── config/                # App configuration (env, database, CORS)
│   ├── controllers/           # 31 API controllers
│   ├── services/              # Business logic layer
│   ├── routes/                # API route definitions
│   ├── middlewares/            # Auth, validation, security, error handling
│   ├── realtime/              # WebSocket server
│   ├── emails/                # Email service + templates
│   ├── pwa/                   # PWA manifest, sync, service worker
│   ├── jobs/                  # Cron jobs (project automation)
│   ├── strategies/            # Business strategies
│   └── utils/                 # Helpers (logger, response, etc.)
│
├── components/
│   ├── modules/               # Role-based dashboard modules
│   │   ├── pm/                # Project Manager components
│   │   ├── fd/                # Finance Director components
│   │   ├── fs/                # Field Supervisor components
│   │   ├── ca/                # Contract Admin components
│   │   └── ec/                # Equipment Coordinator components
│   ├── ui/                    # Shared UI components
│   ├── DrawerTemplates.js     # Sidebar navigation templates
│   └── RoleSwitcher.js        # Role-based view switching
│
├── scripts/
│   ├── ensure-db.js           # Auto-start PostgreSQL service
│   └── generate-cert.js       # Self-signed SSL certificate generator
│
├── public/                    # Static assets
│   └── uploads/               # User-uploaded files
│
└── tests/                     # Test suite
```

---

## 🌐 API Endpoints

All API routes are prefixed with `/api/v1/`

### 🔑 Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Login with email + password |
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset email |
| `POST` | `/api/v1/auth/reset-password` | Reset password with token |
| `GET` | `/api/v1/auth/me` | Get current user profile |

### 📊 Projects
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/projects` | List all projects |
| `GET` | `/api/v1/projects/:id` | Get project details |
| `POST` | `/api/v1/projects` | Create new project |
| `PUT` | `/api/v1/projects/:id` | Update project |

### 📝 Daily Logs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/daily-logs` | List logs (filterable) |
| `POST` | `/api/v1/daily-logs` | Submit new daily log |
| `PUT` | `/api/v1/daily-logs/:id/approve` | Approve/reject log |

### 💰 Finance
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/requisitions` | List requisitions |
| `POST` | `/api/v1/requisitions` | Create requisition |
| `PUT` | `/api/v1/requisitions/:id/review` | Approve/reject requisition |
| `GET` | `/api/v1/transactions` | List transactions |

### 📄 Contracts & Vendors
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/contracts` | List contracts |
| `POST` | `/api/v1/contracts` | Create contract |
| `GET` | `/api/v1/vendors` | List vendors |

### 🚜 Equipment & Fleet
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/assets` | List all assets |
| `POST` | `/api/v1/assets` | Register new asset |
| `GET` | `/api/v1/vehicle-rentals` | List rental contracts |
| `POST` | `/api/v1/vehicle-rentals` | Create rental contract |

### 🛡️ Safety & Compliance
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/safety-incidents` | List safety incidents |
| `POST` | `/api/v1/safety-incidents` | Report incident |
| `GET` | `/api/v1/whistleblower` | List whistleblower reports |
| `GET` | `/api/v1/audit-logs` | View audit trail |

### 📈 Reports & Notifications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/reports/:reportId` | Generate specific report |
| `GET` | `/api/v1/notifications` | Get user notifications |
| `GET` | `/api/v1/health` | Server health check |

> [!NOTE]
> Most endpoints require a valid JWT token in the `Authorization: Bearer <token>` header. Obtain a token via the login endpoint.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot-reload (nodemon + browser-sync) |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:migrate` | Create database migration |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio (GUI database browser) |
| `npm run test` | Run test suite |

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| ❌ Can't connect to database | Ensure PostgreSQL is running: `services.msc` → Start `postgresql-x64-XX` |
| ❌ `prisma: command not found` | Run `npm install` to install dependencies |
| ❌ Port 3000 already in use | `npx kill-port 3000` or change `PORT` in `.env` |
| ❌ JWT / auth errors | Check `JWT_SECRET` is set in `.env` |
| ❌ Emails not sending | Use a Gmail App Password, not your login password |
| ❌ SSL browser warning | Expected for dev — click Advanced → Proceed. Or set `USE_HTTPS=false` |
| ❌ Missing tables | Run `npx prisma db push` |
| ❌ Empty dashboards | Run `npx prisma db seed` |

---

<div align="center">

**Built with ❤️ for the construction industry**

[![GitHub](https://img.shields.io/badge/GitHub-AK47GT18-181717?style=for-the-badge&logo=github)](https://github.com/AK47GT18/MCMS)

</div>
