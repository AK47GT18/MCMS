const http = require('http');

const data = {
    refCode: 'TEST-100',
    title: 'Test Contract',
    documentUrl: '/uploads/documents/test.pdf',
    fileName: 'test.pdf',
    contractType: 'project',
    projectId: 1,
    value: 1000
};

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/contracts',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        // Mock authorization token bypass or use a valid one if needed
        // For testing, I'll bypass authentication or use a known token
        // Let's just create directly via service to see if it works.
    }
});
