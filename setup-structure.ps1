# Mkaka Construction Management System - PowerShell Setup Script (Hybrid Modal/Page Architecture)
# This script creates a production-ready, scalable, and secure file structure
# Author: Anthony Kanjira (CEN/01/01/22)
# Supervisor: Mr. John Kaira

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Mkaka Construction Management System" -ForegroundColor Cyan
Write-Host "Modern Hybrid Architecture (Modals + Pages)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Create root project directory
$PROJECT_ROOT = "mkaka-construction-system"
New-Item -ItemType Directory -Force -Path $PROJECT_ROOT | Out-Null
Set-Location $PROJECT_ROOT

Write-Host "Creating modern hybrid directory structure..." -ForegroundColor Yellow

# Function to create directories
function New-Directory {
    param([string]$Path)
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
}

# Function to create files
function New-FileItem {
    param([string]$Path)
    New-Item -ItemType File -Force -Path $Path | Out-Null
}

# ============================================
# ROOT LEVEL CONFIGURATION FILES
# ============================================
New-FileItem ".gitignore"
New-FileItem ".env.example"
New-FileItem ".env"
New-FileItem "README.md"
New-FileItem "docker-compose.yml"
New-FileItem "Dockerfile"

# ============================================
# DOCKER CONFIGURATION
# ============================================
New-Directory "docker/nginx"
New-Directory "docker/php"
New-Directory "docker/mysql"
New-FileItem "docker/nginx/nginx.conf"
New-FileItem "docker/nginx/default.conf"
New-FileItem "docker/php/Dockerfile"
New-FileItem "docker/php/php.ini"
New-FileItem "docker/mysql/init.sql"
New-FileItem "docker/mysql/my.cnf"

# ============================================
# PUBLIC DIRECTORY (Web Root)
# ============================================
New-Directory "public/css/base"
New-Directory "public/css/components"
New-Directory "public/css/layouts"
New-Directory "public/css/modules"
New-Directory "public/css/utilities"
New-Directory "public/js/core"
New-Directory "public/js/modules"
New-Directory "public/js/components"
New-Directory "public/js/utils"
New-Directory "public/js/services"
New-Directory "public/images/icons/pwa"
New-Directory "public/images/icons/favicon"
New-Directory "public/images/logos"
New-Directory "public/images/avatars"
New-Directory "public/images/equipment"
New-Directory "public/images/projects"
New-Directory "public/uploads/temp"
New-Directory "public/uploads/documents"
New-Directory "public/uploads/photos/projects"
New-Directory "public/uploads/photos/equipment"
New-Directory "public/uploads/photos/incidents"
New-Directory "public/uploads/contracts"
New-Directory "public/uploads/reports"
New-Directory "public/fonts"

# CSS Files - Modular Architecture
New-FileItem "public/css/base/reset.css"
New-FileItem "public/css/base/typography.css"
New-FileItem "public/css/base/variables.css"
New-FileItem "public/css/components/buttons.css"
New-FileItem "public/css/components/cards.css"
New-FileItem "public/css/components/forms.css"
New-FileItem "public/css/components/modals.css"
New-FileItem "public/css/components/tables.css"
New-FileItem "public/css/components/alerts.css"
New-FileItem "public/css/components/dropdowns.css"
New-FileItem "public/css/components/tooltips.css"
New-FileItem "public/css/layouts/header.css"
New-FileItem "public/css/layouts/footer.css"
New-FileItem "public/css/layouts/sidebar.css"
New-FileItem "public/css/layouts/grid.css"
New-FileItem "public/css/modules/dashboard.css"
New-FileItem "public/css/modules/projects.css"
New-FileItem "public/css/modules/finance.css"
New-FileItem "public/css/modules/equipment.css"
New-FileItem "public/css/modules/contracts.css"
New-FileItem "public/css/utilities/helpers.css"
New-FileItem "public/css/utilities/animations.css"
New-FileItem "public/css/utilities/responsive.css"
New-FileItem "public/css/main.css"

# JavaScript Files - Enhanced for Modal/AJAX Architecture
New-FileItem "public/js/core/app.js"
New-FileItem "public/js/core/router.js"
New-FileItem "public/js/core/auth.js"
New-FileItem "public/js/core/config.js"
New-FileItem "public/js/core/modal-manager.js"
New-FileItem "public/js/core/ajax-handler.js"
New-FileItem "public/js/modules/dashboard.js"
New-FileItem "public/js/modules/projects.js"
New-FileItem "public/js/modules/finance.js"
New-FileItem "public/js/modules/equipment.js"
New-FileItem "public/js/modules/contracts.js"
New-FileItem "public/js/modules/reports.js"
New-FileItem "public/js/components/gantt.js"
New-FileItem "public/js/components/calendar.js"
New-FileItem "public/js/components/charts.js"
New-FileItem "public/js/components/map.js"
New-FileItem "public/js/components/notifications.js"
New-FileItem "public/js/components/modals.js"
New-FileItem "public/js/components/data-tables.js"
New-FileItem "public/js/utils/validation.js"
New-FileItem "public/js/utils/formatter.js"
New-FileItem "public/js/utils/helpers.js"
New-FileItem "public/js/utils/storage.js"
New-FileItem "public/js/services/api.js"
New-FileItem "public/js/services/gps.js"
New-FileItem "public/js/services/offline.js"
New-FileItem "public/js/services/sync.js"
New-FileItem "public/js/main.js"

# PWA Files
New-FileItem "public/manifest.json"
New-FileItem "public/service-worker.js"
New-FileItem "public/offline.html"

# Entry point
New-FileItem "public/index.php"

# Security files
New-FileItem "public/uploads/.htaccess"

# ============================================
# APPLICATION SOURCE CODE
# ============================================
New-Directory "src/config"
New-FileItem "src/config/database.php"
New-FileItem "src/config/app.php"
New-FileItem "src/config/security.php"
New-FileItem "src/config/email.php"
New-FileItem "src/config/constants.php"

# Core System Classes
New-Directory "src/core"
New-FileItem "src/core/Database.php"
New-FileItem "src/core/Model.php"
New-FileItem "src/core/Controller.php"
New-FileItem "src/core/Router.php"
New-FileItem "src/core/Request.php"
New-FileItem "src/core/Response.php"
New-FileItem "src/core/Session.php"
New-FileItem "src/core/Validator.php"
New-FileItem "src/core/Authentication.php"
New-FileItem "src/core/Authorization.php"

# Models
New-Directory "src/models"
New-FileItem "src/models/User.php"
New-FileItem "src/models/Project.php"
New-FileItem "src/models/Task.php"
New-FileItem "src/models/Transaction.php"
New-FileItem "src/models/Contract.php"
New-FileItem "src/models/Equipment.php"
New-FileItem "src/models/SiteReport.php"
New-FileItem "src/models/Document.php"
New-FileItem "src/models/AuditLog.php"
New-FileItem "src/models/Notification.php"
New-FileItem "src/models/Approval.php"
New-FileItem "src/models/Budget.php"
New-FileItem "src/models/Maintenance.php"

# Controllers - Separated by responsibility
New-Directory "src/controllers"
New-FileItem "src/controllers/AuthController.php"
New-FileItem "src/controllers/DashboardController.php"
New-FileItem "src/controllers/ProjectController.php"
New-FileItem "src/controllers/FinanceController.php"
New-FileItem "src/controllers/ContractController.php"
New-FileItem "src/controllers/EquipmentController.php"
New-FileItem "src/controllers/ReportController.php"
New-FileItem "src/controllers/UserController.php"
New-FileItem "src/controllers/DocumentController.php"
New-FileItem "src/controllers/NotificationController.php"

# Middleware
New-Directory "src/middleware"
New-FileItem "src/middleware/AuthMiddleware.php"
New-FileItem "src/middleware/RoleMiddleware.php"
New-FileItem "src/middleware/CsrfMiddleware.php"
New-FileItem "src/middleware/RateLimitMiddleware.php"
New-FileItem "src/middleware/LogMiddleware.php"
New-FileItem "src/middleware/CorsMiddleware.php"
New-FileItem "src/middleware/AjaxMiddleware.php"

# Services
New-Directory "src/services"
New-FileItem "src/services/AuthService.php"
New-FileItem "src/services/ProjectService.php"
New-FileItem "src/services/FinanceService.php"
New-FileItem "src/services/ContractService.php"
New-FileItem "src/services/EquipmentService.php"
New-FileItem "src/services/ReportService.php"
New-FileItem "src/services/NotificationService.php"
New-FileItem "src/services/EmailService.php"
New-FileItem "src/services/GpsService.php"
New-FileItem "src/services/FileService.php"
New-FileItem "src/services/ApprovalService.php"
New-FileItem "src/services/AuditService.php"

# Repositories
New-Directory "src/repositories"
New-FileItem "src/repositories/UserRepository.php"
New-FileItem "src/repositories/ProjectRepository.php"
New-FileItem "src/repositories/TransactionRepository.php"
New-FileItem "src/repositories/ContractRepository.php"
New-FileItem "src/repositories/EquipmentRepository.php"
New-FileItem "src/repositories/ReportRepository.php"
New-FileItem "src/repositories/DocumentRepository.php"
New-FileItem "src/repositories/AuditRepository.php"

# Utilities
New-Directory "src/utils"
New-FileItem "src/utils/Logger.php"
New-FileItem "src/utils/FileUploader.php"
New-FileItem "src/utils/ImageProcessor.php"
New-FileItem "src/utils/PdfGenerator.php"
New-FileItem "src/utils/ExcelExporter.php"
New-FileItem "src/utils/GpsExtractor.php"
New-FileItem "src/utils/Sanitizer.php"
New-FileItem "src/utils/Encryptor.php"
New-FileItem "src/utils/DateHelper.php"

# Exceptions
New-Directory "src/exceptions"
New-FileItem "src/exceptions/ValidationException.php"
New-FileItem "src/exceptions/AuthenticationException.php"
New-FileItem "src/exceptions/AuthorizationException.php"
New-FileItem "src/exceptions/NotFoundException.php"
New-FileItem "src/exceptions/DatabaseException.php"

# ============================================
# VIEWS - HYBRID MODAL/PAGE ARCHITECTURE
# ============================================
New-Directory "views/layouts"
New-Directory "views/partials"
New-Directory "views/partials/modals"
New-Directory "views/pages/auth"
New-Directory "views/pages/dashboard"
New-Directory "views/pages/projects"
New-Directory "views/pages/finance"
New-Directory "views/pages/contracts"
New-Directory "views/pages/equipment"
New-Directory "views/pages/reports"
New-Directory "views/pages/users"
New-Directory "views/pages/settings"
New-Directory "views/modals/projects"
New-Directory "views/modals/finance"
New-Directory "views/modals/contracts"
New-Directory "views/modals/equipment"
New-Directory "views/modals/reports"
New-Directory "views/modals/shared"
New-Directory "views/emails"

# Layouts
New-FileItem "views/layouts/main.php"
New-FileItem "views/layouts/auth.php"
New-FileItem "views/layouts/print.php"
New-FileItem "views/layouts/modal.php"

# Partials
New-FileItem "views/partials/header.php"
New-FileItem "views/partials/footer.php"
New-FileItem "views/partials/sidebar.php"
New-FileItem "views/partials/navbar.php"
New-FileItem "views/partials/breadcrumb.php"
New-FileItem "views/partials/alerts.php"
New-FileItem "views/partials/pagination.php"

# Partial Modals (Container structures)
New-FileItem "views/partials/modals/base-modal.php"
New-FileItem "views/partials/modals/confirm-modal.php"
New-FileItem "views/partials/modals/loading-modal.php"

# Auth Pages
New-FileItem "views/pages/auth/login.php"
New-FileItem "views/pages/auth/forgot-password.php"
New-FileItem "views/pages/auth/reset-password.php"
New-FileItem "views/pages/auth/change-password.php"

# Dashboard Pages
New-FileItem "views/pages/dashboard/index.php"
New-FileItem "views/pages/dashboard/widgets.php"

# PROJECT PAGES (Complex - Full Pages)
New-FileItem "views/pages/projects/list.php"
New-FileItem "views/pages/projects/create.php"
New-FileItem "views/pages/projects/edit.php"
New-FileItem "views/pages/projects/view-full.php"
New-FileItem "views/pages/projects/gantt.php"
New-FileItem "views/pages/projects/tasks.php"

# PROJECT MODALS (Quick Actions)
New-FileItem "views/modals/projects/quick-view.php"
New-FileItem "views/modals/projects/status-update.php"
New-FileItem "views/modals/projects/assign-team.php"
New-FileItem "views/modals/projects/add-task.php"
New-FileItem "views/modals/projects/task-complete.php"

# FINANCE PAGES (Complex - Full Pages)
New-FileItem "views/pages/finance/list.php"
New-FileItem "views/pages/finance/create-transaction.php"
New-FileItem "views/pages/finance/edit-transaction.php"
New-FileItem "views/pages/finance/budgets.php"
New-FileItem "views/pages/finance/reports.php"

# FINANCE MODALS (Quick Actions)
New-FileItem "views/modals/finance/transaction-details.php"
New-FileItem "views/modals/finance/approve-transaction.php"
New-FileItem "views/modals/finance/reject-transaction.php"
New-FileItem "views/modals/finance/budget-alert.php"
New-FileItem "views/modals/finance/quick-filter.php"

# CONTRACT PAGES (Complex - Full Pages)
New-FileItem "views/pages/contracts/list.php"
New-FileItem "views/pages/contracts/create.php"
New-FileItem "views/pages/contracts/edit.php"
New-FileItem "views/pages/contracts/view-full.php"
New-FileItem "views/pages/contracts/documents.php"

# CONTRACT MODALS (Quick Actions)
New-FileItem "views/modals/contracts/quick-view.php"
New-FileItem "views/modals/contracts/milestone-details.php"
New-FileItem "views/modals/contracts/upload-document.php"
New-FileItem "views/modals/contracts/version-history.php"

# EQUIPMENT PAGES (Complex - Full Pages)
New-FileItem "views/pages/equipment/list.php"
New-FileItem "views/pages/equipment/register.php"
New-FileItem "views/pages/equipment/edit.php"
New-FileItem "views/pages/equipment/view-full.php"
New-FileItem "views/pages/equipment/maintenance-schedule.php"
New-FileItem "views/pages/equipment/utilization-report.php"

# EQUIPMENT MODALS (Quick Actions)
New-FileItem "views/modals/equipment/quick-view.php"
New-FileItem "views/modals/equipment/checkin.php"
New-FileItem "views/modals/equipment/checkout.php"
New-FileItem "views/modals/equipment/status-update.php"
New-FileItem "views/modals/equipment/location-map.php"

# REPORT PAGES (Complex - Full Pages)
New-FileItem "views/pages/reports/list.php"
New-FileItem "views/pages/reports/create-site-report.php"
New-FileItem "views/pages/reports/view-full.php"
New-FileItem "views/pages/reports/project-status.php"
New-FileItem "views/pages/reports/financial.php"
New-FileItem "views/pages/reports/equipment-utilization.php"

# REPORT MODALS (Quick Actions)
New-FileItem "views/modals/reports/quick-view.php"
New-FileItem "views/modals/reports/photo-viewer.php"
New-FileItem "views/modals/reports/gps-validation.php"

# USER PAGES (Full Pages)
New-FileItem "views/pages/users/list.php"
New-FileItem "views/pages/users/create.php"
New-FileItem "views/pages/users/edit.php"
New-FileItem "views/pages/users/profile.php"

# SETTINGS PAGES (Full Pages)
New-FileItem "views/pages/settings/index.php"
New-FileItem "views/pages/settings/system.php"
New-FileItem "views/pages/settings/notifications.php"

# SHARED MODALS (Reusable across modules)
New-FileItem "views/modals/shared/delete-confirm.php"
New-FileItem "views/modals/shared/success-message.php"
New-FileItem "views/modals/shared/error-message.php"
New-FileItem "views/modals/shared/loading-spinner.php"
New-FileItem "views/modals/shared/image-preview.php"

# Email Templates
New-FileItem "views/emails/approval-request.php"
New-FileItem "views/emails/approval-approved.php"
New-FileItem "views/emails/approval-rejected.php"
New-FileItem "views/emails/deadline-reminder.php"
New-FileItem "views/emails/budget-alert.php"
New-FileItem "views/emails/welcome.php"
New-FileItem "views/emails/password-reset.php"

# ============================================
# API ENDPOINTS - Enhanced for Modal Support
# ============================================
New-Directory "api/v1/auth"
New-Directory "api/v1/projects"
New-Directory "api/v1/finance"
New-Directory "api/v1/contracts"
New-Directory "api/v1/equipment"
New-Directory "api/v1/reports"
New-Directory "api/v1/users"
New-Directory "api/v1/notifications"
New-Directory "api/v1/modal-data"

# Auth endpoints
New-FileItem "api/v1/auth/login.php"
New-FileItem "api/v1/auth/logout.php"
New-FileItem "api/v1/auth/refresh.php"
New-FileItem "api/v1/auth/verify.php"

# Project endpoints
New-FileItem "api/v1/projects/index.php"
New-FileItem "api/v1/projects/create.php"
New-FileItem "api/v1/projects/update.php"
New-FileItem "api/v1/projects/delete.php"
New-FileItem "api/v1/projects/tasks.php"
New-FileItem "api/v1/projects/progress.php"
New-FileItem "api/v1/projects/update-status.php"

# Finance endpoints
New-FileItem "api/v1/finance/transactions.php"
New-FileItem "api/v1/finance/create.php"
New-FileItem "api/v1/finance/approve.php"
New-FileItem "api/v1/finance/reject.php"
New-FileItem "api/v1/finance/budgets.php"

# Contract endpoints
New-FileItem "api/v1/contracts/index.php"
New-FileItem "api/v1/contracts/create.php"
New-FileItem "api/v1/contracts/update.php"
New-FileItem "api/v1/contracts/documents.php"
New-FileItem "api/v1/contracts/milestones.php"

# Equipment endpoints
New-FileItem "api/v1/equipment/index.php"
New-FileItem "api/v1/equipment/create.php"
New-FileItem "api/v1/equipment/checkin.php"
New-FileItem "api/v1/equipment/checkout.php"
New-FileItem "api/v1/equipment/maintenance.php"
New-FileItem "api/v1/equipment/update-status.php"

# Report endpoints
New-FileItem "api/v1/reports/site-reports.php"
New-FileItem "api/v1/reports/create.php"
New-FileItem "api/v1/reports/gps-validate.php"
New-FileItem "api/v1/reports/upload-photo.php"

# User endpoints
New-FileItem "api/v1/users/index.php"
New-FileItem "api/v1/users/create.php"
New-FileItem "api/v1/users/update.php"
New-FileItem "api/v1/users/profile.php"

# Notification endpoints
New-FileItem "api/v1/notifications/index.php"
New-FileItem "api/v1/notifications/mark-read.php"
New-FileItem "api/v1/notifications/subscribe.php"

# MODAL DATA ENDPOINTS (For AJAX modal loading)
New-FileItem "api/v1/modal-data/project-details.php"
New-FileItem "api/v1/modal-data/transaction-details.php"
New-FileItem "api/v1/modal-data/equipment-status.php"
New-FileItem "api/v1/modal-data/contract-milestone.php"
New-FileItem "api/v1/modal-data/report-preview.php"

# ============================================
# DATABASE
# ============================================
New-Directory "database/migrations"
New-Directory "database/seeds"
New-Directory "database/schema"

# Migrations
New-FileItem "database/migrations/001_create_users_table.sql"
New-FileItem "database/migrations/002_create_projects_table.sql"
New-FileItem "database/migrations/003_create_tasks_table.sql"
New-FileItem "database/migrations/004_create_transactions_table.sql"
New-FileItem "database/migrations/005_create_contracts_table.sql"
New-FileItem "database/migrations/006_create_equipment_table.sql"
New-FileItem "database/migrations/007_create_site_reports_table.sql"
New-FileItem "database/migrations/008_create_documents_table.sql"
New-FileItem "database/migrations/009_create_audit_logs_table.sql"
New-FileItem "database/migrations/010_create_notifications_table.sql"
New-FileItem "database/migrations/011_create_approvals_table.sql"
New-FileItem "database/migrations/012_create_budgets_table.sql"
New-FileItem "database/migrations/013_create_maintenance_table.sql"

# Seeds
New-FileItem "database/seeds/001_seed_roles.sql"
New-FileItem "database/seeds/002_seed_admin_user.sql"
New-FileItem "database/seeds/003_seed_sample_projects.sql"

# Schema
New-FileItem "database/schema/database-design.sql"
New-FileItem "database/schema/views.sql"
New-FileItem "database/schema/stored-procedures.sql"
New-FileItem "database/schema/triggers.sql"
New-FileItem "database/schema/indexes.sql"

# ============================================
# TESTS
# ============================================
New-Directory "tests/unit/models"
New-Directory "tests/unit/services"
New-Directory "tests/unit/utils"
New-Directory "tests/integration/auth"
New-Directory "tests/integration/projects"
New-Directory "tests/integration/finance"
New-Directory "tests/api"
New-Directory "tests/frontend"

# Unit tests
New-FileItem "tests/unit/models/UserTest.php"
New-FileItem "tests/unit/models/ProjectTest.php"
New-FileItem "tests/unit/services/AuthServiceTest.php"
New-FileItem "tests/unit/utils/ValidatorTest.php"

# Integration tests
New-FileItem "tests/integration/auth/LoginTest.php"
New-FileItem "tests/integration/projects/CreateProjectTest.php"
New-FileItem "tests/integration/finance/TransactionTest.php"

# API tests
New-FileItem "tests/api/AuthApiTest.php"
New-FileItem "tests/api/ProjectApiTest.php"
New-FileItem "tests/api/FinanceApiTest.php"
New-FileItem "tests/api/ModalDataApiTest.php"

# Frontend tests
New-FileItem "tests/frontend/modal-tests.js"
New-FileItem "tests/frontend/ajax-tests.js"

# Test config
New-FileItem "tests/bootstrap.php"
New-FileItem "tests/TestCase.php"
New-FileItem "phpunit.xml"

# ============================================
# DOCUMENTATION
# ============================================
New-Directory "docs/api"
New-Directory "docs/user-manual"
New-Directory "docs/technical"
New-Directory "docs/diagrams"
New-Directory "docs/architecture"

New-FileItem "docs/README.md"
New-FileItem "docs/INSTALLATION.md"
New-FileItem "docs/DEPLOYMENT.md"
New-FileItem "docs/CONTRIBUTING.md"
New-FileItem "docs/CHANGELOG.md"

# API docs
New-FileItem "docs/api/authentication.md"
New-FileItem "docs/api/projects.md"
New-FileItem "docs/api/finance.md"
New-FileItem "docs/api/equipment.md"
New-FileItem "docs/api/contracts.md"
New-FileItem "docs/api/modal-endpoints.md"

# User manual
New-FileItem "docs/user-manual/getting-started.md"
New-FileItem "docs/user-manual/project-managers.md"
New-FileItem "docs/user-manual/finance-officers.md"
New-FileItem "docs/user-manual/field-supervisors.md"
New-FileItem "docs/user-manual/equipment-coordinators.md"

# Technical docs
New-FileItem "docs/technical/architecture.md"
New-FileItem "docs/technical/database-schema.md"
New-FileItem "docs/technical/security.md"
New-FileItem "docs/technical/api-design.md"
New-FileItem "docs/technical/pwa-implementation.md"
New-FileItem "docs/technical/modal-page-architecture.md"

# Architecture decision records
New-FileItem "docs/architecture/001-hybrid-modal-architecture.md"
New-FileItem "docs/architecture/002-ajax-patterns.md"
New-FileItem "docs/architecture/003-frontend-state-management.md"

# ============================================
# SCRIPTS
# ============================================
New-Directory "scripts/deployment"
New-Directory "scripts/maintenance"
New-Directory "scripts/backup"

New-FileItem "scripts/deployment/deploy.sh"
New-FileItem "scripts/deployment/rollback.sh"
New-FileItem "scripts/deployment/setup-server.sh"
New-FileItem "scripts/maintenance/cleanup-uploads.sh"
New-FileItem "scripts/maintenance/optimize-database.sh"
New-FileItem "scripts/maintenance/generate-reports.sh"
New-FileItem "scripts/backup/backup-database.sh"
New-FileItem "scripts/backup/backup-files.sh"
New-FileItem "scripts/backup/restore-database.sh"

# ============================================
# LOGS AND STORAGE
# ============================================
New-Directory "logs/application"
New-Directory "logs/error"
New-Directory "logs/access"
New-Directory "logs/audit"
New-Directory "logs/security"
New-Directory "logs/ajax"
New-FileItem "logs/.gitkeep"

New-Directory "storage/temp"
New-Directory "storage/backups/database"
New-Directory "storage/backups/files"
New-Directory "storage/exports/reports"
New-Directory "storage/exports/data"
New-Directory "storage/cache"
New-FileItem "storage/.gitkeep"

# ============================================
# VENDOR AND CI/CD
# ============================================
New-FileItem "composer.json"
New-FileItem "composer.lock"
New-FileItem "package.json"
New-FileItem "package-lock.json"

New-Directory ".github/workflows"
New-FileItem ".github/workflows/ci.yml"
New-FileItem ".github/workflows/deploy.yml"

# ============================================
# SECURITY FILES
# ============================================
New-FileItem ".htaccess"
New-FileItem "robots.txt"
New-FileItem "security.txt"

# ============================================
# CREATE ESSENTIAL FILE CONTENTS
# ============================================

# Root .htaccess
@"
# Prevent directory listing
Options -Indexes

# Protect sensitive files
<FilesMatch "\.(env|json|sql|sh|log)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Redirect to public directory
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/public/
RewriteRule ^(.*)$ public/$1 [L]
"@ | Out-File -FilePath ".htaccess" -Encoding UTF8

# Uploads .htaccess
@"
# Prevent PHP execution in uploads directory
<FilesMatch "\.php$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Only allow specific file types
<FilesMatch "\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx)$">
    Order allow,deny
    Allow from all
</FilesMatch>
"@ | Out-File -FilePath "public/uploads/.htaccess" -Encoding UTF8

# robots.txt
@"
User-agent: *
Disallow: /api/
Disallow: /src/
Disallow: /database/
Disallow: /logs/
Disallow: /storage/
Disallow: /vendor/
Allow: /public/
"@ | Out-File -FilePath "robots.txt" -Encoding UTF8

# .gitignore
@"
# Environment files
.env
.env.local

# Dependencies
/vendor/
node_modules/

# Logs
/logs/*.log
/logs/*/*.log

# Uploads
/public/uploads/*
!/public/uploads/.htaccess

# Storage
/storage/temp/*
/storage/backups/*
/storage/cache/*
!/storage/.gitkeep

# IDE
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# OS
.DS_Store
Thumbs.db

# Composer
composer.phar

# Test coverage
/coverage/
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8

# .env.example
@"
# Application
APP_NAME="Mkaka Construction Management System"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://localhost

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mkaka_construction
DB_USER=root
DB_PASS=

# Security
APP_KEY=your_32_character_app_key_here
JWT_SECRET=your_jwt_secret_key_here
SESSION_LIFETIME=120

# Email
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=noreply@mkakaconstruction.com
MAIL_PASS=your_mail_password
MAIL_FROM=noreply@mkakaconstruction.com
MAIL_FROM_NAME="Mkaka Construction"

# File Upload
MAX_UPLOAD_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx

# GPS Validation
GPS_VALIDATION_ENABLED=true
MALAWI_MIN_LAT=-17.125
MALAWI_MAX_LAT=-9.367
MALAWI_MIN_LNG=32.674
MALAWI_MAX_LNG=35.924

# PWA
PWA_NAME="Mkaka Construction"
PWA_SHORT_NAME="Mkaka"
PWA_THEME_COLOR=#1a73e8
PWA_BACKGROUND_COLOR=#ffffff
"@ | Out-File -FilePath ".env.example" -Encoding UTF8

# Create Architecture Decision Record
@"
# ADR-001: Hybrid Modal/Page Architecture

## Date: $(Get-Date -Format 'yyyy-MM-dd')

## Status: Accepted

## Context
Modern enterprise applications require balancing speed (modals) with complexity (full pages).
Construction management involves both quick actions (approvals, status updates) and complex 
workflows (project creation, report generation).

## Decision
Implement a hybrid architecture:
- **Modals**: Quick views, approvals, simple forms (< 5 fields)
- **Full Pages**: Complex forms, multi-step workflows, comprehensive views

## Structure
\`\`\`
views/
├── pages/          # Complex workflows (full page loads)
│   └── projects/
│       ├── list.php
│       ├── create.php
│       └── edit.php
└── modals/         # Quick actions (AJAX loaded)
    └── projects/
        ├── quick-view.php
        ├── status-update.php
        └── assign-team.php
\`\`\`

## API Pattern
\`\`\`
api/v1/
├── projects/           # CRUD operations
└── modal-data/         # Quick data fetching for modals
\`\`\`

## Benefits
- Faster user experience for common actions
- Proper workflows for complex tasks
- Reduced cognitive load
- Better mobile experience
- Industry-standard UX pattern

## Consequences
- More JavaScript complexity
- Need robust AJAX error handling
- Requires careful state management
- Increased testing surface

"@ | Out-File -FilePath "docs/architecture/001-hybrid-modal-architecture.md" -Encoding UTF8

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "HYBRID ARCHITECTURE CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Project root: $PROJECT_ROOT" -ForegroundColor Cyan
Write-Host ""
Write-Host "ARCHITECTURE PATTERN:" -ForegroundColor Yellow
Write-Host "   Modals for quick actions (40% of interactions)" -ForegroundColor Green
Write-Host "   Full pages for complex workflows (60% of interactions)" -ForegroundColor Green
Write-Host ""
Write-Host "KEY DIRECTORIES:" -ForegroundColor Yellow
Write-Host "   views/pages/        - Complex forms (create, edit, reports)" -ForegroundColor Cyan
Write-Host "   views/modals/       - Quick actions (view, approve, status)" -ForegroundColor Cyan
Write-Host "  api/v1/modal-data/  - AJAX endpoints for modals" -ForegroundColor Cyan
Write-Host "   public/js/core/     - Modal manager & AJAX handler" -ForegroundColor Cyan
Write-Host ""
Write-Host "MODAL EXAMPLES:" -ForegroundColor Yellow
Write-Host "  • Project quick view → views/modals/projects/quick-view.php" -ForegroundColor White
Write-Host "  • Approve transaction → views/modals/finance/approve-transaction.php" -ForegroundColor White
Write-Host "  • Equipment checkout → views/modals/equipment/checkout.php" -ForegroundColor White
Write-Host ""
Write-Host "PAGE EXAMPLES:" -ForegroundColor Yellow
Write-Host "  • Create project → views/pages/projects/create.php" -ForegroundColor White
Write-Host "  • Edit contract → views/pages/contracts/edit.php" -ForegroundColor White
Write-Host "  • Site report → views/pages/reports/create-site-report.php" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. cd $PROJECT_ROOT"
Write-Host "2. Copy .env.example to .env and configure"
Write-Host "3. Read docs/architecture/001-hybrid-modal-architecture.md"
Write-Host "4. Configure XAMPP virtual host"
Write-Host "5. Import database schema"
Write-Host "6. Run: composer install"
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Happy coding with modern UX! " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green