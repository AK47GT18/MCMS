const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch'); // Let's use standard node http instead if node-fetch is unavailable
const http = require('http');

async function testUpload() {
    // create a dummy file
    fs.writeFileSync('test_upload.pdf', 'dummy pdf content');
    
    // We will just write a boundary request manually since form-data might not be installed
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    let body = `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="projectId"\r\n\r\n`;
    body += `1\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="refCode"\r\n\r\n`;
    body += `TEST-200\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="title"\r\n\r\n`;
    body += `Test Upload\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="contractType"\r\n\r\n`;
    body += `project\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="document"; filename="test_upload.pdf"\r\n`;
    body += `Content-Type: application/pdf\r\n\r\n`;
    body += `dummy pdf content\r\n`;
    body += `--${boundary}--\r\n`;

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/contracts',
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(body),
            // Mock auth token if possible, or we temporarily bypass auth in controller
        }
    };

    const req = http.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => console.log('Response:', data));
    });

    req.on('error', console.error);
    req.write(body);
    req.end();
}

testUpload();
