/**
 * MPP Portal eLearning - Storyboard Validation
 *
 * Validates all section JSON files for completeness and consistency:
 * - All screenshot files referenced in JSON exist on disk
 * - No empty modal text or voiceover fields
 * - Voiceover word count: 25-50 words per step
 * - Modal text word count: 15-40 words per step
 * - Each section has exactly 3 quiz questions with correct answer + feedback
 * - Step IDs sequential within each section
 * - No duplicate screenshot filenames
 *
 * Usage: node storyboard/validate-storyboard.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

const SECTION_FILES = [
  '01-dashboard.json',
  '02-protege-signup.json',
  '03-agreement-overview.json',
  '04-agreement-team.json',
  '05-mentor-company-info.json',
  '06-protege-company-info.json',
  '07-needs-assessment.json',
  '08-terms-of-agreement.json',
  '09-dap.json',
  '10-white-paper.json',
  '11-mpa-proposal.json',
];

let errors = 0;
let warnings = 0;

function error(section, msg) {
  console.log(`  [ERROR] ${section}: ${msg}`);
  errors++;
}

function warn(section, msg) {
  console.log(`  [WARN]  ${section}: ${msg}`);
  warnings++;
}

function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function validateSection(sectionFile) {
  const filepath = path.join(DATA_DIR, sectionFile);
  if (!fs.existsSync(filepath)) {
    error(sectionFile, 'File not found');
    return;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    error(sectionFile, `Invalid JSON: ${e.message}`);
    return;
  }

  const sectionName = data.sheetName || data.title || sectionFile;
  console.log(`\n  Validating: ${sectionName}`);

  // Check required fields
  if (!data.id) error(sectionName, 'Missing "id" field');
  if (!data.title) error(sectionName, 'Missing "title" field');
  if (!data.sheetName) error(sectionName, 'Missing "sheetName" field');
  if (!data.pages || !Array.isArray(data.pages)) error(sectionName, 'Missing or invalid "pages" array');
  if (!data.steps || !Array.isArray(data.steps)) {
    error(sectionName, 'Missing or invalid "steps" array');
    return;
  }

  // Track screenshot filenames for duplicates
  const screenshotFiles = new Set();

  // Validate steps
  let expectedId = 1;
  for (const step of data.steps) {
    const stepLabel = `Step ${step.stepId}`;

    // Sequential IDs
    const numId = parseInt(step.stepId, 10);
    if (numId !== expectedId) {
      warn(sectionName, `${stepLabel}: Expected ID ${String(expectedId).padStart(2, '0')}, got ${step.stepId}`);
    }
    expectedId = numId + 1;

    // Step type
    if (!['sidebar-start', 'sidebar-end', 'overview', 'element', 'dropdown'].includes(step.type)) {
      error(sectionName, `${stepLabel}: Invalid type "${step.type}"`);
    }

    // Screenshot file
    if (!step.screenshotFile) {
      error(sectionName, `${stepLabel}: Missing screenshotFile`);
    } else {
      // Check for duplicates
      if (screenshotFiles.has(step.screenshotFile)) {
        error(sectionName, `${stepLabel}: Duplicate screenshot "${step.screenshotFile}"`);
      }
      screenshotFiles.add(step.screenshotFile);

      // Check file exists on disk
      const imgPath = path.join(SCREENSHOTS_DIR, step.screenshotFile);
      if (!fs.existsSync(imgPath)) {
        warn(sectionName, `${stepLabel}: Screenshot not found: ${step.screenshotFile}`);
      }
    }

    // Modal text
    if (!step.modalText || step.modalText.trim() === '') {
      error(sectionName, `${stepLabel}: Empty modalText`);
    } else {
      const wc = wordCount(step.modalText);
      if (wc < 15) warn(sectionName, `${stepLabel}: modalText too short (${wc} words, min 15)`);
      if (wc > 40) warn(sectionName, `${stepLabel}: modalText too long (${wc} words, max 40)`);
    }

    // Voiceover
    if (!step.voiceover || step.voiceover.trim() === '') {
      error(sectionName, `${stepLabel}: Empty voiceover`);
    } else {
      const wc = wordCount(step.voiceover);
      if (wc < 25) warn(sectionName, `${stepLabel}: voiceover too short (${wc} words, min 25)`);
      if (wc > 50) warn(sectionName, `${stepLabel}: voiceover too long (${wc} words, max 50)`);
    }

    // Notes
    if (!step.notes) {
      warn(sectionName, `${stepLabel}: Missing notes`);
    }
  }

  // Validate quiz
  if (!data.quiz || !Array.isArray(data.quiz)) {
    error(sectionName, 'Missing or invalid "quiz" array');
    return;
  }

  if (data.quiz.length !== 3) {
    error(sectionName, `Expected 3 quiz questions, got ${data.quiz.length}`);
  }

  for (const q of data.quiz) {
    const qLabel = `Quiz ${q.id}`;

    if (!q.question) error(sectionName, `${qLabel}: Missing question`);
    if (!q.options || Object.keys(q.options).length !== 3) {
      error(sectionName, `${qLabel}: Must have exactly 3 options (A/B/C)`);
    }
    if (!['A', 'B', 'C'].includes(q.correct)) {
      error(sectionName, `${qLabel}: Invalid correct answer "${q.correct}"`);
    }

    // Check feedback
    if (!q.feedback) {
      error(sectionName, `${qLabel}: Missing feedback object`);
    } else {
      if (!q.feedback.correct) error(sectionName, `${qLabel}: Missing correct feedback`);
      for (const opt of ['A', 'B', 'C']) {
        if (opt !== q.correct && !q.feedback[opt]) {
          error(sectionName, `${qLabel}: Missing feedback for incorrect option ${opt}`);
        }
      }
    }
  }

  console.log(`    ${data.steps.length} steps, ${data.quiz.length} quiz questions`);
}

// ============================================================
// Main
// ============================================================

console.log('\n' + '='.repeat(60));
console.log('  MPP Portal eLearning - Storyboard Validation');
console.log('='.repeat(60));

let found = 0;
for (const file of SECTION_FILES) {
  if (fs.existsSync(path.join(DATA_DIR, file))) found++;
}
console.log(`\n  Found ${found}/${SECTION_FILES.length} section files`);

for (const file of SECTION_FILES) {
  validateSection(file);
}

console.log('\n' + '='.repeat(60));
if (errors === 0 && warnings === 0) {
  console.log('  ALL CHECKS PASSED');
} else {
  console.log(`  ${errors} errors, ${warnings} warnings`);
}
console.log('='.repeat(60) + '\n');

process.exit(errors > 0 ? 1 : 0);
