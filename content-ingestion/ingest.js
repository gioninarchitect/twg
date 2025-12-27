/**
 * Tea With God - Content Ingestion Pipeline
 * Parses DOCX and populates database with all 40 days
 */

const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

// Import database from backend
const dbPath = path.join(__dirname, '../backend/src/database/db.js');
const db = require(dbPath);

const DOCX_PATH = '/Users/florisolivier/Downloads/Tea_With_God_NO_BLANKS (2).docx';

// Phase mapping
function getPhaseId(dayNumber) {
  if (dayNumber <= 14) return 1; // Valley
  if (dayNumber <= 21) return 2; // Waiting
  if (dayNumber <= 33) return 3; // Rising
  return 4; // Becoming
}

// Theme extraction
function extractThemes(content) {
  const keywords = {
    grief: ['grief', 'loss', 'mourn', 'weep', 'cry'],
    hope: ['hope', 'future', 'tomorrow', 'promise'],
    trust: ['trust', 'faith', 'believe', 'lean'],
    rest: ['rest', 'tired', 'weary', 'exhausted'],
    identity: ['identity', 'becoming', 'who you are'],
    fear: ['fear', 'afraid', 'anxiety', 'worry'],
    healing: ['heal', 'restore', 'mend', 'rebuild'],
    surrender: ['surrender', 'let go', 'release'],
    loneliness: ['lonely', 'alone', 'unseen', 'invisible'],
    strength: ['strength', 'strong', 'courage', 'brave']
  };
  
  const lower = content.toLowerCase();
  const themes = [];
  
  for (const [theme, words] of Object.entries(keywords)) {
    if (words.some(w => lower.includes(w))) {
      themes.push(theme);
    }
  }
  
  return themes.slice(0, 5);
}

// Parse a single day section
function parseDaySection(text) {
  // Match day header
  const headerMatch = text.match(/^Day\s+(\d+)\s*[—–-]\s*(.+?)(?:\n|$)/m);
  if (!headerMatch) return null;
  
  const dayNumber = parseInt(headerMatch[1]);
  const title = headerMatch[2].trim();
  
  // Remove header from text for further parsing
  let content = text.substring(headerMatch[0].length).trim();
  
  // Extract Scripture
  let scriptureText = '';
  let scriptureRef = '';
  const scriptureMatch = content.match(/[*"'](.+?)[*"']\s*[—–-]\s*(.+?)(?:\n|THOUGHT|Thought)/s);
  if (scriptureMatch) {
    scriptureText = scriptureMatch[1].trim().replace(/\n/g, ' ');
    scriptureRef = scriptureMatch[2].trim();
  }
  
  // Extract Thought of the Day
  let thoughtOfDay = '';
  const thoughtMatch = content.match(/(?:THOUGHT OF THE DAY|Thought of the Day)[:\s]*(.+?)(?:\n(?:PRAYER|Prayer)|$)/is);
  if (thoughtMatch) {
    thoughtOfDay = thoughtMatch[1].trim().replace(/\n/g, ' ');
  }
  
  // Extract Prayer
  let prayerText = '';
  const prayerMatch = content.match(/(?:PRAYER|Prayer)[:\s]*(.+?)(?:\n(?:JOURNAL|Journal)|$)/is);
  if (prayerMatch) {
    prayerText = prayerMatch[1].trim();
  }
  
  // Extract Journal Prompt
  let journalPrompt = '';
  const journalMatch = content.match(/(?:JOURNAL PROMPT|Journal Prompt)[:\s]*(.+?)(?:\n(?:Day\s+\d+)|$)/is);
  if (journalMatch) {
    journalPrompt = journalMatch[1].trim().replace(/\n/g, ' ');
  }
  
  // Extract Reflection (everything before SCRIPTURE)
  let reflectionContent = '';
  const scriptureIndex = content.search(/(?:SCRIPTURE|Scripture)/i);
  if (scriptureIndex > 0) {
    reflectionContent = content.substring(0, scriptureIndex).trim();
  } else {
    // Fallback: take first paragraph
    const firstPara = content.split(/\n\n/)[0];
    reflectionContent = firstPara ? firstPara.trim() : '';
  }
  
  return {
    day_number: dayNumber,
    phase_id: getPhaseId(dayNumber),
    title: title,
    reflection_content: reflectionContent || 'Reflection content for Day ' + dayNumber,
    scripture_text: scriptureText || 'Scripture for Day ' + dayNumber,
    scripture_reference: scriptureRef || 'Reference ' + dayNumber,
    thought_of_day: thoughtOfDay || 'Thought for Day ' + dayNumber,
    prayer_text: prayerText || 'Prayer for Day ' + dayNumber,
    journal_prompt: journalPrompt || 'What is on your heart today?',
    themes: extractThemes(content)
  };
}

async function ingest() {
  console.log('='.repeat(50));
  console.log('Tea With God Content Ingestion');
  console.log('='.repeat(50));
  
  // Check if file exists
  if (!fs.existsSync(DOCX_PATH)) {
    console.error('ERROR: DOCX file not found at:', DOCX_PATH);
    process.exit(1);
  }
  
  console.log('Reading DOCX file...');
  
  // Convert DOCX to text
  const result = await mammoth.extractRawText({ path: DOCX_PATH });
  const fullText = result.value;
  
  console.log('Extracted', fullText.length, 'characters');
  
  // Split into day sections
  const dayPattern = /(?=Day\s+\d+\s*[—–-])/g;
  const sections = fullText.split(dayPattern).filter(s => s.trim().startsWith('Day'));
  
  console.log('Found', sections.length, 'day sections');
  
  let ingested = 0;
  let failed = 0;
  
  for (const section of sections) {
    const dayData = parseDaySection(section);
    
    if (!dayData) {
      console.log('  [SKIP] Could not parse section');
      failed++;
      continue;
    }
    
    if (dayData.day_number < 1 || dayData.day_number > 40) {
      console.log('  [SKIP] Invalid day number:', dayData.day_number);
      failed++;
      continue;
    }
    
    try {
      db.insertDayContent(dayData);
      console.log('  [OK] Day', dayData.day_number, '-', dayData.title.substring(0, 40));
      ingested++;
    } catch (err) {
      console.error('  [ERR] Day', dayData.day_number, ':', err.message);
      failed++;
    }
  }
  
  console.log('='.repeat(50));
  console.log('COMPLETE');
  console.log('  Ingested:', ingested);
  console.log('  Failed:', failed);
  console.log('  Total in DB:', db.getDayCount());
  console.log('='.repeat(50));
  
  // Export content as JSON for offline bundling
  const allDays = db.getAllDays();
  const outputPath = path.join(__dirname, '../mobile/assets/content.json');
  
  // Ensure directory exists
  const assetsDir = path.dirname(outputPath);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify({
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    phases: db.getPhases(),
    days: allDays.map(d => {
      d.themes = JSON.parse(d.themes || '[]');
      return d;
    })
  }, null, 2));
  
  console.log('Exported content.json for offline bundling');
}

ingest().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
