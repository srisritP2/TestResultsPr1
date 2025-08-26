# 🚀 Quick Reference Card - Cucumber Report System

*Keep this handy for daily use!*

---

## ⚡ **Daily Workflow (Copy & Paste)**

```bash
# 1. Generate fresh report
cd E:\Automation\IdeaProjects\qa-automation-v4
mvn clean test

# 2. Start system
cd E:\Projects\AutomationTestResultsWebSite\cucumber-report-viewer
npm run dev

# 3. Upload via browser: http://localhost:8080
# 4. Click "Publish to GitHub Pages" → Select "TestResultsJsons" folder
# 5. Deploy to live site
npm run update-index && git add . && git commit -m "New report $(date)" && git push
```

---

## 🛠️ **Essential Commands**

| Command | Purpose |
|---------|---------|
| `mvn clean test` | Generate fresh JSON report |
| `npm run dev` | Start development server |
| `npm run diagnose "file.json"` | Check file format |
| `npm run fix-skipped "file.json"` | Fix skipped steps |
| `npm run update-index` | Regenerate report index |
| `npm run fix-and-index` | Fix formats + update index |
| `git add . && git commit -m "msg" && git push` | Deploy to GitHub Pages |

---

## 🔧 **Troubleshooting Quick Fixes**

| Problem | Quick Fix |
|---------|-----------|
| Upload fails | `npm run diagnose "path/to/file.json"` |
| All steps skipped | `npm run fix-skipped "path/to/file.json"` |
| Report not on GitHub Pages | `npm run update-index && git push` |
| Port 3001 in use | `taskkill /PID $(netstat -ano \| findstr :3001) /F` |
| Old date showing | Run fresh `mvn clean test` |
| Server won't start | `npm run dev` (restart) |

---

## 📍 **Key Locations**

| What | Where |
|------|-------|
| **Test Reports** | `E:\Automation\IdeaProjects\qa-automation-v4\target\cucumber-reports\` |
| **System Root** | `E:\Projects\AutomationTestResultsWebSite\cucumber-report-viewer\` |
| **Published Reports** | `cucumber-report-viewer/public/TestResultsJsons/` |
| **Development URL** | http://localhost:8080 |
| **Live Site** | https://srisritP2.github.io/TestResultsPr1/ |

---

## 🎯 **Upload Steps (Visual Guide)**

```
1. mvn clean test          → Fresh JSON created
2. npm run dev            → Server starts (localhost:8080)
3. Browser upload         → Select JSON file
4. "Publish to GitHub"    → Select TestResultsJsons folder
5. npm run update-index   → Index updated
6. git add/commit/push    → Live on GitHub Pages
```

---

## 📊 **Status Indicators**

| Icon/Message | Meaning |
|--------------|---------|
| ✅ "Uploaded to Server!" | Perfect - saved to server |
| ✅ "Saved Successfully!" | Good - saved locally |
| ⚠️ "Saved with Compression" | OK - large file compressed |
| 🟢 Green cloud icon | Published to GitHub Pages |
| 🔵 Blue upload icon | Uploaded but not published |

---

## 🚨 **Emergency Commands**

```bash
# If everything breaks:
npm run fix-reports && npm run update-index && git add . && git commit -m "Fix all" && git push

# If server won't start:
taskkill /F /IM node.exe && npm run dev

# If upload fails:
npm run diagnose "E:\Automation\IdeaProjects\qa-automation-v4\target\cucumber-reports\Cucumber.json"
```

---

## 📞 **Need Help?**

1. **Check the full handbook:** `SriHandBook/Cucumber-Report-System-Handbook.md`
2. **Run diagnostics:** `npm run diagnose "your-file.json"`
3. **Check console logs** in browser developer tools
4. **Verify GitHub Actions** at: https://github.com/srisritP2/TestResultsPr1/actions

---

*Print this card and keep it near your desk! 📋*