# Development Guide

## Development Environment Setup

### Prerequisites
- Node.js 16+ and npm
- Git
- Code editor (VS Code recommended)

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/srisritP2/TestResultsPr1.git
cd TestResultsPr1/cucumber-report-viewer

# Install dependencies
npm install

# Start development server
npm run serve

# Start backend server (in separate terminal)
npm run server
```

### Development Workflow

#### 1. Frontend Development
```bash
# Start Vue.js development server
npm run serve
# Access at http://localhost:8080
```

#### 2. Backend Development
```bash
# Start Express server
npm run server
# API available at http://localhost:3001
```

#### 3. Full Stack Development
```bash
# Terminal 1: Frontend
npm run serve

# Terminal 2: Backend
npm run server

# Terminal 3: File watching (optional)
npm run watch
```

## Project Structure

```
cucumber-report-viewer/
├── src/
│   ├── components/          # Vue components
│   │   ├── ReportViewer.vue # Main report display
│   │   ├── ReportsCollection.vue # Report management
│   │   ├── ReportUploader.vue # File upload
│   │   └── ThemeToggle.vue  # Dark/light theme
│   ├── services/            # Business logic
│   │   ├── DeletionService.js # Report deletion
│   │   └── ReportService.js # Report processing
│   ├── utils/               # Utility functions
│   ├── store/               # Vuex state management
│   ├── views/               # Page components
│   └── styles/              # Global styles
├── public/
│   └── TestResultsJsons/    # Report storage
├── server.js                # Express backend
└── docs/                    # Documentation
```

## Coding Standards

### Vue.js Components
- Use Composition API for new components
- Follow Vue.js style guide
- Use TypeScript for complex components
- Implement proper error handling

### JavaScript/Node.js
- Use ES6+ features
- Follow ESLint configuration
- Implement proper error handling
- Use async/await for promises

### CSS/SCSS
- Use Vuetify design system
- Follow BEM methodology for custom styles
- Support dark/light themes
- Ensure responsive design

## Testing

### Unit Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Component Testing
```bash
# Test specific component
npm run test -- --grep "ReportViewer"

# Test with debugging
npm run test:debug
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Test API endpoints
npm run test:api
```

## Build Process

### Development Build
```bash
npm run serve
```

### Production Build
```bash
npm run build
```

### Build Analysis
```bash
npm run build:analyze
```

## Git Workflow

### Branch Strategy
- `main` - Production ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Critical fixes

### Commit Convention
```bash
# Format: type(scope): description
git commit -m "feat(reports): add dark theme support"
git commit -m "fix(deletion): handle server offline scenarios"
git commit -m "docs(readme): update installation instructions"
```

### Types:
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation
- `style` - Code formatting
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance tasks

## Code Review Guidelines

### Before Submitting PR
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design tested
- [ ] Dark/light theme tested

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Cross-browser testing done

## Screenshots
Include screenshots for UI changes
```

## Performance Optimization

### Frontend Optimization
- Use Vue.js lazy loading
- Implement virtual scrolling for large lists
- Optimize bundle size with tree shaking
- Use service workers for caching

### Backend Optimization
- Implement request caching
- Use compression middleware
- Optimize file I/O operations
- Add request rate limiting

## Security Considerations

### Frontend Security
- Sanitize user inputs
- Validate file uploads
- Implement CSP headers
- Use HTTPS in production

### Backend Security
- Validate all API inputs
- Implement proper error handling
- Use secure file handling
- Add request validation

## Debugging Tips

### Vue.js Debugging
```javascript
// Use Vue DevTools
// Add debugging breakpoints
debugger;

// Console logging
console.log('Component data:', this.$data);
console.log('Props:', this.$props);
```

### Node.js Debugging
```bash
# Debug mode
node --inspect server.js

# Debug with breakpoints
node --inspect-brk server.js
```

### Network Debugging
```javascript
// Monitor API calls
fetch('/api/reports')
  .then(response => {
    console.log('Response:', response);
    return response.json();
  })
  .catch(error => {
    console.error('API Error:', error);
  });
```

## Common Development Tasks

### Adding New Feature
1. Create feature branch
2. Implement component/service
3. Add tests
4. Update documentation
5. Submit PR

### Fixing Bugs
1. Reproduce the issue
2. Write failing test
3. Implement fix
4. Verify test passes
5. Submit PR

### Updating Dependencies
```bash
# Check outdated packages
npm outdated

# Update packages
npm update

# Update major versions
npm install package@latest
```

## IDE Configuration

### VS Code Extensions
- Vue Language Features (Volar)
- ESLint
- Prettier
- GitLens
- Auto Rename Tag
- Bracket Pair Colorizer

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "vue": "html"
  }
}
```

## Deployment Pipeline

### GitHub Actions
- Automated testing on PR
- Build verification
- Deployment to GitHub Pages
- Report processing automation

### Manual Deployment
```bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy

# Verify deployment
curl -I https://your-domain.github.io
```