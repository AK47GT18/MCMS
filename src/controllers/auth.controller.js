/**
 * MCMS Controller - Authentication
 * Handles login, register, and profile endpoints
 */

const authService = require('../services/auth.service');
const { validateBody, parseBody } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { loginSchema, registerSchema } = require('../utils/validators');
const response = require('../utils/response');
const auditService = require('../services/audit.service');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * POST /api/v1/auth/login
 * Authenticate user and return JWT token
 */
const login = asyncHandler(async (req, res) => {
  const body = await parseBody(req);
  const data = validateBody(body, loginSchema, res);
  if (!data) return;
  
  const result = await authService.login(data.email, data.password);
  
  // Log successful login (passing details directly as req.user is null)
  await auditService.log({
    userId: result.user.id,
    userName: result.user.name,
    userRole: result.user.role,
    action: 'LOGIN_SUCCESS',
    targetType: 'User',
    targetId: result.user.id,
    targetCode: result.user.email,
    ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    details: { message: 'User logged in successfully' }
  });

  response.success(res, result);
});

/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
const register = asyncHandler(async (req, res) => {
  const body = await parseBody(req);
  const data = validateBody(body, registerSchema, res);
  if (!data) return;
  
  const result = await authService.register(data);
  response.created(res, result);
});

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const profile = await authService.getProfile(user.id);
  response.success(res, profile);
});

/**
 * POST /api/v1/auth/change-password
 * Change user password
 */
const changePassword = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const { currentPassword, newPassword } = body;
  
  if (!currentPassword || !newPassword) {
    return response.badRequest(res, 'Current and new password required');
  }

  // Validate password strength
  const { passwordSchema } = require('../utils/validators');
  const validation = passwordSchema.safeParse(newPassword);
  if (!validation.success) {
    return response.badRequest(res, validation.error.errors[0].message);
  }
  
  await authService.changePassword(user.id, currentPassword, newPassword);
  
  // Log password change
  await auditService.logFromRequest(req, 'PASSWORD_CHANGE', 'User', user.id, user.email, {
    message: 'User changed their password'
  });

  response.success(res, { message: 'Password changed successfully' });
});

/**
 * POST /api/v1/auth/change-email
 * Change user email address
 */
const changeEmail = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const { newEmail } = body;
  
  if (!newEmail) {
    return response.badRequest(res, 'New email address required');
  }
  
  await authService.changeEmail(user.id, newEmail);
  response.success(res, { message: 'Email address updated successfully' });
});

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset email
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const body = await parseBody(req);
  const { email } = body;
  
  if (!email) {
    return response.badRequest(res, 'Email is required');
  }
  
  const result = await authService.forgotPassword(email);
  response.success(res, result);
});

/**
 * POST /api/v1/auth/reset-password
 * Reset password with token
 */
const resetPassword = asyncHandler(async (req, res) => {
  const body = await parseBody(req);
  const { token, newPassword } = body;
  
  if (!token || !newPassword) {
    return response.badRequest(res, 'Token and new password are required');
  }
  
  // Validate password strength
  const { passwordSchema } = require('../utils/validators');
  const validation = passwordSchema.safeParse(newPassword);
  if (!validation.success) {
    return response.badRequest(res, validation.error.errors[0].message);
  }
  
  const result = await authService.resetPassword(token, newPassword);
  
  // Log successful password reset
  await auditService.log({
    userId: result.user.id,
    userName: result.user.name,
    userRole: 'User', // Role might not be in the minimal return, 'User' is safe fallback
    action: 'PASSWORD_RESET',
    targetType: 'User',
    targetId: result.user.id,
    targetCode: result.user.email,
    ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    details: { message: 'Password reset successful via recovery token' }
  });

  response.success(res, result);
});

module.exports = { login, register, getProfile, changePassword, changeEmail, forgotPassword, resetPassword };

