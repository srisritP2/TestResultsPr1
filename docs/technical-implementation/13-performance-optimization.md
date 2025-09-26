# Performance Optimization

## Overview

This document details comprehensive performance optimization strategies implemented in the Cucumber Test Results Viewer, covering frontend optimization, backend performance, caching strategies, lazy loading, code splitting, and monitoring techniques.

## Frontend Performance Optimization

### Code Splitting and Lazy Loading

```javascript
// src/router/index.js - Route-based Code Splitting
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import(
      /* webpackChunkName: "home" */ 
      '@/views/Home.vue'
    )
  },
  {
    path: '/report/:filename',
    name: 'Report',
    component: () => import(
      /* webpackChunkName: "report" */ 
      '@/views/Report.vue'
    ),
    props: true
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import(
      /* webpackChunkName: "upload" */ 
      '@/views/Upload.vue'
    )
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import(
      /* webpackChunkName: "analytics" */ 
      '@/views/Analytics.vue'
    )
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router
```

### Component Lazy Loading

```javascript
// src/components/LazyComponents.js
export const LazyReportViewer = () => ({
  component: import(
    /* webpackChunkName: "report-viewer" */
    '@/components/ReportViewer.vue'
  ),
  loading: () => import('@/components/LoadingSpinner.vue'),
  error: () => import('@/components/ErrorComponent.vue'),
  delay: 200,
  timeout: 10000
})

export const LazyChartComponent = () => ({
  component: import(
    /* webpackChunkName: "charts" */
    '@/components/ChartComponent.vue'
  ),
  loading: () => import('@/components/ChartSkeleton.vue'),
  delay: 100,
  timeout: 5000
})

export const LazyDataTable = () => ({
  component: import(
    /* webpackChunkName: "data-table" */
    '@/components/DataTable.vue'
  ),
  loading: () => import('@/components/TableSkeleton.vue'),
  delay: 150,
  timeout: 8000
})
```

### Virtual Scrolling Implementation

```vue
<!-- src/components/VirtualScrollList.vue -->
<template>
  <div 
    ref="container"
    class="virtual-scroll-container"
    @scroll="handleScroll"
    :style="{ height: containerHeight + 'px' }"
  >
    <div 
      class="virtual-scroll-spacer"
      :style="{ height: totalHeight + 'px' }"
    >
      <div 
        class="virtual-scroll-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="item.id"
          class="virtual-scroll-item"
          :style="{ height: itemHeight + 'px' }"
        >
          <slot :item="item" :index="item.index" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VirtualScrollList',
  
  props: {
    items: {
      type: Array,
      required: true
    },
    itemHeight: {
      type: Number,
      default: 50
    },
    containerHeight: {
      type: Number,
      default: 400
    },
    buffer: {
      type: Number,
      default: 5
    }
  },
  
  data() {
    return {
      scrollTop: 0,
      startIndex: 0,
      endIndex: 0
    }
  },
  
  computed: {
    totalHeight() {
      return this.items.length * this.itemHeight
    },
    
    visibleCount() {
      return Math.ceil(this.containerHeight / this.itemHeight)
    },
    
    offsetY() {
      return this.startIndex * this.itemHeight
    },
    
    visibleItems() {
      return this.items
        .slice(this.startIndex, this.endIndex + 1)
        .map((item, index) => ({
          ...item,
          index: this.startIndex + index
        }))
    }
  },
  
  mounted() {
    this.updateVisibleRange()
  },
  
  watch: {
    items() {
      this.updateVisibleRange()
    }
  },
  
  methods: {
    handleScroll(event) {
      this.scrollTop = event.target.scrollTop
      this.updateVisibleRange()
    },
    
    updateVisibleRange() {
      const startIndex = Math.floor(this.scrollTop / this.itemHeight)
      const endIndex = Math.min(
        startIndex + this.visibleCount + this.buffer,
        this.items.length - 1
      )
      
      this.startIndex = Math.max(0, startIndex - this.buffer)
      this.endIndex = endIndex
    },
    
    scrollToIndex(index) {
      const scrollTop = index * this.itemHeight
      this.$refs.container.scrollTop = scrollTop
    }
  }
}
</script>

<style scoped>
.virtual-scroll-container {
  overflow-y: auto;
  position: relative;
}

.virtual-scroll-spacer {
  position: relative;
}

.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-scroll-item {
  display: flex;
  align-items: center;
}
</style>
```

### Image and Asset Optimization

```javascript
// src/utils/imageOptimization.js
class ImageOptimization {
  static createResponsiveImage(src, sizes = [400, 800, 1200]) {
    const baseUrl = src.split('.').slice(0, -1).join('.')
    const extension = src.split('.').pop()
    
    return {
      src,
      srcSet: sizes.map(size => 
        `${baseUrl}_${size}w.${extension} ${size}w`
      ).join(', '),
      sizes: sizes.map((size, index) => {
        if (index === sizes.length - 1) return `${size}px`
        return `(max-width: ${size}px) ${size}px`
      }).join(', ')
    }
  }
  
  static lazyLoadImage(img, options = {}) {
    const {
      rootMargin = '50px',
      threshold = 0.1,
      placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGNUY1RjUiLz48L3N2Zz4='
    } = options
    
    // Set placeholder
    img.src = placeholder
    img.classList.add('lazy-loading')
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const lazyImg = entry.target
          const actualSrc = lazyImg.dataset.src
          
          if (actualSrc) {
            // Preload image
            const tempImg = new Image()
            tempImg.onload = () => {
              lazyImg.src = actualSrc
              lazyImg.classList.remove('lazy-loading')
              lazyImg.classList.add('lazy-loaded')
            }
            tempImg.onerror = () => {
              lazyImg.classList.add('lazy-error')
            }
            tempImg.src = actualSrc
          }
          
          observer.unobserve(lazyImg)
        }
      })
    }, {
      rootMargin,
      threshold
    })
    
    observer.observe(img)
    
    return observer
  }
  
  static optimizeImageFormat(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        // Convert to WebP if supported
        if (canvas.toBlob && this.supportsWebP()) {
          canvas.toBlob(resolve, 'image/webp', 0.8)
        } else {
          canvas.toBlob(resolve, 'image/jpeg', 0.8)
        }
      }
      
      img.src = URL.createObjectURL(file)
    })
  }
  
  static supportsWebP() {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }
}

export default ImageOptimization
```

### Bundle Optimization

```javascript
// vue.config.js - Webpack Optimization
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  configureWebpack: (config) => {
    // Production optimizations
    if (process.env.NODE_ENV === 'production') {
      config.plugins.push(
        // Gzip compression
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8
        }),
        
        // Brotli compression
        new CompressionPlugin({
          algorithm: 'brotliCompress',
          test: /\.(js|css|html|svg)$/,
          compressionOptions: { level: 11 },
          threshold: 8192,
          minRatio: 0.8,
          filename: '[path][base].br'
        })
      )
      
      // Bundle analyzer (only when needed)
      if (process.env.ANALYZE_BUNDLE) {
        config.plugins.push(new BundleAnalyzerPlugin())
      }
    }
    
    // Optimization settings
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          vuetify: {
            test: /[\\/]node_modules[\\/]vuetify[\\/]/,
            name: 'vuetify',
            chunks: 'all',
            priority: 20
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          }
        }
      },
      runtimeChunk: {
        name: 'runtime'
      }
    }
  },
  
  chainWebpack: (config) => {
    // Preload important chunks
    config.plugin('preload').tap(options => {
      options[0] = {
        rel: 'preload',
        include: 'initial',
        fileBlacklist: [/\.map$/, /hot-update\.js$/]
      }
      return options
    })
    
    // Prefetch non-critical chunks
    config.plugin('prefetch').tap(options => {
      options[0].fileBlacklist = options[0].fileBlacklist || []
      options[0].fileBlacklist.push(/runtime\..*\.js$/)
      return options
    })
    
    // Optimize images
    config.module
      .rule('images')
      .test(/\.(gif|png|jpe?g|svg)$/i)
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({
        mozjpeg: { progressive: true, quality: 80 },
        optipng: { enabled: false },
        pngquant: { quality: [0.65, 0.90], speed: 4 },
        gifsicle: { interlaced: false },
        webp: { quality: 80 }
      })
  }
}
```

## Backend Performance Optimization

### Database Query Optimization

```javascript
// server/database/optimizedQueries.js
class OptimizedQueries {
  constructor(pool) {
    this.pool = pool
    this.queryCache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }
  
  async getReportsWithPagination(filters = {}) {
    const cacheKey = this.generateCacheKey('reports', filters)
    const cached = this.getFromCache(cacheKey)
    
    if (cached) {
      return cached
    }
    
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = filters
    
    // Optimized query with proper indexing
    const query = `
      WITH filtered_reports AS (
        SELECT 
          id, filename, name, created_at, modified_at, file_size,
          metadata, statistics,
          COUNT(*) OVER() as total_count
        FROM reports 
        WHERE deleted_at IS NULL
        ${this.buildWhereClause(filters)}
        ORDER BY ${this.sanitizeSortField(sort)} ${this.sanitizeSortOrder(order)}
        LIMIT $1 OFFSET $2
      )
      SELECT 
        id, filename, name, created_at, modified_at, file_size,
        metadata, statistics, total_count
      FROM filtered_reports
    `
    
    const offset = (page - 1) * limit
    const params = [limit, offset, ...this.buildWhereParams(filters)]
    
    try {
      const result = await this.pool.query(query, params)
      const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0
      
      const response = {
        reports: result.rows.map(row => {
          const { total_count, ...report } = row
          return report
        }),
        total,
        pages: Math.ceil(total / limit)
      }
      
      this.setCache(cacheKey, response)
      return response
    } catch (error) {
      console.error('Optimized query error:', error)
      throw error
    }
  }
  
  async getReportStatistics(filename) {
    const cacheKey = `stats:${filename}`
    const cached = this.getFromCache(cacheKey)
    
    if (cached) {
      return cached
    }
    
    // Optimized statistics query
    const query = `
      SELECT 
        filename,
        statistics,
        (statistics->>'totalScenarios')::int as total_scenarios,
        (statistics->>'passed')::int as passed,
        (statistics->>'failed')::int as failed,
        (statistics->>'skipped')::int as skipped,
        (statistics->>'totalDuration')::bigint as total_duration,
        created_at,
        modified_at
      FROM reports 
      WHERE filename = $1 AND deleted_at IS NULL
    `
    
    try {
      const result = await this.pool.query(query, [filename])
      
      if (result.rows.length === 0) {
        return null
      }
      
      const stats = result.rows[0]
      this.setCache(cacheKey, stats, 10 * 60 * 1000) // Cache for 10 minutes
      
      return stats
    } catch (error) {
      console.error('Statistics query error:', error)
      throw error
    }
  }
  
  async getAggregatedStatistics(timeRange = '30d') {
    const cacheKey = `aggregated:${timeRange}`
    const cached = this.getFromCache(cacheKey)
    
    if (cached) {
      return cached
    }
    
    const timeFilter = this.getTimeFilter(timeRange)
    
    const query = `
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as report_count,
        SUM((statistics->>'totalScenarios')::int) as total_scenarios,
        SUM((statistics->>'passed')::int) as total_passed,
        SUM((statistics->>'failed')::int) as total_failed,
        SUM((statistics->>'skipped')::int) as total_skipped,
        AVG((statistics->>'passed')::float / NULLIF((statistics->>'totalScenarios')::float, 0) * 100) as avg_pass_rate
      FROM reports 
      WHERE deleted_at IS NULL 
        AND created_at >= NOW() - INTERVAL '${timeFilter}'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `
    
    try {
      const result = await this.pool.query(query)
      
      const stats = {
        timeRange,
        data: result.rows,
        summary: this.calculateSummaryStats(result.rows)
      }
      
      this.setCache(cacheKey, stats, 15 * 60 * 1000) // Cache for 15 minutes
      return stats
    } catch (error) {
      console.error('Aggregated statistics query error:', error)
      throw error
    }
  }
  
  // Connection pooling optimization
  async executeWithRetry(query, params, maxRetries = 3) {
    let lastError
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = await this.pool.connect()
        
        try {
          const result = await client.query(query, params)
          return result
        } finally {
          client.release()
        }
      } catch (error) {
        lastError = error
        
        if (attempt < maxRetries && this.isRetryableError(error)) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          await this.sleep(delay)
          continue
        }
        
        throw error
      }
    }
    
    throw lastError
  }
  
  // Cache management
  generateCacheKey(prefix, data) {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex')
    return `${prefix}:${hash}`
  }
  
  getFromCache(key) {
    const cached = this.queryCache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    
    this.queryCache.delete(key)
    return null
  }
  
  setCache(key, data, timeout = this.cacheTimeout) {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      timeout
    })
    
    // Clean up expired cache entries
    if (this.queryCache.size > 1000) {
      this.cleanupCache()
    }
  }
  
  cleanupCache() {
    const now = Date.now()
    
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > value.timeout) {
        this.queryCache.delete(key)
      }
    }
  }
  
  // Helper methods
  buildWhereClause(filters) {
    const conditions = []
    
    if (filters.search) {
      conditions.push(`(name ILIKE $${conditions.length + 3} OR filename ILIKE $${conditions.length + 3})`)
    }
    
    if (filters.status && filters.status !== 'all') {
      conditions.push(`statistics->>'status' = $${conditions.length + 3}`)
    }
    
    if (filters.dateFrom && filters.dateTo) {
      conditions.push(`created_at BETWEEN $${conditions.length + 3} AND $${conditions.length + 4}`)
    }
    
    return conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''
  }
  
  buildWhereParams(filters) {
    const params = []
    
    if (filters.search) {
      params.push(`%${filters.search}%`)
    }
    
    if (filters.status && filters.status !== 'all') {
      params.push(filters.status)
    }
    
    if (filters.dateFrom && filters.dateTo) {
      params.push(filters.dateFrom, filters.dateTo)
    }
    
    return params
  }
  
  sanitizeSortField(field) {
    const allowedFields = ['name', 'created_at', 'modified_at', 'file_size']
    return allowedFields.includes(field) ? field : 'created_at'
  }
  
  sanitizeSortOrder(order) {
    return ['asc', 'desc'].includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC'
  }
  
  getTimeFilter(range) {
    const ranges = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
      '1y': '1 year'
    }
    return ranges[range] || '30 days'
  }
  
  calculateSummaryStats(data) {
    if (data.length === 0) return {}
    
    const totals = data.reduce((acc, row) => ({
      reports: acc.reports + parseInt(row.report_count),
      scenarios: acc.scenarios + parseInt(row.total_scenarios || 0),
      passed: acc.passed + parseInt(row.total_passed || 0),
      failed: acc.failed + parseInt(row.total_failed || 0),
      skipped: acc.skipped + parseInt(row.total_skipped || 0)
    }), { reports: 0, scenarios: 0, passed: 0, failed: 0, skipped: 0 })
    
    return {
      ...totals,
      passRate: totals.scenarios > 0 ? (totals.passed / totals.scenarios * 100).toFixed(2) : 0
    }
  }
  
  isRetryableError(error) {
    const retryableCodes = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED']
    return retryableCodes.includes(error.code) || error.message.includes('connection')
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = OptimizedQueries
```

### Caching Strategy

```javascript
// server/cache/cacheManager.js
const Redis = require('redis')
const NodeCache = require('node-cache')

class CacheManager {
  constructor() {
    this.memoryCache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Check for expired keys every minute
      useClones: false
    })
    
    this.redisClient = null
    this.initializeRedis()
  }
  
  async initializeRedis() {
    if (process.env.REDIS_URL) {
      try {
        this.redisClient = Redis.createClient({
          url: process.env.REDIS_URL,
          retry_strategy: (options) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              console.error('Redis connection refused')
              return new Error('Redis connection refused')
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              return new Error('Redis retry time exhausted')
            }
            if (options.attempt > 10) {
              return undefined
            }
            return Math.min(options.attempt * 100, 3000)
          }
        })
        
        await this.redisClient.connect()
        console.log('Redis connected successfully')
      } catch (error) {
        console.error('Redis connection failed:', error)
        this.redisClient = null
      }
    }
  }
  
  async get(key, useRedis = true) {
    try {
      // Try Redis first if available
      if (useRedis && this.redisClient) {
        const value = await this.redisClient.get(key)
        if (value) {
          return JSON.parse(value)
        }
      }
      
      // Fallback to memory cache
      return this.memoryCache.get(key)
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }
  
  async set(key, value, ttl = 300, useRedis = true) {
    try {
      const serialized = JSON.stringify(value)
      
      // Set in Redis if available
      if (useRedis && this.redisClient) {
        await this.redisClient.setEx(key, ttl, serialized)
      }
      
      // Always set in memory cache as fallback
      this.memoryCache.set(key, value, ttl)
      
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }
  
  async del(key, useRedis = true) {
    try {
      if (useRedis && this.redisClient) {
        await this.redisClient.del(key)
      }
      
      this.memoryCache.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }
  
  async flush(useRedis = true) {
    try {
      if (useRedis && this.redisClient) {
        await this.redisClient.flushAll()
      }
      
      this.memoryCache.flushAll()
      return true
    } catch (error) {
      console.error('Cache flush error:', error)
      return false
    }
  }
  
  // Cache warming strategies
  async warmCache() {
    console.log('Starting cache warming...')
    
    try {
      // Warm frequently accessed data
      await this.warmReportsCache()
      await this.warmStatisticsCache()
      
      console.log('Cache warming completed')
    } catch (error) {
      console.error('Cache warming failed:', error)
    }
  }
  
  async warmReportsCache() {
    // Pre-load first page of reports
    const key = 'reports:page:1:limit:10'
    // Implementation would fetch and cache first page
  }
  
  async warmStatisticsCache() {
    // Pre-load common statistics
    const timeRanges = ['7d', '30d', '90d']
    
    for (const range of timeRanges) {
      const key = `stats:aggregated:${range}`
      // Implementation would fetch and cache statistics
    }
  }
  
  // Cache invalidation patterns
  invalidatePattern(pattern) {
    // For memory cache
    const keys = this.memoryCache.keys()
    const matchingKeys = keys.filter(key => key.includes(pattern))
    
    matchingKeys.forEach(key => {
      this.memoryCache.del(key)
    })
    
    // For Redis (if available)
    if (this.redisClient) {
      this.redisClient.keys(`*${pattern}*`).then(keys => {
        if (keys.length > 0) {
          this.redisClient.del(keys)
        }
      }).catch(console.error)
    }
  }
  
  // Middleware for Express
  middleware(options = {}) {
    const {
      ttl = 300,
      keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
      condition = () => true
    } = options
    
    return async (req, res, next) => {
      if (!condition(req)) {
        return next()
      }
      
      const key = keyGenerator(req)
      const cached = await this.get(key)
      
      if (cached) {
        return res.json(cached)
      }
      
      // Override res.json to cache the response
      const originalJson = res.json
      res.json = (data) => {
        this.set(key, data, ttl)
        return originalJson.call(res, data)
      }
      
      next()
    }
  }
}

module.exports = new CacheManager()
```

### API Response Compression

```javascript
// server/middleware/compression.js
const compression = require('compression')
const zlib = require('zlib')

class CompressionMiddleware {
  static configure() {
    return compression({
      // Compression level (1-9, 9 is best compression)
      level: 6,
      
      // Minimum response size to compress
      threshold: 1024,
      
      // Custom filter function
      filter: (req, res) => {
        // Don't compress if client doesn't support it
        if (!req.headers['accept-encoding']) {
          return false
        }
        
        // Don't compress already compressed responses
        if (res.getHeader('content-encoding')) {
          return false
        }
        
        // Don't compress images, videos, or already compressed files
        const contentType = res.getHeader('content-type')
        if (contentType) {
          const nonCompressible = [
            'image/',
            'video/',
            'audio/',
            'application/zip',
            'application/gzip',
            'application/x-rar'
          ]
          
          if (nonCompressible.some(type => contentType.includes(type))) {
            return false
          }
        }
        
        return compression.filter(req, res)
      },
      
      // Brotli compression for modern browsers
      brotli: {
        enabled: true,
        zlib: zlib.constants.BROTLI_PARAM_QUALITY,
        value: 4
      }
    })
  }
  
  static customCompress(data, encoding = 'gzip') {
    return new Promise((resolve, reject) => {
      const callback = (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
      
      switch (encoding) {
        case 'br':
          zlib.brotliCompress(data, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
              [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length
            }
          }, callback)
          break
          
        case 'gzip':
          zlib.gzip(data, { level: 6 }, callback)
          break
          
        case 'deflate':
          zlib.deflate(data, { level: 6 }, callback)
          break
          
        default:
          resolve(data)
      }
    })
  }
}

module.exports = CompressionMiddleware
```

## Performance Monitoring

### Client-Side Performance Monitoring

```javascript
// src/utils/performanceMonitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      navigation: {},
      resources: [],
      userTiming: [],
      vitals: {}
    }
    
    this.observers = []
    this.initializeMonitoring()
  }
  
  initializeMonitoring() {
    // Core Web Vitals
    this.measureWebVitals()
    
    // Navigation timing
    this.measureNavigationTiming()
    
    // Resource timing
    this.measureResourceTiming()
    
    // User timing
    this.measureUserTiming()
    
    // Long tasks
    this.measureLongTasks()
    
    // Memory usage
    this.measureMemoryUsage()
  }
  
  measureWebVitals() {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      this.metrics.vitals.lcp = {
        value: lastEntry.startTime,
        rating: this.rateLCP(lastEntry.startTime)
      }
      
      this.reportMetric('lcp', this.metrics.vitals.lcp)
    })
    
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    this.observers.push(lcpObserver)
    
    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach(entry => {
        this.metrics.vitals.fid = {
          value: entry.processingStart - entry.startTime,
          rating: this.rateFID(entry.processingStart - entry.startTime)
        }
        
        this.reportMetric('fid', this.metrics.vitals.fid)
      })
    })
    
    fidObserver.observe({ entryTypes: ['first-input'] })
    this.observers.push(fidObserver)
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    let clsEntries = []
    
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
          clsEntries.push(entry)
        }
      })
      
      this.metrics.vitals.cls = {
        value: clsValue,
        rating: this.rateCLS(clsValue),
        entries: clsEntries
      }
      
      this.reportMetric('cls', this.metrics.vitals.cls)
    })
    
    clsObserver.observe({ entryTypes: ['layout-shift'] })
    this.observers.push(clsObserver)
  }
  
  measureNavigationTiming() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0]
      
      if (navigation) {
        this.metrics.navigation = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ssl: navigation.secureConnectionStart > 0 ? 
            navigation.connectEnd - navigation.secureConnectionStart : 0,
          ttfb: navigation.responseStart - navigation.requestStart,
          download: navigation.responseEnd - navigation.responseStart,
          domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
          domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          total: navigation.loadEventEnd - navigation.navigationStart
        }
        
        this.reportMetric('navigation', this.metrics.navigation)
      }
    })
  }
  
  measureResourceTiming() {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach(entry => {
        const resource = {
          name: entry.name,
          type: this.getResourceType(entry),
          size: entry.transferSize || 0,
          duration: entry.duration,
          startTime: entry.startTime,
          dns: entry.domainLookupEnd - entry.domainLookupStart,
          tcp: entry.connectEnd - entry.connectStart,
          ssl: entry.secureConnectionStart > 0 ? 
            entry.connectEnd - entry.secureConnectionStart : 0,
          ttfb: entry.responseStart - entry.requestStart,
          download: entry.responseEnd - entry.responseStart
        }
        
        this.metrics.resources.push(resource)
        
        // Report slow resources
        if (resource.duration > 1000) {
          this.reportMetric('slow-resource', resource)
        }
      })
    })
    
    resourceObserver.observe({ entryTypes: ['resource'] })
    this.observers.push(resourceObserver)
  }
  
  measureUserTiming() {
    const userTimingObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach(entry => {
        const timing = {
          name: entry.name,
          type: entry.entryType,
          startTime: entry.startTime,
          duration: entry.duration || 0
        }
        
        this.metrics.userTiming.push(timing)
        this.reportMetric('user-timing', timing)
      })
    })
    
    userTimingObserver.observe({ entryTypes: ['mark', 'measure'] })
    this.observers.push(userTimingObserver)
  }
  
  measureLongTasks() {
    if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach(entry => {
          const longTask = {
            startTime: entry.startTime,
            duration: entry.duration,
            attribution: entry.attribution || []
          }
          
          this.reportMetric('long-task', longTask)
        })
      })
      
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.push(longTaskObserver)
    }
  }
  
  measureMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          timestamp: Date.now()
        }
        
        this.metrics.memory = memory
        
        // Report memory pressure
        const usage = memory.used / memory.limit
        if (usage > 0.8) {
          this.reportMetric('memory-pressure', memory)
        }
      }, 30000) // Every 30 seconds
    }
  }
  
  // Custom timing methods
  mark(name) {
    performance.mark(name)
  }
  
  measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark)
  }
  
  // Rating functions
  rateLCP(value) {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  }
  
  rateFID(value) {
    if (value <= 100) return 'good'
    if (value <= 300) return 'needs-improvement'
    return 'poor'
  }
  
  rateCLS(value) {
    if (value <= 0.1) return 'good'
    if (value <= 0.25) return 'needs-improvement'
    return 'poor'
  }
  
  getResourceType(entry) {
    if (entry.initiatorType) return entry.initiatorType
    
    const url = new URL(entry.name)
    const extension = url.pathname.split('.').pop().toLowerCase()
    
    const typeMap = {
      js: 'script',
      css: 'stylesheet',
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
      gif: 'image',
      svg: 'image',
      woff: 'font',
      woff2: 'font',
      ttf: 'font'
    }
    
    return typeMap[extension] || 'other'
  }
  
  async reportMetric(type, data) {
    try {
      await fetch('/api/metrics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      })
    } catch (error) {
      console.error('Failed to report performance metric:', error)
    }
  }
  
  getMetrics() {
    return this.metrics
  }
  
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor()

export default performanceMonitor
```

This comprehensive performance optimization strategy ensures the Cucumber Test Results Viewer delivers excellent user experience with fast load times, smooth interactions, and efficient resource utilization.