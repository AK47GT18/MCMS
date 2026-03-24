const http = require('http');

const body = JSON.stringify({
  roadSpec: {
    roadType: 'RT-2 Gravel',
    lengthKm: 12.5,
    widthM: 6.5,
    lanes: 2,
    terrain: 'rolling',
    geographicZone: 'central',
    nearestTownKm: 25
  },
  accessories: ['signage', 'drainage']
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/road-estimation/calculate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  },
  (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('Response:', data.substring(0, 500));
    });
  }
);

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(body);
req.end();
