/* Simple script to POST JSON to /api/_debug/echo */

const http = require('http');
const data = JSON.stringify({ hello: 'world', now: new Date().toISOString() });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/_debug/echo',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), 'Origin': 'http://localhost:5500' }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', body));
});
req.on('error', (e) => console.error('Request error', e));
req.write(data);
req.end();
