# Deployment Strategies and DevOps

## Overview

This document outlines comprehensive deployment strategies, DevOps practices, and infrastructure management for the Cucumber Test Results Viewer. It covers multiple deployment environments, CI/CD pipelines, monitoring, and production best practices.

## Deployment Architecture

### Multi-Environment Strategy

```yaml
# environments.yml
environments:
  development:
    url: http://localhost:8080
    api_url: http://localhost:3000
    database: sqlite
    logging_level: debug
    
  staging:
    url: https://staging.cucumber-viewer.com
    api_url: https://api-staging.cucumber-viewer.com
    database: postgresql
    logging_level: info
    
  production:
    url: https://cucumber-viewer.com
    api_url: https://api.cucumber-viewer.com
    database: postgresql
    logging_level: warn
    cdn: https://cdn.cucumber-viewer.com
```

### GitHub Pages Deployment

```yaml
# .github/workflows/deploy-github-pages.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: 'cucumber-report-viewer/package-lock.json'
    
    - name: Install dependencies
      working-directory: ./cucumber-report-viewer
      run: npm ci
    
    - name: Run tests
      working-directory: ./cucumber-report-viewer
      run: |
        npm run test:unit
        npm run test:e2e:headless
    
    - name: Build application
      working-directory: ./cucumber-report-viewer
      run: npm run build
      env:
        NODE_ENV: production
        VUE_APP_BASE_URL: /TestResults/
        VUE_APP_API_URL: /TestResults/api
    
    - name: Setup Pages
      uses: actions/configure-pages@v4
    
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: './cucumber-report-viewer/dist'
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    
    steps:
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy SSL certificates (if using HTTPS)
COPY ssl/ /etc/nginx/ssl/

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    volumes:
      - ./reports:/usr/share/nginx/html/reports:ro
      - ./ssl:/etc/nginx/ssl:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/cucumber_reports
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=cucumber_reports
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

```yaml
# k8s/namespace.yml
apiVersion: v1
kind: Namespace
metadata:
  name: cucumber-viewer
  labels:
    name: cucumber-viewer
```

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cucumber-viewer-app
  namespace: cucumber-viewer
  labels:
    app: cucumber-viewer
    component: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cucumber-viewer
      component: frontend
  template:
    metadata:
      labels:
        app: cucumber-viewer
        component: frontend
    spec:
      containers:
      - name: app
        image: cucumber-viewer:latest
        ports:
        - containerPort: 80
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
      imagePullSecrets:
      - name: registry-secret
```

```yaml
# k8s/service.yml
apiVersion: v1
kind: Service
metadata:
  name: cucumber-viewer-service
  namespace: cucumber-viewer
spec:
  selector:
    app: cucumber-viewer
    component: frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

```yaml
# k8s/ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cucumber-viewer-ingress
  namespace: cucumber-viewer
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - cucumber-viewer.com
    secretName: cucumber-viewer-tls
  rules:
  - host: cucumber-viewer.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: cucumber-viewer-service
            port:
              number: 80
```

## CI/CD Pipeline Implementation

### Advanced GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  release:
    types: [ published ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run unit tests
      run: npm run test:unit -- --coverage
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
  
  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
    
    - name: Run CodeQL analysis
      uses: github/codeql-action/analyze@v2
      with:
        languages: javascript
  
  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    
    outputs:
      image: ${{ steps.image.outputs.image }}
      digest: ${{ steps.build.outputs.digest }}
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha
    
    - name: Build and push Docker image
      id: build
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Output image
      id: image
      run: |
        echo "image=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.version }}" >> $GITHUB_OUTPUT
  
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to staging
      run: |
        echo "Deploying ${{ needs.build.outputs.image }} to staging"
        # Add actual deployment commands here
    
    - name: Run smoke tests
      run: |
        npm run test:smoke -- --env=staging
    
    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  
  deploy-production:
    if: github.event_name == 'release'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        echo "Deploying ${{ needs.build.outputs.image }} to production"
        # Add actual deployment commands here
    
    - name: Run health checks
      run: |
        npm run test:health -- --env=production
    
    - name: Update deployment status
      uses: chrnorm/deployment-status@v2
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        state: success
        deployment-id: ${{ steps.deployment.outputs.deployment-id }}
```

### Deployment Scripts

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}

echo "🚀 Deploying to $ENVIRONMENT with image tag $IMAGE_TAG"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Load environment variables
source "config/$ENVIRONMENT.env"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."
./scripts/health-check.sh "$API_URL/health"

# Database migrations (if needed)
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🗄️ Running database migrations..."
    npm run migrate:up
fi

# Deploy application
echo "📦 Deploying application..."
if [ "$DEPLOYMENT_TYPE" = "kubernetes" ]; then
    kubectl set image deployment/cucumber-viewer-app app="$REGISTRY/$IMAGE_NAME:$IMAGE_TAG" -n cucumber-viewer
    kubectl rollout status deployment/cucumber-viewer-app -n cucumber-viewer --timeout=300s
elif [ "$DEPLOYMENT_TYPE" = "docker" ]; then
    docker-compose -f docker-compose.$ENVIRONMENT.yml pull
    docker-compose -f docker-compose.$ENVIRONMENT.yml up -d --remove-orphans
fi

# Post-deployment verification
echo "✅ Running post-deployment verification..."
sleep 30
./scripts/health-check.sh "$APP_URL/health"
./scripts/smoke-test.sh "$APP_URL"

# Update monitoring
echo "📊 Updating monitoring dashboards..."
curl -X POST "$MONITORING_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"environment\": \"$ENVIRONMENT\", \"version\": \"$IMAGE_TAG\", \"status\": \"deployed\"}"

echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
```

```bash
#!/bin/bash
# scripts/health-check.sh

URL=$1
MAX_ATTEMPTS=30
ATTEMPT=1

echo "🏥 Checking health of $URL"

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Health check passed (attempt $ATTEMPT)"
        exit 0
    fi
    
    echo "⏳ Health check failed (attempt $ATTEMPT/$MAX_ATTEMPTS) - HTTP $HTTP_CODE"
    sleep 10
    ATTEMPT=$((ATTEMPT + 1))
done

echo "❌ Health check failed after $MAX_ATTEMPTS attempts"
exit 1
```

## Infrastructure as Code

### Terraform Configuration

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
  
  backend "s3" {
    bucket = "cucumber-viewer-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "cucumber-viewer-vpc"
    Environment = var.environment
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "cucumber-viewer-${var.environment}"
  role_arn = aws_iam_role.cluster.arn
  version  = "1.27"
  
  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
  ]
  
  tags = {
    Environment = var.environment
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier = "cucumber-viewer-${var.environment}"
  
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = var.db_instance_class
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  
  db_name  = "cucumber_reports"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment != "production"
  
  tags = {
    Environment = var.environment
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.static.id}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.static.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = {
    Environment = var.environment
  }
}
```

### Ansible Playbooks

```yaml
# ansible/deploy.yml
---
- name: Deploy Cucumber Test Results Viewer
  hosts: webservers
  become: yes
  vars:
    app_name: cucumber-viewer
    app_user: cucumber
    app_dir: /opt/cucumber-viewer
    
  tasks:
    - name: Create application user
      user:
        name: "{{ app_user }}"
        system: yes
        shell: /bin/bash
        home: "{{ app_dir }}"
        
    - name: Create application directory
      file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ app_user }}"
        group: "{{ app_user }}"
        mode: '0755'
        
    - name: Install Node.js
      apt:
        name: nodejs
        state: present
        update_cache: yes
        
    - name: Install npm
      apt:
        name: npm
        state: present
        
    - name: Copy application files
      synchronize:
        src: ../dist/
        dest: "{{ app_dir }}/public/"
        delete: yes
      notify: restart nginx
      
    - name: Install nginx
      apt:
        name: nginx
        state: present
        
    - name: Configure nginx
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/sites-available/{{ app_name }}
      notify: restart nginx
      
    - name: Enable nginx site
      file:
        src: /etc/nginx/sites-available/{{ app_name }}
        dest: /etc/nginx/sites-enabled/{{ app_name }}
        state: link
      notify: restart nginx
      
    - name: Remove default nginx site
      file:
        path: /etc/nginx/sites-enabled/default
        state: absent
      notify: restart nginx
      
    - name: Start and enable nginx
      systemd:
        name: nginx
        state: started
        enabled: yes
        
  handlers:
    - name: restart nginx
      systemd:
        name: nginx
        state: restarted
```

## Monitoring and Observability

### Application Monitoring

```javascript
// src/utils/monitoring.js
class ApplicationMonitoring {
  constructor() {
    this.metrics = {
      pageViews: 0,
      reportLoads: 0,
      errors: 0,
      performanceMetrics: []
    }
    
    this.initializeMonitoring()
  }
  
  initializeMonitoring() {
    // Performance monitoring
    if ('performance' in window) {
      this.trackPerformance()
    }
    
    // Error tracking
    window.addEventListener('error', this.trackError.bind(this))
    window.addEventListener('unhandledrejection', this.trackPromiseRejection.bind(this))
    
    // User interaction tracking
    this.trackUserInteractions()
    
    // Send metrics periodically
    setInterval(() => this.sendMetrics(), 60000) // Every minute
  }
  
  trackPerformance() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.performanceMetrics.push({
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
          type: entry.entryType,
          timestamp: Date.now()
        })
      }
    })
    
    observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] })
  }
  
  trackError(event) {
    this.metrics.errors++
    
    const errorData = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    this.sendErrorReport(errorData)
  }
  
  trackPromiseRejection(event) {
    this.metrics.errors++
    
    const errorData = {
      type: 'unhandledPromiseRejection',
      reason: event.reason,
      timestamp: Date.now(),
      url: window.location.href
    }
    
    this.sendErrorReport(errorData)
  }
  
  trackUserInteractions() {
    // Track page views
    this.trackPageView()
    
    // Track report loads
    document.addEventListener('reportLoaded', () => {
      this.metrics.reportLoads++
    })
    
    // Track feature usage
    document.addEventListener('click', (event) => {
      if (event.target.dataset.track) {
        this.trackEvent('click', event.target.dataset.track)
      }
    })
  }
  
  trackPageView() {
    this.metrics.pageViews++
    
    const pageData = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now()
    }
    
    this.sendEvent('pageView', pageData)
  }
  
  trackEvent(type, data) {
    const eventData = {
      type,
      data,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    }
    
    this.sendEvent('userInteraction', eventData)
  }
  
  async sendMetrics() {
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: this.metrics,
          timestamp: Date.now(),
          sessionId: this.getSessionId()
        })
      })
      
      // Reset metrics after sending
      this.resetMetrics()
    } catch (error) {
      console.error('Failed to send metrics:', error)
    }
  }
  
  async sendErrorReport(errorData) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      })
    } catch (error) {
      console.error('Failed to send error report:', error)
    }
  }
  
  async sendEvent(type, data) {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: Date.now()
        })
      })
    } catch (error) {
      console.error('Failed to send event:', error)
    }
  }
  
  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }
  
  resetMetrics() {
    this.metrics = {
      pageViews: 0,
      reportLoads: 0,
      errors: 0,
      performanceMetrics: []
    }
  }
}

// Initialize monitoring
const monitoring = new ApplicationMonitoring()
export default monitoring
```

### Prometheus Metrics

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'cucumber-viewer-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: /metrics
    scrape_interval: 30s
    
  - job_name: 'cucumber-viewer-nginx'
    static_configs:
      - targets: ['nginx:9113']
    scrape_interval: 30s
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 30s
```

### Grafana Dashboards

```json
{
  "dashboard": {
    "title": "Cucumber Test Results Viewer - Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      }
    ]
  }
}
```

This comprehensive deployment strategy ensures reliable, scalable, and monitored deployments across multiple environments with proper DevOps practices.