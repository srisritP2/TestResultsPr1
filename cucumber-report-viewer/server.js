#!/usr/bin/env node

/**
 * Simple Express server to handle report uploads and index generation
 * This allows the frontend to save files to the uploads folder and update index.json
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const UPLOADS_DIR = path.join(__dirname, 'public/TestResultsJsons');
const INDEX_SCRIPT = path.join(UPLOADS_DIR, 'generate-index-enhanced.js');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Save report data to TestResultsJsons directory
 */
function saveReportToDirectory(reportId, reportData) {
  try {
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportId}-${timestamp}.json`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Write file with proper formatting
    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    
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
    const originalCwd = process.cwd();
    process.chdir(UPLOADS_DIR);
    
    // Run the index generation script
    execSync('node generate-index-enhanced.js --verbose', { stdio: 'inherit' });
    
    // Change back to original directory
    process.chdir(originalCwd);
    
    console.log('✅ Index generated successfully');
  } catch (error) {
    console.error('❌ Error generating index:', error.message);
    throw error;
  }
}

// API Routes

/**
 * POST /api/upload-report
 * Upload a new report and update the index
 */
app.post('/api/upload-report', async (req, res) => {
  try {
    const { reportId, reportData, name } = req.body;
    
    if (!reportId || !reportData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportId and reportData'
      });
    }

    // Validate report data structure
    if (!reportData.features || !Array.isArray(reportData.features)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report data: missing features array'
      });
    }

    // Save the report file
    const filename = saveReportToDirectory(reportId, reportData);
    
    // Generate updated index
    generateIndex();
    
    res.json({
      success: true,
      message: 'Report uploaded successfully',
      filename,
      reportId,
      url: `/TestResultsJsons/${filename}`
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reports
 * Get list of available reports from index.json
 */
app.get('/api/reports', (req, res) => {
  try {
    const indexPath = path.join(UPLOADS_DIR, 'index.json');
    
    if (!fs.existsSync(indexPath)) {
      return res.json({
        success: true,
        reports: []
      });
    }
    
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    
    res.json({
      success: true,
      reports: indexData
    });
    
  } catch (error) {
    console.error('Error reading reports:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/reports/:filename
 * Delete a specific report file and update index
 */
app.delete('/api/reports/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(UPLOADS_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'Report file not found'
      });
    }
    
    // Delete the file
    fs.unlinkSync(filepath);
    
    // Regenerate index
    generateIndex();
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/regenerate-index
 * Manually trigger index regeneration
 */
app.post('/api/regenerate-index', (req, res) => {
  try {
    generateIndex();
    
    res.json({
      success: true,
      message: 'Index regenerated successfully'
    });
    
  } catch (error) {
    console.error('Index regeneration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uploadsDir: UPLOADS_DIR
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Report upload server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;