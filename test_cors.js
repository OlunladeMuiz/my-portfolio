const http = require('http');

const ORIGINS = [
  { origin: 'http://127.0.0.1:5501', expectAllowed: true },
  { origin: 'http://localhost:8080', expectAllowed: true },
  { origin: 'http://evil.com', expectAllowed: false }
];

function optionsRequest(origin) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/_debug/echo',
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST'
      }
    };
    const req = http.request(opts, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    });
    req.on('error', (e) => resolve({ error: e }));
    req.end();
  });
}

function postRequest(origin) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ test: 'echo' });
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/_debug/echo',
      method: 'POST',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', (e) => resolve({ error: e }));
    req.write(data);
    req.end();
  });
}

(async function run() {
  let failures = 0;
  for (const t of ORIGINS) {
    console.log('\nTesting origin:', t.origin, 'expect allowed=', t.expectAllowed);
    const opt = await optionsRequest(t.origin);
    console.log('OPTIONS:', opt.status, 'ACAO=', opt.headers && opt.headers['access-control-allow-origin']);
    if (t.expectAllowed && !(opt.headers && opt.headers['access-control-allow-origin'])) {
      console.error('Expected ACCESS-CONTROL-ALLOW-ORIGIN header on OPTIONS for', t.origin);
      failures++;
    }
    if (!t.expectAllowed) {
      // Expect 403 from our middleware
      if (opt.status !== 403) {
        console.error('Expected 403 on OPTIONS for blocked origin', t.origin, 'got', opt.status);
        failures++;
      }
    }

    const post = await postRequest(t.origin);
    console.log('POST:', post.status, 'ACAO=', post.headers && post.headers['access-control-allow-origin']);
    if (t.expectAllowed && post.status !== 200) {
      console.error('Expected 200 on POST for allowed origin', t.origin, 'got', post.status, post.body);
      failures++;
    }
    if (!t.expectAllowed && post.status !== 403) {
      console.error('Expected 403 on POST for blocked origin', t.origin, 'got', post.status, post.body);
      failures++;
    }
  }
  if (failures) {
    console.error('\nCORS tests failed:', failures, 'checks');
    process.exit(1);
  }
  console.log('\nAll CORS checks passed');
  process.exit(0);
})();