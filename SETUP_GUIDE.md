# MCMS Installation & Setup Guide

This guide provides everything you need to set up and run the MCMS (Construction Management System) on a new machine.

## 1. Prerequisites

Ensure the following software is installed on the target machine:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL**: Version 14.x or higher ([Download](https://www.postgresql.org/download/))
- **Git**: For cloning the repository.
- **Browser**: Chrome, Edge, or Firefox.

## 2. Initial Setup

1.  **Clone the Repository**

    ```bash
    git clone <repository-url>
    cd MCMS
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Environment Configuration**
    - Create a `.env` file in the root directory.
    - Copy the contents of `.env.example` into `.env`.
    - Update the `DATABASE_URL` with your PostgreSQL credentials.
    - Update the `SMTP` settings if you want to enable email notifications.

## 3. Database Setup

1.  **Create the Database** (Manually or via Prisma)
    - Open your PostgreSQL client (e.g., pgAdmin or `psql`).
    - Create a database named `mcms`.

2.  **Sync the Schema**

    ```bash
    # This will create the tables and generate the Prisma Client
    npx prisma db push
    ```

3.  **Seed the Data** (Optional but recommended for roles and initial projects)
    ```bash
    npm run db:seed
    ```

## 4. Running the Application

- **Development Mode**:

  ```bash
  npm run dev
  ```

  _This runs the backend server and a proxy for the frontend files._

- **Access the App**:
  - Backend API: `http://localhost:3000/api/v1`
  - Frontend Interface: `http://localhost:3001` (via Browser-sync)

## 5. Troubleshooting Common Issues

### "EPERM: operation not permitted" (Prisma Sync)

If you encounter this error while running `npx prisma db push`, it means the Prisma engine is locked by the running server.
**Solution**: Stop the `npm run dev` process (Ctrl+C), run the prisma command, then restart the server.

### "PrismaClientInitializationError: Can't reach database"

Ensure PostgreSQL is running. On Windows, you can check the service status:

```powershell
Get-Service postgresql*
```

If stopped, start it with: `Start-Service <service-name>` (requires Admin).

## 6. Project Structure Overview

- `/src`: Backend logic (controllers, services, routes).
- `/components`: Frontend JavaScript modules.
- `/prisma`: Database schema and seed scripts.
- `/public/uploads`: Directory where document uploads are stored (Auto-created if missing).
- `server.js`: Main entry point.
- `index.html`: Main frontend file.
