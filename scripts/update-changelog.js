#!/usr/bin/env node

/**
 * Changelog Update Helper
 * 
 * This script helps maintain the CHANGELOG.md file by providing
 * templates and validation for new entries.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

const ENTRY_TEMPLATE = `
### Added
- 

### Changed
- 

### Fixed
- 

### Removed
- 

### Security
- 

### Technical
- 
`;

function showUsage() {
  console.log(`
Thirstee Changelog Helper

Usage:
  node scripts/update-changelog.js [command]

Commands:
  template    Show template for new changelog entries
  validate    Validate changelog format
  version     Show current version from package.json

Examples:
  node scripts/update-changelog.js template
  node scripts/update-changelog.js validate
`);
}

function showTemplate() {
  console.log('📝 Changelog Entry Template:');
  console.log('Copy this template and add your changes under [Unreleased]');
  console.log(ENTRY_TEMPLATE);
}

function validateChangelog() {
  try {
    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    
    // Basic validation checks
    const checks = [
      { test: changelog.includes('# Changelog'), message: 'Has main title' },
      { test: changelog.includes('[Unreleased]'), message: 'Has Unreleased section' },
      { test: changelog.includes('## ['), message: 'Has versioned sections' },
      { test: changelog.includes('### Added'), message: 'Has category sections' },
    ];
    
    console.log('🔍 Changelog Validation:');
    checks.forEach(check => {
      console.log(`${check.test ? '✅' : '❌'} ${check.message}`);
    });
    
    const hasUnreleased = changelog.includes('[Unreleased]');
    if (hasUnreleased) {
      console.log('\n📋 Ready for new entries in [Unreleased] section');
    }
    
  } catch (error) {
    console.error('❌ Error reading changelog:', error.message);
  }
}

function showVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'frontend', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`📦 Current version: ${packageJson.version}`);
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'template':
    showTemplate();
    break;
  case 'validate':
    validateChangelog();
    break;
  case 'version':
    showVersion();
    break;
  default:
    showUsage();
}
