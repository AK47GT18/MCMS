/**
 * Test Data Fixtures
 * Mock data for testing API endpoints
 */

export const mockUsers = [
  {
    id: 1,
    name: 'Alice Chimwala',
    email: 'alice@mkaka.mw',
    phone: '+265888123456',
    role: 'System Technician',
    avatarUrl: 'https://ui-avatars.com/api/?name=Alice+Chimwala',
    isLocked: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: 'James Banda',
    email: 'james@mkaka.mw',
    phone: '+265999234567',
    role: 'Project Manager',
    avatarUrl: 'https://ui-avatars.com/api/?name=James+Banda',
    isLocked: false,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
];

export const mockProjects = [
  {
    id: 1,
    name: 'Lilongwe Road Expansion',
    code: 'PRJ-2024-001',
    budget: 5000000,
    status: 'Active',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    managerId: 2,
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Blantyre Bridge Construction',
    code: 'PRJ-2024-002',
    budget: 8000000,
    status: 'Planning',
    startDate: '2024-03-01',
    endDate: '2025-02-28',
    managerId: 2,
    createdAt: '2024-01-05T10:00:00Z',
  },
];

export const mockAuthResponse = {
  user: mockUsers[0],
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
};

export const mockErrorResponses = {
  unauthorized: {
    status: 401,
    message: 'Authentication required',
  },
  notFound: {
    status: 404,
    message: 'Resource not found',
  },
  validation: {
    status: 400,
    message: 'Validation failed',
    errors: [
      { field: 'email', message: 'Email is required' },
      { field: 'password', message: 'Password must be at least 8 characters' },
    ],
  },
  serverError: {
    status: 500,
    message: 'Internal server error',
  },
};

export const mockPaginatedResponse = {
  users: mockUsers,
  total: 25,
  page: 1,
  limit: 20,
};
