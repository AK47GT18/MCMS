/**
 * MCMS Utilities - Zod Validation Schemas
 * Centralized validation schemas for all API requests
 */

const { z } = require('zod');

// ============================================
// AUTH SCHEMAS
// ============================================

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Password strength requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  phone: z.string().optional(),
  role: z.enum([
    'Project_Manager', 'Finance_Director', 'Field_Supervisor',
    'Contract_Administrator', 'Equipment_Coordinator',
    'Operations_Manager', 'Managing_Director', 'System_Technician'
  ]),
});

// ============================================
// USER SCHEMAS
// ============================================

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum([
    'Project_Manager', 'Finance_Director', 'Field_Supervisor',
    'Contract_Administrator', 'Equipment_Coordinator',
    'Operations_Manager', 'Managing_Director', 'System_Technician'
  ]),
  password: passwordSchema,
  permissions: z.array(z.string()).optional(),
});

const updateUserSchema = createUserSchema.partial();

// ============================================
// PROJECT SCHEMAS
// ============================================

const createProjectSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  client: z.string().max(255).optional(),
  managerId: z.number().int().positive().optional(),
  status: z.enum(['active', 'planning', 'on_hold', 'completed', 'cancelled']).optional(),
  contractValue: z.number().positive().optional(),
  budgetTotal: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().int().optional(),
  suspensionReason: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.partial();

// ============================================
// VENDOR SCHEMAS
// ============================================

const createVendorSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().max(50).optional(),
  taxClearanceValid: z.boolean().optional(),
  taxClearanceExpiry: z.string().datetime().optional(),
  ncicGrade: z.string().max(20).optional(),
  performanceRating: z.number().int().min(1).max(5).optional(),
  status: z.enum(['approved', 'pending', 'suspended']).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
});

const updateVendorSchema = createVendorSchema.partial();

// ============================================
// CONTRACT SCHEMAS
// ============================================

const createContractSchema = z.object({
  refCode: z.string().min(1).max(30),
  projectId: z.number().int().positive().optional(),
  vendorId: z.number().int().positive().optional(),
  title: z.string().min(1).max(255),
  value: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['active', 'draft', 'expired', 'cancelled']).optional(),
  documentUrl: z.string().url().optional(),
});

const updateContractSchema = createContractSchema.partial();

// ============================================
// TASK SCHEMAS
// ============================================

const createTaskSchema = z.object({
  projectId: z.number().int().positive(),
  name: z.string().min(1).max(255),
  startDate: z.string(),
  endDate: z.string(),
  progress: z.number().int().min(0).max(100).optional(),
  dependencyId: z.number().int().positive().optional(),
  statusClass: z.string().max(50).optional(),
});

const updateTaskSchema = createTaskSchema.partial();

// ============================================
// ASSET SCHEMAS
// ============================================

const createAssetSchema = z.object({
  assetCode: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  serialNumber: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  modelYear: z.number().int().optional(),
  hoursOrKm: z.number().int().optional(),
  condition: z.enum(['Good', 'Fair', 'Poor']).optional(),
  fuelLevel: z.number().int().min(0).max(100).optional(),
  currentProjectId: z.number().int().positive().optional(),
  status: z.enum(['available', 'checked_out', 'in_transit', 'maintenance', 'decommissioned']).optional(),
  estimatedValue: z.number().positive().optional(),
});

const updateAssetSchema = createAssetSchema.partial();

// ============================================
// REQUISITION SCHEMAS
// ============================================

const createRequisitionSchema = z.object({
  reqCode: z.string().min(1).max(20),
  projectId: z.number().int().positive().optional(),
  vendorId: z.number().int().positive().optional(),
  description: z.string().optional(),
  totalAmount: z.number().positive(),
  budgetLine: z.string().max(20).optional(),
  items: z.array(z.object({
    itemName: z.string().min(1).max(255),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).optional(),
});

const updateRequisitionSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'fraud_flag']).optional(),
  fraudCheck: z.boolean().optional(),
});

// ============================================
// DAILY LOG SCHEMAS
// ============================================

const createDailyLogSchema = z.object({
  projectId: z.number().int().positive(),
  logDate: z.string(),
  headcount: z.number().int().optional(),
  weather: z.string().max(50).optional(),
  narrative: z.string().optional(),
  expenseAmount: z.number().positive().optional(),
  expenseCategory: z.string().max(50).optional(),
  expenseReason: z.string().optional(),
  isSos: z.boolean().optional(),
});

const updateDailyLogSchema = z.object({
  pmApproved: z.boolean().optional(),
});

// ============================================
// ISSUE SCHEMAS
// ============================================

const createIssueSchema = z.object({
  issueCode: z.string().min(1).max(20),
  category: z.string().max(100).optional(),
  projectId: z.number().int().positive().optional(),
  siteLocation: z.string().max(100).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  description: z.string().optional(),
  photoUrl: z.string().url().optional(),
  assignedTo: z.number().int().positive().optional(),
});

const updateIssueSchema = z.object({
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  resolutionNotes: z.string().optional(),
  assignedTo: z.number().int().positive().optional(),
});

// ============================================
// PROCUREMENT SCHEMAS
// ============================================

const createProcurementSchema = z.object({
  reqCode: z.string().min(1).max(20),
  vehicleName: z.string().min(1).max(255),
  estimatedCost: z.number().positive().optional(),
  justification: z.string().optional(),
  priority: z.enum(['Standard', 'Urgent', 'Critical']).optional(),
});

const updateProcurementSchema = z.object({
  status: z.enum(['pending_pm', 'pending_finance', 'approved', 'rejected', 'purchased']).optional(),
  pmComments: z.string().optional(),
  financeComments: z.string().optional(),
});

// ============================================
// PAGINATION SCHEMA
// ============================================

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  // User Filters
  role: z.string().optional(),
  isLocked: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Auth
  loginSchema,
  registerSchema,
  passwordSchema,
  // User
  createUserSchema,
  updateUserSchema,
  // Project
  createProjectSchema,
  updateProjectSchema,
  // Vendor
  createVendorSchema,
  updateVendorSchema,
  // Contract
  createContractSchema,
  updateContractSchema,
  // Task
  createTaskSchema,
  updateTaskSchema,
  // Asset
  createAssetSchema,
  updateAssetSchema,
  // Requisition
  createRequisitionSchema,
  updateRequisitionSchema,
  // Daily Log
  createDailyLogSchema,
  updateDailyLogSchema,
  // Issue
  createIssueSchema,
  updateIssueSchema,
  // Procurement
  createProcurementSchema,
  updateProcurementSchema,
  // Common
  paginationSchema,
};
