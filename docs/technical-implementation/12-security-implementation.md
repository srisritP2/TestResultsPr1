# Security Implementation

## Overview

This document outlines comprehensive security measures implemented in the Cucumber Test Results Viewer, covering frontend security, API security, data protection, authentication, authorization, and security best practices throughout the application stack.

## Frontend Security

### Content Security Policy (CSP)

```javascript
// public/index.html - CSP Meta Tag
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
  font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.github.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
">
```

```javascript
// server.js - Express CSP Configuration
const helmet = require('helmet')

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Vue.js development
        "https://cdn.jsdelivr.net",
        process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : null
      ].filter(Boolean),
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://api.github.com",
        process.env.NODE_ENV === 'development' ? "ws://localhost:*" : null
      ].filter(Boolean),
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false // Required for some Vue.js features
}))
```

### Input Sanitization and Validation

```javascript
// src/utils/sanitization.js
import DOMPurify from 'dompurify'

class SecurityUtils {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHTML(dirty) {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre', 'br'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    })
  }
  
  /**
   * Sanitize user input for display
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input
    }
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
  
  /**
   * Validate filename to prevent path traversal
   */
  static validateFilename(filename) {
    const invalidChars = /[<>:"/\\|?*\\x00-\\x1f]/
    const pathTraversal = /\\.\\./
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
    
    if (!filename || typeof filename !== 'string') {
      return { valid: false, error: 'Filename is required' }
    }
    
    if (filename.length > 255) {
      return { valid: false, error: 'Filename too long' }
    }
    
    if (invalidChars.test(filename)) {
      return { valid: false, error: 'Filename contains invalid characters' }
    }
    
    if (pathTraversal.test(filename)) {
      return { valid: false, error: 'Path traversal detected' }
    }
    
    if (reservedNames.test(filename.split('.')[0])) {
      return { valid: false, error: 'Reserved filename' }
    }
    
    return { valid: true }
  }
  
  /**
   * Validate JSON structure to prevent prototype pollution
   */
  static validateJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)
      
      // Check for prototype pollution attempts
      if (this.hasPrototypePollution(parsed)) {
        throw new Error('Potential prototype pollution detected')
      }
      
      return { valid: true, data: parsed }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }
  
  /**
   * Check for prototype pollution in object
   */
  static hasPrototypePollution(obj) {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype']
    
    const checkObject = (current, path = '') => {
      if (current === null || typeof current !== 'object') {
        return false
      }
      
      for (const key of Object.keys(current)) {
        if (dangerousKeys.includes(key)) {
          console.warn(`Dangerous key detected: ${path}.${key}`)
          return true
        }
        
        if (typeof current[key] === 'object' && current[key] !== null) {
          if (checkObject(current[key], `${path}.${key}`)) {
            return true
          }
        }
      }
      
      return false
    }
    
    return checkObject(obj)
  }
  
  /**
   * Generate secure random string
   */
  static generateSecureToken(length = 32) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  /**
   * Validate URL to prevent SSRF
   */
  static validateURL(url) {
    try {
      const parsed = new URL(url)
      
      // Only allow HTTPS in production
      if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
        return { valid: false, error: 'Only HTTPS URLs are allowed' }
      }
      
      // Block private IP ranges
      const hostname = parsed.hostname
      const privateRanges = [
        /^127\\./, // 127.0.0.0/8
        /^10\\./, // 10.0.0.0/8
        /^172\\.(1[6-9]|2[0-9]|3[0-1])\\./, // 172.16.0.0/12
        /^192\\.168\\./, // 192.168.0.0/16
        /^169\\.254\\./, // 169.254.0.0/16 (link-local)
        /^::1$/, // IPv6 loopback
        /^fc00:/, // IPv6 private
        /^fe80:/ // IPv6 link-local
      ]
      
      if (privateRanges.some(range => range.test(hostname))) {
        return { valid: false, error: 'Private IP addresses are not allowed' }
      }
      
      return { valid: true, url: parsed }
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' }
    }
  }
}

export default SecurityUtils
```

### Secure File Upload

```javascript
// src/components/SecureFileUploader.vue
<template>
  <div class="secure-file-uploader">
    <input
      ref="fileInput"
      type="file"
      :accept="allowedTypes.join(',')"
      @change="handleFileSelect"
      style="display: none"
    >
    
    <v-btn
      @click="$refs.fileInput.click()"
      :disabled="uploading"
      color="primary"
    >
      <v-icon left>mdi-upload</v-icon>
      Select File
    </v-btn>
    
    <div v-if="selectedFile" class="file-info">
      <p><strong>File:</strong> {{ selectedFile.name }}</p>
      <p><strong>Size:</strong> {{ formatFileSize(selectedFile.size) }}</p>
      <p><strong>Type:</strong> {{ selectedFile.type }}</p>
    </div>
    
    <v-alert
      v-if="securityWarning"
      type="warning"
      class="mt-3"
    >
      {{ securityWarning }}
    </v-alert>
  </div>
</template>

<script>
import SecurityUtils from '@/utils/sanitization'

export default {
  name: 'SecureFileUploader',
  
  data() {
    return {
      selectedFile: null,
      uploading: false,
      securityWarning: null,
      allowedTypes: ['.json'],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: ['application/json', 'text/plain']
    }
  },
  
  methods: {
    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return
      
      this.securityWarning = null
      
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.valid) {
        this.securityWarning = validation.error
        this.$refs.fileInput.value = ''
        return
      }
      
      this.selectedFile = file
      
      // Scan file content
      try {
        const content = await this.readFileContent(file)
        const contentValidation = this.validateFileContent(content)
        
        if (!contentValidation.valid) {
          this.securityWarning = contentValidation.error
          this.selectedFile = null
          this.$refs.fileInput.value = ''
          return
        }
        
        this.$emit('file-selected', { file, content: contentValidation.data })
      } catch (error) {
        this.securityWarning = 'Failed to read file content'
        this.selectedFile = null
        this.$refs.fileInput.value = ''
      }
    },
    
    validateFile(file) {
      // Check file size
      if (file.size > this.maxFileSize) {
        return {
          valid: false,
          error: `File size exceeds ${this.formatFileSize(this.maxFileSize)} limit`
        }
      }
      
      // Check MIME type
      if (!this.allowedMimeTypes.includes(file.type)) {
        return {
          valid: false,
          error: `File type ${file.type} is not allowed`
        }
      }
      
      // Validate filename
      const filenameValidation = SecurityUtils.validateFilename(file.name)
      if (!filenameValidation.valid) {
        return filenameValidation
      }
      
      // Check file extension
      const extension = file.name.toLowerCase().split('.').pop()
      if (!this.allowedTypes.some(type => type.slice(1) === extension)) {
        return {
          valid: false,
          error: `File extension .${extension} is not allowed`
        }
      }
      
      return { valid: true }
    },
    
    async readFileContent(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = (e) => {
          resolve(e.target.result)
        }
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'))
        }
        
        // Set timeout for large files
        setTimeout(() => {
          if (reader.readyState === FileReader.LOADING) {
            reader.abort()
            reject(new Error('File reading timeout'))
          }
        }, 30000) // 30 seconds
        
        reader.readAsText(file)
      })
    },
    
    validateFileContent(content) {
      // Validate JSON structure
      const jsonValidation = SecurityUtils.validateJSON(content)
      if (!jsonValidation.valid) {
        return jsonValidation
      }
      
      // Validate Cucumber report structure
      const cucumberValidation = this.validateCucumberStructure(jsonValidation.data)
      if (!cucumberValidation.valid) {
        return cucumberValidation
      }
      
      return { valid: true, data: jsonValidation.data }
    },
    
    validateCucumberStructure(data) {
      if (!Array.isArray(data)) {
        return {
          valid: false,
          error: 'Invalid Cucumber report: Root must be an array'
        }
      }
      
      // Check for required fields in features
      for (let i = 0; i < data.length; i++) {
        const feature = data[i]
        
        if (!feature.name || typeof feature.name !== 'string') {
          return {
            valid: false,
            error: `Invalid feature at index ${i}: Missing or invalid name`
          }
        }
        
        if (!Array.isArray(feature.elements)) {
          return {
            valid: false,
            error: `Invalid feature at index ${i}: Missing or invalid elements`
          }
        }
        
        // Validate scenarios
        for (let j = 0; j < feature.elements.length; j++) {
          const element = feature.elements[j]
          
          if (!element.name || typeof element.name !== 'string') {
            return {
              valid: false,
              error: `Invalid scenario at feature ${i}, element ${j}: Missing name`
            }
          }
          
          if (!Array.isArray(element.steps)) {
            return {
              valid: false,
              error: `Invalid scenario at feature ${i}, element ${j}: Missing steps`
            }
          }
        }
      }
      
      return { valid: true }
    },
    
    formatFileSize(bytes) {
      const sizes = ['B', 'KB', 'MB', 'GB']
      if (bytes === 0) return '0 B'
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }
  }
}
</script>
```

## API Security

### Authentication and Authorization

```javascript
// server/middleware/auth.js
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const bcrypt = require('bcrypt')

class AuthenticationMiddleware {
  static generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'cucumber-viewer',
      audience: 'cucumber-viewer-users'
    })
  }
  
  static verifyToken(req, res, next) {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No valid authentication token provided',
        code: 'NO_TOKEN'
      })
    }
    
    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'cucumber-viewer',
        audience: 'cucumber-viewer-users'
      })
      
      req.user = decoded
      req.tokenExp = decoded.exp
      
      next()
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Authentication token has expired',
          code: 'TOKEN_EXPIRED'
        })
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Authentication token is invalid',
          code: 'INVALID_TOKEN'
        })
      }
      
      return res.status(500).json({
        error: 'Authentication error',
        message: 'Failed to verify authentication token',
        code: 'AUTH_ERROR'
      })
    }
  }
  
  static authorize(roles = []) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        })
      }
      
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Required role: ${roles.join(' or ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        })
      }
      
      next()
    }
  }
  
  static createLoginLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: {
        error: 'Too many login attempts',
        message: 'Please try again later',
        retryAfter: 900
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true
    })
  }
  
  static async hashPassword(password) {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }
  
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash)
  }
}

module.exports = AuthenticationMiddleware
```

### Request Validation and Sanitization

```javascript
// server/middleware/validation.js
const { body, param, query, validationResult } = require('express-validator')
const DOMPurify = require('isomorphic-dompurify')

class ValidationMiddleware {
  static sanitizeInput(req, res, next) {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = this.deepSanitize(req.body)
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = this.deepSanitize(req.query)
    }
    
    next()
  }
  
  static deepSanitize(obj) {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
      }
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item))
    }
    
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip dangerous keys
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        continue
      }
      
      sanitized[key] = this.deepSanitize(value)
    }
    
    return sanitized
  }
  
  static validateReportUpload = [
    body('filename')
      .isString()
      .isLength({ min: 1, max: 255 })
      .matches(/^[^<>:\"/\\\\|?*\\x00-\\x1f]+\\.json$/)
      .withMessage('Invalid filename format')
      .custom((value) => {
        // Additional filename validation
        const pathTraversal = /\\.\\./
        if (pathTraversal.test(value)) {
          throw new Error('Path traversal detected in filename')
        }
        return true
      }),
    
    body('data')
      .isArray()
      .withMessage('Data must be an array of features')
      .custom((value) => {
        // Validate Cucumber structure
        if (!Array.isArray(value)) {
          throw new Error('Data must be an array')
        }
        
        for (let i = 0; i < value.length; i++) {
          const feature = value[i]
          
          if (!feature.name || typeof feature.name !== 'string') {
            throw new Error(`Feature ${i}: Missing or invalid name`)
          }
          
          if (!Array.isArray(feature.elements)) {
            throw new Error(`Feature ${i}: Missing or invalid elements`)
          }
        }
        
        return true
      }),
    
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
    
    this.handleValidationErrors
  ]
  
  static validatePagination = [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1 and 1000'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sort')
      .optional()
      .isIn(['name', 'created', 'modified', 'size'])
      .withMessage('Invalid sort field'),
    
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be asc or desc'),
    
    this.handleValidationErrors
  ]
  
  static validateFilename = [
    param('filename')
      .isString()
      .matches(/^[^<>:\"/\\\\|?*\\x00-\\x1f]+\\.json$/)
      .withMessage('Invalid filename format')
      .custom((value) => {
        if (value.includes('..')) {
          throw new Error('Path traversal detected')
        }
        return true
      }),
    
    this.handleValidationErrors
  ]
  
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req)
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Request contains invalid parameters',
        details: errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          value: error.value
        })),
        code: 'VALIDATION_ERROR'
      })
    }
    
    next()
  }
  
  static validateFileSize(maxSize = 50 * 1024 * 1024) { // 50MB default
    return (req, res, next) => {
      if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
        return res.status(413).json({
          error: 'File too large',
          message: `File size exceeds ${maxSize} bytes limit`,
          code: 'FILE_TOO_LARGE'
        })
      }
      
      next()
    }
  }
}

module.exports = ValidationMiddleware
```

### SQL Injection Prevention

```javascript
// server/database/queries.js
const { Pool } = require('pg')

class DatabaseQueries {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  
  async getReports(filters = {}) {
    const { page = 1, limit = 10, sort = 'created', order = 'desc', search, status } = filters
    
    let query = `
      SELECT 
        id, filename, name, created_at, modified_at, file_size, 
        metadata, statistics
      FROM reports 
      WHERE deleted_at IS NULL
    `
    
    const params = []
    let paramIndex = 1
    
    // Add search filter (parameterized)
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR filename ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }
    
    // Add status filter (parameterized)
    if (status && status !== 'all') {
      query += ` AND statistics->>'status' = $${paramIndex}`
      params.push(status)
      paramIndex++
    }
    
    // Add sorting (whitelist validation)
    const allowedSortFields = ['name', 'created_at', 'modified_at', 'file_size']
    const allowedOrders = ['asc', 'desc']
    
    if (allowedSortFields.includes(sort) && allowedOrders.includes(order.toLowerCase())) {
      query += ` ORDER BY ${sort} ${order.toUpperCase()}`
    } else {
      query += ` ORDER BY created_at DESC`
    }
    
    // Add pagination (parameterized)
    const offset = (page - 1) * limit
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)
    
    try {
      const result = await this.pool.query(query, params)
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM reports 
        WHERE deleted_at IS NULL
        ${search ? `AND (name ILIKE $1 OR filename ILIKE $1)` : ''}
        ${status && status !== 'all' ? `AND statistics->>'status' = $${search ? 2 : 1}` : ''}
      `
      
      const countParams = []
      if (search) countParams.push(`%${search}%`)
      if (status && status !== 'all') countParams.push(status)
      
      const countResult = await this.pool.query(countQuery, countParams)
      const total = parseInt(countResult.rows[0].total)
      
      return {
        reports: result.rows,
        total,
        pages: Math.ceil(total / limit)
      }
    } catch (error) {
      console.error('Database query error:', error)
      throw new Error('Failed to fetch reports')
    }
  }
  
  async getReportByFilename(filename) {
    const query = `
      SELECT * FROM reports 
      WHERE filename = $1 AND deleted_at IS NULL
    `
    
    try {
      const result = await this.pool.query(query, [filename])
      return result.rows[0] || null
    } catch (error) {
      console.error('Database query error:', error)
      throw new Error('Failed to fetch report')
    }
  }
  
  async createReport(reportData) {
    const { filename, name, data, metadata, statistics } = reportData
    
    const query = `
      INSERT INTO reports (filename, name, data, metadata, statistics, created_at, modified_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `
    
    try {
      const result = await this.pool.query(query, [
        filename,
        name,
        JSON.stringify(data),
        JSON.stringify(metadata),
        JSON.stringify(statistics)
      ])
      
      return result.rows[0]
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Report with this filename already exists')
      }
      
      console.error('Database query error:', error)
      throw new Error('Failed to create report')
    }
  }
  
  async deleteReport(filename, soft = true) {
    let query
    
    if (soft) {
      query = `
        UPDATE reports 
        SET deleted_at = NOW(), modified_at = NOW()
        WHERE filename = $1 AND deleted_at IS NULL
        RETURNING *
      `
    } else {
      query = `
        DELETE FROM reports 
        WHERE filename = $1
        RETURNING *
      `
    }
    
    try {
      const result = await this.pool.query(query, [filename])
      return result.rows[0] || null
    } catch (error) {
      console.error('Database query error:', error)
      throw new Error('Failed to delete report')
    }
  }
  
  async close() {
    await this.pool.end()
  }
}

module.exports = DatabaseQueries
```

## Data Protection and Privacy

### Data Encryption

```javascript
// server/utils/encryption.js
const crypto = require('crypto')

class EncryptionUtils {
  constructor() {
    this.algorithm = 'aes-256-gcm'
    this.keyLength = 32
    this.ivLength = 16
    this.tagLength = 16
    this.saltLength = 32
  }
  
  /**
   * Encrypt sensitive data
   */
  encrypt(text, password) {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(this.saltLength)
      const iv = crypto.randomBytes(this.ivLength)
      
      // Derive key from password
      const key = crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256')
      
      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key)
      cipher.setAAD(Buffer.from('cucumber-viewer', 'utf8'))
      
      // Encrypt data
      let encrypted = cipher.update(text, 'utf8')
      encrypted = Buffer.concat([encrypted, cipher.final()])
      
      // Get authentication tag
      const tag = cipher.getAuthTag()
      
      // Combine all components
      const result = Buffer.concat([salt, iv, tag, encrypted])
      
      return result.toString('base64')
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message)
    }
  }
  
  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData, password) {
    try {
      const buffer = Buffer.from(encryptedData, 'base64')
      
      // Extract components
      const salt = buffer.slice(0, this.saltLength)
      const iv = buffer.slice(this.saltLength, this.saltLength + this.ivLength)
      const tag = buffer.slice(this.saltLength + this.ivLength, this.saltLength + this.ivLength + this.tagLength)
      const encrypted = buffer.slice(this.saltLength + this.ivLength + this.tagLength)
      
      // Derive key from password
      const key = crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256')
      
      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, key)
      decipher.setAAD(Buffer.from('cucumber-viewer', 'utf8'))
      decipher.setAuthTag(tag)
      
      // Decrypt data
      let decrypted = decipher.update(encrypted)
      decrypted = Buffer.concat([decrypted, decipher.final()])
      
      return decrypted.toString('utf8')
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message)
    }
  }
  
  /**
   * Hash sensitive data (one-way)
   */
  hash(data, salt = null) {
    if (!salt) {
      salt = crypto.randomBytes(this.saltLength)
    }
    
    const hash = crypto.pbkdf2Sync(data, salt, 100000, this.keyLength, 'sha256')
    
    return {
      hash: hash.toString('base64'),
      salt: salt.toString('base64')
    }
  }
  
  /**
   * Verify hashed data
   */
  verifyHash(data, hash, salt) {
    const saltBuffer = Buffer.from(salt, 'base64')
    const computed = this.hash(data, saltBuffer)
    
    return computed.hash === hash
  }
  
  /**
   * Generate secure random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('base64url')
  }
}

module.exports = new EncryptionUtils()
```

### Secure Session Management

```javascript
// server/middleware/session.js
const session = require('express-session')
const MongoStore = require('connect-mongo')
const redis = require('redis')
const RedisStore = require('connect-redis')(session)

class SessionManager {
  static createSessionMiddleware() {
    const sessionConfig = {
      name: 'cucumber-viewer-session',
      secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict' // CSRF protection
      }
    }
    
    // Use Redis for session storage in production
    if (process.env.REDIS_URL) {
      const redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        legacyMode: true
      })
      
      redisClient.connect().catch(console.error)
      
      sessionConfig.store = new RedisStore({
        client: redisClient,
        prefix: 'cucumber-viewer:sess:',
        ttl: 86400 // 24 hours
      })
    }
    
    return session(sessionConfig)
  }
  
  static requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_SESSION'
      })
    }
    
    // Check session expiry
    if (req.session.expiresAt && Date.now() > req.session.expiresAt) {
      req.session.destroy()
      return res.status(401).json({
        error: 'Session expired',
        code: 'SESSION_EXPIRED'
      })
    }
    
    next()
  }
  
  static createSession(req, user) {
    req.session.userId = user.id
    req.session.userRole = user.role
    req.session.createdAt = Date.now()
    req.session.expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    
    return new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) {
          reject(error)
        } else {
          resolve(req.session)
        }
      })
    })
  }
  
  static destroySession(req) {
    return new Promise((resolve, reject) => {
      req.session.destroy((error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }
}

module.exports = SessionManager
```

## Security Headers and HTTPS

### Security Headers Configuration

```javascript
// server/middleware/security.js
const helmet = require('helmet')

class SecurityHeaders {
  static configure(app) {
    // Basic security headers
    app.use(helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.github.com"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"]
        }
      },
      
      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      
      // X-Frame-Options
      frameguard: {
        action: 'deny'
      },
      
      // X-Content-Type-Options
      noSniff: true,
      
      // X-XSS-Protection
      xssFilter: true,
      
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      },
      
      // Permissions Policy
      permissionsPolicy: {
        features: {
          camera: ["'none'"],
          microphone: ["'none'"],
          geolocation: ["'none'"],
          payment: ["'none'"]
        }
      }
    }))
    
    // Additional custom headers
    app.use((req, res, next) => {
      // Remove server information
      res.removeHeader('X-Powered-By')
      
      // Add custom security headers
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader('X-XSS-Protection', '1; mode=block')
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
      
      next()
    })
  }
}

module.exports = SecurityHeaders
```

### HTTPS Configuration

```javascript
// server/https-server.js
const https = require('https')
const fs = require('fs')
const path = require('path')

class HTTPSServer {
  static createServer(app) {
    if (process.env.NODE_ENV === 'production') {
      // Production HTTPS configuration
      const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH || '/etc/ssl/private/server.key'),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/etc/ssl/certs/server.crt'),
        
        // Additional security options
        secureProtocol: 'TLSv1_2_method',
        ciphers: [
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES128-SHA256',
          'ECDHE-RSA-AES256-SHA384'
        ].join(':'),
        honorCipherOrder: true
      }
      
      return https.createServer(options, app)
    } else {
      // Development HTTP server
      return require('http').createServer(app)
    }
  }
  
  static enforceHTTPS(req, res, next) {
    if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.get('host')}${req.url}`)
    }
    next()
  }
}

module.exports = HTTPSServer
```

This comprehensive security implementation ensures the Cucumber Test Results Viewer is protected against common web vulnerabilities and follows security best practices.