# Section 8: Graphical User Interface Specification

## 8.0 Graphical User Interface
The Graphical User Interface (GUI) of the Mkaka Construction Management System (MCMS) is a role-centric, modular platform designed for real-time construction operations management. It utilizes a Responsive Web Design (RWD) approach, ensuring full functionality across desktop (for PMs, Finance) and mobile devices (for Field Supervisors).

## 8.1 Description of the User Interface
The UI follows a consistent layout with a side navigation menu, a breadcrumb-led header, and a dynamic content area. Interactive forms are presented through a sliding drawer component to maintain task context.

### 8.1.1 Screen Images (Textual Representations)

#### 1. Authentication Center
*   **Login Screen:** A clean, centralized card interface with Mkaka branding. Features fields for Email, Password, and a "Log In" button.
*   **Password Reset:** Modals for email-based reset links and new password configuration.

#### 2. Project Manager (PM) Workspace
*   **Portfolio Dashboard:** Aggregate stats (Budget Health, Pending Reviews) and project progress tables.
*   **Gantt Execution View:** Interactive timeline for scheduling and dependency management.
*   **Review Center:** A list of submitted site logs and requisitions awaiting PM validation.

#### 3. Finance Director (FM) Workspace
*   **Action Dashboard:** Alerts for fraud, budget overruns, and high-value requisitions.
*   **Reconciliation:** Comparative view of bank statements vs. system records.
*   **Vendor Compliance:** Registry of approved suppliers and their tax/NCIC status.

#### 4. Equipment Coordinator (EQ) Workspace
*   **Fleet Dashboard:** Stats on utilization, fuel alerts, and maintenance due.
*   **GPS Map:** Live tracking of geotagged assets across all sites.

#### 5. Contract Administrator (CM) Workspace
*   **Document Repository:** Version-controlled storage for contracts and amendments.
*   **Compliance Tracker:** Monitoring for insurance expiries and performance bonds.

#### 6. Field Supervisor (FS) Workspace (Mobile-First)
*   **Site Portal:** Large-button interface for daily reporting, attendance, and safety.
*   **Live Task List:** Real-time assignments and progress update sliders.

---

### 8.1.2 Objects and Actions
This section identifies major screen objects, their controls, and the specific events or methods that manage them.

| Form Name | Controls and Fields | Display Method | Control Triggered Method(s) |
| :--- | :--- | :--- | :--- |
| **Login Form** | Email (Input), Password (Input), Login (Btn) | `openModal('loginModal')` | `handleLogin()`, `onTextChange()` |
| **Reset Password** | New Password, Confirm Password | `switchModal('resetModal')` | `updatePassword()`, `closeModal()` |
| **New Project Form** | Project Name, Client, Budget, Dates, Radius | `window.drawer.open('newProject')` | `createProject()`, `updateMapRadius()` |
| **Daily Progress Log** | Narrative, Expense Amount, Category, SOS | `window.drawer.open('dailyProgressLog')`| `handleDailyLogSubmit()`, `updateWallet()` |
| **Site Log Verification**| Verify/Reject buttons, Narrative review | `window.drawer.open('siteLogVerification')` | `confirmLog()`, `updateGantt()`, `rejectLog()` |
| **Safety Incident** | Incident Type, Site Area, Description, Photo | `window.drawer.open('safetyIncident')` | `logIncident()`, `triggerAlert()` |
| **Request New Vehicle** | Vehicle Name, Cost, Justification, Priority | `window.drawer.open('requestNewVehicle')` | `submitProcurementRequest()` |
| **Review Vehicle Req** | Review Comments, Recommend/Info buttons | `window.drawer.open('reviewVehicleRequest')` | `recommendToFinance()`, `requestInfo()` |
| **Approve Purchase** | GL Code, Final Cost, Approve (Btn) | `window.drawer.open('approveVehiclePurchase')` | `approvePO()`, `releaseFunds()` |
| **Requisition Review** | Item List, Valuation, Budget Check, Approve | `window.drawer.open('requisitionReview')` | `approveRequisition()`, `rejectRequisition()` |
| **Flag Regulatory Breach**| Breach Type, Impact, Confirm (Btn) | `window.drawer.open('flagBreach')` | `logBreach()`, `suspendPayments()` |
| **Certify Milestone** | Valuation, Inspection Checklist, Certificate | `window.drawer.open('certifyMilestone')` | `issueCertificate()`, `generateValuation()` |
| **Fraud Investigation** | Investigation Notes, Confirm/Clear buttons | `window.drawer.open('investigation')` | `freezeVendor()`, `clearFraudAlert()` |
| **User Management** | Full Name, Role, Email, Permission sets | `window.drawer.open('newUser')` | `createAccount()`, `forcePasswordReset()` |

---

### 8.1.3 Key System Workflows & Interconnections
The MCMS platform is built on an asynchronous event-driven architecture where field-level actions propagate through the management hierarchy:

1.  **Field-to-Project Workflow:** When a Field Supervisor (FS) submits a *Daily Progress Log*, the data is held for PM review. Once the PM uses the *Site Log Verification* drawer to confirm, the system automatically updates the project's Gantt Chart progress and deducts materials/costs from the project budget.
2.  **Procurement Hierarchy:** Equipment Coordinator (EQ) initiates a vehicle request via the *Request New Vehicle* drawer. The Project Manager (PM) receives an alert, reviews it via the *Review Vehicle Request* drawer, and adds a recommendation. Finally, the Finance Director (FM) uses the *Approve Purchase* drawer to release funds and generate a PO.
3.  **Compliance-Finance Link:** If a Contract Administrator (CM) identifies an expired insurance policy and uses the *Flag Breach* drawer, the system automatically places a "Compliance Hold" on that vendor in the Finance Dashboard, preventing the FM from accidentally approving new requisitions for that vendor until rectified.
4.  **Integrity Workflow:** Reports filed through the *Whistleblower Portal* are routed to the *Issue Resolution Center*. The PM handles the narrative, but all resolution actions are logged in the FM's *Immutable Audit Trail* for oversight.

---

## 8.2 Description of Reports

| Report Name | Purpose | Format/Layout |
| :--- | :--- | :--- |
| **Project Status Summary** | Evaluates timeline adherence and critical path risks. | PDF; RAG Status Gauges + Gantt Snapshot. |
| **Financial Expenditure** | Tracks real-time budget utilization vs. planned costs. | XLSX; Pivot-table ready line-item ledger. |
| **Site Activity Log** | Permanent record of field progress and evidence. | PDF; Feed with integrated photos and GPS. |
| **Asset Utilization** | Identifies idle vs. productive equipment hours. | CSV/Charts; Bar graphs by equipment category. |
| **Compliance Audit** | Tracks legal document history and regulatory breaches. | PDF; Tabular immutable trail with actor IDs. |
| **Labor Productivity** | Analyzes man-hour efficiency per project phase. | PDF; Tabular data with productivity trend lines. |
| **Monthly Financials** | Executive summary of cash flow and P&L position. | PDF; Standard balance sheet layout. |
