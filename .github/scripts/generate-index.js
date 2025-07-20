// Auto-generate index.json for Cucumber reports
// Usage: node generate-index.js (run from TestResultsJsons directory)
const fs = require('fs');
const path = require('path');

const reportsDir = process.cwd();
const files = fs.readdirSync(reportsDir)
  .filter(f => f.endsWith('.json') && f !== 'index.json');

const index = files.map(filename => {
  const filePath = path.join(reportsDir, filename);
  let json;
  try {
    json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
  // Try to get name from first feature, else fallback
  let name = 'Automation Test Results';
  if (Array.isArray(json) && json[0] && json[0].name) {
    name = json[0].name;
  }
  // Try to get date from meta, else use file mtime
  let date = '';
  if (Array.isArray(json) && json[0] && json[0].metadata && json[0].metadata.timestamp) {
    date = json[0].metadata.timestamp;
  } else {
    const stats = fs.statSync(filePath);
    date = stats.mtime.toISOString();
  }
  return {
    id: filename.replace(/\.json$/, ''),
    name,
    date
  };
}).filter(Boolean);

fs.writeFileSync(
  path.join(reportsDir, 'index.json'),
  JSON.stringify(index, null, 2)
);
console.log('index.json updated with', index.length, 'reports.');
