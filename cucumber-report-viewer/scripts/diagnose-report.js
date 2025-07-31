#!/usr/bin/env node

/**
 * Diagnostic tool to analyze Cucumber JSON report formats
 * Helps identify why a report might not be uploading correctly
 */

const fs = require('fs');
const path = require('path');

function analyzeReport(filePath) {
  console.log(`🔍 Analyzing: ${filePath}`);
  console.log('=' .repeat(50));
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ File does not exist');
      return;
    }
    
    // Read file
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 File size: ${content.length} bytes`);
    
    // Parse JSON
    let data;
    try {
      data = JSON.parse(content);
      console.log('✅ Valid JSON');
    } catch (parseError) {
      console.log('❌ Invalid JSON:', parseError.message);
      return;
    }
    
    // Analyze structure
    console.log('\n📊 Structure Analysis:');
    console.log(`Root type: ${Array.isArray(data) ? 'Array' : typeof data}`);
    
    if (Array.isArray(data)) {
      console.log(`Array length: ${data.length}`);
      if (data.length > 0) {
        console.log('First element type:', typeof data[0]);
        console.log('First element keys:', Object.keys(data[0] || {}));
        
        // Check if it looks like Cucumber features
        const firstFeature = data[0];
        if (firstFeature) {
          console.log('\n🥒 Cucumber Analysis:');
          console.log(`Has name: ${!!firstFeature.name}`);
          console.log(`Has uri: ${!!firstFeature.uri}`);
          console.log(`Has elements: ${!!firstFeature.elements}`);
          console.log(`Has scenarios: ${!!firstFeature.scenarios}`);
          
          if (firstFeature.elements) {
            console.log(`Elements count: ${firstFeature.elements.length}`);
          }
          if (firstFeature.scenarios) {
            console.log(`Scenarios count: ${firstFeature.scenarios.length}`);
          }
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      console.log('Object keys:', Object.keys(data));
      
      if (data.features) {
        console.log('\n🥒 Wrapped Format Detected:');
        console.log(`Features type: ${Array.isArray(data.features) ? 'Array' : typeof data.features}`);
        if (Array.isArray(data.features)) {
          console.log(`Features count: ${data.features.length}`);
        }
      }
    }
    
    // Provide recommendations
    console.log('\n💡 Recommendations:');
    
    if (Array.isArray(data) && data.length > 0 && data[0].name && (data[0].elements || data[0].scenarios)) {
      console.log('✅ This appears to be a valid Cucumber JSON report');
      console.log('✅ Should work with the uploader');
    } else if (data.features && Array.isArray(data.features)) {
      console.log('✅ This is a wrapped Cucumber JSON report');
      console.log('✅ The uploader should automatically convert this format');
    } else {
      console.log('❌ This does not appear to be a standard Cucumber JSON report');
      console.log('💡 Expected format: Array of feature objects');
      console.log('💡 Each feature should have: name, elements/scenarios');
    }
    
  } catch (error) {
    console.log('❌ Error analyzing file:', error.message);
  }
}

// Command line usage
if (process.argv.length < 3) {
  console.log(`
Usage: node diagnose-report.js <path-to-json-file>

Example:
  node diagnose-report.js "E:\\Automation\\IdeaProjects\\qa-automation\\target\\cucumber-reports\\cucumber.json"
  node diagnose-report.js "./public/TestResultsJsons/sample-report.json"
`);
  process.exit(1);
}

const filePath = process.argv[2];
analyzeReport(filePath);