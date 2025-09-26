# Webpack Configuration and Build Process

## Overview

This document explains the Webpack configuration, build process, and optimization strategies used in the Cucumber Test Results Viewer. It covers the Vue CLI configuration, custom webpack settings, performance optimizations, and deployment configurations.

## Vue CLI Configuration (`vue.config.js`)

### Complete Configuration Analysis

```javascript
// vue.config.js for GitHub Pages deployment with performance optimizations
const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  // GitHub Pages deployment configuration
  publicPath: process.env.NODE_ENV === 'production' 
    ? '/TestResults/' 
    : '/',
  
  // Output directory for built files
  outputDir: 'dist',
  
  // Directory for static assets (relative to outputDir)
  assetsDir: 'static',
  
  // Disable linting on save for faster development
  lintOnSave: process.env.NODE_ENV !== 'production',
  
  // Source map configuration
  productionSourceMap: false, // Disable source maps in production for smaller builds
  
  // Development server configuration
  devServer: {
    port: 8080,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },

  // Webpack configuration customization
  configureWebpack: {
    // Resolve configuration
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@views': path.resolve(__dirname, 'src/views'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@styles': path.resolve(__dirname, 'src/styles')
      },
      extensions: ['.js', '.vue', '.json', '.scss', '.css']
    },

    // Performance optimization
    optimization: {
      // Split chunks for better caching
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          // Vuetify components
          vuetify: {
            test: /[\\/]node_modules[\\/]vuetify[\\/]/,
            name: 'vuetify',
            chunks: 'all',
            priority: 20
          },
          // Vue ecosystem
          vue: {
            test: /[\\/]node_modules[\\/](vue|vue-router|vuex)[\\/]/,
            name: 'vue-ecosystem',
            chunks: 'all',
            priority: 15
          },
          // Common utilities
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          }
        }
      },
      
      // Runtime chunk for better caching
      runtimeChunk: {
        name: 'runtime'
      },
      
      // Minimize configuration
      minimize: process.env.NODE_ENV === 'production',
      minimizer: [
        // TerserPlugin for JavaScript minification (default)
        '...',
        // CSS optimization
        new (require('css-minimizer-webpack-plugin'))()
      ]
    },

    // Plugin configuration
    plugins: [
      // Compression plugin for gzip
      new CompressionPlugin({
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8,
        algorithm: 'gzip'
      }),

      // Bundle analyzer (only in analyze mode)
      ...(process.env.ANALYZE ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-report.html'
        })
      ] : [])
    ],

    // External dependencies (CDN)
    externals: process.env.NODE_ENV === 'production' ? {
      // 'vue': 'Vue',
      // 'vuetify': 'Vuetify'
    } : {}
  },

  // Webpack chain configuration for advanced customization
  chainWebpack: config => {
    // HTML plugin configuration
    config.plugin('html').tap(args => {
      args[0].title = 'Cucumber Report Viewer'
      args[0].meta = {
        viewport: 'width=device-width,initial-scale=1.0',
        description: 'Interactive Cucumber test results viewer'
      }
      return args
    })

    // Preload and prefetch configuration
    config.plugin('preload').tap(options => {
      options[0] = {
        rel: 'preload',
        include: 'initial',
        fileBlacklist: [/\.map$/, /hot-update\.js$/]
      }
      return options
    })

    config.plugin('prefetch').tap(options => {
      options[0].fileBlacklist = options[0].fileBlacklist || []
      options[0].fileBlacklist.push(/\.map$/, /hot-update\.js$/)
      return options
    })

    // Image optimization
    config.module
      .rule('images')
      .test(/\.(gif|png|jpe?g|svg)$/i)
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({
        mozjpeg: { 
          progressive: true, 
          quality: 85 
        },
        optipng: { 
          enabled: false 
        },
        pngquant: { 
          quality: [0.65, 0.90], 
          speed: 4 
        },
        gifsicle: { 
          interlaced: false 
        },
        webp: { 
          quality: 85 
        }
      })

    // Font optimization
    config.module
      .rule('fonts')
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 4096,
        fallback: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[hash:8].[ext]'
          }
        }
      })

    // Asset copying configuration
    config.plugin('copy').tap(([options]) => {
      if (!options.patterns) {
        options.patterns = []
      }
      
      // Copy favicon files
      options.patterns.push({
        from: path.resolve(__dirname, 'public/img'),
        to: path.resolve(__dirname, 'dist/img'),
        globOptions: {
          ignore: ['**/.*']
        }
      })
      
      // Copy TestResultsJsons directory
      options.patterns.push({
        from: path.resolve(__dirname, 'public/TestResultsJsons'),
        to: path.resolve(__dirname, 'dist/TestResultsJsons'),
        globOptions: {
          ignore: ['**/.*', '**/*.tmp']
        }
      })
      
      return [options]
    })

    // Configure proper chunk naming for consistent asset paths
    config.output
      .filename(process.env.NODE_ENV === 'production' 
        ? 'js/[name].[contenthash:8].js' 
        : 'js/[name].js')
      .chunkFilename(process.env.NODE_ENV === 'production' 
        ? 'js/[name].[contenthash:8].js' 
        : 'js/[name].js')

    // CSS extraction and naming
    if (process.env.NODE_ENV === 'production') {
      config.plugin('extract-css').tap(([options]) => {
        options.filename = 'css/[name].[contenthash:8].css'
        options.chunkFilename = 'css/[name].[contenthash:8].css'
        return [options]
      })
    }

    // Service Worker configuration
    if (process.env.NODE_ENV === 'production') {
      config.plugin('workbox').tap(([options]) => {
        options.skipWaiting = true
        options.clientsClaim = true
        options.runtimeCaching = [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\/TestResults\/TestResultsJsons\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cucumber-reports',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          }
        ]
        return [options]
      })
    }

    // Development-specific optimizations
    if (process.env.NODE_ENV === 'development') {
      // Faster source maps for development
      config.devtool('eval-cheap-module-source-map')
      
      // Hot module replacement
      config.plugin('hmr').use(require('webpack').HotModuleReplacementPlugin)
    }

    // Production-specific optimizations
    if (process.env.NODE_ENV === 'production') {
      // Remove console logs in production
      config.optimization.minimizer('terser').tap(([options]) => {
        options.terserOptions.compress.drop_console = true
        options.terserOptions.compress.drop_debugger = true
        return [options]
      })

      // Analyze bundle if requested
      if (process.env.ANALYZE) {
        config.plugin('bundle-analyzer').use(BundleAnalyzerPlugin, [{
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-report.html'
        }])
      }
    }
  },

  // CSS configuration
  css: {
    // Enable CSS source maps in development
    sourceMap: process.env.NODE_ENV === 'development',
    
    // CSS loader options
    loaderOptions: {
      sass: {
        // Global SCSS variables and mixins
        additionalData: `
          @import "@/styles/variables.scss";
          @import "@/styles/mixins.scss";
        `
      },
      postcss: {
        plugins: [
          require('autoprefixer'),
          require('cssnano')({
            preset: 'default'
          })
        ]
      }
    },
    
    // Extract CSS in production
    extract: process.env.NODE_ENV === 'production' ? {
      ignoreOrder: true
    } : false
  },

  // PWA configuration
  pwa: {
    name: 'Cucumber Report Viewer',
    short_name: 'Cucumber Reports',
    description: 'View and analyze Cucumber test reports with an interactive web interface',
    themeColor: '#3B82F6',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    
    // Manifest options
    manifestOptions: {
      name: 'Cucumber Report Viewer',
      short_name: 'Cucumber Reports',
      description: 'View and analyze Cucumber test reports with an interactive web interface',
      start_url: '/TestResults/',
      scope: '/TestResults/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#3B82F6',
      icons: [
        {
          src: '/TestResults/img/icons/favicon-16x16.png',
          sizes: '16x16',
          type: 'image/png'
        },
        {
          src: '/TestResults/img/icons/favicon-32x32.png',
          sizes: '32x32',
          type: 'image/png'
        },
        {
          src: '/TestResults/img/icons/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png'
        }
      ]
    },

    // Icon paths
    iconPaths: {
      favicon32: 'img/icons/favicon-32x32.png',
      favicon16: 'img/icons/favicon-16x16.png',
      appleTouchIcon: 'img/icons/apple-touch-icon.png',
      maskIcon: 'img/icons/favicon.svg',
      msTileImage: 'img/icons/favicon-32x32.png'
    },

    // Workbox options
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
      
      // Runtime caching strategies
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'google-fonts-stylesheets'
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            cacheableResponse: {
              statuses: [0, 200]
            },
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
          }
        },
        {
          urlPattern: /\/TestResults\/TestResultsJsons\/.*/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'cucumber-reports',
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
            }
          }
        }
      ]
    }
  },

  // Plugin options
  pluginOptions: {
    // Vuetify plugin options
    vuetify: {
      theme: {
        themes: {
          light: {
            primary: '#3B82F6',
            secondary: '#64748B',
            accent: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#06B6D4',
            success: '#22C55E'
          },
          dark: {
            primary: '#60A5FA',
            secondary: '#94A3B8',
            accent: '#34D399',
            error: '#F87171',
            warning: '#FBBF24',
            info: '#22D3EE',
            success: '#4ADE80'
          }
        }
      }
    }
  }
}
```

## Build Scripts and Optimization

### Package.json Build Scripts

```json
{
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "build:analyze": "cross-env ANALYZE=true vue-cli-service build",
    "build:modern": "vue-cli-service build --modern",
    "build:report": "vue-cli-service build --report",
    "build:staging": "cross-env NODE_ENV=staging vue-cli-service build",
    "build:production": "cross-env NODE_ENV=production vue-cli-service build",
    "build:validate": "npm run build && npm run validate-build",
    "validate-build": "node scripts/validate-build.js",
    "analyze": "npm run build:analyze && open dist/bundle-report.html",
    "preview": "npm run build && npx http-server dist -p 8080 -g",
    "lint": "vue-cli-service lint",
    "lint:fix": "vue-cli-service lint --fix"
  }
}
```

### Build Validation Script

```javascript
// scripts/validate-build.js
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class BuildValidator {
  constructor() {
    this.distDir = path.resolve(__dirname, '../dist')
    this.errors = []
    this.warnings = []
  }

  async validate() {
    console.log('🔍 Validating build output...')
    
    try {
      await this.checkDistDirectory()
      await this.checkRequiredFiles()
      await this.checkAssetIntegrity()
      await this.checkBundleSizes()
      await this.checkServiceWorker()
      await this.checkManifest()
      
      this.printResults()
      
      if (this.errors.length > 0) {
        process.exit(1)
      }
    } catch (error) {
      console.error('❌ Build validation failed:', error.message)
      process.exit(1)
    }
  }

  async checkDistDirectory() {
    if (!fs.existsSync(this.distDir)) {
      this.errors.push('dist directory does not exist')
      return
    }
    
    console.log('✅ dist directory exists')
  }

  async checkRequiredFiles() {
    const requiredFiles = [
      'index.html',
      'manifest.json',
      'service-worker.js',
      'img/icons/favicon-16x16.png',
      'img/icons/favicon-32x32.png',
      'img/icons/apple-touch-icon.png'
    ]

    for (const file of requiredFiles) {
      const filePath = path.join(this.distDir, file)
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing required file: ${file}`)
      } else {
        console.log(`✅ Found: ${file}`)
      }
    }
  }

  async checkAssetIntegrity() {
    // Check CSS files
    const cssDir = path.join(this.distDir, 'css')
    if (fs.existsSync(cssDir)) {
      const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'))
      if (cssFiles.length === 0) {
        this.errors.push('No CSS files found')
      } else {
        console.log(`✅ Found ${cssFiles.length} CSS file(s)`)
        
        // Check for critical CSS issues
        for (const cssFile of cssFiles) {
          const cssPath = path.join(cssDir, cssFile)
          const cssContent = fs.readFileSync(cssPath, 'utf8')
          
          if (cssContent.length === 0) {
            this.errors.push(`Empty CSS file: ${cssFile}`)
          }
          
          if (cssContent.includes('undefined')) {
            this.warnings.push(`CSS file ${cssFile} contains 'undefined'`)
          }
        }
      }
    } else {
      this.errors.push('CSS directory not found')
    }

    // Check JS files
    const jsDir = path.join(this.distDir, 'js')
    if (fs.existsSync(jsDir)) {
      const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'))
      if (jsFiles.length === 0) {
        this.errors.push('No JavaScript files found')
      } else {
        console.log(`✅ Found ${jsFiles.length} JavaScript file(s)`)
      }
    } else {
      this.errors.push('JavaScript directory not found')
    }
  }

  async checkBundleSizes() {
    const sizeLimit = 2 * 1024 * 1024 // 2MB limit for main bundle
    
    const jsDir = path.join(this.distDir, 'js')
    if (fs.existsSync(jsDir)) {
      const jsFiles = fs.readdirSync(jsDir)
      
      for (const file of jsFiles) {
        const filePath = path.join(jsDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.size > sizeLimit) {
          this.warnings.push(`Large bundle: ${file} (${this.formatBytes(stats.size)})`)
        }
        
        console.log(`📦 ${file}: ${this.formatBytes(stats.size)}`)
      }
    }
  }

  async checkServiceWorker() {
    const swPath = path.join(this.distDir, 'service-worker.js')
    
    if (fs.existsSync(swPath)) {
      const swContent = fs.readFileSync(swPath, 'utf8')
      
      if (swContent.length === 0) {
        this.errors.push('Service worker file is empty')
      } else if (!swContent.includes('precacheAndRoute')) {
        this.warnings.push('Service worker may not be properly configured')
      } else {
        console.log('✅ Service worker appears valid')
      }
    } else {
      this.errors.push('Service worker file not found')
    }
  }

  async checkManifest() {
    const manifestPath = path.join(this.distDir, 'manifest.json')
    
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        
        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons']
        for (const field of requiredFields) {
          if (!manifest[field]) {
            this.errors.push(`Missing manifest field: ${field}`)
          }
        }
        
        // Check if start_url is correct for GitHub Pages
        if (manifest.start_url && !manifest.start_url.includes('/TestResults/')) {
          this.errors.push(`Incorrect start_url in manifest: ${manifest.start_url}`)
        }
        
        console.log('✅ Manifest.json is valid')
      } catch (error) {
        this.errors.push(`Invalid manifest.json: ${error.message}`)
      }
    } else {
      this.errors.push('manifest.json not found')
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  printResults() {
    console.log('\n📊 Build Validation Results:')
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All checks passed!')
    } else {
      if (this.errors.length > 0) {
        console.log('\n❌ Errors:')
        this.errors.forEach(error => console.log(`  - ${error}`))
      }
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️  Warnings:')
        this.warnings.forEach(warning => console.log(`  - ${warning}`))
      }
    }
  }
}

// Run validation
const validator = new BuildValidator()
validator.validate()
```

## Performance Optimizations

### Code Splitting Strategies

```javascript
// Dynamic imports for route-based code splitting
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import(/* webpackChunkName: "home" */ '@/views/Home.vue')
  },
  {
    path: '/report/:filename',
    name: 'Report',
    component: () => import(/* webpackChunkName: "report" */ '@/views/Report.vue')
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import(/* webpackChunkName: "reports" */ '@/views/Reports.vue')
  }
]

// Component-level code splitting
export default {
  components: {
    // Lazy load heavy components
    ReportViewer: () => import(/* webpackChunkName: "report-viewer" */ '@/components/ReportViewer.vue'),
    DataTable: () => import(/* webpackChunkName: "data-table" */ '@/components/DataTable.vue')
  }
}
```

### Asset Optimization

```javascript
// Image optimization configuration
const imageOptimizationConfig = {
  mozjpeg: {
    progressive: true,
    quality: 85
  },
  optipng: {
    enabled: false
  },
  pngquant: {
    quality: [0.65, 0.90],
    speed: 4
  },
  gifsicle: {
    interlaced: false
  },
  webp: {
    quality: 85
  }
}

// Font loading optimization
const fontOptimizationConfig = {
  preload: [
    {
      rel: 'preload',
      href: '/fonts/inter-var.woff2',
      as: 'font',
      type: 'font/woff2',
      crossorigin: 'anonymous'
    }
  ]
}
```

### Bundle Analysis

```javascript
// Bundle analysis configuration
const bundleAnalysisConfig = {
  analyzer: {
    analyzerMode: 'static',
    openAnalyzer: false,
    reportFilename: 'bundle-report.html',
    defaultSizes: 'gzip'
  },
  
  // Size limits
  limits: {
    maxAssetSize: 250000, // 250KB
    maxEntrypointSize: 250000, // 250KB
    hints: 'warning'
  }
}
```

## Environment-Specific Configurations

### Development Configuration

```javascript
// Development-specific webpack config
const developmentConfig = {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  
  optimization: {
    splitChunks: false,
    minimize: false
  },
  
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  
  devServer: {
    hot: true,
    compress: true,
    historyApiFallback: true,
    overlay: {
      warnings: false,
      errors: true
    }
  }
}
```

### Production Configuration

```javascript
// Production-specific webpack config
const productionConfig = {
  mode: 'production',
  devtool: false,
  
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },
  
  plugins: [
    new CompressionPlugin({
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    })
  ]
}
```

This comprehensive Webpack configuration provides optimal build performance, asset optimization, and deployment readiness for the Cucumber Test Results Viewer application.