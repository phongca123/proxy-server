// pre-deploy.js
const { execSync } = require('child_process');
const apiKey = process.env.XAI_API_KEY;

if (!apiKey) {
  console.error('XAI_API_KEY is not set');
  process.exit(1);
}
console.log('API Key check passed');
process.exit(0);
