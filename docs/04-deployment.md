# Deployment Guide

## Overview

The Cucumber Test Results Viewer supports multiple deployment strategies, with GitHub Pages being the primary production deployment method.

## GitHub Pages Deployment

### Prerequisites
- GitHub repository with Pages enabled
- GitHub Actions enabled
- Node.js 18+ for local development

### Automatic Deployment Setup

1. **Enable GitHub Pages**
   ```bash
   # In your GitHub repository settings:
   # Settings → Pages → Source: GitHub Actions
   ```

2. **Configure GitHub Actions**
   The repository includes pre-configured workflows:
   ```
   .github/workflows/
   ├── deploy.yml           # Main deployment workflow
   ├── update-index.yml     # Report processing workflow
   └── test.yml             # Testing workflow
   ```

3. **Environment Variables**
   Set in GitHub repository settings:
   ```bash
   GITHUB_TOKEN=<automatically_provided>
   NODE_ENV=production
   ```

### Manual GitHub Pages Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**
   ```bash
   npm run deploy
   ```

3. **Verify Deployment**
   - Visit `https://your-username.github.io/your-repo`
   - Check that reports are loading correctly
   - Test upload and deletion functionality

## Local Development Deployment

### Development Server Setup

1. **Install Dependencies**
   ```bash
   cd cucumber-report-viewer
   npm install
   ```

2. **Start Development Servers**
   ```bash
   # Terminal 1: Frontend development server
   npm run serve

   # Terminal 2: Backend API server
   npm run server
   ```

3. **Access Application**
   - Frontend: `http://localhost:8080`
   - Backend API: `http://localhost:3001`

### Production-like Local Setup

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Serve Built Files**
   ```bash
   # Using Node.js server
   npm run start

   # Or using a static file server
   npx serve dist
   ```

## Docker Deployment

### Dockerfile Configuration

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Setup

```yaml
version: '3.8'
services:
  cucumber-reports:
    build: .
    ports:
      - "80:80"
    volumes:
      - ./reports:/usr/share/nginx/html/TestResultsJsons
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### Docker Deployment Commands

```bash
# Build image
docker build -t cucumber-reports .

# Run container
docker run -d -p 80:80 --name cucumber-reports cucumber-reports

# Using Docker Compose
docker-compose up -d
```

## Cloud Platform Deployments

### Netlify Deployment

1. **Connect Repository**
   - Link GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**
   ```bash
   NODE_ENV=production
   VUE_APP_API_URL=/.netlify/functions
   ```

3. **Netlify Functions** (Optional)
   ```javascript
   // netlify/functions/upload.js
   exports.handler = async (event, context) => {
     // Handle file uploads
   };
   ```

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configuration** (`vercel.json`)
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/api/$1"
       },
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ]
   }
   ```

### AWS S3 + CloudFront Deployment

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Upload to S3**
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

3. **CloudFront Configuration**
   ```json
   {
     "Origins": [{
       "DomainName": "your-bucket.s3.amazonaws.com",
       "Id": "S3-your-bucket",
       "S3OriginConfig": {
         "OriginAccessIdentity": ""
       }
     }],
     "DefaultCacheBehavior": {
       "TargetOriginId": "S3-your-bucket",
       "ViewerProtocolPolicy": "redirect-to-https"
     }
   }
   ```

## Environment Configuration

### Environment Variables

```bash
# Development
NODE_ENV=development
VUE_APP_API_URL=http://localhost:3001
VUE_APP_ENABLE_DEBUG=true

# Production
NODE_ENV=production
VUE_APP_API_URL=
VUE_APP_ENABLE_DEBUG=false
VUE_APP_GITHUB_PAGES_URL=https://your-username.github.io/your-repo
```

### Configuration Files

#### `.env.local` (Development)
```bash
NODE_ENV=development
VUE_APP_API_URL=http://localhost:3001
VUE_APP_ENABLE_DEBUG=true
VUE_APP_ENABLE_ANALYTICS=false
```

#### `.env.production` (Production)
```bash
NODE_ENV=production
VUE_APP_API_URL=
VUE_APP_ENABLE_DEBUG=false
VUE_APP_ENABLE_ANALYTICS=true
VUE_APP_GITHUB_PAGES_URL=https://your-username.github.io/your-repo
```

## Build Configuration

### Webpack Configuration

```javascript
// vue.config.js
module.exports = {
  publicPath: process.env.NODE_ENV === 'production' 
    ? '/your-repo-name/' 
    : '/',
  
  outputDir: 'dist',
  
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
  },
  
  pwa: {
    name: 'Cucumber Test Results',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
  },
};
```

### Build Scripts

```json
{
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "build:dev": "vue-cli-service build --mode development",
    "build:staging": "vue-cli-service build --mode staging",
    "build:prod": "vue-cli-service build --mode production",
    "deploy": "npm run build && gh-pages -d dist",
    "deploy:staging": "npm run build:staging && gh-pages -d dist -b staging",
    "server": "node server.js",
    "start": "npm run server"
  }
}
```

## Deployment Verification

### Health Checks

1. **Application Health**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Frontend Functionality**
   - Page loads without errors
   - Theme toggle works
   - File upload functions
   - Report viewing works

3. **Backend API**
   - Upload endpoint responds
   - Delete endpoint works
   - Health endpoint returns 200

### Performance Testing

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Load testing
npm install -g artillery
artillery quick --count 10 --num 5 https://your-domain.com
```

## Monitoring and Logging

### Application Monitoring

1. **Error Tracking**
   ```javascript
   // Sentry integration
   import * as Sentry from "@sentry/vue";
   
   Sentry.init({
     app,
     dsn: process.env.VUE_APP_SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```

2. **Analytics**
   ```javascript
   // Google Analytics
   import { gtag } from 'vue-gtag';
   
   gtag('config', process.env.VUE_APP_GA_ID);
   ```

### Server Monitoring

```javascript
// server.js monitoring
const express = require('express');
const morgan = require('morgan');

app.use(morgan('combined'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});
```

## Backup and Recovery

### Data Backup Strategy

1. **Report Files Backup**
   ```bash
   # Automated backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   tar -czf "reports_backup_$DATE.tar.gz" public/TestResultsJsons/
   aws s3 cp "reports_backup_$DATE.tar.gz" s3://backup-bucket/
   ```

2. **Configuration Backup**
   ```bash
   # Backup configuration files
   git add .
   git commit -m "Backup configuration - $(date)"
   git push origin backup-branch
   ```

### Disaster Recovery

1. **Application Recovery**
   ```bash
   # Restore from backup
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   npm install
   npm run build
   npm run deploy
   ```

2. **Data Recovery**
   ```bash
   # Restore report files
   aws s3 cp s3://backup-bucket/reports_backup_latest.tar.gz .
   tar -xzf reports_backup_latest.tar.gz
   ```

## Troubleshooting Deployment Issues

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   npm run clean
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **GitHub Pages 404 Errors**
   - Check `publicPath` in `vue.config.js`
   - Verify repository name matches configuration
   - Ensure GitHub Pages is enabled

3. **API Connection Issues**
   - Verify CORS configuration
   - Check environment variables
   - Test API endpoints directly

4. **Performance Issues**
   - Enable gzip compression
   - Optimize bundle size
   - Use CDN for static assets

### Debug Commands

```bash
# Check build output
npm run build -- --report

# Analyze bundle size
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer dist/static/js/*.js

# Test production build locally
npm install -g serve
serve -s dist -l 3000
```