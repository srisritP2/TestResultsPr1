#!/usr/bin/env node

/**
 * Detailed step result analyzer for Cucumber JSON reports
 * Helps identify why tests might show as skipped when they should be passed
 */

const fs = require('fs');

function analyzeStepResults(filePath) {
  console.log(`🔍 Analyzing Step Results: ${filePath}`);
  console.log('=' .repeat(60));
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log('❌ File does not exist');
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      console.log('❌ Expected array of features');
      return;
    }
    
    console.log(`📊 Total Features: ${data.length}\n`);
    
    let totalScenarios = 0;
    let totalSteps = 0;
    let statusCounts = {
      passed: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      undefined: 0,
      other: 0
    };
    
    data.forEach((feature, featureIndex) => {
      console.log(`🎯 Feature ${featureIndex + 1}: ${feature.name}`);
      console.log(`   URI: ${feature.uri}`);
      console.log(`   Elements: ${feature.elements ? feature.elements.length : 0}`);
      
      if (feature.elements) {
        feature.elements.forEach((element, elementIndex) => {
          totalScenarios++;
          console.log(`\n   📋 Scenario ${elementIndex + 1}: ${element.name || 'Unnamed'}`);
          console.log(`      Type: ${element.type}`);
          console.log(`      Steps: ${element.steps ? element.steps.length : 0}`);
          
          if (element.steps) {
            element.steps.forEach((step, stepIndex) => {
              totalSteps++;
              const result = step.result || {};
              const status = result.status || 'undefined';
              
              // Count status
              if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
              } else {
                statusCounts.other++;
              }
              
              console.log(`         Step ${stepIndex + 1}: ${step.keyword}${step.name}`);
              console.log(`            Status: ${status}`);
              
              if (result.duration) {
                console.log(`            Duration: ${result.duration}ns`);
              }
              
              if (result.error_message) {
                console.log(`            Error: ${result.error_message.substring(0, 100)}...`);
              }
              
              // Check for potential issues
              if (status === 'skipped' && stepIndex === 0) {
                console.log(`            ⚠️  ISSUE: First step is skipped - this might indicate a problem`);
              }
              
              if (!result.status) {
                console.log(`            ⚠️  ISSUE: Missing result.status field`);
              }
            });
          }
        });
      }
      console.log('');
    });
    
    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   Features: ${data.length}`);
    console.log(`   Scenarios: ${totalScenarios}`);
    console.log(`   Steps: ${totalSteps}`);
    console.log('\n📊 Step Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count > 0) {
        const percentage = ((count / totalSteps) * 100).toFixed(1);
        const icon = {
          passed: '✅',
          failed: '❌',
          skipped: '⏭️',
          pending: '⏳',
          undefined: '❓',
          other: '🔸'
        }[status];
        
        console.log(`   ${icon} ${status}: ${count} (${percentage}%)`);
      }
    });
    
    // Potential Issues
    console.log('\n🔍 POTENTIAL ISSUES:');
    
    if (statusCounts.skipped > 0 && statusCounts.passed === 0) {
      console.log('❌ All steps are skipped - this suggests a configuration or setup issue');
    }
    
    if (statusCounts.undefined > 0) {
      console.log('❌ Some steps have undefined status - missing result.status field');
    }
    
    if (statusCounts.skipped > statusCounts.passed && statusCounts.passed > 0) {
      console.log('⚠️  More skipped than passed steps - check for conditional logic or failed preconditions');
    }
    
    if (totalSteps === 0) {
      console.log('❌ No steps found - empty test scenarios');
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (statusCounts.passed > 0 && statusCounts.skipped === 0 && statusCounts.failed === 0) {
      console.log('✅ All tests passed - should display correctly on website');
    } else if (statusCounts.skipped > 0) {
      console.log('🔧 Check why steps are marked as skipped:');
      console.log('   - Verify test execution completed successfully');
      console.log('   - Check for conditional step logic');
      console.log('   - Ensure all step definitions are implemented');
    }
    
  } catch (error) {
    console.log('❌ Error analyzing file:', error.message);
  }
}

// Command line usage
if (process.argv.length < 3) {
  console.log(`
Usage: node analyze-step-results.js <path-to-json-file>

Example:
  node analyze-step-results.js "E:\\path\\to\\cucumber.json"
`);
  process.exit(1);
}

const filePath = process.argv[2];
analyzeStepResults(filePath);