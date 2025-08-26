# 🥒 Cucumber Report System - Complete Handbook

*Your comprehensive guide to managing Cucumber test reports with automated upload and GitHub Pages publishing*

---

## 📋 **Table of Contents**

1. [Quick Start Guide](#quick-start-guide)
2. [Step-by-Step Upload Process](#step-by-step-upload-process)
3. [Available Commands](#available-commands)
4. [Troubleshooting](#troubleshooting)
5. [System Architecture](#system-architecture)
6. [Advanced Features](#advanced-features)
7. [File Locations](#file-locations)
8. [Common Issues & Solutions](#common-issues--solutions)

---

## 🚀 **Quick Start Guide**

### **Daily Upload Workflow**
```bash
# 1. Generate fresh test report
cd E:\Automation\IdeaProjects\qa-automation-v4
mvn clean test

# 2. Start development server
cd E:\Projects\AutomationTestResultsWebSite\cucumber-report-viewer
npm run dev

# 3. Upload via browser (http://localhost:8080)
# 4. Click "Publish to GitHub Pages" button
# 5. Push to live site
npm run update-index && git add . && git commit -m "New report" && git push
```

### **Super Quick Version**
```bash
mvn clean test && npm run dev
# Upload via browser, publish, then:
npm run fix-and-index && git add . && git commit -m "New report" && git push
```

---

## 📝 **Step-by-Step Upload Process**

### **Step 1: Generate Fresh Test Report**
```bash
cd E:\Automation\IdeaProjects\qa-automation-v4
mvn clean test
```
**What it does:** Creates fresh JSON with today's timestamp in `target/cucumber-reports/Cucumber.json`

**Alternative commands:**
```bash
# Run specific test
mvn test -Dtest=*Members*

# Run with specific tags
mvn test -Dcucumber.filter.tags="@YourTag"
```

### **Step 2: Start Development Server**
```bash
cd E:\Projects\AutomationTestResultsWebSite\cucumber-report-viewer
npm run dev
```
**What it does:** 
- Starts frontend on `http://localhost:8080`
- Starts backend on `http://localhost:3001`
- Enables hot reloading and CORS

### **Step 3: Upload via Browser**
1. Open `http://localhost:8080`
2. Click **"Upload Report"**
3. Select: `E:\Automation\IdeaProjects\qa-automation-v4\target\cucumber-reports\Cucumber.json`
4. Click **"Upload"**
5. ✅ See success message with auto-fixes applied

### **Step 4: Publish to GitHub Pages**
1. Click **"Publish to GitHub Pages"** button on your uploaded report
2. When folder picker opens, navigate to and select: `TestResultsJsons` folder
3. ✅ Get confirmation alert: "In next push the report will be published"

### **Step 5: Push to Live Site**
```bash
# Update index and commit changes
npm run update-index
git add .
git commit -m "Add new test report - $(date)"
git push origin main
```

### **Step 6: Verify Live Deployment**
- Wait 1-2 minutes for GitHub Actions
- Visit: `https://srisritP2.github.io/TestResultsPr1/`
- ✅ See your new report with today's date!

---

## 🛠️ **Available Commands**

### **Development Commands**
```bash
npm run serve          # Start frontend only (port 8080)
npm run server         # Start backend only (port 3001)
npm run dev           # Start both frontend and backend
npm start             # Start backend server
```

### **Report Management Commands**
```bash
npm run diagnose "path/to/file.json"        # Analyze report format
npm run analyze-steps "path/to/file.json"   # Detailed step analysis
npm run fix-skipped "path/to/file.json"     # Fix skipped steps with duration
npm run fix-reports                         # Fix all existing report formats
npm run update-index                        # Regenerate index.json
npm run fix-and-index                       # Fix formats and update index
```

### **Build Commands**
```bash
npm run build         # Build for production
npm run build:analyze # Build with bundle analysis
npm run lint          # Run code linting
```

### **Git Commands for Deployment**
```bash
git add .
git commit -m "Add new test report"
git push origin main
```

---

## 🔧 **Troubleshooting**

### **Problem: Upload Fails**
**Solution:**
```bash
# Check file format
npm run diagnose "E:\Automation\IdeaProjects\qa-automation-v4\target\cucumber-reports\Cucumber.json"

# Check server health
curl http://localhost:3001/api/health
```

### **Problem: Steps Show as Skipped (but have duration)**
**Solution:**
```bash
# Fix the file
npm run fix-skipped "E:\Automation\IdeaProjects\qa-automation-v4\target\cucumber-reports\Cucumber.json"

# Or upload - system auto-fixes this now
```

### **Problem: Report Not in GitHub Pages**
**Solution:**
```bash
# Regenerate index
npm run update-index

# Check if files exist
ls cucumber-report-viewer/public/TestResultsJsons/

# Push changes
git add . && git commit -m "Update index" && git push
```

### **Problem: Server Won't Start**
**Solution:**
```bash
# Kill process on port 3001
taskkill /PID $(netstat -ano | findstr :3001 | awk '{print $5}') /F

# Restart
npm run dev
```

### **Problem: Old Date Showing**
**Cause:** Using old JSON file from target directory
**Solution:** Run fresh Maven test: `mvn clean test`

---

## 🏗️ **System Architecture**

### **Frontend (Vue.js)**
- **Port:** 8080
- **Location:** `src/`
- **Key Components:**
  - `ReportUploader.vue` - File upload interface
  - `ReportViewer.vue` - Report display
  - `ReportsCollection.vue` - Report listing
  - `ThemeToggle.vue` - Dark/light theme

### **Backend (Express.js)**
- **Port:** 3001
- **Location:** `server.js`
- **API Endpoints:**
  - `POST /api/upload-report` - Upload reports
  - `GET /api/reports` - List reports
  - `GET /api/health` - Health check

### **File Processing**
- **Auto-format detection** - Handles multiple JSON formats
- **Auto-fixes** - Corrects common Cucumber issues
- **Index generation** - Updates report listings
- **GitHub Actions** - Automated deployment

---

## ⚡ **Advanced Features**

### **Automatic Format Detection**
The system handles these formats automatically:
- Standard: `[{name, elements}, ...]`
- Wrapped: `{features: [{name, elements}, ...]}`
- Single: `{name, elements}` → wrapped in array
- TestNG: `{results: [...]}`

### **Auto-Fixes Applied**
- **Skipped steps with duration** → Changed to "passed"
- **Format normalization** → Converts to standard array format
- **Missing fields** → Adds default values
- **File naming** → Descriptive names with timestamps

### **Dark Theme System**
- **Navy blue & grey palette** - Professional appearance
- **System preference detection** - Respects OS theme
- **Smooth transitions** - Premium visual effects
- **Accessibility compliant** - WCAG 2.1 AA standards

### **Performance Optimizations**
- **Virtual scrolling** - Handles large reports
- **Lazy loading** - Loads content on demand
- **Bundle optimization** - Faster loading times
- **Caching strategies** - Improved performance

---

## 📁 **File Locations**

### **Your Test Projects**
```
E:\Automation\IdeaProjects\qa-automation\target\cucumber-reports\CucumberTestReport.json
E:\Automation\IdeaProjects\qa-automation-v4\target\cucumber-reports\Cucumber.json
```

### **Report System**
```
E:\Projects\AutomationTestResultsWebSite\cucumber-report-viewer\
├── src/                          # Frontend source code
├── public/TestResultsJsons/      # Published reports
├── scripts/                      # Diagnostic and fix tools
├── server.js                     # Backend server
└── package.json                  # Dependencies and scripts
```

### **Published Reports Location**
```
cucumber-report-viewer/public/TestResultsJsons/
├── index.json                    # Report index
├── stats.json                    # Statistics
├── Your-Report-Name-YYYY-MM-DD.json
└── generate-index-enhanced.js    # Index generator
```

### **GitHub Pages URL**
```
https://srisritP2.github.io/TestResultsPr1/
```

---

## 🚨 **Common Issues & Solutions**

### **Issue: "File does not appear to be a valid Cucumber JSON report"**
**Cause:** Invalid JSON format or structure
**Solution:**
```bash
npm run diagnose "path/to/file.json"
# Check the output and fix format issues
```

### **Issue: "All steps are skipped"**
**Cause:** Cucumber framework bug marking executed steps as skipped
**Solution:**
```bash
npm run fix-skipped "path/to/file.json"
# Or just upload - system auto-fixes this
```

### **Issue: "Port 3001 already in use"**
**Cause:** Another process using the port
**Solution:**
```bash
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F
npm run dev
```

### **Issue: "Report uploaded but not on GitHub Pages"**
**Cause:** Index not updated or changes not pushed
**Solution:**
```bash
npm run update-index
git add . && git commit -m "Update index" && git push
```

### **Issue: "Dark theme not working"**
**Cause:** Theme state not initialized
**Solution:** Click the theme toggle button in the header

### **Issue: "Upload button disabled"**
**Cause:** File validation failed
**Solution:** Check console for error messages and fix file format

---

## 📊 **System Status Indicators**

### **Upload Status Messages**
- ✅ **"Uploaded to Server!"** - Saved to server successfully
- ✅ **"Saved Successfully!"** - Saved to localStorage
- ⚠️ **"Saved with Compression"** - Large file, compressed storage
- ℹ️ **"Session Only"** - Temporary storage, server unavailable

### **Report Status Icons**
- 🟢 **Green cloud** - Published to GitHub Pages
- 🔵 **Blue upload** - Uploaded but not published
- ⚪ **Grey circle** - Local storage only

### **Step Status Colors**
- ✅ **Green check** - Passed
- ❌ **Red X** - Failed
- ⏭️ **Yellow skip** - Skipped
- ❓ **Grey question** - Unknown/undefined

---

## 🎯 **Best Practices**

### **For Test Execution**
- Always use `mvn clean test` for fresh reports
- Avoid scenario-level execution for JSON generation
- Check target directory for latest JSON files

### **For Uploading**
- Start dev server before uploading
- Use localhost interface for testing
- Publish immediately after upload for best results

### **For Maintenance**
- Run `npm run fix-reports` periodically
- Keep dependencies updated
- Monitor GitHub Actions for deployment issues

### **For Troubleshooting**
- Use diagnostic commands before asking for help
- Check console logs for detailed error messages
- Verify file formats before uploading

---

## 📞 **Quick Reference**

### **Essential Commands**
```bash
mvn clean test                    # Generate fresh report
npm run dev                       # Start development
npm run diagnose "file.json"      # Check file format
npm run fix-and-index            # Fix and update
git add . && git commit -m "msg" && git push  # Deploy
```

### **Essential URLs**
- **Development:** http://localhost:8080
- **API Health:** http://localhost:3001/api/health
- **Live Site:** https://srisritP2.github.io/TestResultsPr1/
- **GitHub Actions:** https://github.com/srisritP2/TestResultsPr1/actions

### **Essential Paths**
- **Test Reports:** `E:\Automation\IdeaProjects\qa-automation-v4\target\cucumber-reports\`
- **System Root:** `E:\Projects\AutomationTestResultsWebSite\cucumber-report-viewer\`
- **Published Reports:** `cucumber-report-viewer/public/TestResultsJsons/`

---

*Last Updated: July 31, 2025*
*System Version: 2.0.0 with Dark Theme and Auto-Fixes*

**Happy Testing! 🚀🥒**