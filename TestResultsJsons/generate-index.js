// Local script to generate index.json for Cucumber reports
// Usage: node generate-index.js (run from TestResultsJsons directory)
const fs = require('fs');
const path = require('path');

const reportsDir = process.cwd();
const files = fs.readdirSync(reportsDir)
  .filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'generate-index.js');

const index = files.map(filename => {
  const filePath = path.join(reportsDir, filename);
  let json;
  try {
    json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
  // Always use static name
  let name = 'Automation Test Results';
  // Try to get date from meta, else use file mtime
  let date = '';
  if (Array.isArray(json) && json[0] && json[0].metadata && json[0].metadata.timestamp) {
    date = json[0].metadata.timestamp;
  } else if (Array.isArray(json) && json[0] && json[0].elements && json[0].elements[0] && json[0].elements[0].start_timestamp) {
    date = json[0].elements[0].start_timestamp;
  } else {
    const stats = fs.statSync(filePath);
    date = stats.mtime.toISOString();
  }
  // id: Automation-Test-Results-<timestamp>
  const tsForId = date.replace(/[:.]/g, '-');
  const id = `Automation-Test-Results-${tsForId}`;
  const newFile = id + '.json';
  // Rename file if needed
  if (filename !== newFile) {
    fs.renameSync(filePath, path.join(reportsDir, newFile));
    console.log(`Renamed ${filename} -> ${newFile}`);
  }
  return {
    id,
    name,
    date
  };
}).filter(Boolean);

fs.writeFileSync(
  path.join(reportsDir, 'index.json'),
  JSON.stringify(index, null, 2)
);
console.log('index.json updated with', index.length, 'reports.');
