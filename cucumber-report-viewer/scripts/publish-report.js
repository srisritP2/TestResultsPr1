#!/usr/bin/env node

/**
 * Script to publish uploaded reports to GitHub Pages
 * This script reads from localStorage data and saves to the TestResultsJsons directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const UPLOADS_DIR = path.join(__dirname, '../public/TestResultsJsons');
const INDEX_SCRIPT = path.join(UPLOADS_DIR, 'generate-index-enhanced.js');

/**
 * Save report data to TestResultsJsons directory
 */
function saveReportToDirectory(reportId, reportData) {
  try {
    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportId}-${timestamp}.json`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Parse and validate JSON
    const jsonData = JSON.parse(reportData);
    
    // Write file with proper formatting
    fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2));
    
    console.log(`✅ Report saved: ${filename}`);
    return filename;
  } catch (error) {
    console.error('❌ Error saving report:', error.message);
    throw error;
  }
}

/**
 * Generate updated index.json
 */
function generateIndex() {
  try {
    console.log('🔄 Generating updated index...');
    
    // Change to the TestResultsJsons directory
    process.chdir(UPLOADS_DIR);
    
    // Run the index generation script
    execSync('node generate-index-enhanced.js --verbose', { stdio: 'inherit' });
    
    console.log('✅ Index generated successfully');
  } catch (error) {
    console.error('❌ Error generating index:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
Usage: node publish-report.js <reportId> <reportData>

Example:
  node publish-report.js "report-123" '{"features": [...]}'

Or pipe JSON data:
  echo '{"features": [...]}' | node publish-report.js "report-123"
    `);
    process.exit(1);
  }

  const reportId = args[0];
  let reportData = args[1];

  // If no data provided as argument, try to read from stdin
  if (!reportData || reportData === '-') {
    const stdin = process.stdin;
    let data = '';
    
    stdin.setEncoding('utf8');
    stdin.on('data', chunk => data += chunk);
    stdin.on('end', () => {
      try {
        const filename = saveReportToDirectory(reportId, data);
        generateIndex();
        console.log(`🎉 Report published successfully: ${filename}`);
      } catch (error) {
        console.error('❌ Failed to publish report:', error.message);
        process.exit(1);
      }
    });
    
    return;
  }

  // Process data from command line argument
  try {
    const filename = saveReportToDirectory(reportId, reportData);
    generateIndex();
    console.log(`🎉 Report published successfully: ${filename}`);
  } catch (error) {
    console.error('❌ Failed to publish report:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  saveReportToDirectory,
  generateIndex
};