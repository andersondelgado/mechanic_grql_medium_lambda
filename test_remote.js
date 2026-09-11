const https = require('https');

const data = JSON.stringify({
  "request": {
    "flows": [
      {
        "name": "workflow_taller",
        "steps": [
          {
            "name": "GestionTallerProd_stats",
            "functionName": "GestionTallerProd_stats",
            "actions": [
              {
                "action": "custom_function",
                "body": {}
              }
            ]
          }
        ]
      }
    ]
  }
});

const apiKey = 'TW5kemFreFRiM0JVYWtRMlYxRkZlblJVV1VsYVowTkdiM1U0ZDNCTVNtNGlmQ0phUjFZeVdWaENkMHh0VW14aVIyUkJXakl4YUdGWGQzVlpNamwwWmtjeGFGa3lhSEJpYlZaSVdWaEthRm95VlQwPSItIk1uZHpha3hUYjNCVWFrUTJWMUZGZW5SVVdVbGFaME5HYjNVNGQzQk1TbTQ9Ii4iWVc1a00zSnpNRzR1WkdWMk0yeHZjRzB6Ym5RPQ==';

// Test each lambda id:
// 1. abbb76ce-1fc1-4267-977f-ddeb2f781286 (workflow_garage_node in .env)
// 2. 98d8376a-d882-4048-b1b7-0cdfadb3ec42 (workflow_taller_js in config.ts fallback)
// 3. 6d033980-4806-4e69-a3e8-a5f8f86d4cec (FICHA_TECNICA.md)
const ids = [
  'abbb76ce-1fc1-4267-977f-ddeb2f781286',
  '98d8376a-d882-4048-b1b7-0cdfadb3ec42',
  '6d033980-4806-4e69-a3e8-a5f8f86d4cec'
];

async function testId(id) {
  return new Promise((resolve) => {
    const url = new URL(`https://db-grql.com/api/secure-rQL/lambdas-json-run-node?db=codeLambdas&table=lambda&id=${id}&format=json`);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-grql-auth': apiKey,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        resolve({ id, status: res.statusCode, body });
      });
    });
    req.on('error', (e) => resolve({ id, error: e.message }));
    req.write(data);
    req.end();
  });
}

(async () => {
  for (const id of ids) {
    const res = await testId(id);
    console.log(`ID ${id}: status=${res.status}`);
    console.log(`Response: ${res.body || res.error}\n`);
  }
})();
