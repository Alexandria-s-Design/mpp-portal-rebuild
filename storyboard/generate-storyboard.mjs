/**
 * MPP Portal eLearning - Complete Storyboard Generator (Node.js)
 *
 * Generates an 11-sheet Excel workbook from JSON data files and screenshots.
 * Design matches reference: "MPP Dashboard and Agreement Modals and Voiceovers.xlsx"
 *
 * Usage: node storyboard/generate-storyboard.mjs
 */

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const OUTPUT_FILE = path.join(__dirname, 'MPP_Portal_eLearning_Storyboard.xlsx');

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

// === STYLES (matching reference spreadsheet) ===
const NAVY_BG = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C1F5B' } };
const LIGHT_BLUE_BG = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
const QUIZ_BG = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
const CORRECT_BG = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
const INCORRECT_BG = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };

const HEADER_FONT = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
const QUIZ_LABEL_FONT = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
const STEP_NUM_FONT = { name: 'Calibri', size: 14, bold: true };
const BODY_FONT = { name: 'Calibri', size: 10 };
const QUIZ_ID_FONT = { name: 'Calibri', size: 10, bold: true };

const CENTER_MID = { horizontal: 'center', vertical: 'middle', wrapText: true };
const LEFT_TOP = { horizontal: 'left', vertical: 'top', wrapText: true };

const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
};

function setupSheet(ws) {
  ws.getColumn('A').width = 8;
  ws.getColumn('B').width = 50;
  ws.getColumn('C').width = 50;
  ws.getColumn('D').width = 58;
  ws.getColumn('E').width = 28;

  // Header row
  const headerRow = ws.getRow(1);
  headerRow.height = 27.95;
  const headers = ['Step #', 'Screenshot', 'Modal Text', 'Voiceover Script', 'Notes'];
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = NAVY_BG;
    cell.font = HEADER_FONT;
    cell.alignment = CENTER_MID;
    cell.border = THIN_BORDER;
  });
}

function addStepRow(ws, rowNum, step, isEvenRow) {
  const row = ws.getRow(rowNum);
  row.height = 140;
  const fill = isEvenRow ? LIGHT_BLUE_BG : undefined;

  // A: Step #
  const cellA = row.getCell(1);
  cellA.value = step.stepId || '';
  cellA.font = STEP_NUM_FONT;
  cellA.alignment = CENTER_MID;
  cellA.border = THIN_BORDER;
  if (fill) cellA.fill = fill;

  // B: Screenshot placeholder (text reference)
  const cellB = row.getCell(2);
  const imgPath = path.join(SCREENSHOTS_DIR, step.screenshotFile || '');
  if (fs.existsSync(imgPath)) {
    try {
      const imgId = ws.workbook.addImage({
        filename: imgPath,
        extension: 'png',
      });
      // Position image in cell B with some padding
      ws.addImage(imgId, {
        tl: { col: 1.1, row: rowNum - 0.9 },
        br: { col: 1.9, row: rowNum - 0.1 },
        editAs: 'oneCell',
      });
    } catch (e) {
      cellB.value = `[${step.screenshotFile}]`;
    }
  } else {
    cellB.value = `[${step.screenshotFile || 'missing'}]`;
  }
  cellB.alignment = CENTER_MID;
  cellB.border = THIN_BORDER;
  if (fill) cellB.fill = fill;

  // C: Modal Text
  const cellC = row.getCell(3);
  cellC.value = step.modalText || '';
  cellC.font = BODY_FONT;
  cellC.alignment = LEFT_TOP;
  cellC.border = THIN_BORDER;
  if (fill) cellC.fill = fill;

  // D: Voiceover
  const cellD = row.getCell(4);
  cellD.value = step.voiceover || '';
  cellD.font = BODY_FONT;
  cellD.alignment = LEFT_TOP;
  cellD.border = THIN_BORDER;
  if (fill) cellD.fill = fill;

  // E: Notes
  const cellE = row.getCell(5);
  cellE.value = step.notes || '';
  cellE.font = BODY_FONT;
  cellE.alignment = LEFT_TOP;
  cellE.border = THIN_BORDER;
  if (fill) cellE.fill = fill;
}

function addQuizSection(ws, startRow, quizData) {
  // Quiz header row
  const sepRow = ws.getRow(startRow);
  sepRow.height = 20.1;
  for (let c = 1; c <= 5; c++) {
    const cell = sepRow.getCell(c);
    cell.fill = NAVY_BG;
    cell.font = QUIZ_LABEL_FONT;
    cell.alignment = CENTER_MID;
    cell.border = THIN_BORDER;
  }
  sepRow.getCell(1).value = 'QUIZ';

  let row = startRow + 1;
  for (const q of quizData) {
    const qRow = ws.getRow(row);
    qRow.height = 159.95;

    // A: Quiz ID
    const cellA = qRow.getCell(1);
    cellA.value = q.id || '';
    cellA.font = QUIZ_ID_FONT;
    cellA.alignment = CENTER_MID;
    cellA.border = THIN_BORDER;
    cellA.fill = QUIZ_BG;

    // B: Question with options
    const options = q.options || {};
    const correct = q.correct || '';
    let questionText = `${q.question || ''}\n\n`;
    for (const [opt, text] of Object.entries(options)) {
      questionText += `${opt}) ${text}\n`;
    }
    const cellB = qRow.getCell(2);
    cellB.value = questionText.trim();
    cellB.font = BODY_FONT;
    cellB.alignment = LEFT_TOP;
    cellB.border = THIN_BORDER;
    cellB.fill = QUIZ_BG;

    // C: Correct answer feedback (green)
    const feedback = q.feedback || {};
    const correctFb = `Correct Answer: ${correct}\n\n${feedback.correct || feedback[correct] || ''}`;
    const cellC = qRow.getCell(3);
    cellC.value = correctFb;
    cellC.font = BODY_FONT;
    cellC.alignment = LEFT_TOP;
    cellC.border = THIN_BORDER;
    cellC.fill = CORRECT_BG;

    // D: Incorrect feedback (pink)
    let incorrectFb = 'Incorrect Answer Feedback:\n\n';
    for (const opt of Object.keys(options)) {
      if (opt !== correct) {
        incorrectFb += `${opt}: ${feedback[opt] || ''}\n\n`;
      }
    }
    const cellD = qRow.getCell(4);
    cellD.value = incorrectFb.trim();
    cellD.font = BODY_FONT;
    cellD.alignment = LEFT_TOP;
    cellD.border = THIN_BORDER;
    cellD.fill = INCORRECT_BG;

    // E: Notes
    const cellE = qRow.getCell(5);
    cellE.value = 'Multiple choice quiz question';
    cellE.font = BODY_FONT;
    cellE.alignment = LEFT_TOP;
    cellE.border = THIN_BORDER;
    cellE.fill = QUIZ_BG;

    row++;
  }
  return row;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  MPP Portal eLearning - Storyboard Generator');
  console.log('='.repeat(60));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MPP Portal eLearning Pipeline';
  wb.created = new Date();

  let totalSteps = 0;
  let totalQuiz = 0;

  for (const sectionFile of SECTION_FILES) {
    const filepath = path.join(DATA_DIR, sectionFile);
    if (!fs.existsSync(filepath)) {
      console.log(`  [SKIP] ${sectionFile} not found`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const sheetName = (data.sheetName || data.title || 'Sheet').substring(0, 31);
    const ws = wb.addWorksheet(sheetName);

    setupSheet(ws);

    // Add steps
    const steps = data.steps || [];
    for (let i = 0; i < steps.length; i++) {
      addStepRow(ws, i + 2, steps[i], i % 2 === 0);
    }

    // Add quiz
    const quiz = data.quiz || [];
    addQuizSection(ws, steps.length + 2, quiz);

    totalSteps += steps.length;
    totalQuiz += quiz.length;
    console.log(`  [OK] ${sheetName}: ${steps.length} steps + ${quiz.length} quiz`);
  }

  await wb.xlsx.writeFile(OUTPUT_FILE);

  console.log('\n' + '='.repeat(60));
  console.log(`  Output: ${OUTPUT_FILE}`);
  console.log(`  Total: ${totalSteps} steps + ${totalQuiz} quiz questions`);
  console.log(`  Sheets: ${wb.worksheets.length}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
