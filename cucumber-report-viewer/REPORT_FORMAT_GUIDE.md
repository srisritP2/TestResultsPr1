# 🥒 Cucumber Report Format Guide

This guide explains the correct format for Cucumber JSON reports and how to avoid common issues.

## ✅ Correct Format

Cucumber JSON reports should be an **array of feature objects**:

```json
[
  {
    "name": "Feature Name",
    "uri": "path/to/feature.feature",
    "id": "feature-id",
    "elements": [
      {
        "name": "Scenario Name",
        "type": "scenario",
        "steps": [...]
      }
    ]
  }
]
```

## ❌ Incorrect Format

**Don't use** the wrapped format:

```json
{
  "features": [
    {
      "name": "Feature Name",
      "elements": [...]
    }
  ]
}
```

## 🔧 Automatic Fixes

We have several automated solutions to prevent format issues:

### 1. **Frontend Auto-Fix**
The ReportUploader automatically converts formats when uploading.

### 2. **Server-Side Normalization**
The Express server normalizes formats before saving.

### 3. **Format Fixer Script**
Run manually to fix existing files:
```bash
npm run fix-reports
```

### 4. **GitHub Actions**
Automatically fixes formats on every push.

### 5. **Pre-commit Hook**
Fixes formats before committing (optional).

## 🚀 Quick Commands

```bash
# Fix all report formats
npm run fix-reports

# Update index after fixing
npm run update-index

# Fix and update in one command
npm run fix-and-index

# Start development with both frontend and backend
npm run dev
```

## 🔍 Troubleshooting

### Issue: Report not appearing in index
**Solution:** Run the format fixer:
```bash
npm run fix-reports
```

### Issue: Upload fails
**Cause:** Invalid JSON format
**Solution:** Validate your JSON before uploading

### Issue: Index not updating
**Solution:** Regenerate manually:
```bash
npm run update-index
```

## 📋 Format Validation

Your Cucumber JSON should have:
- ✅ Root element is an array
- ✅ Each feature has `name`, `elements` properties
- ✅ Each scenario has `name`, `type`, `steps` properties
- ✅ Each step has `name`, `keyword`, `result` properties

## 🤖 Automated Prevention

All these systems work together to prevent format issues:

1. **Upload** → Frontend normalizes format
2. **Server** → Backend validates and normalizes
3. **Save** → File saved in correct format
4. **Commit** → Pre-commit hook fixes any issues
5. **Push** → GitHub Actions ensures consistency
6. **Deploy** → Index automatically updated

## 📞 Support

If you encounter format issues:
1. Run `npm run fix-reports`
2. Check the console output for errors
3. Validate your JSON structure
4. Contact support if issues persist

---

*This system ensures your Cucumber reports are always in the correct format and appear properly in the GitHub Pages site.*