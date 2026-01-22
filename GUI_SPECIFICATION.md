# Section 8: Graphical User Interface Specification

## 8.0 Graphical User Interface
The Graphical User Interface (GUI) of the Mkaka Construction Management System (MCMS) is a role-centric, modular platform designed for real-time construction operations management. It utilizes a Responsive Web Design (RWD) approach, ensuring full functionality across desktop (for PMs, Finance) and mobile devices (for Field Supervisors).

## 8.1 Description of the User Interface
The UI follows a consistent layout with a side navigation menu, a breadcrumb-led header, and a dynamic content area. Interactive forms are presented through a sliding drawer component to maintain task context.

### 8.1.1 Screen Images (Textual Representations)

#### 1. Authentication Center
*   **Login Screen:** A clean, centralized card interface with Mkaka branding. It features fields for Email and Password, a "Forgot Password" link, and a prominent "Log In" button.
*   **Password Reset Screen:** A series of modals for initiating a reset via email and subsequently setting a new password with confirmation fields.

#### 2. Project Manager (PM) Workspace
*   **Portfolio Dashboard:** A high-level overview featuring aggregate stats (Budget Health, Pending Reviews) and a table of active projects with progress bars.
*   **Execution Schedule (Gantt):** A full-width interactive Gantt chart displaying task dependencies, milestones, and completion percentages.
*   **Report Center:** A filtered grid view of report cards (Project Status, Financial, Site Activity) with export options.
*   **Issue Resolution Center:** A tracking table for safety hazards and governance alerts (whistleblower reports).

#### 3. Finance Director (FM) Workspace
*   **Priority Action Dashboard:** Highlighted cards for Fraud Alerts and Pending Approvals, leading to investigation workflows.
*   **Reconciliation Center:** A dual-pane view comparing bank statement records against system ledger entries.
*   **Governance Ledger:** An immutable audit trail of all financial transactions with user and timestamp metadata.

#### 4. Equipment Coordinator (EQ) Workspace
*   **Asset Registry:** A master list of machinery showing current location, fuel levels, and utilization metrics.
*   **GPS Tracking Map:** An integrated Leaflet map showing the last known position of all geotagged equipment.
*   **Service Center:** A maintenance schedule tracking engine hours and upcoming service intervals.

#### 5. Contract Administrator (CM) Workspace
*   **Contract Repository:** A version-controlled storage area for all legal agreements and project variations.
*   **Compliance Dashboard:** A risk-focused view highlighting expiring insurance policies and performance bonds.
*   **Milestone Certification View:** A tabular list of project milestones requiring verification and certificate issuance.

#### 6. Field Supervisor (FS) Workspace
*   **Mobile Dashboard:** A vertically optimized view for site use, featuring large touch-friendly buttons for "Daily Log" and "Report Incident".
*   **Task List:** A simplified list of daily assignments with a completion slider.
*   **Site Equipment Log:** A verification screen for equipment arrival and usage tracking.

#### 7. System Technician (SA) Workspace
*   **Configuration Portal:** A tabular interface for managing global system variables (VAT, Currency, SMTP).
*   **User Registry:** A comprehensive management table for user accounts, roles, and security status.

### 8.1.2 Objects and Actions

| Form/Object Name | Controls and Fields | Display Trigger (Method) | Control Trigger (Method) |
| :--- | :--- | :--- | :--- |
| **Login Form** | Email (Input), Password (Input), Log In (Button) | `openModal('loginModal')` | `handleLogin()` |
| **Initialize New Project** | Project Name, Client, Budget, Start/End Date, Supervisor, Radius, Map Marker | `window.drawer.open('Initialize New Project', ...)` | `updateMapRadius()`, `createProjectRecord()` |
| **Daily Site Report** | Headcount, Work Description, Expense Amount, Category, Photo Upload | `window.drawer.open('Daily Site Report', ...)` | `syncSiteLog()`, `deductProjectWallet()` |
| **Budget Change Request** | Project Code, Category, New Amount, Justification | `window.drawer.open('Initiate Budget Change', ...)` | `logGovernanceAlert()`, `notifyFinance()` |
| **Assign Equipment** | Equipment ID (Select), Project (Select), Responsible Person, Return Date | `window.drawer.open('Assign Equipment', ...)` | `lockAssetToGeofence()`, `updateAssetStatus()` |
| **Upload Amendment** | Amendment Type, Change Description, Financial Impact, PDF Upload | `window.drawer.open('Upload Amendment', ...)` | `versionContract()`, `updateContractValue()` |
| **Fraud Investigation** | Investigation Notes, Confirm Fraud (Button), Clear Alert (Button) | `window.drawer.open('Investigation', ...)` | `freezeVendor()`, `resolveFraudAlert()` |
| **User Account Form** | Full Name, Role (Select), Email, Phone, Initial Password | `window.drawer.open('Add New User', ...)` | `createAccount()`, `sendWelcomeEmail()` |

## 8.2 Description of Reports

| Report Name | Purpose | Format/Layout |
| :--- | :--- | :--- |
| **Project Status Summary** | Evaluates timeline adherence and critical path risks. | PDF; RAG Status Gauges + Gantt Snapshot. |
| **Financial Expenditure** | Tracks real-time budget utilization vs. planned costs. | XLSX; Pivot-table ready line-item ledger. |
| **Site Activity Log** | Provides a permanent record of field progress and evidence. | PDF; Chronological feed with integrated photos and GPS. |
| **Asset Utilization** | Identifies idle vs. productive equipment hours. | CSV/Charts; Bar graphs by equipment category. |
| **Compliance Audit** | Tracks legal document history and regulatory breaches. | PDF; Tabular immutable trail with user IDs. |
| **Labor Productivity** | Analyzes man-hour efficiency per project phase. | PDF; Tabular data with productivity trend lines. |
| **Monthly Financials** | Executive summary of cash flow and P&L position. | PDF; Standard accounting balance sheet layout. |
