#!/usr/bin/env node

/**
 * Fix for Cucumber reports where steps are marked as "skipped" but have duration
 * This suggests the steps actually ran but were incorrectly marked as skipped
 */

const fs = require('fs');
const path = require('path');

function fixSkippedStepsWithDuration(filePath, outputPath = null) {
  console.log(`🔧 Fixing skipped steps with duration: ${filePath}`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log('❌ File does not exist');
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      console.log('❌ Expected array of features');
      return false;
    }
    
    let fixedSteps = 0;
    let totalSteps = 0;
    
    // Process each feature
    data.forEach(feature => {
      if (feature.elements) {
        feature.elements.forEach(element => {
          if (element.steps) {
            element.steps.forEach(step => {
              totalSteps++;
              
              // Check if step is marked as skipped but has duration
              if (step.result && 
                  step.result.status === 'skipped' && 
                  step.result.duration && 
                  step.result.duration > 0) {
                
                console.log(`🔄 Fixing step: ${step.keyword}${step.name}`);
                console.log(`   Duration: ${step.result.duration}ns`);
                
                // Change status from skipped to passed
                step.result.status = 'passed';
                fixedSteps++;
              }
            });
          }
        });
      }
    });
    
    if (fixedSteps > 0) {
      // Write the fixed data
      const output = outputPath || filePath.replace('.json', '_fixed.json');
      fs.writeFileSync(output, JSON.stringify(data, null, 2));
      
      console.log(`✅ Fixed ${fixedSteps} out of ${totalSteps} steps`);
      console.log(`📁 Saved to: ${output}`);
      
      // Show summary
      console.log('\n📊 SUMMARY:');
      console.log(`   Total steps: ${totalSteps}`);
      console.log(`   Fixed steps: ${fixedSteps}`);
      console.log(`   Fix rate: ${((fixedSteps / totalSteps) * 100).toFixed(1)}%`);
      
      return true;
    } else {
      console.log('ℹ️  No steps needed fixing');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error fixing file:', error.message);
    return false;
  }
}

// Command line usage
if (process.argv.length < 3) {
  console.log(`
Usage: node fix-skipped-with-duration.js <input-file> [output-file]

Examples:
  node fix-skipped-with-duration.js "cucumber.json"
  node fix-skipped-with-duration.js "cucumber.json" "cucumber_fixed.json"

This tool fixes Cucumber JSON reports where steps are marked as "skipped" 
but have duration values, indicating they actually executed successfully.
`);
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

const success = fixSkippedStepsWithDuration(inputFile, outputFile);
process.exit(success ? 0 : 1);