const http = require('http');

function request(path) {
  return new Promise(function (resolve, reject) {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'GET'
      },
      function (res) {
        let data = '';
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          resolve({ status: res.statusCode, body: data });
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

async function run() {
  try {
    const health = await request('/api/health');
    console.log('GET /api/health ->', health.status, health.body);

    const dbStatus = await request('/api/db-status');
    console.log('GET /api/db-status ->', dbStatus.status, dbStatus.body);
  } catch (error) {
    console.error('No se pudo ejecutar la prueba de humo:', error.message);
    process.exit(1);
  }
}

run();

