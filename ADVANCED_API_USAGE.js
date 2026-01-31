/**
 * Advanced API Client Usage Examples
 * Demonstrates new features: cancellation, deduplication, and response transformation
 */

import { client, users } from './src/api/index.js';

// ============================================
// Example 1: Request Cancellation
// ============================================

// Cancel requests when navigating away from a page
class DashboardComponent {
  constructor() {
    this.requestIds = [];
  }
  
  async loadData() {
    // Make requests and track their IDs
    const requestId1 = `users-${Date.now()}`;
    const requestId2 = `projects-${Date.now()}`;
    
    this.requestIds.push(requestId1, requestId2);
    
    try {
      const [usersData, projectsData] = await Promise.all([
        users.getAll({ requestId: requestId1 }),
        client.get('/projects', { requestId: requestId2 }),
      ]);
      
      console.log('Data loaded', { usersData, projectsData });
    } catch (error) {
      if (error.message === 'Request cancelled') {
        console.log('Requests were cancelled');
      }
    }
  }
  
  onNavigateAway() {
    // Cancel all pending requests when user navigates away
    this.requestIds.forEach(id => client.cancelRequest(id));
    // Or cancel all at once:
    // client.cancelAllRequests();
  }
}

// Usage with router
window.addEventListener('beforeunload', (e) => {
  const cancelled = client.cancelAllRequests();
  console.log(`Cancelled ${cancelled} pending requests`);
});

// ============================================
// Example 2: Request Deduplication
// ============================================

// Multiple components fetch the same data simultaneously
async function demonstrateDeduplication() {
  // Clicking a button multiple times won't create duplicate requests
  document.getElementById('loadUsersBtn').addEventListener('click', async () => {
    // Even if clicked 5 times rapidly, only 1 actual network request is made
    // All 5 calls will receive the same promise
    const data = await users.getAll({ page: 1, limit: 20 });
    console.log('Users loaded:', data);
  });
  
  // Programmatic example
  const promise1 = users.getAll({ page: 1, limit: 20 });
  const promise2 = users.getAll({ page: 1, limit: 20 }); // Same request!
  const promise3 = users.getAll({ page: 1, limit: 20 }); // Same request!
  
  // All three will use the SAME network request
  const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);
  
  console.log('All results are identical:', result1 === result2 && result2 === result3);
}

// Disable deduplication for specific requests
async function forceNewRequest() {
  const data = await users.getAll({ 
    page: 1, 
    limit: 20, 
    skipDeduplication: true // Force a fresh request
  });
}

// ============================================
// Example 3: Response Transformation
// ============================================

// Normalize backend response format
const backendNormalizer = (data, config) => {
  // Example: Backend returns { success: true, data: {...}, message: '...' }
  // Transform to just return the data
  if (data && data.success && data.data) {
    return data.data;
  }
  return data;
};

// Date string to Date object transformation
const dateTransformer = (data, config) => {
  if (Array.isArray(data)) {
    return data.map(item => transformDates(item));
  } else if (typeof data === 'object' && data !== null) {
    return transformDates(data);
  }
  return data;
};

function transformDates(obj) {
  const transformed = { ...obj };
  const dateFields = ['createdAt', 'updatedAt', 'startDate', 'endDate', 'dueDate'];
  
  for (const field of dateFields) {
    if (transformed[field] && typeof transformed[field] === 'string') {
      transformed[field] = new Date(transformed[field]);
    }
  }
  
  return transformed;
}

// Register transformers
client.addResponseTransformer(backendNormalizer);
client.addResponseTransformer(dateTransformer);

// Now all responses are automatically transformed
async function transformerExample() {
  const users = await users.getAll();
  
  // users[0].createdAt is now a Date object, not a string
  console.log(users[0].createdAt instanceof Date); // true
}

// Remove a transformer
const unsubscribe = client.addResponseTransformer(dateTransformer);
unsubscribe(); // Remove the transformer

// ============================================
// Example 4: Combining All Features
// ============================================

class AdvancedDashboard {
  constructor() {
    this.activeRequestIds = new Set();
    this.setupTransformers();
  }
  
  setupTransformers() {
    // Add custom transformer for this dashboard
    client.addResponseTransformer((data) => {
      // Add dashboard-specific transformations
      if (data.users) {
        data.users = data.users.map(user => ({
          ...user,
          fullName: user.name,
          initials: this.getInitials(user.name),
        }));
      }
      return data;
    });
  }
  
  async loadUsers(page = 1) {
    const requestId = `dashboard-users-${page}`;
    this.activeRequestIds.add(requestId);
    
    try {
      // Request with deduplication, transformation, and cancellation support
      const data = await users.getAll({ 
        page, 
        limit: 20,
        requestId,
      });
      
      // data.users now have fullName and initials fields
      this.renderUsers(data.users);
    } catch (error) {
      if (error.message !== 'Request cancelled') {
        window.toast.error('Error', 'Failed to load users');
      }
    } finally {
      this.activeRequestIds.delete(requestId);
    }
  }
  
  getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  renderUsers(users) {
    console.log('Rendering users:', users);
  }
  
  destroy() {
    // Cancel all active requests when component is destroyed
    for (const requestId of this.activeRequestIds) {
      client.cancelRequest(requestId);
    }
  }
}

// ============================================
// Example 5: Monitoring Pending Requests
// ============================================

// Show loading indicator based on pending requests
setInterval(() => {
  const pendingCount = client.getPendingRequestCount();
  const loaderEl = document.getElementById('global-loader');
  
  if (pendingCount > 0) {
    loaderEl.textContent = `${pendingCount} request(s) in progress...`;
    loaderEl.classList.add('active');
  } else {
    loaderEl.classList.remove('active');
  }
}, 100);

// ============================================
// Example 6: Prevent Double-Submit Forms
// ============================================

async function handleFormSubmit(formData) {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  
  try {
    // If user clicks submit twice rapidly, only 1 request is made
    const result = await users.create(formData);
    
    window.toast.success('Success', 'User created successfully');
    return result;
  } catch (error) {
    window.toast.error('Error', error.message);
  } finally {
    submitBtn.disabled = false;
  }
}

export {
  DashboardComponent,
  demonstrateDeduplication,
  transformerExample,
  AdvancedDashboard,
};
