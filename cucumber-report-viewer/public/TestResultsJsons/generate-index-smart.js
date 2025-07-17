// Improved script: generates index.json and suggests/renames files to <feature-title>-<timestamp>.json
// Usage: node generate-index-smart.js (run from TestResultsJsons directory)
const fs = require('fs');
const path = require('path');

function sanitize(str) {
  return str
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60); // limit length
}

const reportsDir = process.cwd();
const files = fs.readdirSync(reportsDir)
  .filter(f => f.endsWith('.json') && f !== 'index.json' && !f.startsWith('generate-index'));

const index = [];

files.forEach(filename => {
  const filePath = path.join(reportsDir, filename);
  let json;
  try {
    json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return;
  }
  let name = 'Automation Test Results';
  let timestamp = '';
  if (Array.isArray(json) && json[0]) {
    if (json[0].name) name = json[0].name;
    // Try to get timestamp from metadata, else from first scenario
    if (json[0].metadata && json[0].metadata.timestamp) {
      timestamp = json[0].metadata.timestamp;
    } else if (json[0].elements && json[0].elements[0] && json[0].elements[0].start_timestamp) {
      timestamp = json[0].elements[0].start_timestamp;
    }
  }
  // Fallback to file mtime if no timestamp
  if (!timestamp) {
    const stats = fs.statSync(filePath);
    timestamp = stats.mtime.toISOString();
  }
  // Format timestamp for filename
  const tsForFile = timestamp.replace(/[:.]/g, '-');
  const base = sanitize(name) + '-' + tsForFile;
  const newFile = base + '.json';
  // Rename file if needed
  if (filename !== newFile) {
    fs.renameSync(filePath, path.join(reportsDir, newFile));
    console.log(`Renamed ${filename} -> ${newFile}`);
  }
  index.push({
    id: base,
    name,
    date: timestamp
  });
});

fs.writeFileSync(
  path.join(reportsDir, 'index.json'),
  JSON.stringify(index, null, 2)
);
console.log('index.json updated with', index.length, 'reports.');
