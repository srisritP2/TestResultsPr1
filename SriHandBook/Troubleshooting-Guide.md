# 🔧 Troubleshooting Guide - Cucumber Report System

*Solutions to common problems you might encounter*

---

## 🚨 **Critical Issues**

### **Issue: "Cannot upload file - validation failed"**
**Symptoms:** Upload button disabled, error message in browser
**Diagnosis:**
```bash
npm run diagnose "E:\Automation\IdeaProjects\qa-automation-v4\target\cucumber-reports\Cucumber.json"
```
**Solutions:**
1. **Invalid JSON:** Fix JSON syntax errors
2. **Wrong format:** Use `npm run fix-reports` to normalize
3. **Empty file:** Regenerate with `mvn clean test`
4. **Corrupted file:** Delete and regenerate test report

### **Issue: "Server not responding"**
**Symptoms:** Upload fails, localhost:3001 not accessible
**Diagnosis:**
```bash
curl http://localhost:3001/api/health
netstat -ano | findstr :3001
```
**Solutions:**
1. **Port occupied:** `taskkill /PID [PID] /F`
2. **Server not started:** `npm run dev`
3. **Dependencies missing:** `npm install`
4. **Firewall blocking:** Check Windows Firewall settings

---

## ⚠️ **Common Issues**

### **Issue: "All test steps show as skipped"**
**Symptoms:** 100% skipped rate, but tests actually ran
**Diagnosis:**
```bash
npm run analyze-steps "path/to/file.json"
```
**Root Cause:** Cucumber framework bug marking executed steps as skipped
**Solutions:**
1. **Auto-fix (Recommended):** Just upload - system fixes automatically
2. **Manual fix:** `npm run fix-skipped "path/to/file.json"`
3. **Prevention:** Update Cucumber configuration in your test project

### **Issue: "Report uploaded but not visible on GitHub Pages"**
**Symptoms:** Upload successful locally, but not on live site
**Diagnosis:**
```bash
ls cucumber-report-viewer/public/TestResultsJsons/
git status
```
**Solutions:**
1. **Index not updated:** `npm run update-index`
2. **Changes not committed:** `git add . && git commit -m "Update" && git push`
3. **GitHub Actions failed:** Check https://github.com/srisritP2/TestResultsPr1/actions
4. **Cache issue:** Hard refresh browser (Ctrl+F5)

### **Issue: "Old date showing instead of today's date"**
**Symptoms:** Report shows execution date from weeks ago
**Root Cause:** Using old JSON file from target directory
**Solutions:**
1. **Generate fresh report:** `mvn clean test`
2. **Verify file timestamp:** Check file modification date
3. **Clear target directory:** `mvn clean` then `mvn test`

---

## 🔍 **Diagnostic Issues**

### **Issue: "npm run dev fails to start"**
**Common Error Messages:**
- "Port 8080 already in use"
- "Port 3001 already in use"  
- "Module not found"
- "Permission denied"

**Solutions:**
```bash
# Kill processes on ports
taskkill /F /IM node.exe

# Check what's using ports
netstat -ano | findstr :8080
netstat -ano | findstr :3001

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try different ports
npm run serve -- --port 8081
```

### **Issue: "Git push fails"**
**Common Error Messages:**
- "Authentication failed"
- "Permission denied"
- "Repository not found"

**Solutions:**
```bash
# Check git configuration
git config --list

# Re-authenticate
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Check remote URL
git remote -v

# Force push (use carefully)
git push --force-with-lease origin main
```

---

## 🎯 **Performance Issues**

### **Issue: "Upload is very slow"**
**Symptoms:** File upload takes several minutes
**Causes & Solutions:**
1. **Large file size:** Use `npm run fix-reports` to compress
2. **Network issues:** Check internet connection
3. **Server overload:** Restart with `npm run dev`
4. **Browser cache:** Clear browser cache and cookies

### **Issue: "Website loads slowly"**
**Symptoms:** GitHub Pages site takes long to load
**Solutions:**
1. **Clear browser cache:** Ctrl+Shift+Delete
2. **Check GitHub Pages status:** https://www.githubstatus.com/
3. **Optimize reports:** Remove very large reports if not needed
4. **Use CDN:** Reports are served via GitHub's CDN

---

## 🔄 **Process Issues**

### **Issue: "Maven test doesn't generate JSON"**
**Symptoms:** No Cucumber.json file in target/cucumber-reports/
**Solutions:**
1. **Check Maven configuration:** Verify Cucumber plugin in pom.xml
2. **Run with correct profile:** `mvn test -P cucumber`
3. **Check test execution:** Ensure tests actually run
4. **Verify output directory:** Check if files are in different location

**Example pom.xml configuration:**
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <systemPropertyVariables>
            <cucumber.plugin>json:target/cucumber-reports/Cucumber.json</cucumber.plugin>
        </systemPropertyVariables>
    </configuration>
</plugin>
```

### **Issue: "Publish button doesn't work"**
**Symptoms:** Clicking "Publish to GitHub Pages" does nothing
**Solutions:**
1. **Browser compatibility:** Use Chrome or Firefox
2. **JavaScript errors:** Check browser console (F12)
3. **File system permissions:** Run as administrator
4. **Browser security:** Allow file system access when prompted

---

## 🛡️ **Security Issues**

### **Issue: "Browser blocks file system access"**
**Symptoms:** Folder picker doesn't open or access denied
**Solutions:**
1. **Enable file system access:** Allow when browser prompts
2. **Use different browser:** Chrome has best support
3. **Check browser settings:** Enable file system API
4. **Run as administrator:** Right-click → Run as administrator

### **Issue: "CORS errors in console"**
**Symptoms:** API calls fail with CORS errors
**Solutions:**
1. **Server not running:** Ensure `npm run dev` started both services
2. **Port mismatch:** Verify frontend (8080) and backend (3001) ports
3. **Browser cache:** Clear cache and hard refresh
4. **Firewall/Antivirus:** Temporarily disable to test

---

## 📊 **Data Issues**

### **Issue: "Report statistics are wrong"**
**Symptoms:** Pass/fail counts don't match actual test results
**Diagnosis:**
```bash
npm run analyze-steps "path/to/file.json"
```
**Solutions:**
1. **Skipped step issue:** Use `npm run fix-skipped`
2. **Format issue:** Use `npm run fix-reports`
3. **Regenerate index:** `npm run update-index`
4. **Check source data:** Verify original JSON file

### **Issue: "Dark theme not working"**
**Symptoms:** Theme toggle doesn't change appearance
**Solutions:**
1. **Click theme toggle:** Button in top-right header
2. **Clear localStorage:** Browser dev tools → Application → Local Storage
3. **Browser compatibility:** Update to latest browser version
4. **CSS cache:** Hard refresh (Ctrl+F5)

---

## 🔧 **Recovery Procedures**

### **Complete System Reset**
If everything is broken:
```bash
# 1. Stop all processes
taskkill /F /IM node.exe

# 2. Clean and reinstall
cd E:\Projects\AutomationTestResultsWebSite\cucumber-report-viewer
rm -rf node_modules package-lock.json
npm install

# 3. Fix all reports and regenerate index
npm run fix-reports
npm run update-index

# 4. Restart system
npm run dev

# 5. Test upload with known good file
# 6. Commit and push changes
git add . && git commit -m "System reset and fixes" && git push
```

### **Emergency File Recovery**
If you accidentally delete important files:
```bash
# Check git history
git log --oneline

# Restore from previous commit
git checkout HEAD~1 -- cucumber-report-viewer/public/TestResultsJsons/

# Or restore specific file
git checkout HEAD~1 -- cucumber-report-viewer/public/TestResultsJsons/index.json
```

---

## 📞 **Getting Help**

### **Before Asking for Help**
1. **Run diagnostics:** `npm run diagnose "your-file.json"`
2. **Check console logs:** Browser F12 → Console tab
3. **Verify file paths:** Ensure all paths are correct
4. **Test with known good file:** Use a previously working report

### **Information to Provide**
- **Error message:** Exact text of any error messages
- **File path:** Full path to the JSON file you're trying to upload
- **Browser:** Chrome, Firefox, Edge, etc.
- **Console logs:** Any red errors in browser console
- **System info:** Windows version, Node.js version

### **Useful Debug Commands**
```bash
# System information
node --version
npm --version
git --version

# Check file details
npm run diagnose "path/to/file.json"
npm run analyze-steps "path/to/file.json"

# Check system status
curl http://localhost:3001/api/health
netstat -ano | findstr :3001
netstat -ano | findstr :8080
```

---

*Keep this guide handy for quick problem resolution! 🛠️*