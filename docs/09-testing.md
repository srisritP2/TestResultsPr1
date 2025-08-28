# Testing Guide

## Testing Strategy

### Testing Pyramid
1. **Unit Tests** (70%) - Individual functions and components
2. **Integration Tests** (20%) - Component interactions
3. **E2E Tests** (10%) - Full user workflows

### Test Types
- **Component Tests** - Vue component behavior
- **Service Tests** - Business logic validation
- **API Tests** - Backend endpoint testing
- **UI Tests** - User interface interactions

## Unit Testing

### Component Testing with Vue Test Utils

```javascript
// Example: ReportViewer.test.js
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import ReportViewer from '@/components/ReportViewer.vue'

describe('ReportViewer', () => {
  let vuetify
  
  beforeEach(() => {
    vuetify = createVuetify()
  })

  it('renders report data correctly', () => {
    const mockReport = {
      features: [
        {
          name: 'Test Feature',
          elements: [
            {
              name: 'Test Scenario',
              steps: [
                { name: 'Given step', result: { status: 'passed' } }
              ]
            }
          ]
        }
      ]
    }

    const wrapper = mount(ReportViewer, {
      props: { report: mockReport },
      global: {
        plugins: [vuetify]
      }
    })

    expect(wrapper.text()).toContain('Test Feature')
    expect(wrapper.text()).toContain('Test Scenario')
  })

  it('handles empty report gracefully', () => {
    const wrapper = mount(ReportViewer, {
      props: { report: null },
      global: {
        plugins: [vuetify]
      }
    })

    expect(wrapper.text()).toContain('No report data available')
  })
})
```

### Service Testing

```javascript
// Example: DeletionService.test.js
import DeletionService from '@/services/DeletionService'

describe('DeletionService', () => {
  let deletionService

  beforeEach(() => {
    deletionService = new DeletionService()
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    }
  })

  it('should delete report successfully', async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        deletionType: 'soft'
      })
    })

    const result = await deletionService.deleteReport('test-report', {
      confirm: false,
      showFeedback: false
    })

    expect(result.success).toBe(true)
    expect(result.deletionType).toBe('soft')
  })

  it('should handle server errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    const result = await deletionService.deleteReport('test-report', {
      confirm: false,
      showFeedback: false
    })

    expect(result.success).toBe(true)
    expect(result.localOnly).toBe(true)
  })
})
```

### Utility Testing

```javascript
// Example: deletionUtils.test.js
import DeletionUtils from '@/utils/deletionUtils'
import fs from 'fs'

jest.mock('fs')

describe('DeletionUtils', () => {
  let deletionUtils

  beforeEach(() => {
    deletionUtils = new DeletionUtils('/test/path')
    jest.clearAllMocks()
  })

  it('should mark report as deleted', async () => {
    fs.existsSync.mockReturnValue(false)
    fs.readFileSync.mockReturnValue('[]')
    fs.writeFileSync.mockImplementation(() => {})

    const result = await deletionUtils.markReportAsDeleted('test.json')

    expect(result.success).toBe(true)
    expect(result.type).toBe('soft')
    expect(fs.writeFileSync).toHaveBeenCalled()
  })
})
```

## Integration Testing

### API Integration Tests

```javascript
// Example: api.integration.test.js
import request from 'supertest'
import app from '../server'

describe('API Integration Tests', () => {
  describe('DELETE /api/reports/:filename', () => {
    it('should delete report successfully', async () => {
      const response = await request(app)
        .delete('/api/reports/test-report.json')
        .query({ soft: 'true' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should handle non-existent report', async () => {
      const response = await request(app)
        .delete('/api/reports/non-existent.json')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('healthy')
    })
  })
})
```

### Component Integration Tests

```javascript
// Example: ReportCollection.integration.test.js
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import ReportsCollection from '@/components/ReportsCollection.vue'

describe('ReportsCollection Integration', () => {
  it('should upload and display report', async () => {
    const vuetify = createVuetify()
    const wrapper = mount(ReportsCollection, {
      global: {
        plugins: [vuetify]
      }
    })

    // Simulate file upload
    const fileInput = wrapper.find('input[type="file"]')
    const mockFile = new File(['{}'], 'test.json', { type: 'application/json' })
    
    await fileInput.setValue([mockFile])
    await wrapper.vm.$nextTick()

    // Verify report appears in collection
    expect(wrapper.text()).toContain('test.json')
  })
})
```

## End-to-End Testing

### Cypress E2E Tests

```javascript
// Example: cypress/e2e/report-management.cy.js
describe('Report Management', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should upload and view report', () => {
    // Upload report
    cy.get('[data-cy="upload-button"]').click()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-report.json')
    cy.get('[data-cy="upload-confirm"]').click()

    // Verify upload success
    cy.contains('Report uploaded successfully').should('be.visible')
    cy.contains('sample-report.json').should('be.visible')

    // View report
    cy.get('[data-cy="view-report"]').first().click()
    cy.url().should('include', '/report/')
    cy.contains('Test Results').should('be.visible')
  })

  it('should delete report', () => {
    // Navigate to report
    cy.get('[data-cy="view-report"]').first().click()
    
    // Delete report
    cy.get('[data-cy="delete-report"]').click()
    cy.get('[data-cy="confirm-delete"]').click()

    // Verify deletion
    cy.contains('Report deleted successfully').should('be.visible')
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('should toggle theme', () => {
    cy.get('[data-cy="theme-toggle"]').click()
    cy.get('body').should('have.attr', 'data-theme', 'dark')
    
    cy.get('[data-cy="theme-toggle"]').click()
    cy.get('body').should('have.attr', 'data-theme', 'light')
  })
})
```

### Playwright E2E Tests

```javascript
// Example: tests/e2e/report-viewer.spec.js
import { test, expect } from '@playwright/test'

test.describe('Report Viewer', () => {
  test('should display report features', async ({ page }) => {
    await page.goto('/')
    
    // Upload test report
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/sample-report.json')
    await page.click('[data-testid="upload-button"]')
    
    // Navigate to report
    await page.click('[data-testid="view-report"]')
    
    // Verify report content
    await expect(page.locator('h1')).toContainText('Cucumber Test Results')
    await expect(page.locator('[data-testid="feature-list"]')).toBeVisible()
  })

  test('should handle search functionality', async ({ page }) => {
    await page.goto('/report/sample-report')
    
    // Open search
    await page.click('[data-testid="search-toggle"]')
    await page.fill('[data-testid="search-input"]', 'login')
    
    // Verify search results
    await expect(page.locator('[data-testid="search-results"]')).toContainText('2 results found')
  })
})
```

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/main.js',
    '!src/router/index.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': 'babel-jest'
  }
}
```

### Test Setup

```javascript
// src/tests/setup.js
import { config } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Global test configuration
config.global.plugins = [
  createVuetify({
    components,
    directives
  })
]

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
})

// Mock fetch
global.fetch = jest.fn()

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
}
```

## Test Data Management

### Fixtures

```javascript
// tests/fixtures/sample-report.json
{
  "features": [
    {
      "name": "User Authentication",
      "elements": [
        {
          "name": "Successful login",
          "steps": [
            {
              "name": "Given user is on login page",
              "result": { "status": "passed", "duration": 1000 }
            },
            {
              "name": "When user enters valid credentials",
              "result": { "status": "passed", "duration": 2000 }
            },
            {
              "name": "Then user should be logged in",
              "result": { "status": "passed", "duration": 500 }
            }
          ]
        }
      ]
    }
  ]
}
```

### Test Factories

```javascript
// tests/factories/reportFactory.js
export const createMockReport = (overrides = {}) => {
  return {
    id: 'test-report-123',
    name: 'Test Report',
    date: '2025-01-01T00:00:00.000Z',
    features: [
      {
        name: 'Test Feature',
        elements: [
          {
            name: 'Test Scenario',
            steps: [
              {
                name: 'Given test step',
                result: { status: 'passed', duration: 1000 }
              }
            ]
          }
        ]
      }
    ],
    ...overrides
  }
}
```

## Running Tests

### Command Line

```bash
# Run all tests
npm test

# Run specific test file
npm test -- ReportViewer.test.js

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run integration tests
npm run test:integration
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
```

## Test Best Practices

### Writing Good Tests
1. **Arrange, Act, Assert** pattern
2. **Descriptive test names**
3. **Single responsibility** per test
4. **Mock external dependencies**
5. **Test edge cases**

### Avoiding Common Pitfalls
- Don't test implementation details
- Avoid brittle selectors
- Don't share state between tests
- Mock time-dependent functions
- Use proper async/await handling

### Performance Testing
```javascript
// Example: Performance test
it('should render large report efficiently', async () => {
  const largeReport = createMockReport({
    features: Array(100).fill().map((_, i) => ({
      name: `Feature ${i}`,
      elements: Array(10).fill().map((_, j) => ({
        name: `Scenario ${j}`,
        steps: Array(5).fill().map((_, k) => ({
          name: `Step ${k}`,
          result: { status: 'passed', duration: 100 }
        }))
      }))
    }))
  })

  const start = performance.now()
  const wrapper = mount(ReportViewer, {
    props: { report: largeReport }
  })
  const end = performance.now()

  expect(end - start).toBeLessThan(1000) // Should render in under 1 second
})
```