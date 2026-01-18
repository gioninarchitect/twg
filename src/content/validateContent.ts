/**
 * Content Validation Script for Tea With God
 *
 * This script validates the devotional content for:
 * 1. Encoding issues (funny characters)
 * 2. Escaped characters that shouldn't be there
 * 3. All 40 days present with correct structure
 * 4. Phase boundaries correct
 * 5. All required fields populated
 *
 * Run: npx ts-node src/content/validateContent.ts
 */

import { DEVOTIONAL_DAYS, FRONT_MATTER, CLOSING_CONTENT, DayContent, Phase } from './devotionalContent';

// ============================================================================
// VALIDATION TYPES
// ============================================================================

interface ValidationError {
  type: 'error' | 'warning';
  location: string;
  message: string;
  value?: string;
}

interface ValidationReport {
  totalDays: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  passed: boolean;
  summary: string;
}

// ============================================================================
// CHARACTER PATTERNS TO CHECK
// ============================================================================

// Characters that indicate encoding issues
const ENCODING_ISSUES: RegExp[] = [
  /[\uFFFD]/g, // Replacement character (indicates failed decode)
  /[\u0000-\u0008]/g, // Control characters (except tab, newline)
  /[\u000B\u000C]/g, // Vertical tab, form feed
  /[\u000E-\u001F]/g, // More control characters
  /[\u007F-\u009F]/g, // DEL and C1 control codes
  /[\uD800-\uDFFF]/g, // Lone surrogates (invalid UTF-16)
];

// Characters that might indicate Word encoding leftovers
const WORD_ENCODING_ISSUES: { pattern: RegExp; name: string }[] = [
  { pattern: /[\u2018\u2019]/g, name: 'curly single quotes' }, // Should be straight '
  { pattern: /[\u201C\u201D]/g, name: 'curly double quotes' }, // Should be straight "
  { pattern: /[\u2013\u2014]/g, name: 'en/em dashes' }, // Acceptable but flag for review
  { pattern: /[\u2026]/g, name: 'horizontal ellipsis' }, // Should be ...
  { pattern: /[\u00A0]/g, name: 'non-breaking space' }, // Should be regular space
  { pattern: /[\u2022]/g, name: 'bullet character' }, // Should be * or -
  { pattern: /[\uFEFF]/g, name: 'BOM marker' }, // Should not be in content
];

// Escape sequences that shouldn't appear in rendered content
const BAD_ESCAPES: { pattern: RegExp; name: string }[] = [
  { pattern: /\\n(?!ew|ot|ame|umber)/g, name: 'literal \\n (should be newline)' },
  { pattern: /\\t/g, name: 'literal \\t (should be tab)' },
  { pattern: /\\r/g, name: 'literal \\r (carriage return)' },
  { pattern: /\\'/g, name: 'escaped single quote' },
  { pattern: /\\"/g, name: 'escaped double quote' },
];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function checkEncodingIssues(text: string, location: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for severe encoding issues
  for (const pattern of ENCODING_ISSUES) {
    const matches = text.match(pattern);
    if (matches) {
      errors.push({
        type: 'error',
        location,
        message: `Found encoding issue: ${matches.length} invalid character(s)`,
        value: matches.slice(0, 3).map((c) => `U+${c.charCodeAt(0).toString(16).toUpperCase()}`).join(', '),
      });
    }
  }

  // Check for Word encoding leftovers (warnings, not errors)
  for (const { pattern, name } of WORD_ENCODING_ISSUES) {
    const matches = text.match(pattern);
    if (matches) {
      // Curly quotes and dashes are acceptable - just note them
      if (name === 'curly single quotes' || name === 'curly double quotes' || name === 'en/em dashes') {
        // These are fine in final output, skip warning
        continue;
      }
      errors.push({
        type: 'warning',
        location,
        message: `Found ${name}: ${matches.length} occurrence(s)`,
        value: matches.slice(0, 3).join(', '),
      });
    }
  }

  return errors;
}

function checkBadEscapes(text: string, location: string): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const { pattern, name } of BAD_ESCAPES) {
    const matches = text.match(pattern);
    if (matches) {
      errors.push({
        type: 'error',
        location,
        message: `Found ${name}: ${matches.length} occurrence(s)`,
        value: matches.slice(0, 3).join(', '),
      });
    }
  }

  return errors;
}

function checkFieldPopulated(value: string | undefined, fieldName: string, location: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!value || value.trim().length === 0) {
    errors.push({
      type: 'error',
      location,
      message: `Missing required field: ${fieldName}`,
    });
  } else if (value.trim().length < 10) {
    errors.push({
      type: 'warning',
      location,
      message: `Field ${fieldName} seems too short (${value.trim().length} chars)`,
      value: value.trim(),
    });
  }

  return errors;
}

function checkPhaseCorrect(day: DayContent): ValidationError[] {
  const errors: ValidationError[] = [];
  const expectedPhase = getExpectedPhase(day.dayNumber);

  if (day.phase !== expectedPhase) {
    errors.push({
      type: 'error',
      location: `Day ${day.dayNumber}`,
      message: `Wrong phase: expected '${expectedPhase}', got '${day.phase}'`,
    });
  }

  return errors;
}

function getExpectedPhase(dayNumber: number): Phase {
  if (dayNumber <= 14) return 'valley';
  if (dayNumber <= 21) return 'waiting';
  if (dayNumber <= 33) return 'rising';
  return 'becoming';
}

function validateDay(day: DayContent): ValidationError[] {
  const errors: ValidationError[] = [];
  const loc = `Day ${day.dayNumber}`;

  // Check all text fields for encoding issues
  const textFields = [
    { name: 'title', value: day.title },
    { name: 'reflection', value: day.reflection },
    { name: 'scripture.text', value: day.scripture.text },
    { name: 'scripture.reference', value: day.scripture.reference },
    { name: 'thoughtOfDay', value: day.thoughtOfDay },
    { name: 'prayer', value: day.prayer },
    { name: 'journalPrompt', value: day.journalPrompt },
  ];

  for (const { name, value } of textFields) {
    // Check if populated
    errors.push(...checkFieldPopulated(value, name, loc));

    if (value) {
      // Check encoding
      errors.push(...checkEncodingIssues(value, `${loc}.${name}`));

      // Check escapes
      errors.push(...checkBadEscapes(value, `${loc}.${name}`));
    }
  }

  // Check phase
  errors.push(...checkPhaseCorrect(day));

  return errors;
}

function validateFrontMatter(): ValidationError[] {
  const errors: ValidationError[] = [];
  const fields = [
    { name: 'dedication', value: FRONT_MATTER.dedication },
    { name: 'openingLetter', value: FRONT_MATTER.openingLetter },
    { name: 'aboutAuthor', value: FRONT_MATTER.aboutAuthor },
    { name: 'introduction', value: FRONT_MATTER.introduction },
    { name: 'howToUse', value: FRONT_MATTER.howToUse },
    { name: 'whyFortyDays', value: FRONT_MATTER.whyFortyDays },
  ];

  for (const { name, value } of fields) {
    errors.push(...checkFieldPopulated(value, name, 'FrontMatter'));
    if (value) {
      errors.push(...checkEncodingIssues(value, `FrontMatter.${name}`));
      errors.push(...checkBadEscapes(value, `FrontMatter.${name}`));
    }
  }

  return errors;
}

function validateClosingContent(): ValidationError[] {
  const errors: ValidationError[] = [];

  errors.push(...checkFieldPopulated(CLOSING_CONTENT.finalPrayer, 'finalPrayer', 'ClosingContent'));
  errors.push(...checkEncodingIssues(CLOSING_CONTENT.finalPrayer, 'ClosingContent.finalPrayer'));
  errors.push(...checkBadEscapes(CLOSING_CONTENT.finalPrayer, 'ClosingContent.finalPrayer'));

  return errors;
}

function checkAllDaysPresent(): ValidationError[] {
  const errors: ValidationError[] = [];
  const dayNumbers = DEVOTIONAL_DAYS.map((d) => d.dayNumber).sort((a, b) => a - b);

  // Check we have exactly 40 days
  if (dayNumbers.length !== 40) {
    errors.push({
      type: 'error',
      location: 'Overall',
      message: `Expected 40 days, found ${dayNumbers.length}`,
    });
  }

  // Check for missing days
  for (let i = 1; i <= 40; i++) {
    if (!dayNumbers.includes(i)) {
      errors.push({
        type: 'error',
        location: 'Overall',
        message: `Missing Day ${i}`,
      });
    }
  }

  // Check for duplicates
  const seen = new Set<number>();
  for (const num of dayNumbers) {
    if (seen.has(num)) {
      errors.push({
        type: 'error',
        location: 'Overall',
        message: `Duplicate Day ${num}`,
      });
    }
    seen.add(num);
  }

  return errors;
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

export function validateAllContent(): ValidationReport {
  const allErrors: ValidationError[] = [];

  console.log('\n========================================');
  console.log('TEA WITH GOD - CONTENT VALIDATION');
  console.log('========================================\n');

  // 1. Check all 40 days present
  console.log('Checking day count and sequence...');
  allErrors.push(...checkAllDaysPresent());

  // 2. Validate front matter
  console.log('Validating front matter...');
  allErrors.push(...validateFrontMatter());

  // 3. Validate each day
  console.log('Validating each day\'s content...');
  for (const day of DEVOTIONAL_DAYS) {
    const dayErrors = validateDay(day);
    if (dayErrors.length > 0) {
      console.log(`  Day ${day.dayNumber}: ${dayErrors.filter((e) => e.type === 'error').length} errors, ${dayErrors.filter((e) => e.type === 'warning').length} warnings`);
    }
    allErrors.push(...dayErrors);
  }

  // 4. Validate closing content
  console.log('Validating closing content...');
  allErrors.push(...validateClosingContent());

  // Separate errors and warnings
  const errors = allErrors.filter((e) => e.type === 'error');
  const warnings = allErrors.filter((e) => e.type === 'warning');

  // Generate report
  const report: ValidationReport = {
    totalDays: DEVOTIONAL_DAYS.length,
    errors,
    warnings,
    passed: errors.length === 0,
    summary: `Found ${errors.length} error(s) and ${warnings.length} warning(s)`,
  };

  // Print results
  console.log('\n========================================');
  console.log('VALIDATION RESULTS');
  console.log('========================================\n');

  console.log(`Total Days: ${report.totalDays}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Status: ${report.passed ? 'PASSED' : 'FAILED'}\n`);

  if (errors.length > 0) {
    console.log('ERRORS:');
    console.log('--------');
    for (const err of errors) {
      console.log(`  [${err.location}] ${err.message}`);
      if (err.value) console.log(`    Value: ${err.value}`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('WARNINGS:');
    console.log('---------');
    for (const warn of warnings) {
      console.log(`  [${warn.location}] ${warn.message}`);
      if (warn.value) console.log(`    Value: ${warn.value}`);
    }
    console.log('');
  }

  // Phase summary
  console.log('PHASE SUMMARY:');
  console.log('--------------');
  const phases: Phase[] = ['valley', 'waiting', 'rising', 'becoming'];
  for (const phase of phases) {
    const count = DEVOTIONAL_DAYS.filter((d) => d.phase === phase).length;
    const expected = phase === 'valley' ? 14 : phase === 'waiting' ? 7 : phase === 'rising' ? 12 : 7;
    const status = count === expected ? 'OK' : 'MISMATCH';
    console.log(`  ${phase}: ${count} days (expected ${expected}) - ${status}`);
  }

  console.log('\n========================================\n');

  return report;
}

// Run if executed directly
if (require.main === module) {
  const report = validateAllContent();
  process.exit(report.passed ? 0 : 1);
}

export default validateAllContent;
