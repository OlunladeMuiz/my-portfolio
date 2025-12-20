const http = require('http');

const unique = Date.now();
const requestId = `e2e-${unique}`;
const payload = { request_id: requestId, name: 'E2E Test', email: `e2e+${unique}@example.com`, subject: 'E2E Submit', message: 'End-to-end test' };

const API_PORT = process.env.PORT || 3000;
const postOptions = {
    hostname: 'localhost',
    port: API_PORT,
    path: '/api/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
};

function postOnce(cb) {
    const data = JSON.stringify(payload);
    const opts = { ...postOptions, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
    const req = http.request(opts, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => cb(null, res.statusCode, body));
    });
    req.on('error', (e) => cb(e));
    req.write(data);
    req.end();
}

function getList(cb) {
    const getOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/users',
        method: 'GET',
        headers: { 'x-admin-token': process.env.ADMIN_TOKEN || 'changeme' }
    };
    const g = http.request(getOptions, (r2) => {
        let b2='';
        r2.on('data', c => b2 += c);
        r2.on('end', () => cb(null, r2.statusCode, b2));
    });
    g.on('error', (e) => cb(e));
    g.end();
}

// Post twice with same request_id to test idempotency
postOnce((err, status1, body1) => {
    if (err) return console.error('First POST error', err);
    console.log('First POST:', status1, body1);
    postOnce((err2, status2, body2) => {
        if (err2) return console.error('Second POST error', err2);
        console.log('Second POST:', status2, body2);
        // Now list and check only one entry for this request_id
        getList((err3, gs, listBody) => {
            if (err3) return console.error('GET list error', err3);
            try {
                const list = JSON.parse(listBody);
                const matches = (list.submissions || []).filter(s => s.request_id === requestId);
                console.log('Entries with request_id=', requestId, matches.length);
            } catch (e) { console.error('Failed to parse GET response', e, listBody); }
        });
    });
});