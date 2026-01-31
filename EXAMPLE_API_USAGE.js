/**
 * API Client Usage Examples
 * Demonstrates how to use the API client in the application
 */

import { auth, users, projects, loadingState } from './src/api/index.js';

// ============================================
// Example 1: Authentication Flow
// ============================================

async function loginExample() {
  try {
    const { user, token } = await auth.login('admin@mkaka.mw', 'password123');
    console.log('Logged in as:', user.name);
    console.log('Token stored automatically');
    
    // Redirect to dashboard
    window.location.href = '/dashboard.html';
  } catch (error) {
    console.error('Login failed:', error.message);
    window.toast.error('Login Failed', error.message);
  }
}

// ============================================
// Example 2: Fetching Users with Loading State
// ============================================

async function fetchUsersExample() {
  try {
    // Loading state starts automatically
    const { users, total, page, limit } = await users.getAll({ 
      page: 1, 
      limit: 20 
    });
    
    console.log(`Fetched ${users.length} of ${total} users`);
    
    // Render users in UI
    renderUsersTable(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    window.toast.error('Error', 'Failed to load users');
  }
}

// ============================================
// Example 3: Creating a User
// ============================================

async function createUserExample() {
  try {
    const newUser = await users.create({
      name: 'John Doe',
      email: 'john@mkaka.mw',
      phone: '+265888123456',
      role: 'Field Supervisor',
      password: 'SecurePass123!',
    });
    
    window.toast.success('Success', `User ${newUser.name} created successfully`);
    
    // Refresh user list (cache is automatically invalidated)
    fetchUsersExample();
  } catch (error) {
    if (error.name === 'ValidationError') {
      window.toast.error('Validation Error', error.message);
    } else {
      window.toast.error('Error', 'Failed to create user');
    }
  }
}

// ============================================
// Example 4: Updating a User
// ============================================

async function updateUserExample(userId) {
  try {
    const updatedUser = await users.update(userId, {
      name: 'Jane Doe',
      phone: '+265999123456',
    });
    
    window.toast.success('Success', 'User updated successfully');
  } catch (error) {
    console.error('Update failed:', error);
    window.toast.error('Error', error.message);
  }
}

// ============================================
// Example 5: Deleting a User with Confirmation
// ============================================

async function deleteUserExample(userId) {
  window.modal.confirm(
    'Delete User',
    'Are you sure you want to delete this user? This action cannot be undone.',
    async () => {
      try {
        await users.remove(userId);
        window.toast.success('Success', 'User deleted successfully');
        fetchUsersExample(); // Refresh list
      } catch (error) {
        window.toast.error('Error', 'Failed to delete user');
      }
    }
  );
}

// ============================================
// Example 6: Loading State Integration
// ============================================

// Listen to global loading events
loadingState.on('globalloadingstart', () => {
  document.getElementById('global-loader')?.classList.add('active');
});

loadingState.on('globalloadingend', () => {
  document.getElementById('global-loader')?.classList.remove('active');
});

// ============================================
// Example 7: Error Handling
// ============================================

async function handleAPIErrors() {
  try {
    await users.getById(99999); // Non-existent user
  } catch (error) {
    switch (error.name) {
      case 'NotFoundError':
        window.toast.error('Not Found', 'User not found');
        break;
      case 'AuthenticationError':
        // Redirect to login (already handled by interceptor)
        break;
      case 'NetworkError':
        window.modal.error('Network Error', 'Please check your internet connection');
        break;
      default:
        window.toast.error('Error', error.message);
    }
  }
}

// ============================================
// Example 8: Working with Projects
// ============================================

async function projectsExample() {
  try {
    // Get all projects
    const { projects } = await projects.getAll();
    
    // Get specific project with stats
    const project = await projects.getById(1);
    const stats = await projects.getStats(1);
    
    console.log(`Project: ${project.name}`);
    console.log(`Budget: ${stats.budgetUtilization}%`);
    
    // Create new project
    const newProject = await projects.create({
      name: 'New Highway Project',
      budget: 5000000,
      startDate: '2026-02-01',
      endDate: '2026-12-31',
    });
    
    window.toast.success('Success', 'Project created successfully');
  } catch (error) {
    console.error('Project operation failed:', error);
  }
}

// ============================================
// Example 9: Logout
// ============================================

function logoutExample() {
  // Clear token and cache
  auth.logout();
  
  // Redirect to login
  window.location.href = '/auth.html';
}

// ============================================
// Example 10: Check Authentication Status
// ============================================

function checkAuth() {
  if (!auth.isAuthenticated()) {
    window.location.href = '/auth.html';
    return false;
  }
  return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  if (!checkAuth()) return;
  
  // Load initial data
  fetchUsersExample();
  
  // Listen for unauthorized events (from interceptor)
  window.addEventListener('auth:unauthorized', () => {
    window.modal.error(
      'Session Expired',
      'Your session has expired. Please login again.',
      () => {
        window.location.href = '/auth.html';
      }
    );
  });
});

export {
  loginExample,
  fetchUsersExample,
  createUserExample,
  updateUserExample,
  deleteUserExample,
  logoutExample,
  checkAuth,
};
