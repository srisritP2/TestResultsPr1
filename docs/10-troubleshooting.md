# Troubleshooting Guide

This guide covers common issues you might encounter and how to resolve them.

## 🚨 Common Issues

### 🔧 Installation & Setup Issues

#### Node.js Version Problems
**Problem**: Application won't start or shows compatibility errors
```bash
Error: This package requires Node.js version 16 or higher
```

**Solution**:
```bash
# Check your Node.js version
node --version

# If version is below 16, update Node.js
# Visit https://nodejs.org/ to download the latest version

# Or use nvm (Node Version Manager)
nvm install 18
nvm use 18
```

#### Dependency Installation Failures
**Problem**: `npm install` fails with permission or network errors

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json
npm install

# Use yarn instead of npm
npm install -g yarn
yarn install

# Fix permission issues (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
```

#### Port Already in Use
**Problem**: Development server won't start due to port conflicts

**Solutions**:
```bash
# Kill process using the port
lsof -ti:5173 | xargs kill -9  # Frontend port
lsof -ti:3001 | xargs kill -9  # Backend port

# Or specify different ports
npm run dev -- --port 5174
PORT=3002 npm run server
```

### 📁 File Upload Issues

#### Upload Fails Silently
**Problem**: Files upload but don't appear in the collection

**Debugging Steps**:
1. **Check browser console** for JavaScript errors
2. **Check network tab** for failed API requests
3. **Verify file format** - must be valid Cucumber JSON
4. **Check server logs** in the terminal

**Solutions**:
```bash
# Restart the backend server
npm run server

# Check file permissions
ls -la public/TestResultsJsons/

# Verify JSON format
cat your-report.json | jq .  # Should not show errors
```

#### Large File Upload Timeout
**Problem**: Large reports fail to upload

**Solution**: Increase server timeout in `server.js`:
```javascript
app.use(express.json({ limit: '100mb' })); // Increase from 50mb
```

#### Invalid JSON Format
**Problem**: "Invalid Cucumber JSON format" error

**Common Issues**:
- File is not an array at root level
- Missing required fields (name, elements, etc.)
- Malformed JSON syntax

**Validation**:
```bash
# Validate JSON syntax
cat report.json | jq .

# Check if it's an array
cat report.json | jq 'type'  # Should return "array"

# Check first element structure
cat report.json | jq '.[0] | keys'
```

### 🖥️ Display & UI Issues

#### Reports Not Displaying
**Problem**: Reports upload successfully but show empty or broken

**Debugging**:
1. **Check browser console** for JavaScript errors
2. **Verify report structure** in the uploaded JSON
3. **Check if features array exists** and has data

**Solutions**:
```javascript
// Check in browser console
localStorage.getItem('cucumber-reports')
JSON.parse(localStorage.getItem('cucumber-reports'))
```

#### Theme Not Working
**Problem**: Dark/light theme toggle doesn't work

**Solutions**:
```bash
# Clear browser storage
localStorage.clear()
sessionStorage.clear()

# Check Vuex store in Vue DevTools
# Look for theme module state
```

#### Responsive Layout Issues
**Problem**: Layout breaks on mobile or different screen sizes

**Solutions**:
1. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
2. **Check CSS conflicts** in browser DevTools
3. **Update Vuetify** to latest version:
```bash
npm update vuetify
```

### 🔄 GitHub Actions Issues

#### Workflow Fails to Run
**Problem**: GitHub Actions workflow doesn't trigger

**Check**:
1. **Workflow file location**: `.github/workflows/update-index.yml`
2. **File permissions**: Should be readable
3. **YAML syntax**: Use YAML validator
4. **Repository settings**: Actions must be enabled

**Solutions**:
```bash
# Validate YAML syntax
yamllint .github/workflows/update-index.yml

# Check workflow status in GitHub
# Go to Actions tab in your repository
```

#### Permission Denied Errors
**Problem**: GitHub Actions can't push changes

**Solution**: Ensure workflow has proper permissions:
```yaml
permissions:
  contents: write
  actions: read
  pages: write
  id-token: write
```

#### Index Generation Fails
**Problem**: Report index doesn't update automatically

**Debugging**:
1. **Check workflow logs** in GitHub Actions tab
2. **Verify file paths** in the workflow
3. **Check Node.js version** in workflow

**Manual Fix**:
```bash
# Run index generation locally
cd public/TestResultsJsons
node generate-index-enhanced.js --verbose
```

### 🗑️ Deletion Issues

#### Delete Button Not Working
**Problem**: Delete button shows loading but nothing happens

**Debugging Steps**:
1. **Check browser console** for errors
2. **Check network tab** for failed requests
3. **Verify server is running** (`http://localhost:3001/api/health`)

**Solutions**:
```bash
# Restart backend server
npm run server

# Check server logs for errors
# Look for deletion-related error messages
```

#### Files Deleted But Still Visible
**Problem**: Reports deleted locally but still appear

**Solutions**:
```bash
# Clear browser storage
localStorage.clear()

# Refresh the page
# Check if files actually exist in filesystem
ls -la public/TestResultsJsons/
```

### 🌐 Deployment Issues

#### GitHub Pages Not Updating
**Problem**: Changes pushed but site doesn't update

**Solutions**:
1. **Check GitHub Actions** - workflow must complete successfully
2. **Wait 5-10 minutes** - GitHub Pages has deployment delay
3. **Clear browser cache** - hard refresh the page
4. **Check Pages settings** - ensure source is set to GitHub Actions

#### Build Failures
**Problem**: GitHub Actions build fails

**Common Causes**:
- **Node.js version mismatch**
- **Missing dependencies**
- **Build script errors**
- **File path issues**

**Solutions**:
```yaml
# Update Node.js version in workflow
- uses: actions/setup-node@v4
  with:
    node-version: '18'  # Use stable version
```

### 🔍 Performance Issues

#### Slow Loading
**Problem**: Application loads slowly or becomes unresponsive

**Solutions**:
1. **Check report size** - very large reports can cause issues
2. **Enable virtual scrolling** for large datasets
3. **Clear browser cache** and storage
4. **Check for memory leaks** in browser DevTools

#### High Memory Usage
**Problem**: Browser tab uses excessive memory

**Solutions**:
```javascript
// Check memory usage in browser console
performance.memory

// Clear large objects from memory
localStorage.clear()
sessionStorage.clear()
```

## 🛠️ Debugging Tools

### Browser DevTools
1. **Console Tab**: JavaScript errors and logs
2. **Network Tab**: API requests and responses
3. **Application Tab**: localStorage and sessionStorage
4. **Performance Tab**: Memory and CPU usage

### Vue DevTools
Install Vue DevTools browser extension for:
- Component inspection
- Vuex state debugging
- Event tracking
- Performance profiling

### Server Debugging
```bash
# Enable debug mode
DEBUG=* npm run server

# Check server health
curl http://localhost:3001/api/health

# Monitor server logs
tail -f server.log  # If logging to file
```

### File System Debugging
```bash
# Check file permissions
ls -la public/TestResultsJsons/

# Check disk space
df -h

# Monitor file changes
watch -n 1 'ls -la public/TestResultsJsons/'
```

## 📞 Getting Help

### Before Creating an Issue

1. **Check this troubleshooting guide**
2. **Search existing GitHub issues**
3. **Try the solutions provided**
4. **Gather debugging information**

### Creating a Good Issue Report

Include:
- **Operating System** and version
- **Node.js version** (`node --version`)
- **Browser** and version
- **Steps to reproduce** the issue
- **Expected behavior**
- **Actual behavior**
- **Console errors** (if any)
- **Screenshots** (if relevant)

### Debug Information Template
```
**Environment:**
- OS: [e.g., Windows 10, macOS 12, Ubuntu 20.04]
- Node.js: [e.g., v18.17.0]
- Browser: [e.g., Chrome 115.0.5790.110]
- Application Version: [e.g., v1.2.0]

**Issue Description:**
[Clear description of the problem]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Console Errors:**
```
[Paste any console errors here]
```

**Additional Context:**
[Any other relevant information]
```

## 🔄 Recovery Procedures

### Reset Application State
```bash
# Clear all browser storage
localStorage.clear()
sessionStorage.clear()

# Reset to default theme
localStorage.setItem('theme', 'light')

# Refresh the page
location.reload()
```

### Reset File System
```bash
# Backup current reports
cp -r public/TestResultsJsons public/TestResultsJsons.backup

# Clear generated files
rm public/TestResultsJsons/index.json
rm public/TestResultsJsons/stats.json
rm public/TestResultsJsons/.deleted-reports.json

# Regenerate index
cd public/TestResultsJsons
node generate-index-enhanced.js
```

### Complete Reset
```bash
# Stop all servers
pkill -f "node.*server"
pkill -f "vite"

# Clear dependencies
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Restart
npm run dev
npm run server  # In another terminal
```

---

*Next: [Debugging Guide](./11-debugging.md)*