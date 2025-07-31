#!/usr/bin/env node

/**
 * Auto-fix script to ensure all report files are in correct Cucumber JSON format
 * Converts {features: [...]} to [...] format and regenerates index
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPORTS_DIR = path.join(__dirname, '../public/TestResultsJsons');

class ReportFormatFixer {
  constructor() {
    this.fixedCount = 0;
    this.errorCount = 0;
    this.processedFiles = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Check if a file needs format fixing
   */
  needsFormatFix(data) {
    return (
      typeof data === 'object' && 
      data !== null && 
      data.features && 
      Array.isArray(data.features) &&
      !Array.isArray(data)
    );
  }

  /**
   * Fix the format of a single report file
   */
  fixReportFormat(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (this.needsFormatFix(data)) {
        // Convert {features: [...]} to [...]
        const fixedData = data.features;
        
        // Write back the fixed format
        fs.writeFileSync(filePath, JSON.stringify(fixedData, null, 2));
        
        this.log(`Fixed format: ${path.basename(filePath)}`, 'success');
        this.fixedCount++;
        this.processedFiles.push({
          file: path.basename(filePath),
          action: 'fixed',
          from: '{features: [...]}',
          to: '[...]'
        });
        
        return true;
      } else if (Array.isArray(data)) {
        this.log(`Already correct format: ${path.basename(filePath)}`, 'info');
        this.processedFiles.push({
          file: path.basename(filePath),
          action: 'skipped',
          reason: 'already correct format'
        });
        
        return false;
      } else {
        this.log(`Unknown format: ${path.basename(filePath)}`, 'warning');
        this.processedFiles.push({
          file: path.basename(filePath),
          action: 'skipped',
          reason: 'unknown format'
        });
        
        return false;
      }
      
    } catch (error) {
      this.log(`Error processing ${path.basename(filePath)}: ${error.message}`, 'error');
      this.errorCount++;
      this.processedFiles.push({
        file: path.basename(filePath),
        action: 'error',
        error: error.message
      });
      
      return false;
    }
  }

  /**
   * Process all JSON files in the reports directory
   */
  processAllReports() {
    this.log('Starting report format fixing...', 'info');
    
    if (!fs.existsSync(REPORTS_DIR)) {
      this.log(`Reports directory not found: ${REPORTS_DIR}`, 'error');
      return false;
    }

    // Find all JSON files (excluding system files)
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => 
        f.endsWith('.json') && 
        f !== 'index.json' && 
        f !== 'stats.json' &&
        !f.startsWith('generate-index')
      );

    this.log(`Found ${files.length} report files to process`, 'info');

    // Process each file
    files.forEach(filename => {
      const filePath = path.join(REPORTS_DIR, filename);
      this.fixReportFormat(filePath);
    });

    return true;
  }

  /**
   * Regenerate the index after fixing formats
   */
  regenerateIndex() {
    try {
      this.log('Regenerating index...', 'info');
      
      const indexScript = path.join(REPORTS_DIR, 'generate-index-enhanced.js');
      if (!fs.existsSync(indexScript)) {
        this.log('Index generation script not found', 'error');
        return false;
      }

      // Change to reports directory and run the script
      const originalCwd = process.cwd();
      process.chdir(REPORTS_DIR);
      
      execSync('node generate-index-enhanced.js --verbose', { stdio: 'inherit' });
      
      // Change back
      process.chdir(originalCwd);
      
      this.log('Index regenerated successfully', 'success');
      return true;
      
    } catch (error) {
      this.log(`Error regenerating index: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Generate a summary report
   */
  generateSummary() {
    this.log('\n📊 SUMMARY REPORT', 'info');
    this.log(`Files processed: ${this.processedFiles.length}`, 'info');
    this.log(`Files fixed: ${this.fixedCount}`, 'success');
    this.log(`Errors: ${this.errorCount}`, this.errorCount > 0 ? 'error' : 'info');
    
    if (this.processedFiles.length > 0) {
      this.log('\n📋 DETAILED RESULTS:', 'info');
      this.processedFiles.forEach(result => {
        const status = {
          fixed: '✅',
          skipped: '⏭️',
          error: '❌'
        }[result.action];
        
        console.log(`  ${status} ${result.file} - ${result.action}`);
        if (result.reason) console.log(`      Reason: ${result.reason}`);
        if (result.error) console.log(`      Error: ${result.error}`);
        if (result.from && result.to) console.log(`      Converted: ${result.from} → ${result.to}`);
      });
    }
  }

  /**
   * Main execution function
   */
  run() {
    this.log('🚀 Starting Cucumber Report Format Fixer', 'info');
    
    const processed = this.processAllReports();
    if (!processed) {
      this.log('Failed to process reports', 'error');
      process.exit(1);
    }

    if (this.fixedCount > 0) {
      const indexRegenerated = this.regenerateIndex();
      if (!indexRegenerated) {
        this.log('Warning: Index regeneration failed', 'warning');
      }
    } else {
      this.log('No files needed fixing, skipping index regeneration', 'info');
    }

    this.generateSummary();
    
    if (this.errorCount > 0) {
      this.log('⚠️ Completed with errors', 'warning');
      process.exit(1);
    } else {
      this.log('🎉 All done! Reports are now in correct format', 'success');
      process.exit(0);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new ReportFormatFixer();
  fixer.run();
}

module.exports = ReportFormatFixer;