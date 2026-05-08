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
  managerId: z.coerce.number().int().positive().optional(),
  fieldSupervisorId: z.coerce.number().int().positive().optional(),
  projectType: z.enum(['civil_works', 'bridge_construction', 'road_works', 'building_works']).optional(),
  status: z.enum(['active', 'planning', 'on_hold', 'completed', 'cancelled']).optional(),
  contractValue: z.coerce.number().positive().optional(),
  budgetTotal: z.coerce.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().int().optional(),
  suspensionReason: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.partial();

const roadEstimationInputSchema = z.object({
  roadType: z.enum(['RT-1', 'RT-2', 'RT-3', 'RT-4', 'RT-5']),
  lengthKm: z.number().positive(),
  widthM: z.number().positive().optional(),
  lanes: z.number().int().positive().optional(),
  terrain: z.enum(['Flat', 'Rolling', 'Hilly/Mountainous', 'Rocky', 'Swampy/Wetland', 'Urban']),
  geographicZone: z.string().max(100).optional(),
  nearestTownKm: z.number().positive().optional(),
  // Can be keys (for calc) or full objects (for save overrides)
  accessories: z.preprocess((val) => Array.isArray(val) ? val : [], z.array(z.any())).optional(),
  layers: z.array(z.any()).optional(),
  approvedTotal: z.number().positive().optional() // required on save, not on calculate
});

// VENDOR SCHEMAS REMOVED

// ============================================
// CONTRACT SCHEMAS
// ============================================

const createContractSchema = z.object({
  refCode: z.string().min(1).max(30),
  projectId: z.coerce.number().int().positive().optional(),
  vendorName: z.string().max(255).optional(),
  vendorPhone: z.string().max(50).optional(),
  vendorId: z.coerce.number().int().positive().nullable().optional(),
  title: z.string().min(1).max(255),
  value: z.coerce.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'draft', 'pending_approval', 'expired', 'cancelled', 'terminated']).optional(),
  documentUrl: z.string().optional(),
  fileName: z.string().optional(),
  materialsList: z.string().optional(),
  contractType: z.string().max(50).optional(),
  justification: z.string().optional(),
  // Financial Precision Fields
  retentionPercentage: z.coerce.number().min(0).optional(),
  retentionAmount: z.coerce.number().min(0).optional(),
  isTaxInclusive: z.coerce.boolean().optional(),
  vatAmount: z.coerce.number().min(0).optional(),
  whtAmount: z.coerce.number().min(0).optional(),
  advancePaymentAmount: z.coerce.number().min(0).optional(),
  guaranteeExpiry: z.string().nullable().optional(),
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
// CONTRACT VERSION SCHEMAS
// ============================================

const createContractVersionSchema = z.object({
  refCode: z.string().max(30).optional(),
  title: z.string().max(255).optional(),
  value: z.coerce.number().positive().optional(),
  status: z.string().max(20).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  changeNotes: z.string().optional(),
});

const updateContractVersionSchema = createContractVersionSchema.partial();

// ============================================
// INSURANCE POLICY SCHEMAS
// ============================================

const createInsurancePolicySchema = z.object({
  entityName: z.string().min(1).max(255),
  documentType: z.string().min(1).max(100),
  policyNumber: z.string().min(1).max(100),
  expiryDate: z.string().datetime(),
  status: z.string().max(20).optional(),
});

const updateInsurancePolicySchema = createInsurancePolicySchema.partial();

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

const assetCheckOutSchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

const assetCheckInSchema = z.object({
  fuelLevel: z.coerce.number().int().min(0).max(100).optional(),
});

const assetFlagIssueSchema = z.object({
  description: z.string().min(1),
});

const assetResolveIssueSchema = z.object({
  resolutionNotes: z.string().optional(),
});

// ============================================
// REQUISITION SCHEMAS
// ============================================

const createRequisitionSchema = z.object({
  reqCode: z.string().max(20).optional(),
  projectId: z.coerce.number().int().positive().optional(),
  vendorName: z.string().max(255).optional(),
  description: z.string().optional(),
  totalAmount: z.coerce.number().min(0),
  budgetLine: z.string().max(20).optional(),
  items: z.array(z.object({
    itemName: z.string().min(1).max(255),
    quantity: z.coerce.number().int().positive(),
    unitPrice: z.coerce.number().min(0),
  })).optional(),
});

const updateRequisitionSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'fraud_flag']).optional(),
  fraudCheck: z.boolean().optional(),
});

const rejectRequisitionSchema = z.object({
  reason: z.string().min(1),
});

const fulfillRequisitionSchema = z.object({
  sectorId: z.coerce.number().int().positive().optional(),
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
  expenseItems: z.array(z.object({
    category: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    totalCost: z.number().positive(),
    description: z.string().optional()
  })).optional(),
  isSos: z.boolean().optional(),
  taskId: z.number().int().positive().optional(),
  activePhase: z.string().max(100).optional(),
  activeTask: z.string().max(255).optional(),
  progressIncrement: z.number().int().min(0).max(100).optional(),
  submissionLat: z.coerce.number().optional(),
  submissionLng: z.coerce.number().optional(),
  submissionAccuracy: z.coerce.number().optional(),
  locationSource: z.string().optional(),
  deviceType: z.string().optional(),
  locationCapturedAt: z.string().optional(),
  photos: z.array(z.any()).optional(), // Added for evidence
});

const updateDailyLogSchema = z.object({
  pmApproved: z.boolean().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  rejectionReason: z.string().optional(),
});

// ============================================
// PROJECT EXTENSION SCHEMA
// ============================================

const extendProjectSchema = z.object({
  newEndDate: z.string().min(1, 'New end date is required'),
  reason: z.string().min(1, 'Extension reason is required'),
});

// ============================================
// ISSUE SCHEMAS
// ============================================

const createIssueSchema = z.object({
  issueCode: z.string().min(1).max(20).optional(),
  category: z.string().max(100).optional(),
  projectId: z.coerce.number().int().positive().optional().nullable(),
  siteLocation: z.string().max(100).optional(),
  priority: z.enum(['low', 'Low', 'medium', 'Medium', 'high', 'High', 'critical', 'Critical']).optional(),
  description: z.string().optional(),
  photoUrl: z.string().optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
});

const updateIssueSchema = z.object({
  status: z.enum(['open', 'in_progress', 'investigating', 'resolved', 'closed']).optional(),
  resolutionNotes: z.string().optional(),
  assignedTo: z.number().int().positive().optional(),
  resolvedAt: z.string().nullable().optional(),
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
// INVENTORY SCHEMAS
// ============================================

const inventoryDistributeSchema = z.object({
  sectorId: z.coerce.number().int().positive(),
  materialName: z.string().min(1),
  quantity: z.coerce.number().positive(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const inventoryConsumeSchema = z.object({
  sectorId: z.coerce.number().int().positive(),
  materialName: z.string().min(1),
  quantity: z.coerce.number().positive(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================
// SAFETY INCIDENT SCHEMAS
// ============================================

const createSafetyIncidentSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  type: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  location: z.string().optional(),
  photos: z.array(z.any()).optional(),
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
  isLocked: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  search: z.string().optional(),
  unassigned: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
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
  roadEstimationInputSchema,
  // Contract
  createContractSchema,
  updateContractSchema,
  // Contract Version
  createContractVersionSchema,
  updateContractVersionSchema,
  // Insurance Policy
  createInsurancePolicySchema,
  updateInsurancePolicySchema,
  // Task
  createTaskSchema,
  updateTaskSchema,
  // Asset
  createAssetSchema,
  updateAssetSchema,
  // Requisition
  createRequisitionSchema,
  updateRequisitionSchema,
  rejectRequisitionSchema,
  fulfillRequisitionSchema,
  // Daily Log
  createDailyLogSchema,
  updateDailyLogSchema,
  // Asset Actions
  assetCheckOutSchema,
  assetCheckInSchema,
  assetFlagIssueSchema,
  assetResolveIssueSchema,
  // Issue
  createIssueSchema,
  updateIssueSchema,
  // Procurement
  createProcurementSchema,
  updateProcurementSchema,
  // Inventory
  inventoryDistributeSchema,
  inventoryConsumeSchema,
  // Safety
  createSafetyIncidentSchema,
  // Project Extension
  extendProjectSchema,
  // Common
  paginationSchema,
};
