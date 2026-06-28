const http = require('http');

const data = JSON.stringify({
  content: "console.log('hello world');"
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/files/something',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
