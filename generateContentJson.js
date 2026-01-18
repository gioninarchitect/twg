#!/usr/bin/env node
/**
 * Generate content.json from devotionalContent.ts
 * Run: node generateContentJson.js
 */

const fs = require('fs');
const path = require('path');

// Read the TypeScript file
const tsContent = fs.readFileSync(
  path.join(__dirname, 'src/content/devotionalContent.ts'),
  'utf8'
);

// Extract days data
function extractDays(content) {
  const days = [];

  // Match each day object more precisely
  const dayRegex = /{\s*dayNumber:\s*(\d+),\s*\n\s*title:\s*['"`](.+?)['"`],\s*\n\s*phase:\s*['"`](\w+)['"`],\s*\n\s*reflection:\s*`([\s\S]*?)`,\s*\n\s*scripture:\s*{\s*\n\s*text:\s*['"`](.+?)['"`],\s*\n\s*reference:\s*['"`](.+?)['"`],\s*\n\s*},\s*\n\s*thoughtOfDay:\s*['"`](.+?)['"`],\s*\n\s*prayer:\s*['"`](.+?)['"`],\s*\n\s*journalPrompt:\s*['"`](.+?)['"`],\s*\n\s*}/g;

  let match;
  while ((match = dayRegex.exec(content)) !== null) {
    days.push({
      day_number: parseInt(match[1]),
      title: cleanString(match[2]),
      phase_name: capitalize(match[3]),
      reflection_content: cleanString(match[4]),
      scripture_text: cleanString(match[5]),
      scripture_reference: cleanString(match[6]),
      thought_of_day: cleanString(match[7]),
      prayer_text: cleanString(match[8]),
      journal_prompt: cleanString(match[9]),
    });
  }

  return days;
}

function cleanString(str) {
  return str
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .trim();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Extract front matter
function extractFrontMatter(content) {
  const frontMatter = {};

  const fields = ['dedication', 'openingLetter', 'aboutAuthor', 'introduction', 'howToUse', 'whyFortyDays'];

  for (const field of fields) {
    const regex = new RegExp(`${field}:\\s*\`([\\s\\S]*?)\``, 'g');
    const match = regex.exec(content);
    if (match) {
      frontMatter[field] = cleanString(match[1]);
    }
  }

  return frontMatter;
}

// Extract closing content
function extractClosingContent(content) {
  const closing = {};

  const prayerMatch = /finalPrayer:\s*`([\s\S]*?)`,/g.exec(content);
  if (prayerMatch) {
    closing.finalPrayer = cleanString(prayerMatch[1]);
  }

  const authorMatch = /author:\s*['"`](.+?)['"`]/g.exec(content);
  if (authorMatch) {
    closing.author = cleanString(authorMatch[1]);
  }

  return closing;
}

// Generate the JSON
console.log('Generating content.json from devotionalContent.ts...\n');

const days = extractDays(tsContent);
const frontMatter = extractFrontMatter(tsContent);
const closingContent = extractClosingContent(tsContent);

console.log(`Found ${days.length} days`);
console.log(`Front matter fields: ${Object.keys(frontMatter).length}`);

// Create the output structure matching what the app expects
const output = {
  metadata: {
    title: 'Tea With God: A 40-Day Devotional for Women',
    author: 'Lani Butler',
    copyright: '2025-2026',
    generatedAt: new Date().toISOString(),
  },
  frontMatter,
  days: days.sort((a, b) => a.day_number - b.day_number),
  closingContent,
};

// Validate we have all 40 days
const dayNumbers = days.map(d => d.day_number);
const missing = [];
for (let i = 1; i <= 40; i++) {
  if (!dayNumbers.includes(i)) {
    missing.push(i);
  }
}

if (missing.length > 0) {
  console.error(`\nWARNING: Missing days: ${missing.join(', ')}`);
} else {
  console.log('All 40 days present!');
}

// Write the JSON file
const outputPath = path.join(__dirname, 'assets/content.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\nWritten to: ${outputPath}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

// Sample output for verification
console.log('\n--- Sample Day 1 ---');
console.log(JSON.stringify(days[0], null, 2).substring(0, 500) + '...');
