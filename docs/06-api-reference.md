# API Reference

## Overview

The Cucumber Test Results Viewer provides a RESTful API for managing test reports. The API supports file upload, report management, and metadata operations.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: Same domain as frontend application

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Content Types

- **Request**: `application/json`, `multipart/form-data` (for uploads)
- **Response**: `application/json`

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Endpoints

### Health Check

#### GET /api/health

Check server health and status.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

### Report Upload

#### POST /api/upload

Upload one or more Cucumber JSON report files.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with file uploads

**Parameters:**
- `files` (required): One or more JSON files

**Example:**
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

**Response:**
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "results": [
    {
      "filename": "report-2024-01-15.json",
      "size": 15420,
      "processed": true,
      "reportId": "admin-test-scenarios-2024-01-15T10-30-00-000Z"
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0,
    "skipped": 0
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid file format",
  "details": [
    {
      "filename": "invalid.json",
      "error": "Not a valid Cucumber JSON format"
    }
  ]
}
```

### Report Management

#### GET /api/reports

Get list of all available reports.

**Query Parameters:**
- `limit` (optional): Maximum number of reports to return
- `offset` (optional): Number of reports to skip
- `sort` (optional): Sort field (`date`, `name`, `size`)
- `order` (optional): Sort order (`asc`, `desc`)

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "admin-test-scenarios-2024-01-15T10-30-00-000Z",
      "name": "Admin Test Scenarios",
      "filename": "Admin-Test-Scenarios-2024-01-15T10-30-00-000Z.json",
      "date": "2024-01-15T10:30:00.000Z",
      "size": 15420,
      "features": 5,
      "scenarios": 25,
      "steps": 150,
      "passed": 145,
      "failed": 3,
      "skipped": 2,
      "duration": 45.6,
      "tags": ["@smoke", "@regression"],
      "status": "active"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

#### GET /api/reports/:id

Get details of a specific report.

**Parameters:**
- `id` (required): Report ID or filename

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "admin-test-scenarios-2024-01-15T10-30-00-000Z",
    "metadata": {
      "name": "Admin Test Scenarios",
      "date": "2024-01-15T10:30:00.000Z",
      "environment": "staging",
      "browser": "chrome",
      "version": "1.0.0"
    },
    "statistics": {
      "features": 5,
      "scenarios": 25,
      "steps": 150,
      "passed": 145,
      "failed": 3,
      "skipped": 2,
      "duration": 45.6,
      "passRate": 96.67
    },
    "features": [
      {
        "id": "login-feature",
        "name": "User Login",
        "description": "Test user authentication",
        "uri": "features/login.feature",
        "line": 1,
        "tags": ["@smoke"],
        "elements": [
          {
            "id": "valid-login",
            "name": "Valid user login",
            "type": "scenario",
            "keyword": "Scenario",
            "line": 5,
            "steps": [
              {
                "keyword": "Given ",
                "name": "user is on login page",
                "line": 6,
                "result": {
                  "status": "passed",
                  "duration": 1500000000
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

#### DELETE /api/reports/:filename

Delete a specific report.

**Parameters:**
- `filename` (required): Report filename (with .json extension)

**Query Parameters:**
- `soft` (optional): Perform soft delete (`true`/`false`)

**Response:**
```json
{
  "success": true,
  "message": "Report deleted successfully",
  "deletionType": "hard",
  "filename": "report-2024-01-15.json",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Soft Delete Response:**
```json
{
  "success": true,
  "message": "Report marked for deletion",
  "deletionType": "soft",
  "filename": "report-2024-01-15.json",
  "deletionRecord": {
    "filename": "report-2024-01-15.json",
    "deletedAt": "2024-01-15T10:30:00.000Z",
    "needsCleanup": true,
    "type": "soft"
  }
}
```

### Deleted Reports Management

#### GET /api/reports/deleted

Get list of soft-deleted reports.

**Response:**
```json
{
  "success": true,
  "deletedReports": [
    {
      "filename": "old-report.json",
      "deletedAt": "2024-01-14T15:20:00.000Z",
      "needsCleanup": true,
      "type": "soft"
    }
  ],
  "count": 1
}
```

#### POST /api/reports/:filename/restore

Restore a soft-deleted report.

**Parameters:**
- `filename` (required): Report filename to restore

**Response:**
```json
{
  "success": true,
  "message": "Report restored successfully",
  "filename": "restored-report.json",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Statistics and Analytics

#### GET /api/stats

Get aggregated statistics across all reports.

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalReports": 15,
    "totalFeatures": 75,
    "totalScenarios": 350,
    "totalSteps": 2100,
    "totalPassed": 2050,
    "totalFailed": 35,
    "totalSkipped": 15,
    "averagePassRate": 97.6,
    "averageDuration": 42.3,
    "oldestReport": {
      "id": "report-1",
      "date": "2024-01-01T00:00:00.000Z"
    },
    "newestReport": {
      "id": "report-15",
      "date": "2024-01-15T10:30:00.000Z"
    },
    "topTags": [
      { "tag": "@smoke", "count": 45 },
      { "tag": "@regression", "count": 30 }
    ]
  }
}
```

#### GET /api/stats/:id

Get statistics for a specific report.

**Parameters:**
- `id` (required): Report ID

**Response:**
```json
{
  "success": true,
  "reportId": "admin-test-scenarios-2024-01-15T10-30-00-000Z",
  "statistics": {
    "features": 5,
    "scenarios": 25,
    "steps": 150,
    "passed": 145,
    "failed": 3,
    "skipped": 2,
    "duration": 45.6,
    "passRate": 96.67,
    "failureRate": 2.0,
    "skipRate": 1.33,
    "averageScenarioDuration": 1.824,
    "slowestScenario": {
      "name": "Complex workflow test",
      "duration": 8.5
    },
    "fastestScenario": {
      "name": "Simple validation",
      "duration": 0.2
    }
  }
}
```

### Sync and Maintenance

#### GET /api/sync/status

Get synchronization status for GitHub Pages deployment.

**Response:**
```json
{
  "success": true,
  "syncStatus": {
    "localReports": 15,
    "deletedReports": 2,
    "pendingCleanup": 1,
    "lastSyncAt": "2024-01-15T09:00:00.000Z",
    "needsCleanup": [
      {
        "filename": "old-report.json",
        "deletedAt": "2024-01-14T15:20:00.000Z"
      }
    ]
  }
}
```

#### POST /api/sync/cleanup

Trigger cleanup of soft-deleted reports.

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed",
  "cleaned": [
    "old-report-1.json",
    "old-report-2.json"
  ],
  "count": 2
}
```

## SDK and Client Libraries

### JavaScript/Node.js Client

```javascript
class CucumberReportsClient {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  async uploadReports(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await fetch(`${this.baseURL}/api/upload`, {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  }

  async getReports(options = {}) {
    const params = new URLSearchParams(options);
    const response = await fetch(`${this.baseURL}/api/reports?${params}`);
    return response.json();
  }

  async getReport(id) {
    const response = await fetch(`${this.baseURL}/api/reports/${id}`);
    return response.json();
  }

  async deleteReport(filename, soft = false) {
    const response = await fetch(
      `${this.baseURL}/api/reports/${filename}?soft=${soft}`,
      { method: 'DELETE' }
    );
    return response.json();
  }

  async getStatistics() {
    const response = await fetch(`${this.baseURL}/api/stats`);
    return response.json();
  }
}

// Usage
const client = new CucumberReportsClient();
const reports = await client.getReports({ limit: 10 });
```

### Python Client

```python
import requests
from typing import List, Dict, Any

class CucumberReportsClient:
    def __init__(self, base_url: str = "http://localhost:3001"):
        self.base_url = base_url
    
    def upload_reports(self, files: List[str]) -> Dict[str, Any]:
        files_data = []
        for file_path in files:
            with open(file_path, 'rb') as f:
                files_data.append(('files', f))
        
        response = requests.post(f"{self.base_url}/api/upload", files=files_data)
        return response.json()
    
    def get_reports(self, **params) -> Dict[str, Any]:
        response = requests.get(f"{self.base_url}/api/reports", params=params)
        return response.json()
    
    def get_report(self, report_id: str) -> Dict[str, Any]:
        response = requests.get(f"{self.base_url}/api/reports/{report_id}")
        return response.json()
    
    def delete_report(self, filename: str, soft: bool = False) -> Dict[str, Any]:
        params = {"soft": str(soft).lower()}
        response = requests.delete(
            f"{self.base_url}/api/reports/{filename}", 
            params=params
        )
        return response.json()

# Usage
client = CucumberReportsClient()
reports = client.get_reports(limit=10)
```

## Rate Limiting

The API implements basic rate limiting:

- **Upload endpoint**: 10 requests per minute per IP
- **Other endpoints**: 100 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## Webhooks (Future Feature)

Planned webhook support for external integrations:

```json
{
  "event": "report.uploaded",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "reportId": "admin-test-scenarios-2024-01-15T10-30-00-000Z",
    "filename": "report.json",
    "statistics": {
      "passed": 145,
      "failed": 3,
      "skipped": 2
    }
  }
}
```