# Express.js API Implementation

## Overview

This document details the Express.js API implementation for the Cucumber Test Results Viewer backend. It covers middleware configuration, route handlers, error handling, security measures, and API design patterns.

## Express Application Setup

### Core Application Configuration

```javascript
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const morgan = require('morgan')

class ExpressAPIServer {
  constructor() {
    this.app = express()
    this.port = process.env.PORT || 3000
    this.environment = process.env.NODE_ENV || 'development'
    
    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
  }

  /**
   * Configure Express middleware stack
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }))

    // Compression middleware
    this.app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false
        }
        return compression.filter(req, res)
      },
      threshold: 1024 // Only compress responses > 1KB
    }))

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 900 // 15 minutes in seconds
      },
      standardHeaders: true,
      legacyHeaders: false
    })
    this.app.use('/api/', limiter)

    // CORS configuration
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
      ],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count']
    }))

    // Request logging
    if (this.environment === 'development') {
      this.app.use(morgan('dev'))
    } else {
      this.app.use(morgan('combined'))
    }

    // Body parsing middleware
    this.app.use(express.json({
      limit: '50mb',
      verify: (req, res, buf) => {
        req.rawBody = buf
      }
    }))
    
    this.app.use(express.urlencoded({
      extended: true,
      limit: '50mb'
    }))

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = this.generateRequestId()
      res.setHeader('X-Request-ID', req.id)
      next()
    })

    // Request timing middleware
    this.app.use((req, res, next) => {
      req.startTime = Date.now()
      
      const originalSend = res.send
      res.send = function(data) {
        const duration = Date.now() - req.startTime
        res.setHeader('X-Response-Time', `${duration}ms`)
        return originalSend.call(this, data)
      }
      
      next()
    })

    // Static file serving
    this.app.use('/static', express.static('public', {
      maxAge: '1d',
      etag: true,
      lastModified: true
    }))
  }

  /**
   * Get allowed CORS origins based on environment
   */
  getAllowedOrigins() {
    if (this.environment === 'production') {
      return [
        'https://srisritp2.github.io',
        'https://srisritp2.github.io/TestResults'
      ]
    }
    
    return [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:3000'
    ]
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
```

## API Route Handlers

### Reports API Routes

```javascript
const express = require('express')
const { body, param, query, validationResult } = require('express-validator')
const multer = require('multer')
const path = require('path')

class ReportsAPI {
  constructor(reportsService) {
    this.router = express.Router()
    this.reportsService = reportsService
    this.setupRoutes()
    this.setupFileUpload()
  }

  /**
   * Setup file upload middleware
   */
  setupFileUpload() {
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 1
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json') {
          cb(null, true)
        } else {
          cb(new Error('Only JSON files are allowed'), false)
        }
      }
    })
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // GET /api/reports - Get all reports with pagination and filtering
    this.router.get('/',
      [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('status').optional().isIn(['all', 'passed', 'failed', 'mixed']),
        query('search').optional().isString().trim(),
        query('sortBy').optional().isIn(['name', 'created', 'modified', 'status']),
        query('sortOrder').optional().isIn(['asc', 'desc'])
      ],
      this.validateRequest,
      this.getReports.bind(this)
    )

    // GET /api/reports/:filename - Get specific report
    this.router.get('/:filename',
      [
        param('filename').isString().matches(/^[a-zA-Z0-9._-]+\.json$/)
      ],
      this.validateRequest,
      this.getReport.bind(this)
    )

    // POST /api/reports - Upload new report
    this.router.post('/',
      this.upload.single('report'),
      [
        body('name').optional().isString().trim().isLength({ max: 100 }),
        body('description').optional().isString().trim().isLength({ max: 500 })
      ],
      this.validateRequest,
      this.uploadReport.bind(this)
    )

    // PUT /api/reports/:filename - Update report metadata
    this.router.put('/:filename',
      [
        param('filename').isString().matches(/^[a-zA-Z0-9._-]+\.json$/),
        body('name').optional().isString().trim().isLength({ max: 100 }),
        body('description').optional().isString().trim().isLength({ max: 500 }),
        body('tags').optional().isArray()
      ],
      this.validateRequest,
      this.updateReport.bind(this)
    )

    // DELETE /api/reports/:filename - Delete report
    this.router.delete('/:filename',
      [
        param('filename').isString().matches(/^[a-zA-Z0-9._-]+\.json$/),
        query('permanent').optional().isBoolean().toBoolean()
      ],
      this.validateRequest,
      this.deleteReport.bind(this)
    )

    // POST /api/reports/:filename/restore - Restore deleted report
    this.router.post('/:filename/restore',
      [
        param('filename').isString().matches(/^[a-zA-Z0-9._-]+\.json$/)
      ],
      this.validateRequest,
      this.restoreReport.bind(this)
    )
  }

  /**
   * Validation middleware
   */
  validateRequest(req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: errors.array(),
        timestamp: new Date().toISOString(),
        requestId: req.id
      })
    }
    next()
  }

  /**
   * GET /api/reports - Get all reports
   */
  async getReports(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        status = 'all',
        search = '',
        sortBy = 'created',
        sortOrder = 'desc'
      } = req.query

      const options = {
        page,
        limit,
        status,
        search,
        sortBy,
        sortOrder
      }

      const result = await this.reportsService.getAllReports(options)

      // Set pagination headers
      res.setHeader('X-Total-Count', result.total)
      res.setHeader('X-Page-Count', result.pages)
      res.setHeader('X-Current-Page', result.page)

      res.json({
        success: true,
        data: result.reports,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages,
          hasNext: result.page < result.pages,
          hasPrev: result.page > 1
        },
        filters: {
          status,
          search,
          sortBy,
          sortOrder
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/reports/:filename - Get specific report
   */
  async getReport(req, res, next) {
    try {
      const { filename } = req.params
      const { includeContent = true } = req.query

      const report = await this.reportsService.getReport(filename, {
        includeContent: includeContent === 'true'
      })

      if (!report) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Report '${filename}' not found`,
          timestamp: new Date().toISOString(),
          requestId: req.id
        })
      }

      res.json({
        success: true,
        data: report,
        timestamp: new Date().toISOString(),
        requestId: req.id
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/reports - Upload new report
   */
  async uploadReport(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No file uploaded',
          timestamp: new Date().toISOString(),
          requestId: req.id
        })
      }

      const { name, description } = req.body
      const fileBuffer = req.file.buffer

      // Parse and validate JSON
      let reportData
      try {
        reportData = JSON.parse(fileBuffer.toString('utf8'))
      } catch (parseError) {
        return res.status(400).json({
          error: 'Invalid JSON',
          message: 'Uploaded file is not valid JSON',
          details: parseError.message,
          timestamp: new Date().toISOString(),
          requestId: req.id
        })
      }

      // Validate Cucumber format
      const validation = await this.reportsService.validateCucumberFormat(reportData)
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid Format',
          message: 'File does not match expected Cucumber JSON format',
          details: validation.errors,
          timestamp: new Date().toISOString(),
          requestId: req.id
        })
      }

      // Generate filename if not provided
      const filename = req.file.originalname || `report-${Date.now()}.json`

      const result = await this.reportsService.saveReport(filename, reportData, {
        name,
        description,
        uploadedBy: req.user?.id || 'anonymous',
        uploadedAt: new Date().toISOString()
      })

      res.status(201).json({
        success: true,
        message: 'Report uploaded successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/reports/:filename - Update report metadata
   */
  async updateReport(req, res, next) {
    try {
      const { filename } = req.params
      const updates = req.body

      const result = await this.reportsService.updateReportMetadata(filename, updates)

      if (!result) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Report '${filename}' not found`,
          timestamp: new Date().toISOString(),
          requestId: req.id
        })
      }

      res.json({
        success: true,
        message: 'Report updated successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/reports/:filename - Delete report
   */
  async deleteReport(req, res, next) {
    try {
      const { filename } = req.params
      const { permanent = false } = req.query

      const result = await this.reportsService.deleteReport(filename, {
        permanent,
        deletedBy: req.user?.id || 'anonymous',
        deletedAt: new Date().toISOString()
      })

      if (!result) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Report '${filename}' not found`,
          timestamp: new Date().toISOString(),
          requestId: req.id
        })
      }

      res.json({
        success: true,
        message: permanent ? 'Report permanently deleted' : 'Report moved to trash',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/reports/:filename/restore - Restore deleted report
   */
  async restoreReport(req, res, next) {
    try {
      const { filename } = req.params

      const result = await this.reportsService.restoreReport(filename, {
        restoredBy: req.user?.id || 'anonymous',
        restoredAt: new Date().toISOString()
      })

      if (!result) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Deleted report '${filename}' not found`,
          timestamp: new Date().toISOString(),
          requestId: req.id
        })
      }

      res.json({
        success: true,
        message: 'Report restored successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id
      })
    } catch (error) {
      next(error)
    }
  }
}
```

### Statistics API Routes

```javascript
class StatsAPI {
  constructor(reportsService) {
    this.router = express.Router()
    this.reportsService = reportsService
    this.setupRoutes()
  }

  setupRoutes() {
    // GET /api/stats - Get overall statistics
    this.router.get('/', this.getOverallStats.bind(this))

    // GET /api/stats/trends - Get trend data
    this.router.get('/trends',
      [
        query('period').optional().isIn(['7d', '30d', '90d', '1y']),
        query('granularity').optional().isIn(['day', 'week', 'month'])
      ],
      this.validateRequest,
      this.getTrends.bind(this)
    )

    // GET /api/stats/features - Get feature-level statistics
    this.router.get('/features', this.getFeatureStats.bind(this))

    // GET /api/stats/performance - Get performance metrics
    this.router.get('/performance', this.getPerformanceStats.bind(this))
  }

  validateRequest(req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
        timestamp: new Date().toISOString(),
        requestId: req.id
      })
    }
    next()
  }

  async getOverallStats(req, res, next) {
    try {
      const stats = await this.reportsService.getOverallStatistics()

      res.json({
        success: true,
        data: {
          summary: {
            totalReports: stats.totalReports,
            totalScenarios: stats.totalScenarios,
            totalFeatures: stats.totalFeatures,
            overallPassRate: stats.overallPassRate
          },
          breakdown: {
            passed: stats.passed,
            failed: stats.failed,
            skipped: stats.skipped,
            pending: stats.pending
          },
          performance: {
            averageDuration: stats.averageDuration,
            totalDuration: stats.totalDuration,
            fastestScenario: stats.fastestScenario,
            slowestScenario: stats.slowestScenario
          },
          recent: {
            lastReport: stats.lastReport,
            recentReports: stats.recentReports.slice(0, 5)
          }
        },
        generatedAt: new Date().toISOString(),
        requestId: req.id
      })
    } catch (error) {
      next(error)
    }
  }

  async getTrends(req, res, next) {
    try {
      const { period = '30d', granularity = 'day' } = req.query

      const trends = await this.reportsService.getTrendData(period, granularity)

      res.json({
        success: true,
        data: {
          period,
          granularity,
          dataPoints: trends.dataPoints,
          summary: {
            totalDataPoints: trends.dataPoints.length,
            averagePassRate: trends.averagePassRate,
            trend: trends.trend, // 'improving', 'declining', 'stable'
            changePercent: trends.changePercent
          }
        },
        generatedAt: new Date().toISOString(),
        requestId: req.id
      })
    } catch (error) {
      next(error)
    }
  }

  async getFeatureStats(req, res, next) {
    try {
      const featureStats = await this.reportsService.getFeatureStatistics()

      res.json({
        success: true,
        data: {
          features: featureStats.map(feature => ({
            name: feature.name,
            totalScenarios: feature.totalScenarios,
            passRate: feature.passRate,
            averageDuration: feature.averageDuration,
            lastRun: feature.lastRun,
            trend: feature.trend
          })),
          summary: {
            totalFeatures: featureStats.length,
            averagePassRate: featureStats.reduce((sum, f) => sum + f.passRate, 0) / featureStats.length,
            mostReliable: featureStats.sort((a, b) => b.passRate - a.passRate)[0],
            leastReliable: featureStats.sort((a, b) => a.passRate - b.passRate)[0]
          }
        },
        generatedAt: new Date().toISOString(),
        requestId: req.id
      })
    } catch (error) {
      next(error)
    }
  }
}
```

## Middleware Implementation

### Authentication Middleware

```javascript
const jwt = require('jsonwebtoken')

class AuthMiddleware {
  constructor(secretKey) {
    this.secretKey = secretKey
  }

  /**
   * JWT authentication middleware
   */
  authenticate(req, res, next) {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
        timestamp: new Date().toISOString(),
        requestId: req.id
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, this.secretKey)
      req.user = decoded
      next()
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
        requestId: req.id
      })
    }
  }

  /**
   * Optional authentication middleware
   */
  optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const decoded = jwt.verify(token, this.secretKey)
        req.user = decoded
      } catch (error) {
        // Ignore invalid tokens for optional auth
        req.user = null
      }
    }
    
    next()
  }

  /**
   * Role-based authorization middleware
   */
  authorize(roles = []) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          requestId: req.id
        })
      }

      if (roles.length > 0 && !roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
          requiredRoles: roles,
          userRole: req.user.role,
          timestamp: new Date().toISOString(),
          requestId: req.id
        })
      }

      next()
    }
  }
}
```

### Caching Middleware

```javascript
const NodeCache = require('node-cache')

class CacheMiddleware {
  constructor(options = {}) {
    this.cache = new NodeCache({
      stdTTL: options.ttl || 300, // 5 minutes default
      checkperiod: options.checkPeriod || 60, // Check for expired keys every minute
      useClones: false
    })
  }

  /**
   * Cache GET requests
   */
  cacheGet(ttl = 300) {
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next()
      }

      const key = this.generateCacheKey(req)
      const cachedResponse = this.cache.get(key)

      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT')
        res.setHeader('X-Cache-Key', key)
        return res.json(cachedResponse)
      }

      // Override res.json to cache the response
      const originalJson = res.json
      res.json = (data) => {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.cache.set(key, data, ttl)
        }
        
        res.setHeader('X-Cache', 'MISS')
        res.setHeader('X-Cache-Key', key)
        return originalJson.call(res, data)
      }

      next()
    }
  }

  /**
   * Invalidate cache for specific patterns
   */
  invalidateCache(pattern) {
    const keys = this.cache.keys()
    const matchingKeys = keys.filter(key => key.includes(pattern))
    
    matchingKeys.forEach(key => {
      this.cache.del(key)
    })

    return matchingKeys.length
  }

  /**
   * Generate cache key from request
   */
  generateCacheKey(req) {
    const { method, originalUrl, query, user } = req
    const userId = user?.id || 'anonymous'
    
    return `${method}:${originalUrl}:${JSON.stringify(query)}:${userId}`
  }

  /**
   * Cache invalidation middleware
   */
  invalidateOnMutation() {
    return (req, res, next) => {
      // Invalidate cache on non-GET requests
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const pattern = req.baseUrl || req.path.split('/')[1]
        const invalidatedCount = this.invalidateCache(pattern)
        
        res.setHeader('X-Cache-Invalidated', invalidatedCount.toString())
      }

      next()
    }
  }
}
```

## Error Handling

### Global Error Handler

```javascript
class ErrorHandler {
  /**
   * Global error handling middleware
   */
  static handle(error, req, res, next) {
    console.error(`[${req.id}] Error:`, error)

    // Default error response
    let statusCode = error.statusCode || 500
    let message = error.message || 'Internal Server Error'
    let details = null

    // Handle specific error types
    if (error.name === 'ValidationError') {
      statusCode = 400
      message = 'Validation Error'
      details = error.details
    } else if (error.name === 'CastError') {
      statusCode = 400
      message = 'Invalid ID format'
    } else if (error.code === 'ENOENT') {
      statusCode = 404
      message = 'File not found'
    } else if (error.code === 'EACCES') {
      statusCode = 403
      message = 'Permission denied'
    } else if (error.code === 'EMFILE' || error.code === 'ENFILE') {
      statusCode = 503
      message = 'Service temporarily unavailable'
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      message = 'Internal Server Error'
      details = null
    }

    const errorResponse = {
      error: true,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId: req.id,
      path: req.originalUrl,
      method: req.method
    }

    if (details) {
      errorResponse.details = details
    }

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack
    }

    res.status(statusCode).json(errorResponse)
  }

  /**
   * 404 handler for unmatched routes
   */
  static notFound(req, res) {
    res.status(404).json({
      error: true,
      message: 'Route not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      requestId: req.id,
      path: req.originalUrl,
      method: req.method,
      availableRoutes: [
        'GET /api/health',
        'GET /api/reports',
        'POST /api/reports',
        'GET /api/stats'
      ]
    })
  }

  /**
   * Async error wrapper
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next)
    }
  }
}
```

## API Documentation

### OpenAPI/Swagger Integration

```javascript
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cucumber Report Viewer API',
      version: '1.0.0',
      description: 'API for managing Cucumber test reports',
      contact: {
        name: 'API Support',
        url: 'https://github.com/srisritP2/TestResults'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://your-domain.com/api',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        Report: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            features: { type: 'number' },
            scenarios: { type: 'number' },
            status: { type: 'string', enum: ['passed', 'failed', 'mixed'] },
            created: { type: 'string', format: 'date-time' },
            modified: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'boolean' },
            message: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js'] // Path to the API files
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

// Setup Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Cucumber Report Viewer API'
}))
```

This comprehensive Express.js API implementation provides a robust, secure, and well-documented backend for the Cucumber Test Results Viewer application.