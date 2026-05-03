const http = require('http');

http.get('http://localhost:3000/uploads/documents/file-1771910657925-629997802.pdf', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk.toString();
  });
  
  res.on('end', () => {
    console.log(`BODY TRUNCATED: ${body.substring(0, 100)}`);
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
