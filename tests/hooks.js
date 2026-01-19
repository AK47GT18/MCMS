/**
 * MCMS Test Hooks
 * Simple testing utilities for all modules
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

/**
 * Make HTTP request
 */
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
          });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Test runner
 */
async function runTests() {
  console.log('\\n🧪 MCMS Backend Test Suite\\n');
  console.log('=' .repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  const tests = [
    // Health check
    async () => {
      const res = await request('GET', '/api/v1/health');
      assert.strictEqual(res.status, 200), 'Health check failed';
      console.log('✅ Health check');
    },
    
    // Auth: Register
    async () => {
      const res = await request('POST', '/api/v1/auth/register', {
        name: 'Test User',
        email: 'test@mcms.local',
        password: 'test123456',
        role: 'Field_Supervisor',
      });
      if (res.status === 201 || res.data?.error?.message?.includes('already')) {
        console.log('✅ Auth: Register');
      } else {
        throw new Error(`Register failed: ${res.status}`);
      }
    },
    
    // Auth: Login
    async () => {
      const res = await request('POST', '/api/v1/auth/login', {
        email: 'test@mcms.local',
        password: 'test123456',
      });
      assert.strictEqual(res.status, 200, 'Login failed');
      assert.ok(res.data?.data?.token, 'No token returned');
      authToken = res.data.data.token;
      console.log('✅ Auth: Login');
    },
    
    // Auth: Get profile
    async () => {
      const res = await request('GET', '/api/v1/auth/me', null, authToken);
      assert.strictEqual(res.status, 200, 'Get profile failed');
      console.log('✅ Auth: Get profile');
    },
    
    // Projects: List
    async () => {
      const res = await request('GET', '/api/v1/projects', null, authToken);
      assert.strictEqual(res.status, 200, 'List projects failed');
      console.log('✅ Projects: List');
    },
    
    // Vendors: List
    async () => {
      const res = await request('GET', '/api/v1/vendors', null, authToken);
      assert.strictEqual(res.status, 200, 'List vendors failed');
      console.log('✅ Vendors: List');
    },
    
    // Contracts: List
    async () => {
      const res = await request('GET', '/api/v1/contracts', null, authToken);
      assert.strictEqual(res.status, 200, 'List contracts failed');
      console.log('✅ Contracts: List');
    },
    
    // Assets: List
    async () => {
      const res = await request('GET', '/api/v1/assets', null, authToken);
      assert.strictEqual(res.status, 200, 'List assets failed');
      console.log('✅ Assets: List');
    },
    
    // Requisitions: List
    async () => {
      const res = await request('GET', '/api/v1/requisitions', null, authToken);
      assert.strictEqual(res.status, 200, 'List requisitions failed');
      console.log('✅ Requisitions: List');
    },
    
    // Issues: List
    async () => {
      const res = await request('GET', '/api/v1/issues', null, authToken);
      assert.strictEqual(res.status, 200, 'List issues failed');
      console.log('✅ Issues: List');
    },
    
    // PWA: Manifest
    async () => {
      const res = await request('GET', '/manifest.json');
      assert.strictEqual(res.status, 200, 'Get manifest failed');
      assert.ok(res.data?.name, 'Invalid manifest');
      console.log('✅ PWA: Manifest');
    },
    
    // Unauthorized access
    async () => {
      const res = await request('GET', '/api/v1/projects');
      assert.strictEqual(res.status, 401, 'Should be unauthorized');
      console.log('✅ Auth: Unauthorized blocked');
    },
    
    // 404 handling
    async () => {
      const res = await request('GET', '/api/v1/nonexistent', null, authToken);
      assert.strictEqual(res.status, 404, 'Should be not found');
      console.log('✅ Router: 404 handling');
    },
  ];
  
  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
      failed++;
    }
  }
  
  console.log('\\n' + '=' .repeat(50));
  console.log(`\\n📊 Results: ${passed} passed, ${failed} failed\\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { request, runTests };
