const http = require('http');

const data = JSON.stringify({ name: 'Test', email: 'test@example.com', subject: 'Hello', message: 'From local test' });

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('Response:', body);
    });
});

req.on('error', (e) => console.error('Request error', e));
req.write(data);
req.end();
