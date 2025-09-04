#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating build output...');

const distDir = path.resolve(__dirname, '../dist');
const requiredFiles = [
  'index.html',
  'manifest.json',
  'img/icons/favicon-16x16.png',
  'img/icons/favicon-32x32.png',
  'img/icons/apple-touch-icon.png'
];

let allValid = true;

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory does not exist');
  process.exit(1);
}

// Check required files
for (const file of requiredFiles) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing required file: ${file}`);
    allValid = false;
  } else {
    console.log(`✅ Found: ${file}`);
  }
}

// Validate manifest.json if it exists
const manifestPath = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check required manifest fields
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        console.error(`❌ Missing manifest field: ${field}`);
        allValid = false;
      }
    }
    
    // Check if start_url is correct for GitHub Pages
    if (manifest.start_url && !manifest.start_url.includes('/TestResults/')) {
      console.error(`❌ Incorrect start_url in manifest: ${manifest.start_url}`);
      allValid = false;
    }
    
    console.log('✅ manifest.json is valid');
  } catch (error) {
    console.error('❌ Invalid manifest.json:', error.message);
    allValid = false;
  }
}

// Check for CSS and JS bundles
const cssDir = path.join(distDir, 'css');
const jsDir = path.join(distDir, 'js');

let cssFiles = [];
let jsFiles = [];

// Check CSS files
if (fs.existsSync(cssDir)) {
  cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
} else {
  // Check for CSS files in root dist directory
  cssFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.css'));
}

// Check JS files
if (fs.existsSync(jsDir)) {
  jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
} else {
  // Check for JS files in root dist directory
  jsFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.js') && !f.includes('service-worker'));
}

if (cssFiles.length === 0) {
  console.error('❌ No CSS bundles found');
  allValid = false;
} else {
  console.log(`✅ Found ${cssFiles.length} CSS bundle(s): ${cssFiles.join(', ')}`);
}

if (jsFiles.length === 0) {
  console.error('❌ No JS bundles found');
  allValid = false;
} else {
  console.log(`✅ Found ${jsFiles.length} JS bundle(s): ${jsFiles.join(', ')}`);
}

if (allValid) {
  console.log('🎉 Build validation passed!');
  process.exit(0);
} else {
  console.log('💥 Build validation failed!');
  process.exit(1);
}