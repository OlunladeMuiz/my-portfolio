/* Test sending Origin: http://127.0.0.1:5500 to POST /api/users */

const http = require('http');
const data = JSON.stringify({ name: '127 Origin Test', email: '127-origin@example.com', subject: '127 Origin', message: 'Testing 127.0.0.1 origin' });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/users',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), 'Origin': 'http://127.0.0.1:5500' }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});
req.on('error', (e) => console.error('Request error', e));
req.write(data);
req.end();
