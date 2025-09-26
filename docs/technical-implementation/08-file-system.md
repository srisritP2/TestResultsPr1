# File System Operations and Management

## Overview

This document covers the file system operations, data storage patterns, and file management strategies used in the Cucumber Test Results Viewer. It includes file I/O operations, directory management, security considerations, and performance optimizations.

## File System Architecture

### Directory Structure

```
cucumber-report-viewer/
├── public/
│   ├── TestResultsJsons/           # Main reports directory
│   │   ├── *.json                  # Individual report files
│   │   ├── index.json              # Reports index file
│   │   ├── stats.json              # Aggregated statistics
│   │   ├── .metadata/              # Report metadata
│   │   │   ├── *.meta.json         # Individual metadata files
│   │   │   └── cache/              # Cached processed data
│   │   ├── .deleted/               # Soft-deleted reports
│   │   │   └── *.json.deleted      # Deleted report files
│   │   ├── .backups/               # Backup files
│   │   │   └── *.json.backup       # Backup copies
│   │   └── .temp/                  # Temporary files
│   │       └── uploads/            # Temporary upload files
│   ├── img/                        # Static images
│   │   └── icons/                  # Application icons
│   └── favicon.ico                 # Favicon file
├── logs/                           # Application logs
│   ├── access.log                  # HTTP access logs
│   ├── error.log                   # Error logs
│   └── file-operations.log         # File operation logs
└── temp/                           # Temporary processing files
    ├── uploads/                    # File upload staging
    └── processing/                 # Report processing workspace
```

## File Operations Service

### Core File Management Class

```javascript
const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')
const crypto = require('crypto')
const { promisify } = require('util')
const stream = require('stream')
const pipeline = promisify(stream.pipeline)

class FileSystemManager {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(__dirname, 'public', 'TestResultsJsons')
    this.tempDir = options.tempDir || path.join(__dirname, 'temp')
    this.maxFileSize = options.maxFileSize || 50 * 1024 * 1024 // 50MB
    this.allowedExtensions = options.allowedExtensions || ['.json']
    this.backupEnabled = options.backupEnabled !== false
    
    this.ensureDirectories()
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const directories = [
      this.baseDir,
      path.join(this.baseDir, '.metadata'),
      path.join(this.baseDir, '.metadata', 'cache'),
      path.join(this.baseDir, '.deleted'),
      path.join(this.baseDir, '.backups'),
      path.join(this.baseDir, '.temp'),
      path.join(this.baseDir, '.temp', 'uploads'),
      this.tempDir,
      path.join(this.tempDir, 'uploads'),
      path.join(this.tempDir, 'processing')
    ]

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true })
      } catch (error) {
        if (error.code !== 'EEXIST') {
          console.error(`Failed to create directory ${dir}:`, error)
        }
      }
    }
  }

  /**
   * Read file with error handling and validation
   */
  async readFile(filename, options = {}) {
    try {
      const filePath = this.getFilePath(filename)
      
      // Security check
      if (!this.isValidPath(filePath)) {
        throw new Error('Invalid file path')
      }

      // Check if file exists
      await this.checkFileExists(filePath)

      // Read file with encoding
      const encoding = options.encoding || 'utf8'
      const content = await fs.readFile(filePath, encoding)

      // Parse JSON if requested
      if (options.parseJson && filename.endsWith('.json')) {
        try {
          return JSON.parse(content)
        } catch (parseError) {
          throw new Error(`Invalid JSON in file ${filename}: ${parseError.message}`)
        }
      }

      return content
    } catch (error) {
      this.logFileOperation('read', filename, false, error.message)
      throw error
    }
  }

  /**
   * Write file with atomic operations and backup
   */
  async writeFile(filename, content, options = {}) {
    try {
      const filePath = this.getFilePath(filename)
      
      // Security validation
      if (!this.isValidPath(filePath)) {
        throw new Error('Invalid file path')
      }

      if (!this.isValidFilename(filename)) {
        throw new Error('Invalid filename')
      }

      // Size validation
      const contentSize = Buffer.byteLength(content, 'utf8')
      if (contentSize > this.maxFileSize) {
        throw new Error(`File size ${contentSize} exceeds maximum ${this.maxFileSize}`)
      }

      // Create backup if file exists and backup is enabled
      if (this.backupEnabled && await this.fileExists(filePath)) {
        await this.createBackup(filename)
      }

      // Atomic write using temporary file
      const tempPath = path.join(this.tempDir, `${filename}.tmp.${Date.now()}`)
      
      try {
        // Write to temporary file first
        await fs.writeFile(tempPath, content, 'utf8')
        
        // Verify written content
        if (options.verify) {
          const writtenContent = await fs.readFile(tempPath, 'utf8')
          if (writtenContent !== content) {
            throw new Error('File verification failed')
          }
        }

        // Atomic move to final location
        await fs.rename(tempPath, filePath)

        // Update metadata
        if (options.updateMetadata !== false) {
          await this.updateFileMetadata(filename, {
            size: contentSize,
            modified: new Date().toISOString(),
            checksum: this.calculateChecksum(content)
          })
        }

        this.logFileOperation('write', filename, true, `${contentSize} bytes`)
        return { success: true, size: contentSize, path: filePath }
      } finally {
        // Clean up temporary file if it still exists
        try {
          await fs.unlink(tempPath)
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      this.logFileOperation('write', filename, false, error.message)
      throw error
    }
  }

  /**
   * Delete file with soft delete option
   */
  async deleteFile(filename, options = {}) {
    try {
      const filePath = this.getFilePath(filename)
      
      if (!this.isValidPath(filePath)) {
        throw new Error('Invalid file path')
      }

      if (!await this.fileExists(filePath)) {
        throw new Error(`File ${filename} does not exist`)
      }

      if (options.soft !== false) {
        // Soft delete - move to .deleted directory
        const deletedDir = path.join(this.baseDir, '.deleted')
        const deletedPath = path.join(deletedDir, `${filename}.${Date.now()}.deleted`)
        
        await fs.rename(filePath, deletedPath)
        
        // Update deletion metadata
        await this.updateDeletionMetadata(filename, {
          deletedAt: new Date().toISOString(),
          deletedBy: options.deletedBy || 'system',
          originalPath: filePath,
          deletedPath: deletedPath,
          recoverable: true
        })

        this.logFileOperation('soft-delete', filename, true, `moved to ${deletedPath}`)
        return { type: 'soft', deletedPath, recoverable: true }
      } else {
        // Hard delete - permanent removal
        await fs.unlink(filePath)
        
        // Remove metadata
        await this.removeFileMetadata(filename)
        
        this.logFileOperation('hard-delete', filename, true, 'permanently deleted')
        return { type: 'hard', recoverable: false }
      }
    } catch (error) {
      this.logFileOperation('delete', filename, false, error.message)
      throw error
    }
  }

  /**
   * Restore soft-deleted file
   */
  async restoreFile(filename, options = {}) {
    try {
      const deletedDir = path.join(this.baseDir, '.deleted')
      const deletedFiles = await fs.readdir(deletedDir)
      
      // Find the deleted file
      const deletedFile = deletedFiles.find(file => 
        file.startsWith(filename) && file.endsWith('.deleted')
      )

      if (!deletedFile) {
        throw new Error(`Deleted file ${filename} not found`)
      }

      const deletedPath = path.join(deletedDir, deletedFile)
      const restoredPath = this.getFilePath(filename)

      // Check if target already exists
      if (await this.fileExists(restoredPath)) {
        if (!options.overwrite) {
          throw new Error(`File ${filename} already exists. Use overwrite option to replace.`)
        }
        await this.createBackup(filename)
      }

      // Restore the file
      await fs.rename(deletedPath, restoredPath)

      // Update metadata
      await this.updateFileMetadata(filename, {
        restoredAt: new Date().toISOString(),
        restoredBy: options.restoredBy || 'system'
      })

      // Remove deletion metadata
      await this.removeDeletionMetadata(filename)

      this.logFileOperation('restore', filename, true, `restored from ${deletedPath}`)
      return { success: true, restoredPath }
    } catch (error) {
      this.logFileOperation('restore', filename, false, error.message)
      throw error
    }
  }

  /**
   * List files with filtering and pagination
   */
  async listFiles(options = {}) {
    try {
      const {
        pattern = '*.json',
        includeDeleted = false,
        includeMetadata = true,
        sortBy = 'modified',
        sortOrder = 'desc',
        limit = null,
        offset = 0
      } = options

      let files = await fs.readdir(this.baseDir)
      
      // Filter by pattern
      if (pattern !== '*') {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
        files = files.filter(file => regex.test(file))
      }

      // Exclude system files unless requested
      if (!includeDeleted) {
        files = files.filter(file => !file.startsWith('.'))
      }

      // Get file stats and metadata
      const fileInfos = await Promise.all(
        files.map(async (filename) => {
          try {
            const filePath = path.join(this.baseDir, filename)
            const stats = await fs.stat(filePath)
            
            const fileInfo = {
              filename,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              isDirectory: stats.isDirectory()
            }

            if (includeMetadata && filename.endsWith('.json')) {
              const metadata = await this.getFileMetadata(filename)
              if (metadata) {
                fileInfo.metadata = metadata
              }
            }

            return fileInfo
          } catch (error) {
            console.warn(`Error getting info for ${filename}:`, error.message)
            return null
          }
        })
      )

      // Filter out failed entries
      let validFiles = fileInfos.filter(info => info !== null)

      // Sort files
      validFiles.sort((a, b) => {
        let aValue = a[sortBy]
        let bValue = b[sortBy]

        if (sortBy === 'size') {
          aValue = parseInt(aValue)
          bValue = parseInt(bValue)
        } else if (sortBy === 'created' || sortBy === 'modified') {
          aValue = new Date(aValue)
          bValue = new Date(bValue)
        }

        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1
        } else {
          return aValue > bValue ? 1 : -1
        }
      })

      // Apply pagination
      if (limit) {
        validFiles = validFiles.slice(offset, offset + limit)
      }

      return {
        files: validFiles,
        total: validFiles.length,
        offset,
        limit
      }
    } catch (error) {
      this.logFileOperation('list', 'directory', false, error.message)
      throw error
    }
  }

  /**
   * Copy file with verification
   */
  async copyFile(sourceFilename, destFilename, options = {}) {
    try {
      const sourcePath = this.getFilePath(sourceFilename)
      const destPath = this.getFilePath(destFilename)

      if (!await this.fileExists(sourcePath)) {
        throw new Error(`Source file ${sourceFilename} does not exist`)
      }

      if (await this.fileExists(destPath) && !options.overwrite) {
        throw new Error(`Destination file ${destFilename} already exists`)
      }

      // Copy file
      await fs.copyFile(sourcePath, destPath)

      // Verify copy if requested
      if (options.verify) {
        const sourceChecksum = await this.getFileChecksum(sourcePath)
        const destChecksum = await this.getFileChecksum(destPath)
        
        if (sourceChecksum !== destChecksum) {
          await fs.unlink(destPath) // Clean up failed copy
          throw new Error('File copy verification failed')
        }
      }

      // Copy metadata
      if (options.copyMetadata !== false) {
        const sourceMetadata = await this.getFileMetadata(sourceFilename)
        if (sourceMetadata) {
          await this.updateFileMetadata(destFilename, {
            ...sourceMetadata,
            copiedFrom: sourceFilename,
            copiedAt: new Date().toISOString()
          })
        }
      }

      this.logFileOperation('copy', `${sourceFilename} -> ${destFilename}`, true)
      return { success: true, sourcePath, destPath }
    } catch (error) {
      this.logFileOperation('copy', `${sourceFilename} -> ${destFilename}`, false, error.message)
      throw error
    }
  }

  /**
   * Move/rename file
   */
  async moveFile(sourceFilename, destFilename, options = {}) {
    try {
      const sourcePath = this.getFilePath(sourceFilename)
      const destPath = this.getFilePath(destFilename)

      if (!await this.fileExists(sourcePath)) {
        throw new Error(`Source file ${sourceFilename} does not exist`)
      }

      if (await this.fileExists(destPath) && !options.overwrite) {
        throw new Error(`Destination file ${destFilename} already exists`)
      }

      // Create backup of destination if it exists
      if (this.backupEnabled && await this.fileExists(destPath)) {
        await this.createBackup(destFilename)
      }

      // Move file
      await fs.rename(sourcePath, destPath)

      // Update metadata
      const metadata = await this.getFileMetadata(sourceFilename)
      if (metadata) {
        await this.removeFileMetadata(sourceFilename)
        await this.updateFileMetadata(destFilename, {
          ...metadata,
          movedFrom: sourceFilename,
          movedAt: new Date().toISOString()
        })
      }

      this.logFileOperation('move', `${sourceFilename} -> ${destFilename}`, true)
      return { success: true, sourcePath, destPath }
    } catch (error) {
      this.logFileOperation('move', `${sourceFilename} -> ${destFilename}`, false, error.message)
      throw error
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filename) {
    try {
      const metadataPath = path.join(this.baseDir, '.metadata', `${filename}.meta.json`)
      
      if (await this.fileExists(metadataPath)) {
        const content = await fs.readFile(metadataPath, 'utf8')
        return JSON.parse(content)
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(filename, metadata) {
    try {
      const metadataPath = path.join(this.baseDir, '.metadata', `${filename}.meta.json`)
      
      // Get existing metadata
      const existing = await this.getFileMetadata(filename) || {}
      
      // Merge with new metadata
      const updated = {
        ...existing,
        ...metadata,
        updatedAt: new Date().toISOString()
      }

      await fs.writeFile(metadataPath, JSON.stringify(updated, null, 2))
      return updated
    } catch (error) {
      console.warn(`Failed to update metadata for ${filename}:`, error.message)
    }
  }

  /**
   * Remove file metadata
   */
  async removeFileMetadata(filename) {
    try {
      const metadataPath = path.join(this.baseDir, '.metadata', `${filename}.meta.json`)
      
      if (await this.fileExists(metadataPath)) {
        await fs.unlink(metadataPath)
      }
    } catch (error) {
      console.warn(`Failed to remove metadata for ${filename}:`, error.message)
    }
  }

  /**
   * Create backup of file
   */
  async createBackup(filename) {
    try {
      const sourcePath = this.getFilePath(filename)
      const backupDir = path.join(this.baseDir, '.backups')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(backupDir, `${filename}.${timestamp}.backup`)

      await fs.copyFile(sourcePath, backupPath)
      
      this.logFileOperation('backup', filename, true, `backed up to ${backupPath}`)
      return backupPath
    } catch (error) {
      this.logFileOperation('backup', filename, false, error.message)
      throw error
    }
  }

  /**
   * Clean up old backups
   */
  async cleanupBackups(options = {}) {
    try {
      const { maxAge = 30 * 24 * 60 * 60 * 1000, maxCount = 10 } = options // 30 days, 10 files
      const backupDir = path.join(this.baseDir, '.backups')
      
      const backups = await fs.readdir(backupDir)
      const backupInfos = await Promise.all(
        backups.map(async (backup) => {
          const backupPath = path.join(backupDir, backup)
          const stats = await fs.stat(backupPath)
          return {
            filename: backup,
            path: backupPath,
            created: stats.birthtime,
            size: stats.size
          }
        })
      )

      // Sort by creation date (newest first)
      backupInfos.sort((a, b) => b.created - a.created)

      const now = Date.now()
      let deletedCount = 0
      let deletedSize = 0

      for (let i = 0; i < backupInfos.length; i++) {
        const backup = backupInfos[i]
        const age = now - backup.created.getTime()
        
        // Delete if too old or exceeds max count
        if (age > maxAge || i >= maxCount) {
          await fs.unlink(backup.path)
          deletedCount++
          deletedSize += backup.size
        }
      }

      this.logFileOperation('cleanup-backups', 'backups', true, 
        `deleted ${deletedCount} backups (${deletedSize} bytes)`)
      
      return { deletedCount, deletedSize }
    } catch (error) {
      this.logFileOperation('cleanup-backups', 'backups', false, error.message)
      throw error
    }
  }

  /**
   * Get disk usage statistics
   */
  async getDiskUsage() {
    try {
      const stats = {
        total: 0,
        reports: 0,
        metadata: 0,
        backups: 0,
        deleted: 0,
        temp: 0
      }

      // Calculate directory sizes
      const directories = [
        { name: 'reports', path: this.baseDir },
        { name: 'metadata', path: path.join(this.baseDir, '.metadata') },
        { name: 'backups', path: path.join(this.baseDir, '.backups') },
        { name: 'deleted', path: path.join(this.baseDir, '.deleted') },
        { name: 'temp', path: this.tempDir }
      ]

      for (const dir of directories) {
        try {
          const size = await this.getDirectorySize(dir.path)
          stats[dir.name] = size
          stats.total += size
        } catch (error) {
          // Directory might not exist
          stats[dir.name] = 0
        }
      }

      return stats
    } catch (error) {
      throw new Error(`Failed to get disk usage: ${error.message}`)
    }
  }

  /**
   * Get directory size recursively
   */
  async getDirectorySize(dirPath) {
    try {
      const files = await fs.readdir(dirPath)
      let totalSize = 0

      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = await fs.stat(filePath)
        
        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath)
        } else {
          totalSize += stats.size
        }
      }

      return totalSize
    } catch (error) {
      return 0
    }
  }

  /**
   * Utility methods
   */

  getFilePath(filename) {
    return path.join(this.baseDir, filename)
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  async checkFileExists(filePath) {
    if (!await this.fileExists(filePath)) {
      throw new Error(`File does not exist: ${filePath}`)
    }
  }

  isValidPath(filePath) {
    const normalizedPath = path.normalize(filePath)
    return normalizedPath.startsWith(this.baseDir) && !normalizedPath.includes('..')
  }

  isValidFilename(filename) {
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
    const pathTraversal = /\.\./
    
    return !invalidChars.test(filename) && 
           !pathTraversal.test(filename) && 
           filename.length > 0 && 
           filename.length < 255 &&
           this.allowedExtensions.some(ext => filename.endsWith(ext))
  }

  calculateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  async getFileChecksum(filePath) {
    const content = await fs.readFile(filePath)
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  logFileOperation(operation, filename, success, details = '') {
    const timestamp = new Date().toISOString()
    const status = success ? 'SUCCESS' : 'FAILED'
    const logMessage = `[${timestamp}] ${operation.toUpperCase()} ${filename} - ${status} ${details}`
    
    console.log(logMessage)
    
    // Write to file operations log
    const logPath = path.join(__dirname, 'logs', 'file-operations.log')
    fsSync.appendFileSync(logPath, logMessage + '\n', { flag: 'a' })
  }

  async updateDeletionMetadata(filename, metadata) {
    const deletionLogPath = path.join(this.baseDir, '.deleted', '.deletion-log.json')
    
    try {
      let deletionLog = []
      
      if (await this.fileExists(deletionLogPath)) {
        const content = await fs.readFile(deletionLogPath, 'utf8')
        deletionLog = JSON.parse(content)
      }

      deletionLog.push({
        filename,
        ...metadata
      })

      await fs.writeFile(deletionLogPath, JSON.stringify(deletionLog, null, 2))
    } catch (error) {
      console.warn('Failed to update deletion metadata:', error.message)
    }
  }

  async removeDeletionMetadata(filename) {
    const deletionLogPath = path.join(this.baseDir, '.deleted', '.deletion-log.json')
    
    try {
      if (await this.fileExists(deletionLogPath)) {
        const content = await fs.readFile(deletionLogPath, 'utf8')
        let deletionLog = JSON.parse(content)
        
        deletionLog = deletionLog.filter(entry => entry.filename !== filename)
        
        await fs.writeFile(deletionLogPath, JSON.stringify(deletionLog, null, 2))
      }
    } catch (error) {
      console.warn('Failed to remove deletion metadata:', error.message)
    }
  }
}

module.exports = FileSystemManager
```

## File Upload Handling

### Secure File Upload Implementation

```javascript
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')

class FileUploadHandler {
  constructor(fileSystemManager) {
    this.fsManager = fileSystemManager
    this.setupMulter()
  }

  setupMulter() {
    // Configure multer for file uploads
    this.upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(this.fsManager.tempDir, 'uploads')
          cb(null, uploadDir)
        },
        filename: (req, file, cb) => {
          // Generate secure filename
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
          const sanitizedName = this.sanitizeFilename(file.originalname)
          cb(null, `${uniqueSuffix}-${sanitizedName}`)
        }
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 5, // Maximum 5 files per request
        fields: 10 // Maximum 10 form fields
      },
      fileFilter: (req, file, cb) => {
        // Validate file type
        if (this.isAllowedFileType(file)) {
          cb(null, true)
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`), false)
        }
      }
    })
  }

  /**
   * Handle single file upload
   */
  async handleSingleUpload(req, res, next) {
    try {
      const uploadSingle = this.upload.single('file')
      
      uploadSingle(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            return res.status(400).json({
              error: 'Upload Error',
              message: this.getMulterErrorMessage(err),
              code: err.code
            })
          }
          return next(err)
        }

        if (!req.file) {
          return res.status(400).json({
            error: 'No File',
            message: 'No file was uploaded'
          })
        }

        // Process the uploaded file
        try {
          const result = await this.processUploadedFile(req.file, req.body)
          
          // Clean up temporary file
          await this.fsManager.deleteFile(req.file.filename, { soft: false })
          
          res.json({
            success: true,
            message: 'File uploaded successfully',
            data: result
          })
        } catch (processError) {
          // Clean up temporary file on error
          try {
            await this.fsManager.deleteFile(req.file.filename, { soft: false })
          } catch (cleanupError) {
            console.warn('Failed to clean up temporary file:', cleanupError.message)
          }
          
          throw processError
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Handle multiple file uploads
   */
  async handleMultipleUpload(req, res, next) {
    try {
      const uploadMultiple = this.upload.array('files', 5)
      
      uploadMultiple(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            return res.status(400).json({
              error: 'Upload Error',
              message: this.getMulterErrorMessage(err),
              code: err.code
            })
          }
          return next(err)
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            error: 'No Files',
            message: 'No files were uploaded'
          })
        }

        // Process all uploaded files
        const results = []
        const errors = []

        for (const file of req.files) {
          try {
            const result = await this.processUploadedFile(file, req.body)
            results.push(result)
          } catch (error) {
            errors.push({
              filename: file.originalname,
              error: error.message
            })
          }

          // Clean up temporary file
          try {
            await this.fsManager.deleteFile(file.filename, { soft: false })
          } catch (cleanupError) {
            console.warn('Failed to clean up temporary file:', cleanupError.message)
          }
        }

        res.json({
          success: errors.length === 0,
          message: `Processed ${results.length} files successfully`,
          data: {
            successful: results,
            failed: errors,
            total: req.files.length
          }
        })
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Process uploaded file
   */
  async processUploadedFile(file, metadata = {}) {
    // Read and validate file content
    const content = await this.fsManager.readFile(file.filename, { parseJson: true })
    
    // Validate Cucumber JSON format
    const validation = this.validateCucumberFormat(content)
    if (!validation.isValid) {
      throw new Error(`Invalid Cucumber format: ${validation.errors.join(', ')}`)
    }

    // Generate final filename
    const finalFilename = this.generateFinalFilename(file.originalname, metadata)
    
    // Save to final location
    await this.fsManager.writeFile(finalFilename, JSON.stringify(content, null, 2), {
      updateMetadata: true,
      verify: true
    })

    // Update metadata
    await this.fsManager.updateFileMetadata(finalFilename, {
      originalName: file.originalname,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      mimetype: file.mimetype,
      ...metadata
    })

    return {
      filename: finalFilename,
      originalName: file.originalname,
      size: file.size,
      features: content.length,
      scenarios: this.countScenarios(content)
    }
  }

  /**
   * Utility methods
   */

  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase()
  }

  isAllowedFileType(file) {
    const allowedMimeTypes = ['application/json', 'text/json']
    const allowedExtensions = ['.json']
    
    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype)
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    )

    return hasValidMimeType && hasValidExtension
  }

  generateFinalFilename(originalName, metadata) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const baseName = path.parse(originalName).name
    const sanitizedBaseName = this.sanitizeFilename(baseName)
    
    if (metadata.name) {
      return `${this.sanitizeFilename(metadata.name)}-${timestamp}.json`
    }
    
    return `${sanitizedBaseName}-${timestamp}.json`
  }

  getMulterErrorMessage(error) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return 'File size exceeds the maximum allowed size'
      case 'LIMIT_FILE_COUNT':
        return 'Too many files uploaded'
      case 'LIMIT_FIELD_COUNT':
        return 'Too many form fields'
      case 'LIMIT_UNEXPECTED_FILE':
        return 'Unexpected file field'
      default:
        return error.message || 'Upload error occurred'
    }
  }

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

  countScenarios(data) {
    return data.reduce((count, feature) => {
      return count + (feature.elements ? feature.elements.length : 0)
    }, 0)
  }
}

module.exports = FileUploadHandler
```

This comprehensive file system implementation provides secure, efficient, and robust file operations for the Cucumber Test Results Viewer application.