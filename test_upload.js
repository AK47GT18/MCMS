const fs = require('fs');
const https = require('https');
const path = require('path');

async function testCreateContract() {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  
  // Dummy file content
  const fileContent = 'dummy pdf content';
  const filename = 'test-doc.pdf';
  
  let body = '';
  
  // Add fields
  const fields = {
    projectId: '1',
    refCode: 'TEST-LOG-' + Date.now(),
    title: 'Logging Test Contract',
    value: '1000000',
    contractType: 'project',
    justification: 'Testing the upload pipeline'
  };
  
  for (const [key, value] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    body += `${value}\r\n`;
  }
  
  // Add file
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="document"; filename="${filename}"\r\n`;
  body += `Content-Type: application/pdf\r\n\r\n`;
  body += fileContent + '\r\n';
  
  body += `--${boundary}--\r\n`;

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/contracts',
    method: 'POST',
    rejectUnauthorized: false, // Ignore self-signed cert errors
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(body),
    }
  };

  console.log('Sending request via HTTPS...');
  const req = https.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('Response:', responseBody);
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.write(body);
  req.end();
}

testCreateContract();
