/* Test sending Origin: null to POST /api/users */

const http = require('http');
const data = JSON.stringify({ name: 'Null Origin Test', email: 'null-origin@example.com', subject: 'Null Origin', message: 'Testing origin null' });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/users',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), 'Origin': 'null' }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});
req.on('error', (e) => console.error('Request error', e));
req.write(data);
req.end();
