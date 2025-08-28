# Quick Start Guide

Get the Cucumber Test Results Viewer up and running in just a few minutes!

## 🚀 Prerequisites

Before you begin, make sure you have:

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- A **modern web browser** (Chrome, Firefox, Safari, Edge)

## ⚡ Quick Setup (5 minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/cucumber-test-results.git
cd cucumber-test-results/cucumber-report-viewer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
# Start the Vue.js frontend
npm run dev

# In another terminal, start the backend server
npm run server
```

### 4. Open in Browser
Navigate to `http://localhost:5173` in your web browser.

## 🎯 First Steps

### Upload Your First Report

1. **Prepare a Cucumber JSON file**
   - Export your Cucumber test results as JSON
   - Ensure the file follows standard Cucumber JSON format

2. **Upload the Report**
   - Click the "Upload Report" button on the main page
   - Drag and drop your JSON file or browse to select it
   - The report will be processed and added to your collection

3. **View the Report**
   - Click on the uploaded report to view detailed results
   - Explore features, scenarios, and individual test steps
   - Use search and filter options to find specific tests

### Explore the Interface

- **Dashboard**: Overview of all your test reports
- **Report Viewer**: Detailed view of individual test reports
- **Theme Toggle**: Switch between light and dark themes
- **Search & Filter**: Find specific tests or results

## 🔧 Development Mode

### Frontend Development
```bash
# Start Vue.js development server with hot reload
npm run dev
```
- Runs on `http://localhost:5173`
- Hot reload enabled for instant updates
- Vue DevTools support

### Backend Development
```bash
# Start Express server for API endpoints
npm run server
```
- Runs on `http://localhost:3001`
- Handles file uploads and report management
- CORS enabled for frontend communication

### Full Stack Development
```bash
# Run both frontend and backend simultaneously
npm run dev:full
```

## 📁 Sample Data

Want to test with sample data? Create a simple Cucumber JSON file:

```json
[
  {
    "line": 1,
    "elements": [
      {
        "line": 3,
        "name": "Sample test scenario",
        "description": "",
        "id": "sample-feature;sample-test-scenario",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 1000000,
              "status": "passed"
            },
            "line": 4,
            "name": "I run a sample test",
            "match": {
              "location": "StepDefinitions.sampleStep()"
            },
            "keyword": "Given "
          }
        ]
      }
    ],
    "name": "Sample Feature",
    "description": "",
    "id": "sample-feature",
    "keyword": "Feature",
    "uri": "features/sample.feature",
    "tags": []
  }
]
```

Save this as `sample-report.json` and upload it to test the application.

## 🌐 GitHub Pages Deployment

### Quick Deploy to GitHub Pages

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/cucumber-test-results.git
   ```

2. **Enable GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "GitHub Actions" as the source

3. **Push Changes**
   ```bash
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

4. **Access Your Site**
   - Your site will be available at `https://YOUR-USERNAME.github.io/cucumber-test-results/`
   - GitHub Actions will automatically build and deploy

## 🔍 Verify Installation

### Check Frontend
- Navigate to `http://localhost:5173`
- You should see the Cucumber Test Results dashboard
- Theme toggle should work
- Upload area should be visible

### Check Backend
- Navigate to `http://localhost:3001/api/health`
- You should see a JSON response with server status
- Upload functionality should work

### Check File Structure
```
cucumber-report-viewer/
├── src/                 # Vue.js source code
├── public/             # Static assets
├── server.js           # Express server
├── package.json        # Dependencies
└── docs/              # Documentation
```

## 🚨 Common Issues

### Port Already in Use
```bash
# If port 5173 is busy, Vite will automatically use the next available port
# Check the terminal output for the actual URL
```

### Node Version Issues
```bash
# Check your Node.js version
node --version

# Should be 16.0.0 or higher
# Update Node.js if needed
```

### Permission Issues
```bash
# On macOS/Linux, you might need to use sudo for global installs
sudo npm install -g @vue/cli
```

## ✅ Next Steps

Now that you have the application running:

1. **Upload some test reports** to see the full functionality
2. **Explore the features** - search, filter, themes
3. **Read the [Features Guide](./05-features.md)** for detailed feature documentation
4. **Check out [Development Guide](./07-development.md)** if you want to contribute

## 🆘 Need Help?

If you encounter any issues:

1. Check the [Troubleshooting Guide](./10-troubleshooting.md)
2. Look at the browser console for error messages
3. Check the terminal output for server errors
4. Create an issue on GitHub with detailed information

---

*Next: [Installation & Setup](./03-installation-setup.md)*