# Node.js Backend Implementation

## Overview

The Cucumber Test Results Viewer includes a Node.js backend server built with Express.js that provides API endpoints for report management, file operations, and server-side functionality. This document explains the backend architecture, implementation details, and API design.

## Server Architecture

### Main Server File (`server.js`)

```javascript
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')

class CucumberReportServer {
  constructor() {
    this.app = express()
    this.port = process.env.PORT || 3000
    this.reportsDir = path.join(__dirname, 'public', 'TestResultsJsons')
    this.maxFileSize = 50 * 1024 * 1024 // 50MB
    
    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://srisritp2.github.io'] 
        : ['http://localhost:8080', 'http://127.0.0.1:8080'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }))

    // Body parsing middleware
    this.app.use(express.json({ limit: '50mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }))

    // Static file serving
    this.app.use('/static', express.static(path.join(__dirname, 'public')))

    // Request logging middleware
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] ${req.method} ${req.url}`)
      next()
    })

    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader('X-XSS-Protection', '1; mode=block')
      next()
    })
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/api/health', this.handleHealthCheck.bind(this))

    // Report management endpoints
    this.app.get('/api/reports', this.handleGetReports.bind(this))
    this.app.get('/api/reports/:filename', this.handleGetReport.bind(this))
    this.app.post('/api/reports', this.handleUploadReport.bind(this))
    this.app.delete('/api/reports/:filename', this.handleDeleteReport.bind(this))

    // Statistics endpoint
    this.app.get('/api/stats', this.handleGetStats.bind(this))

    // File management endpoints
    this.app.get('/api/files', this.handleGetFiles.bind(this))
    this.app.post('/api/files/cleanup', this.handleCleanupFiles.bind(this))

    // Index management
    this.app.post('/api/index/regenerate', this.handleRegenerateIndex.bind(this))

    // Catch-all for SPA routing
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'))
    })
  }

  /**
   * Setup error handling middleware
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`,
        timestamp: new Date().toISOString()
      })
    })

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Server Error:', error)
      
      const statusCode = error.statusCode || 500
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : error.message

      res.status(statusCode).json({
        error: 'Server Error',
        message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      })
    })
  }

  /**
   * Health check endpoint handler
   */
  async handleHealthCheck(req, res) {
    try {
      const stats = await this.getSystemStats()
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        node_version: process.version,
        memory: process.memoryUsage(),
        ...stats
      })
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Get all reports handler
   */
  async handleGetReports(req, res) {
    try {
      const { page = 1, limit = 10, status, search } = req.query
      
      const reports = await this.getAllReports()
      let filteredReports = reports

      // Apply filters
      if (status && status !== 'all') {
        filteredReports = filteredReports.filter(report => report.status === status)
      }

      if (search) {
        const searchLower = search.toLowerCase()
        filteredReports = filteredReports.filter(report =>
          report.name.toLowerCase().includes(searchLower) ||
          report.description?.toLowerCase().includes(searchLower)
        )
      }

      // Apply pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + parseInt(limit)
      const paginatedReports = filteredReports.slice(startIndex, endIndex)

      res.json({
        reports: paginatedReports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredReports.length,
          pages: Math.ceil(filteredReports.length / limit)
        },
        filters: { status, search }
      })
    } catch (error) {
      console.error('Error getting reports:', error)
      res.status(500).json({
        error: 'Failed to retrieve reports',
        message: error.message
      })
    }
  }

  /**
   * Get specific report handler
   */
  async handleGetReport(req, res) {
    try {
      const { filename } = req.params
      
      if (!this.isValidFilename(filename)) {
        return res.status(400).json({
          error: 'Invalid filename',
          message: 'Filename contains invalid characters'
        })
      }

      const reportPath = path.join(this.reportsDir, filename)
      
      // Check if file exists
      try {
        await fs.access(reportPath)
      } catch {
        return res.status(404).json({
          error: 'Report not found',
          message: `Report ${filename} does not exist`
        })
      }

      // Read and parse report
      const reportData = await fs.readFile(reportPath, 'utf8')
      const parsedReport = JSON.parse(reportData)

      // Add metadata
      const stats = await fs.stat(reportPath)
      const reportWithMeta = {
        filename,
        data: parsedReport,
        metadata: {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          features: parsedReport.length,
          scenarios: this.countScenarios(parsedReport)
        }
      }

      res.json(reportWithMeta)
    } catch (error) {
      console.error('Error getting report:', error)
      
      if (error instanceof SyntaxError) {
        return res.status(400).json({
          error: 'Invalid JSON',
          message: 'Report file contains invalid JSON'
        })
      }

      res.status(500).json({
        error: 'Failed to retrieve report',
        message: error.message
      })
    }
  }

  /**
   * Upload report handler
   */
  async handleUploadReport(req, res) {
    try {
      const { filename, data, metadata = {} } = req.body

      if (!filename || !data) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'filename and data are required'
        })
      }

      if (!this.isValidFilename(filename)) {
        return res.status(400).json({
          error: 'Invalid filename',
          message: 'Filename contains invalid characters'
        })
      }

      // Validate JSON data
      let parsedData
      try {
        parsedData = typeof data === 'string' ? JSON.parse(data) : data
      } catch {
        return res.status(400).json({
          error: 'Invalid JSON',
          message: 'Report data is not valid JSON'
        })
      }

      // Validate Cucumber format
      const validation = this.validateCucumberFormat(parsedData)
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid Cucumber format',
          message: 'Report does not match expected Cucumber JSON format',
          details: validation.errors
        })
      }

      // Check file size
      const dataSize = JSON.stringify(parsedData).length
      if (dataSize > this.maxFileSize) {
        return res.status(413).json({
          error: 'File too large',
          message: `File size exceeds maximum allowed size of ${this.maxFileSize} bytes`
        })
      }

      // Ensure reports directory exists
      await fs.mkdir(this.reportsDir, { recursive: true })

      // Write report file
      const reportPath = path.join(this.reportsDir, filename)
      await fs.writeFile(reportPath, JSON.stringify(parsedData, null, 2))

      // Update index
      await this.updateReportsIndex()

      res.status(201).json({
        message: 'Report uploaded successfully',
        filename,
        size: dataSize,
        features: parsedData.length,
        scenarios: this.countScenarios(parsedData),
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error uploading report:', error)
      res.status(500).json({
        error: 'Failed to upload report',
        message: error.message
      })
    }
  }

  /**
   * Delete report handler
   */
  async handleDeleteReport(req, res) {
    try {
      const { filename } = req.params
      const { permanent = false } = req.query

      if (!this.isValidFilename(filename)) {
        return res.status(400).json({
          error: 'Invalid filename',
          message: 'Filename contains invalid characters'
        })
      }

      const reportPath = path.join(this.reportsDir, filename)

      // Check if file exists
      try {
        await fs.access(reportPath)
      } catch {
        return res.status(404).json({
          error: 'Report not found',
          message: `Report ${filename} does not exist`
        })
      }

      if (permanent === 'true') {
        // Permanent deletion
        await fs.unlink(reportPath)
        
        res.json({
          message: 'Report permanently deleted',
          filename,
          type: 'permanent',
          timestamp: new Date().toISOString()
        })
      } else {
        // Soft deletion (move to .deleted folder)
        const deletedDir = path.join(this.reportsDir, '.deleted')
        await fs.mkdir(deletedDir, { recursive: true })
        
        const deletedPath = path.join(deletedDir, `${filename}.${Date.now()}`)
        await fs.rename(reportPath, deletedPath)
        
        res.json({
          message: 'Report moved to deleted folder',
          filename,
          type: 'soft',
          recoverable: true,
          timestamp: new Date().toISOString()
        })
      }

      // Update index
      await this.updateReportsIndex()
    } catch (error) {
      console.error('Error deleting report:', error)
      res.status(500).json({
        error: 'Failed to delete report',
        message: error.message
      })
    }
  }

  /**
   * Get statistics handler
   */
  async handleGetStats(req, res) {
    try {
      const reports = await this.getAllReports()
      
      const stats = {
        totalReports: reports.length,
        totalScenarios: 0,
        totalFeatures: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        totalDuration: 0,
        averageDuration: 0,
        passRate: 0,
        recentReports: reports.slice(0, 5),
        oldestReport: null,
        newestReport: null
      }

      if (reports.length > 0) {
        // Calculate aggregated statistics
        reports.forEach(report => {
          stats.totalFeatures += report.features || 0
          stats.totalScenarios += report.scenarios || 0
          stats.passed += report.passed || 0
          stats.failed += report.failed || 0
          stats.skipped += report.skipped || 0
          stats.totalDuration += report.duration || 0
        })

        stats.averageDuration = stats.totalDuration / stats.totalScenarios || 0
        stats.passRate = stats.totalScenarios > 0 
          ? Math.round((stats.passed / stats.totalScenarios) * 100) 
          : 0

        // Find oldest and newest reports
        const sortedByDate = reports.sort((a, b) => new Date(a.created) - new Date(b.created))
        stats.oldestReport = sortedByDate[0]
        stats.newestReport = sortedByDate[sortedByDate.length - 1]
      }

      res.json(stats)
    } catch (error) {
      console.error('Error getting stats:', error)
      res.status(500).json({
        error: 'Failed to retrieve statistics',
        message: error.message
      })
    }
  }

  /**
   * Get all reports from filesystem
   */
  async getAllReports() {
    try {
      const files = await fs.readdir(this.reportsDir)
      const jsonFiles = files.filter(file => file.endsWith('.json') && !file.startsWith('.'))

      const reports = await Promise.all(
        jsonFiles.map(async (filename) => {
          try {
            const filePath = path.join(this.reportsDir, filename)
            const stats = await fs.stat(filePath)
            const content = await fs.readFile(filePath, 'utf8')
            const data = JSON.parse(content)

            return {
              filename,
              name: this.extractReportName(filename),
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              features: data.length,
              scenarios: this.countScenarios(data),
              status: this.calculateReportStatus(data)
            }
          } catch (error) {
            console.warn(`Error processing report ${filename}:`, error.message)
            return null
          }
        })
      )

      return reports.filter(report => report !== null)
    } catch (error) {
      console.error('Error reading reports directory:', error)
      return []
    }
  }

  /**
   * Validate Cucumber JSON format
   */
  validateCucumberFormat(data) {
    const errors = []

    if (!Array.isArray(data)) {
      errors.push('Root must be an array of features')
      return { isValid: false, errors }
    }

    data.forEach((feature, index) => {
      if (!feature.name) {
        errors.push(`Feature ${index}: Missing name`)
      }

      if (!Array.isArray(feature.elements)) {
        errors.push(`Feature ${index}: Missing elements array`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Count scenarios in report data
   */
  countScenarios(data) {
    if (!Array.isArray(data)) return 0
    
    return data.reduce((count, feature) => {
      return count + (feature.elements ? feature.elements.length : 0)
    }, 0)
  }

  /**
   * Calculate report status based on scenarios
   */
  calculateReportStatus(data) {
    if (!Array.isArray(data)) return 'unknown'

    let passed = 0
    let failed = 0
    let total = 0

    data.forEach(feature => {
      if (feature.elements) {
        feature.elements.forEach(scenario => {
          total++
          const scenarioStatus = this.getScenarioStatus(scenario)
          if (scenarioStatus === 'passed') passed++
          else if (scenarioStatus === 'failed') failed++
        })
      }
    })

    if (total === 0) return 'empty'
    if (failed === 0) return 'passed'
    if (passed === 0) return 'failed'
    return 'mixed'
  }

  /**
   * Get scenario status from steps
   */
  getScenarioStatus(scenario) {
    if (!scenario.steps || scenario.steps.length === 0) return 'skipped'

    const stepStatuses = scenario.steps.map(step => step.result?.status)
    
    if (stepStatuses.includes('failed')) return 'failed'
    if (stepStatuses.includes('skipped')) return 'skipped'
    if (stepStatuses.every(status => status === 'passed')) return 'passed'
    
    return 'unknown'
  }

  /**
   * Extract report name from filename
   */
  extractReportName(filename) {
    return filename
      .replace('.json', '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  /**
   * Validate filename for security
   */
  isValidFilename(filename) {
    // Check for path traversal attempts and invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
    const pathTraversal = /\.\./
    
    return !invalidChars.test(filename) && 
           !pathTraversal.test(filename) && 
           filename.length > 0 && 
           filename.length < 255
  }

  /**
   * Update reports index file
   */
  async updateReportsIndex() {
    try {
      const reports = await this.getAllReports()
      const indexPath = path.join(this.reportsDir, 'index.json')
      
      const indexData = {
        reports: reports.map(report => ({
          filename: report.filename,
          name: report.name,
          created: report.created,
          modified: report.modified,
          features: report.features,
          scenarios: report.scenarios,
          status: report.status
        })),
        generated: new Date().toISOString(),
        total: reports.length
      }

      await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2))
      console.log('Reports index updated successfully')
    } catch (error) {
      console.error('Error updating reports index:', error)
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    try {
      const reportsCount = (await this.getAllReports()).length
      const diskUsage = await this.getDiskUsage()
      
      return {
        reports_count: reportsCount,
        disk_usage: diskUsage,
        reports_directory: this.reportsDir
      }
    } catch (error) {
      console.warn('Error getting system stats:', error.message)
      return {}
    }
  }

  /**
   * Get disk usage for reports directory
   */
  async getDiskUsage() {
    try {
      const files = await fs.readdir(this.reportsDir)
      let totalSize = 0

      for (const file of files) {
        const filePath = path.join(this.reportsDir, file)
        const stats = await fs.stat(filePath)
        if (stats.isFile()) {
          totalSize += stats.size
        }
      }

      return {
        total_bytes: totalSize,
        total_mb: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        file_count: files.length
      }
    } catch (error) {
      return { error: error.message }
    }
  }

  /**
   * Start the server
   */
  start() {
    this.app.listen(this.port, () => {
      console.log(`🥒 Cucumber Report Server running on port ${this.port}`)
      console.log(`📁 Reports directory: ${this.reportsDir}`)
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`📊 Health check: http://localhost:${this.port}/api/health`)
    })
  }
}

// Create and start server
const server = new CucumberReportServer()
server.start()

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

module.exports = CucumberReportServer
```

## API Endpoints Documentation

### Health Check
- **GET** `/api/health`
- Returns server health status and system information

### Reports Management
- **GET** `/api/reports` - Get all reports with pagination and filtering
- **GET** `/api/reports/:filename` - Get specific report by filename
- **POST** `/api/reports` - Upload new report
- **DELETE** `/api/reports/:filename` - Delete report (soft or permanent)

### Statistics
- **GET** `/api/stats` - Get aggregated statistics across all reports

### File Management
- **GET** `/api/files` - List all files in reports directory
- **POST** `/api/files/cleanup` - Clean up deleted files

### Index Management
- **POST** `/api/index/regenerate` - Regenerate reports index

## Error Handling

The server implements comprehensive error handling:

1. **Input Validation** - Validates all incoming data
2. **File Security** - Prevents path traversal attacks
3. **JSON Validation** - Ensures valid Cucumber JSON format
4. **Size Limits** - Enforces file size restrictions
5. **Graceful Degradation** - Handles missing files and corrupted data

## Security Features

1. **CORS Configuration** - Proper cross-origin setup
2. **Security Headers** - XSS protection, content type validation
3. **Input Sanitization** - Filename and data validation
4. **File Size Limits** - Prevents DoS attacks
5. **Path Traversal Protection** - Secure file operations

## Performance Optimizations

1. **Async Operations** - Non-blocking file operations
2. **Caching** - In-memory caching for frequently accessed data
3. **Pagination** - Efficient data retrieval for large datasets
4. **Compression** - Gzip compression for responses
5. **Connection Pooling** - Efficient resource management

This Node.js backend provides a robust, secure, and performant API for the Cucumber Test Results Viewer application.