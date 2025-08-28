# Architecture Guide

## System Overview

The Cucumber Test Results Viewer is a modern web application built with Vue.js 3 and designed for both local development and GitHub Pages deployment.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vue.js 3)                     │
├─────────────────────────────────────────────────────────────┤
│  Components  │  Services  │  Store  │  Router  │  Plugins   │
├─────────────────────────────────────────────────────────────┤
│                    Backend (Express.js)                    │
├─────────────────────────────────────────────────────────────┤
│   API Routes  │  File System  │  Index Generation  │ Utils │
├─────────────────────────────────────────────────────────────┤
│                  GitHub Pages Deployment                   │
├─────────────────────────────────────────────────────────────┤
│  Static Files  │  GitHub Actions  │  Automated Workflows   │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Vue.js 3 Application Structure

```
src/
├── components/          # Reusable Vue components
│   ├── ReportViewer.vue    # Main report display component
│   ├── ReportsCollection.vue # Report management interface
│   ├── ReportUploader.vue   # File upload component
│   ├── ThemeToggle.vue      # Dark/light theme switcher
│   └── ConfirmationDialog.vue # Reusable confirmation dialogs
├── views/               # Page-level components
│   └── Report.vue          # Report detail page
├── services/            # Business logic and API calls
│   ├── ReportService.js    # Report data management
│   └── DeletionService.js  # Report deletion logic
├── store/               # Vuex state management
│   └── modules/
│       └── theme.js        # Theme state management
├── utils/               # Utility functions
│   └── deletionUtils.js    # File system utilities
├── plugins/             # Vue plugins configuration
│   └── vuetify.js          # Material Design components
├── styles/              # Global styles
│   └── vuetify.scss        # Theme customization
└── tests/               # Unit and integration tests
    ├── setup.js            # Test configuration
    └── *.test.js           # Test files
```

### Component Architecture

#### ReportViewer Component
- **Purpose**: Main component for displaying Cucumber test results
- **Features**: 
  - Expandable feature/scenario sections
  - Search and filtering capabilities
  - Error display with stack traces
  - Screenshot support
- **State Management**: Local component state with Vuex integration
- **Performance**: Virtual scrolling for large reports

#### ReportsCollection Component
- **Purpose**: Manages multiple reports and provides overview
- **Features**:
  - Report listing with metadata
  - Bulk operations (delete, export)
  - Statistics dashboard
  - GitHub Pages publishing
- **Data Flow**: Fetches data from localStorage and server APIs

#### Services Layer
- **ReportService**: Handles report data operations
- **DeletionService**: Manages report deletion with fallback mechanisms
- **API Integration**: RESTful communication with backend

## Backend Architecture

### Express.js Server Structure

```
server.js                # Main server file
├── API Routes
│   ├── POST /api/upload     # File upload endpoint
│   ├── DELETE /api/reports/:id # Report deletion
│   ├── GET /api/reports     # Report listing
│   └── GET /api/health      # Health check
├── Middleware
│   ├── CORS configuration   # Cross-origin requests
│   ├── JSON parsing         # Request body parsing
│   └── Static file serving  # Public file access
└── Utilities
    ├── File validation      # Cucumber JSON validation
    ├── Index generation     # Automatic index.json creation
    └── Error handling       # Comprehensive error management
```

### File System Organization

```
public/TestResultsJsons/
├── *.json                  # Cucumber report files
├── index.json              # Generated report index
├── stats.json              # Aggregated statistics
├── .deleted-reports.json   # Soft deletion tracking
├── .backups/               # Backup files
│   └── *-backup-*.json     # Timestamped backups
└── uploads/                # Temporary upload directory
    └── *.json              # Pending uploads
```

## Data Flow Architecture

### Report Upload Flow
```
1. User selects files → ReportUploader component
2. File validation → Frontend validation
3. API call → POST /api/upload
4. Server processing → File system storage
5. Index generation → Automatic index.json update
6. UI update → Component re-render
7. GitHub sync → Automatic commit (if configured)
```

### Report Viewing Flow
```
1. Route navigation → Vue Router
2. Data fetching → ReportService
3. State management → Vuex store
4. Component rendering → ReportViewer
5. User interactions → Search, filter, expand
6. Real-time updates → Reactive data binding
```

### Deletion Flow
```
1. User action → Delete button click
2. Confirmation → ConfirmationDialog component
3. Service call → DeletionService
4. Server request → DELETE /api/reports/:id
5. Fallback handling → Local deletion if server unavailable
6. State update → Remove from UI
7. Sync tracking → Update deletion metadata
```

## State Management

### Vuex Store Structure
```javascript
store/
├── index.js              # Root store configuration
└── modules/
    ├── theme.js          # Theme state (dark/light)
    ├── reports.js        # Report data and metadata
    └── ui.js             # UI state (loading, errors)
```

### Local Storage Strategy
- **Report Data**: Cached in localStorage for offline access
- **User Preferences**: Theme, layout preferences
- **Deletion Tracking**: Soft-deleted reports metadata
- **Upload History**: Recent upload information

## GitHub Pages Integration

### Deployment Architecture
```
GitHub Repository
├── Source Code (main branch)
├── GitHub Actions Workflows
│   ├── Build and Deploy
│   ├── Report Processing
│   └── Index Generation
└── GitHub Pages (gh-pages branch)
    ├── Built Application
    ├── Static Assets
    └── Report Files
```

### Automated Workflows
1. **Build Workflow**: Compiles Vue.js application
2. **Report Processing**: Handles new report uploads
3. **Index Generation**: Updates report listings
4. **Deployment**: Publishes to GitHub Pages

## Security Architecture

### Frontend Security
- **Input Validation**: Client-side validation of uploaded files
- **XSS Prevention**: Sanitized HTML rendering
- **CSRF Protection**: Token-based request validation
- **Content Security Policy**: Restricted resource loading

### Backend Security
- **File Type Validation**: Strict JSON format checking
- **Path Traversal Prevention**: Sanitized file paths
- **Rate Limiting**: API request throttling
- **Error Handling**: Secure error messages

## Performance Architecture

### Frontend Optimization
- **Code Splitting**: Lazy-loaded components
- **Virtual Scrolling**: Efficient large list rendering
- **Caching Strategy**: Intelligent data caching
- **Bundle Optimization**: Tree shaking and minification

### Backend Optimization
- **File Streaming**: Efficient file upload handling
- **Compression**: Gzip compression for responses
- **Caching Headers**: Browser caching optimization
- **Database-free**: File system based storage

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: No server-side sessions
- **CDN Integration**: Static asset distribution
- **Load Balancing**: Multiple server instances
- **Microservices**: Modular service architecture

### Vertical Scaling
- **Memory Management**: Efficient memory usage
- **CPU Optimization**: Optimized algorithms
- **Storage Efficiency**: Compressed file storage
- **Network Optimization**: Minimized data transfer

## Development Architecture

### Development Environment
```
Local Development
├── Vue.js Dev Server (port 8080)
├── Express.js API Server (port 3001)
├── Hot Module Replacement
└── Development Tools
    ├── Vue DevTools
    ├── Browser DevTools
    └── Debug Logging
```

### Build Process
1. **Source Compilation**: Vue.js → JavaScript/CSS
2. **Asset Optimization**: Images, fonts, icons
3. **Bundle Generation**: Webpack bundling
4. **Testing**: Unit and integration tests
5. **Deployment**: GitHub Pages publishing

## Monitoring and Observability

### Logging Strategy
- **Frontend Logging**: Console logging with levels
- **Backend Logging**: Structured logging with timestamps
- **Error Tracking**: Comprehensive error capture
- **Performance Monitoring**: Timing and metrics

### Health Checks
- **API Health**: `/api/health` endpoint
- **Service Status**: Component health monitoring
- **Resource Usage**: Memory and CPU tracking
- **Dependency Checks**: External service validation