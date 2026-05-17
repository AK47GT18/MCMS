# Section 8: Graphical User Interface Specification

## 8.0 Graphical User Interface
The Graphical User Interface (GUI) of the Mkaka Construction Management System (MCMS) is a modular, role-based platform designed to digitize and optimize construction operations. The system prioritizes usability, providing high-fidelity dashboards and specialized modal components (Drawers) for data entry and approval workflows.

## 8.1 Description of the User Interface
The MCMS interface utilizes a three-tier layout: a sticky navigation sidebar for role-specific modules, a header containing breadcrumbs and user profile actions, and a primary content area for data visualization (Gantt charts, tables, maps). Modals and sliding Drawers are used extensively to maintain contextual focus during complex operations like transaction entry or project initialization.

### 8.1.1 Screen Images (Textual Representations)

#### 1. Authentication & Profile
*   **Login Screen:** Centralized login card. Fields: `Email Address`, `Password`. Actions: `Forgot Password` link, `Log In` button.
*   **Reset Password Screen:** Modal triggered by reset link. Fields: `New Password`, `Confirm Password`. Actions: `Update Password`.
*   **Forgot Password Modal:** Fields: `Email Address`. Actions: `Send Reset Link`, `Back to Login`.
*   **User Profile Drawer:** Fields: `Full Name`, `Email`, `Profile Photo`. Actions: `Edit Profile`, `Change Password`, `Sign Out`.

#### 2. Project Manager (PM) Workspace
*   **Main Dashboard:** Summary tiles for `Budget Held`, `Pending Reviews`, `Schedule Variances`, `Incidents`.
*   **Execution Schedule:** Full-screen Gantt chart with real-time progress tracking and dependency lines.
*   **Financial Control:** Transaction ledger view showing `Reference`, `Category`, `Vendor`, `Amount`, `Status`.
*   **Report Center:** Grid of report types: `Project Summary`, `Financial Expenditure`, `Site Activity Log`, `Procurement Tracker`. Filters: `Category`, `Period`, `Project`.
*   **Issue Resolution Center:** Detail view for identifying whistleblowers or site trouble, with data forwarding capabilities.

#### 3. Finance Director (FM) Workspace
*   **FM Dashboard:** High-level overview of `Alerts`, `Pending Approvals`, `Contract Details`, `Budget Overruns`.
*   **Reconciliation Center:** Bank statement import and matching view for `DEP`, `SVC`, and `CHQ` references.
*   **Requisition Queue:** Tabular list with `Reference ID`, `Project`, `Vendor`, `Amount`, `Project Approval Status`.

#### 4. Equipment Coordinator (EQ) Workspace
*   **Fleet Registry:** Master list of assets with `ID`, `Model`, `Serial Number`, `Engine Hours`.
*   **GPS Tracking Map:** Live Leaflet-based map showing assets with `Timestamp`, `Actual Location`, `User`, `Fuel Levels`.
*   **Repair Cost Center:** Cumulative cost overview for equipment repairs with `Export CSV` functionality.

#### 5. Contract Administrator (CM) Workspace
*   **Contract Repository:** Storage for `Reference ID`, `Contract Title`, `Vendor`, `Start Date`, `Completion Value`.
*   **Milestones & Tracking:** List showing `Due Date`, `Reference`, `Project`, `Milestone`, `Value`, `Status`, `Certify` button.
*   **Insurance & Bonds:** Compliance monitor for performance bonds and insurance expiries (45-day warnings).

#### 6. Field Supervisor (FS) Workspace
*   **FS Portal (Mobile):** Touch-optimized dashboard with buttons for `Daily Reports`, `Tasks`, `Equipment`, `Safety`.
*   **Execution Schedule:** Mobile-friendly Gantt view.
*   **Daily Tasks:** Simplified list of assigned site tasks with update buttons.

#### 7. Operations Manager (OM) Workspace
*   **Operations Hub:** Metrics on `Labor Efficiency`, `Material Usage`, `Active Fleets`, and `Safety Score`.
*   **Site Performance:** Table comparing `Site ID`, `Daily Output`, `Supervisor`, and `Status`.

#### 8. Managing Director (MD) Workspace
*   **Executive View:** Strategic cards for `Net Margin`, `Cash Flow`, `Critical Risks`, and `Portfolio Value`.
*   **Profit & Loss:** Detailed P&L statement with `Actual vs. Budget` variance analysis.

---

### 8.1.2 Objects and Actions

| Form/Drawer Name | Controls and Fields | Display Trigger (Method) | Control Triggered Method(s) |
| :--- | :--- | :--- | :--- |
| **Login Form** | Email, Password | `onApplicationStart()` | `handleLogin()`, `openModal('forgotModal')` |
| **Initialize New Project** | Project Name, Client, Budget, Start/End Date, Supervisor, Radius, Map Seat | `window.drawer.open('Initialize New Project')` | `createProject()`, `validateLocation()`, `updateMapRadius()` |
| **Add Task (Gantt)** | Task Name, Start Date, Duration, Assigned, Dependencies | `window.drawer.open('Add Task')` | `saveTask()`, `updateGanttChart()` |
| **Daily Progress Log** | Workforce Headcount, Work Completed Today, Expense Category, Amount, Details, SOS Check, Photo | `window.drawer.open('dailyProgressLog')` | `handleDailyLogSubmit()`, `triggerSOSAlert()`, `updateWallet()` |
| **Verify Daily Log** | Supervisor, Timestamp, Evidence Photo, Narrative, Resource Consumption, Attendance | `window.drawer.open('siteLogVerification')` | `confirmLog()`, `rejectLog()`, `updateGanttProgress()` |
| **Transaction Entry** | Transaction Type (Radio), Amount, Project (Select), Budget Line, Description, Receipt Upload | `window.drawer.open('transactionEntry')` | `processTransaction()`, `logLedgerEntry()` |
| **Initiate Budget Change** | Project Code, Category, Current vs Proposed Amount, Justification | `window.drawer.open('initiateBCR')` | `submitBudgetRequest()`, `notifyFinanceDirector()` |
| **Requisition Review** | Submitted By, Project, Vendor, Total Amount, Line Items (Item, Qty, Unit Price, Total), Budget Check | `window.drawer.open('requisitionReview')` | `approveRequisition()`, `rejectRequisition()` |
| **Fraud Investigation** | Case ID, Suspicious Pattern, Notes | `window.drawer.open('investigation')` | `confirmFraud()`, `freezeVendor()`, `clearAlert()` |
| **Request New Vehicle** | Vehicle Name/Model, Estimated Cost, Justification, Priority | `window.drawer.open('requestNewVehicle')` | `submitProcurementRequest()`, `notifyPM()` |
| **Review Vehicle Req** | EQ Justification, PM Review Comments | `window.drawer.open('reviewVehicleRequest')` | `recommendToFinance()`, `requestClarification()` |
| **Assign Equipment** | Equipment ID/Name, Assign To Project, Responsible Person, Expected Return, Instructions, GPS | `window.drawer.open('assignEquipment')` | `processHandover()`, `lockGPSGeofence()` |
| **New Contract Form** | Project, Vendor, Contract Type, Value (Locked), Start Date, Document Upload | `window.drawer.open('newContract')` | `createRecord()`, `linkToBudget()` |
| **Upload Amendment** | Amendment Type, Change Description, Financial Impact, PDF Document | `window.drawer.open('uploadAmendment')` | `saveNewVersion()`, `auditLogChange()` |
| **Policy Details** | Bond Type, Coverage Limit, Expiry Date, Provider Details | `window.drawer.open('viewPolicy')` | `downloadCertificate()`, `triggerRenewalRequest()` |
| **Regulator Breach** | Authority, Apex Workers Comp, Breach Type, Impact, suspended Pymt Cert, Notify Auth | `window.drawer.open('flagBreach')` | `confirmBreach()`, `notifyLegal()`, `freezeVendor()` |
| **Report Safety Incident**| Incident Type, Site Area, Person Involved, Narrative Description, Photos | `window.drawer.open('safetyIncident')` | `logIncident()`, `triggerSMSAlert()` |
| **Certify Milestone** | Valuation Amount, Site Inspection Check, Quality Test Check, Attachment | `window.drawer.open('certifyMilestone')` | `issueCertificate()`, `generatePaymentTrigger()` |
| **Shift Plan Form** | Site, Shift Date, Resource Demand (General, Carpenters, Steel Fixers) | `window.drawer.open('shiftPlan')` | `publishPlan()`, `broadcastToSite()` |
| **User Management** | Full Name, Role, Email, Phone, Initial Password, Permissions | `window.drawer.open('newUser')` | `createAccount()`, `sendWelcomeEmail()` |

---

### 8.1.3 Key System Workflows & Interconnections
The MCMS platform coordinates multiple roles through a unified event-driven pipeline:

1.  **Field-to-Chart Pipeline:** A Field Supervisor (FS) logs work progress. This triggers a "Pending Review" status for the Project Manager (PM). Once the PM verifies the log (confirming resource consumption and narrative accuracy), the system automatically updates the Gantt Chart and calculates the budget burn rate.
2.  **Procurement Chain of Command:** An Equipment Coordinator (EQ) identifies a vehicle need. They submit a request that flows to the PM for operational vetting. Upon PM recommendation, the request appears in the Finance Director's (FM) dashboard for fund release and PO generation.
3.  **Compliance Lockdown:** If a Contract Administrator (CM) flags a regulatory breach or insurance expiry, the system places a "Compliance Hold" on the associated vendor. This hold is globally visible to the FM and PM, preventing further financial transactions or site assignments for that vendor.
4.  **Executive Transparency:** The Managing Director (MD) has read-access to the FM's *Immutable Audit Trail* and the PM's *Project Health* metrics. Strategic decisions (Growth, Technology) are driven by automated aggregations of field data and financial variances.

---

## 8.2 Description of Reports

| Report Name | Purpose | Format/Layout |
| :--- | :--- | :--- |
| **Project Status Summary** | Timeline adherence and milestone tracking. | PDF; RAG Status Gauges + Gantt Snapshot. |
| **Financial Expenditure** | Budget consumption by category and labor. | XLSX; Pivot-table ready line-item ledger. |
| **Site Activity Log** | Daily record of progress, attendance, and GPS. | PDF; Chronological feed with evidence photos. |
| **Procurement Tracker** | Material requisition and supplier performance. | CSV/PDF; Tabular status of all POs. |
| **Asset Utilization** | Equipment engine hours and fuel efficiency. | Charts; Bar graphs by equipment category. |
| **Repair Cost Summary** | Cumulative maintenance OpEx for fleet. | CSV; Itemized repair log with vendor costs. |
| **Compliance Audit** | History of amendments, bonds, and breaches. | PDF; Tabular audit trail with actor IDs. |
| **Labor Productivity** | Man-hour efficiency per project phase. | PDF; Productivity trend lines and site metrics. |
| **Profit & Loss (MD)** | Financial health summary for executive review. | PDF; Standard comparative accounting layout. |
| **Risk Heatmap** | Strategic enterprise risk assessment. | PDF; 3x3 Impact/Probability matrix. |
