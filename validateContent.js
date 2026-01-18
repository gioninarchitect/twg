#!/usr/bin/env node
/**
 * Content Validation Script for Tea With God
 * Run: node validateContent.js
 */

const fs = require('fs');
const path = require('path');

// Read and parse the TypeScript content file
const contentFile = fs.readFileSync(
  path.join(__dirname, 'src/content/devotionalContent.ts'),
  'utf8'
);

// ============================================================================
// EXTRACT DATA FROM TYPESCRIPT FILE
// ============================================================================

function extractDays(content) {
  const days = [];

  // Find each day block - handle both single and escaped quotes
  const dayPattern = /dayNumber:\s*(\d+),\s*\n\s*title:\s*['"`](.+?)['"`],\s*\n\s*phase:\s*['"`](\w+)['"`],/g;
  let match;

  while ((match = dayPattern.exec(content)) !== null) {
    days.push({
      dayNumber: parseInt(match[1]),
      title: match[2].replace(/\\'/g, "'"),
      phase: match[3],
    });
  }

  return days;
}

// ============================================================================
// VALIDATION CHECKS
// ============================================================================

// Characters that indicate encoding issues
const ENCODING_PATTERNS = [
  { pattern: /\uFFFD/g, name: 'replacement character (failed decode)' },
  { pattern: /[\u0000-\u0008]/g, name: 'control characters' },
  { pattern: /[\u000B\u000C]/g, name: 'vertical tab/form feed' },
  { pattern: /[\u000E-\u001F]/g, name: 'control characters' },
];

// Word encoding leftovers (warnings only)
const WORD_PATTERNS = [
  { pattern: /[\u00A0]/g, name: 'non-breaking space', severity: 'warning' },
  { pattern: /[\u2022]/g, name: 'bullet character', severity: 'warning' },
  { pattern: /[\uFEFF]/g, name: 'BOM marker', severity: 'error' },
];

// Bad escapes that shouldn't be in the final content
const BAD_ESCAPES = [
  { pattern: /\\n(?![a-z])/g, name: 'literal \\n in string' },
  { pattern: /\\t/g, name: 'literal \\t in string' },
  { pattern: /\\r/g, name: 'literal \\r in string' },
];

function checkContent(content, location) {
  const errors = [];
  const warnings = [];

  // Check encoding issues
  for (const { pattern, name } of ENCODING_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      errors.push({
        location,
        message: `Found ${name}: ${matches.length} occurrence(s)`,
        chars: matches.slice(0, 3).map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase()}`).join(', ')
      });
    }
  }

  // Check Word leftovers
  for (const { pattern, name, severity } of WORD_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      const issue = {
        location,
        message: `Found ${name}: ${matches.length} occurrence(s)`,
      };
      if (severity === 'error') {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }

  return { errors, warnings };
}

function getExpectedPhase(dayNumber) {
  if (dayNumber <= 14) return 'valley';
  if (dayNumber <= 21) return 'waiting';
  if (dayNumber <= 33) return 'rising';
  return 'becoming';
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

console.log('\n========================================');
console.log('TEA WITH GOD - CONTENT VALIDATION');
console.log('========================================\n');

const allErrors = [];
const allWarnings = [];

// 1. Check the raw file for encoding issues
console.log('1. Checking file encoding...');
const fileCheck = checkContent(contentFile, 'File');
allErrors.push(...fileCheck.errors);
allWarnings.push(...fileCheck.warnings);
console.log(`   Found ${fileCheck.errors.length} errors, ${fileCheck.warnings.length} warnings\n`);

// 2. Extract and validate day count
console.log('2. Checking day structure...');
const days = extractDays(contentFile);
console.log(`   Found ${days.length} days in content\n`);

if (days.length !== 40) {
  allErrors.push({
    location: 'Overall',
    message: `Expected 40 days, found ${days.length}`,
  });
}

// 3. Check all days 1-40 present
console.log('3. Checking all days present...');
const dayNumbers = days.map(d => d.dayNumber).sort((a, b) => a - b);
const missing = [];
const duplicates = [];
const seen = new Set();

for (let i = 1; i <= 40; i++) {
  if (!dayNumbers.includes(i)) {
    missing.push(i);
  }
}

for (const num of dayNumbers) {
  if (seen.has(num)) {
    duplicates.push(num);
  }
  seen.add(num);
}

if (missing.length > 0) {
  allErrors.push({
    location: 'Overall',
    message: `Missing days: ${missing.join(', ')}`,
  });
  console.log(`   MISSING: Days ${missing.join(', ')}`);
}

if (duplicates.length > 0) {
  allErrors.push({
    location: 'Overall',
    message: `Duplicate days: ${duplicates.join(', ')}`,
  });
  console.log(`   DUPLICATES: Days ${duplicates.join(', ')}`);
}

if (missing.length === 0 && duplicates.length === 0) {
  console.log('   All 40 days present and unique\n');
}

// 4. Check phases
console.log('4. Checking phase assignments...');
let phaseErrors = 0;
for (const day of days) {
  const expected = getExpectedPhase(day.dayNumber);
  if (day.phase !== expected) {
    allErrors.push({
      location: `Day ${day.dayNumber}`,
      message: `Wrong phase: expected '${expected}', got '${day.phase}'`,
    });
    phaseErrors++;
  }
}
console.log(`   ${phaseErrors === 0 ? 'All phases correct' : `${phaseErrors} phase errors`}\n`);

// 5. Check for problematic characters in titles
console.log('5. Checking titles for special characters...');
for (const day of days) {
  // Check for unescaped apostrophes that might break
  if (day.title.includes("'") && !day.title.includes("\\'")) {
    // This is fine in template literals, but check for issues
    const check = checkContent(day.title, `Day ${day.dayNumber} title`);
    allErrors.push(...check.errors);
    allWarnings.push(...check.warnings);
  }
}
console.log('   Title check complete\n');

// 6. Phase summary
console.log('6. Phase Summary:');
const phaseCounts = {
  valley: days.filter(d => d.phase === 'valley').length,
  waiting: days.filter(d => d.phase === 'waiting').length,
  rising: days.filter(d => d.phase === 'rising').length,
  becoming: days.filter(d => d.phase === 'becoming').length,
};
const phaseExpected = { valley: 14, waiting: 7, rising: 12, becoming: 7 };

for (const [phase, count] of Object.entries(phaseCounts)) {
  const expected = phaseExpected[phase];
  const status = count === expected ? 'OK' : 'MISMATCH';
  console.log(`   ${phase}: ${count} days (expected ${expected}) - ${status}`);
}

// ============================================================================
// FINAL REPORT
// ============================================================================

console.log('\n========================================');
console.log('VALIDATION RESULTS');
console.log('========================================\n');

console.log(`Total Days Found: ${days.length}/40`);
console.log(`Errors: ${allErrors.length}`);
console.log(`Warnings: ${allWarnings.length}`);
console.log(`Status: ${allErrors.length === 0 ? 'PASSED' : 'FAILED'}\n`);

if (allErrors.length > 0) {
  console.log('ERRORS:');
  console.log('--------');
  for (const err of allErrors) {
    console.log(`  [${err.location}] ${err.message}`);
    if (err.chars) console.log(`    Characters: ${err.chars}`);
  }
  console.log('');
}

if (allWarnings.length > 0) {
  console.log('WARNINGS:');
  console.log('---------');
  for (const warn of allWarnings) {
    console.log(`  [${warn.location}] ${warn.message}`);
  }
  console.log('');
}

// List all days for verification
console.log('ALL DAYS:');
console.log('---------');
for (const day of days.sort((a, b) => a.dayNumber - b.dayNumber)) {
  console.log(`  Day ${day.dayNumber.toString().padStart(2)}: [${day.phase.padEnd(8)}] ${day.title}`);
}

console.log('\n========================================\n');

process.exit(allErrors.length === 0 ? 0 : 1);
