# Debugging Guide

Learn how to effectively debug issues in the Cucumber Test Results Viewer.

## 🔍 Debugging Strategy

### 1. Identify the Problem Area
- **Frontend Issues**: UI problems, display issues, client-side errors
- **Backend Issues**: API failures, file operations, server errors
- **Integration Issues**: Communication between frontend and backend
- **Deployment Issues**: GitHub Actions, GitHub Pages problems

### 2. Gather Information
- **Error messages** from console and logs
- **Network requests** and responses
- **Application state** and data flow
- **Environment details** (OS, browser, Node.js version)

### 3. Reproduce the Issue
- **Consistent reproduction** steps
- **Minimal test case** that triggers the problem
- **Different environments** (local vs deployed)

## 🖥️ Frontend Debugging

### Browser DevTools

#### Console Debugging
```javascript
// Add debug logs to components
console.log('Component mounted:', this.$options.name);
console.log('Props received:', this.$props);
console.log('Current state:', this.$data);

// Debug reactive data
watch: {
  reportData: {
    handler(newVal, oldVal) {
      console.log('Report data changed:', { newVal, oldVal });
    },
    deep: true
  }
}

// Debug computed properties
computed: {
  filteredReports() {
    const result = this.reports.filter(/* ... */);
    console.log('Filtered reports:', result.length);
    return result;
  }
}
```

#### Network Tab Analysis
1. **Open DevTools** → Network tab
2. **Reproduce the issue** while monitoring requests
3. **Check failed requests** (red entries)
4. **Examine request/response details**

Common patterns to look for:
- **404 errors**: Missing endpoints or files
- **500 errors**: Server-side issues
- **CORS errors**: Cross-origin problems
- **Timeout errors**: Slow or hanging requests

#### Application Tab Inspection
```javascript
// Check localStorage data
console.log('Stored reports:', localStorage.getItem('cucumber-reports'));
console.log('Theme setting:', localStorage.getItem('theme'));
console.log('Deleted reports:', localStorage.getItem('deleted-reports'));

// Clear storage for testing
localStorage.clear();
sessionStorage.clear();
```

### Vue DevTools

#### Component Inspection
1. **Install Vue DevTools** browser extension
2. **Open DevTools** → Vue tab
3. **Select components** to inspect props, data, computed
4. **Modify data** in real-time for testing

#### Vuex State Debugging
```javascript
// In browser console
$vm.$store.state  // View entire state
$vm.$store.getters  // View all getters
$vm.$store.dispatch('actionName', payload)  // Test actions
$vm.$store.commit('mutationName', payload)  // Test mutations
```

#### Event Debugging
```javascript
// Add event listeners for debugging
created() {
  this.$root.$on('*', (eventName, ...args) => {
    console.log('Event emitted:', eventName, args);
  });
}
```

### Component-Specific Debugging

#### ReportViewer Component
```javascript
// Debug report loading
async loadReport() {
  console.log('Loading report:', this.reportId);
  try {
    const report = await this.fetchReport();
    console.log('Report loaded:', report);
  } catch (error) {
    console.error('Report loading failed:', error);
  }
}

// Debug filtering
applyFilters() {
  console.log('Applying filters:', this.filters);
  const filtered = this.filterReports();
  console.log('Filtered results:', filtered.length);
}
```

#### ReportsCollection Component
```javascript
// Debug upload process
async uploadReport(file) {
  console.log('Uploading file:', file.name, file.size);
  const formData = new FormData();
  formData.append('report', file);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    console.log('Upload response:', response.status);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

## 🖧 Backend Debugging

### Server Logging

#### Enhanced Logging Setup
```javascript
// In server.js
const debug = require('debug');
const log = debug('cucumber-viewer');

// Enable with: DEBUG=cucumber-viewer npm run server

// Add logging to endpoints
app.post('/api/upload', (req, res) => {
  log('Upload request received:', req.files?.length || 0, 'files');
  // ... rest of handler
});

app.delete('/api/reports/:filename', (req, res) => {
  log('Delete request:', req.params.filename);
  // ... rest of handler
});
```

#### Request/Response Logging
```javascript
// Middleware for request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Response logging
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    console.log('Response:', res.statusCode, data);
    originalSend.call(this, data);
  };
  next();
});
```

### File System Debugging

#### Monitor File Operations
```javascript
// In deletionUtils.js
async deleteReportFile(filename) {
  console.log('Attempting to delete:', filename);
  const filePath = path.join(this.reportsDir, filename);
  
  console.log('File path:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log('File stats:', {
      size: stats.size,
      modified: stats.mtime,
      permissions: stats.mode
    });
  }
  
  try {
    fs.unlinkSync(filePath);
    console.log('File deleted successfully');
  } catch (error) {
    console.error('Delete failed:', error);
    throw error;
  }
}
```

#### Directory Monitoring
```bash
# Monitor file system changes
watch -n 1 'ls -la public/TestResultsJsons/'

# Monitor specific files
watch -n 1 'stat public/TestResultsJsons/index.json'

# Use inotify for real-time monitoring (Linux)
inotifywait -m -r public/TestResultsJsons/
```

### API Endpoint Testing

#### Manual Testing with curl
```bash
# Test health endpoint
curl -X GET http://localhost:3001/api/health

# Test file upload
curl -X POST \
  -F "report=@sample-report.json" \
  http://localhost:3001/api/upload

# Test file deletion
curl -X DELETE \
  "http://localhost:3001/api/reports/sample-report.json?soft=true"

# Test with verbose output
curl -v -X GET http://localhost:3001/api/health
```

#### Testing with Postman/Insomnia
1. **Create collection** for all API endpoints
2. **Set up environment** variables (base URL, auth tokens)
3. **Test each endpoint** individually
4. **Save test cases** for regression testing

## 🔄 Integration Debugging

### Frontend-Backend Communication

#### CORS Issues
```javascript
// Check CORS configuration in server.js
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Debug CORS in browser
fetch('http://localhost:3001/api/health', {
  method: 'GET',
  mode: 'cors'
}).then(response => {
  console.log('CORS test successful:', response.status);
}).catch(error => {
  console.error('CORS test failed:', error);
});
```

#### Request/Response Debugging
```javascript
// Intercept all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('Fetch response:', response.status, response.url);
      return response;
    })
    .catch(error => {
      console.error('Fetch error:', error);
      throw error;
    });
};
```

### State Synchronization

#### Debug Data Flow
```javascript
// Track data changes across components
// In parent component
data() {
  return {
    reports: []
  }
},
watch: {
  reports: {
    handler(newReports) {
      console.log('Reports updated in parent:', newReports.length);
      this.$emit('reports-changed', newReports);
    },
    deep: true
  }
}

// In child component
props: ['reports'],
watch: {
  reports: {
    handler(newReports) {
      console.log('Reports received in child:', newReports.length);
    },
    immediate: true
  }
}
```

## 🚀 GitHub Actions Debugging

### Workflow Debugging

#### Enable Debug Logging
```yaml
# In .github/workflows/update-index.yml
- name: Debug environment
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Working directory: $(pwd)"
    echo "Files in directory:"
    ls -la
  env:
    ACTIONS_STEP_DEBUG: true
```

#### Step-by-Step Debugging
```yaml
- name: Debug file operations
  run: |
    echo "Before index generation:"
    ls -la cucumber-report-viewer/public/TestResultsJsons/
    
    echo "Running index generation..."
    cd cucumber-report-viewer/public/TestResultsJsons
    node generate-index-enhanced.js --verbose
    
    echo "After index generation:"
    ls -la
    
    echo "Index content:"
    cat index.json | head -20
```

#### Artifact Collection
```yaml
- name: Upload debug artifacts
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: debug-logs
    path: |
      cucumber-report-viewer/public/TestResultsJsons/
      *.log
```

### Local Workflow Testing

#### Act (GitHub Actions Local Runner)
```bash
# Install act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow locally
act -j update-index

# Run with specific event
act push

# Debug mode
act -v
```

## 🧪 Testing & Validation

### Unit Test Debugging

#### Jest Debugging
```bash
# Run tests in debug mode
npm test -- --verbose

# Run specific test file
npm test -- ReportViewer.test.js

# Run with coverage
npm test -- --coverage

# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### Component Testing
```javascript
// In component tests
import { mount } from '@vue/test-utils';
import ReportViewer from '@/components/ReportViewer.vue';

describe('ReportViewer', () => {
  it('should render report data', () => {
    const wrapper = mount(ReportViewer, {
      props: {
        report: mockReportData
      }
    });
    
    // Debug component state
    console.log('Component HTML:', wrapper.html());
    console.log('Component data:', wrapper.vm.$data);
    console.log('Component props:', wrapper.vm.$props);
    
    expect(wrapper.find('.report-title').text()).toBe('Expected Title');
  });
});
```

### Integration Testing

#### End-to-End Testing
```javascript
// Using Cypress or similar
describe('Report Upload Flow', () => {
  it('should upload and display report', () => {
    cy.visit('/');
    cy.get('[data-testid="upload-button"]').click();
    cy.get('input[type="file"]').selectFile('sample-report.json');
    
    // Debug network requests
    cy.intercept('POST', '/api/upload').as('uploadRequest');
    cy.wait('@uploadRequest').then((interception) => {
      console.log('Upload request:', interception.request);
      console.log('Upload response:', interception.response);
    });
    
    cy.get('[data-testid="report-item"]').should('be.visible');
  });
});
```

## 📊 Performance Debugging

### Memory Leaks

#### Detect Memory Leaks
```javascript
// Monitor memory usage
setInterval(() => {
  if (performance.memory) {
    console.log('Memory usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
}, 5000);
```

#### Component Cleanup
```javascript
// Ensure proper cleanup in components
beforeDestroy() {
  // Clear timers
  if (this.timer) {
    clearInterval(this.timer);
  }
  
  // Remove event listeners
  window.removeEventListener('resize', this.handleResize);
  
  // Clear large objects
  this.largeDataSet = null;
}
```

### Performance Profiling

#### Vue Performance DevTools
1. **Open Vue DevTools**
2. **Go to Performance tab**
3. **Start recording**
4. **Perform actions**
5. **Stop recording and analyze**

#### Browser Performance Tab
1. **Open DevTools** → Performance tab
2. **Click record button**
3. **Perform slow operations**
4. **Stop recording**
5. **Analyze flame graph**

## 🛠️ Debug Tools & Utilities

### Custom Debug Utilities

#### Debug Helper Functions
```javascript
// utils/debug.js
export const debug = {
  log: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error);
  },
  
  time: (label) => {
    console.time(label);
  },
  
  timeEnd: (label) => {
    console.timeEnd(label);
  },
  
  table: (data) => {
    console.table(data);
  }
};

// Usage in components
import { debug } from '@/utils/debug';

methods: {
  processReports() {
    debug.time('Report Processing');
    debug.log('Processing reports', this.reports);
    
    // ... processing logic
    
    debug.timeEnd('Report Processing');
  }
}
```

#### State Inspector
```javascript
// utils/stateInspector.js
export const stateInspector = {
  inspect: (component) => {
    return {
      name: component.$options.name,
      props: component.$props,
      data: component.$data,
      computed: Object.keys(component.$options.computed || {}),
      methods: Object.keys(component.$options.methods || {}),
      watchers: Object.keys(component.$options.watch || {})
    };
  },
  
  diff: (oldState, newState) => {
    const changes = {};
    for (const key in newState) {
      if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
        changes[key] = {
          old: oldState[key],
          new: newState[key]
        };
      }
    }
    return changes;
  }
};
```

### Remote Debugging

#### Debug Production Issues
```javascript
// Add remote logging for production
const remoteLogger = {
  log: (level, message, data) => {
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          data,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(() => {}); // Fail silently
    }
  }
};

// Use in error boundaries
window.addEventListener('error', (event) => {
  remoteLogger.log('error', 'JavaScript Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});
```

---

*Next: [Maintenance Guide](./12-maintenance.md)*