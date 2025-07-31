#!/usr/bin/env node

/**
 * Pre-commit hook to automatically fix report formats before committing
 * This ensures all reports are in the correct format before they reach GitHub
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '../public/TestResultsJsons');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function checkForReportChanges() {
  try {
    // Check if any JSON files in TestResultsJsons are staged
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(file => 
        file.includes('TestResultsJsons') && 
        file.endsWith('.json') &&
        !file.includes('index.json') &&
        !file.includes('stats.json')
      );

    return stagedFiles;
  } catch (error) {
    log('Error checking staged files', 'error');
    return [];
  }
}

function runFormatFixer() {
  try {
    log('🔧 Running report format fixer...', 'info');
    
    const fixerScript = path.join(__dirname, 'fix-report-formats.js');
    execSync(`node "${fixerScript}"`, { stdio: 'inherit' });
    
    log('✅ Report formats fixed', 'success');
    return true;
  } catch (error) {
    log('❌ Error running format fixer', 'error');
    return false;
  }
}

function stageFixedFiles() {
  try {
    // Stage any files that were fixed
    execSync(`git add "${REPORTS_DIR}/*.json"`, { stdio: 'inherit' });
    log('📁 Staged fixed files', 'info');
    return true;
  } catch (error) {
    log('Warning: Could not stage fixed files', 'warning');
    return false;
  }
}

function main() {
  log('🚀 Pre-commit hook: Checking report formats...', 'info');
  
  const changedReports = checkForReportChanges();
  
  if (changedReports.length === 0) {
    log('ℹ️ No report files changed, skipping format check', 'info');
    process.exit(0);
  }
  
  log(`📋 Found ${changedReports.length} changed report files:`, 'info');
  changedReports.forEach(file => log(`  - ${file}`, 'info'));
  
  // Run the format fixer
  const success = runFormatFixer();
  
  if (!success) {
    log('❌ Pre-commit hook failed: Could not fix report formats', 'error');
    log('💡 Try running: npm run fix-reports', 'info');
    process.exit(1);
  }
  
  // Stage the fixed files
  stageFixedFiles();
  
  log('🎉 Pre-commit hook completed successfully!', 'success');
  log('📝 Report formats have been automatically fixed and staged', 'info');
  
  process.exit(0);
}

// Run the hook
main();