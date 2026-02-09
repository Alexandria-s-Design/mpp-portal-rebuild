/**
 * MPP Portal eLearning Storyboard - Screenshot Capture
 *
 * Captures zoomed/cropped screenshots for all 11 sections of the MPP Portal.
 * Reads step definitions from JSON files in storyboard/data/.
 *
 * Usage:
 *   node storyboard/capture-screenshots.mjs --all
 *   node storyboard/capture-screenshots.mjs --section dashboard
 *   node storyboard/capture-screenshots.mjs --section agreement-team
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const BASE_URL = 'http://localhost:3005';

// All section JSON files in order
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

// Load fictional data for form filling
const fictionalData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'fictional-data.json'), 'utf8'));

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Highlight an element with orange border and darkened overlay
 */
async function highlightElement(page, selector, padding = 50) {
  try {
    let element;
    if (selector.includes(':has-text(')) {
      const textMatch = selector.match(/:has-text\("([^"]+)"\)/);
      if (textMatch) {
        const tag = selector.split(':has-text')[0] || '*';
        element = await page.locator(`${tag}:text("${textMatch[1]}")`).first();
      }
    } else {
      element = await page.locator(selector).first();
    }

    if (!element) {
      console.log(`  [WARN] Could not find element: ${selector}`);
      return null;
    }

    await element.scrollIntoViewIfNeeded({ timeout: 3000 });
    await delay(500);

    const box = await element.boundingBox();
    if (!box) {
      console.log(`  [WARN] Could not get bounding box for: ${selector}`);
      return null;
    }

    await page.evaluate(({ box, padding }) => {
      const existing = document.getElementById('capture-highlight');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'capture-highlight';
      overlay.style.cssText = `
        position: fixed;
        left: ${box.x - padding}px;
        top: ${box.y - padding}px;
        width: ${box.width + padding * 2}px;
        height: ${box.height + padding * 2}px;
        border: 4px solid #FF6B35;
        border-radius: 12px;
        box-shadow: 0 0 0 4000px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: 99999;
      `;
      document.body.appendChild(overlay);
    }, { box, padding });

    return {
      x: Math.max(0, box.x - padding),
      y: Math.max(0, box.y - padding),
      width: box.width + padding * 2,
      height: box.height + padding * 2
    };
  } catch (error) {
    console.log(`  [WARN] Error highlighting: ${error.message}`);
    return null;
  }
}

async function removeHighlight(page) {
  await page.evaluate(() => {
    const overlay = document.getElementById('capture-highlight');
    if (overlay) overlay.remove();
  });
}

/**
 * Hide the navigation bar for clean screenshots
 */
async function hideNavBar(page) {
  await page.evaluate(() => {
    const nav = document.getElementById('mpp-nav-bar');
    if (nav) nav.style.display = 'none';
  });
}

/**
 * Collapse the main sidebar to 72px
 */
async function collapseSidebar(page) {
  await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar-expanded');
    if (sidebar) sidebar.classList.remove('sidebar-expanded');
  });
}

/**
 * Fill form fields on a page using the step's formFill data.
 * Skips disabled fields and uses short timeouts to avoid 30s hangs.
 */
async function fillFormFields(page, formFill) {
  if (!formFill) return;

  for (const [selector, value] of Object.entries(formFill)) {
    try {
      const el = await page.locator(selector).first();
      const count = await page.locator(selector).count();
      if (count === 0) continue;

      // Check if element is disabled before attempting fill
      const info = await el.evaluate(e => ({
        tag: e.tagName.toLowerCase(),
        type: e.type || '',
        disabled: e.disabled || e.hasAttribute('disabled') || e.getAttribute('aria-disabled') === 'true',
      }), { timeout: 3000 });

      if (info.disabled) continue;

      if (info.tag === 'select') {
        await el.selectOption(value, { timeout: 3000 });
      } else if (info.tag === 'input') {
        if (info.type === 'checkbox' || info.type === 'radio') {
          if (value === true || value === 'true') {
            await el.check({ timeout: 3000 });
          }
        } else if (info.type === 'date') {
          // Date inputs need YYYY-MM-DD format
          const formatted = value.includes('/') ? value.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2') : value;
          await el.fill(formatted, { timeout: 3000 });
        } else {
          await el.fill(value, { timeout: 3000 });
        }
      } else if (info.tag === 'textarea') {
        await el.fill(value, { timeout: 3000 });
      }
    } catch (e) {
      // Silent skip - don't log 3s timeout warnings to keep output clean
    }
  }
  await delay(300);
}

/**
 * Capture a screenshot based on step type
 */
async function captureStep(page, step, outputDir) {
  const filepath = path.join(SCREENSHOTS_DIR, step.screenshotFile);
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log(`  [${step.stepId}] ${step.type}: ${step.notes || step.screenshotFile}`);

  // Navigate if needed (new page)
  if (step.pageFile) {
    const currentUrl = page.url();
    const targetUrl = `${BASE_URL}/${step.pageFile}`;
    if (!currentUrl.includes(step.pageFile)) {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await delay(1000);
      await hideNavBar(page);
      await collapseSidebar(page);
    }
  }

  // Fill form data if present
  if (step.formFill) {
    await fillFormFields(page, step.formFill);
  }

  const padding = step.padding || 120;

  switch (step.type) {
    case 'sidebar-start':
    case 'sidebar-end': {
      // Capture the progress sidebar section
      const sel = step.selector || '.flex.flex-col.gap-2';
      const clipArea = await highlightElement(page, sel, padding);
      await delay(400);
      if (clipArea) {
        await page.screenshot({
          path: filepath,
          clip: {
            x: clipArea.x,
            y: clipArea.y,
            width: Math.min(clipArea.width, 500),
            height: Math.min(clipArea.height, 500)
          }
        });
      } else {
        await page.screenshot({ path: filepath, fullPage: false });
      }
      await removeHighlight(page);
      break;
    }

    case 'overview': {
      // Content area crop (exclude sidebar chrome) - max 800x550
      const contentSelectors = ['.content-area', 'main > div', '.wizard-content', 'main'];
      let mainEl = null;
      for (const sel of contentSelectors) {
        const count = await page.locator(sel).count();
        if (count > 0) {
          mainEl = await page.locator(sel).first();
          break;
        }
      }
      // Fall back to step selector if none of the content selectors matched
      if (!mainEl && step.selector) {
        mainEl = await page.locator(step.selector).first();
      }
      if (mainEl) {
        await mainEl.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        await delay(300);
        const box = await mainEl.boundingBox();
        if (box) {
          await page.screenshot({
            path: filepath,
            clip: {
              x: Math.max(0, box.x - 10),
              y: Math.max(0, box.y - 10),
              width: Math.min(box.width + 20, 800),
              height: Math.min(box.height + 20, 550)
            }
          });
        } else {
          await page.screenshot({ path: filepath, fullPage: false });
        }
      } else {
        await page.screenshot({ path: filepath, fullPage: false });
      }
      break;
    }

    case 'element': {
      // Zoomed crop with highlight
      const clipArea = await highlightElement(page, step.selector, padding);
      await delay(400);
      if (clipArea) {
        await page.screenshot({
          path: filepath,
          clip: {
            x: clipArea.x,
            y: clipArea.y,
            width: Math.min(clipArea.width, 900),
            height: Math.min(clipArea.height, 650)
          }
        });
      } else {
        await page.screenshot({ path: filepath, fullPage: false });
      }
      await removeHighlight(page);
      break;
    }

    case 'dropdown': {
      // Expand dropdown and capture
      try {
        const sel = step.selector;
        const count = await page.locator(sel).count();
        if (count > 0) {
          const selectEl = await page.locator(sel).first();
          await selectEl.evaluate(el => {
            if (el.tagName === 'SELECT') {
              el.setAttribute('size', Math.min(el.options.length, 10));
              el.style.position = 'relative';
              el.style.zIndex = '9999';
            }
          }, { timeout: 3000 });
          await delay(300);
        }
      } catch (e) {
        console.log(`  [WARN] Could not expand dropdown: ${e.message}`);
      }

      const clipArea = await highlightElement(page, step.selector, padding);
      await delay(400);
      if (clipArea) {
        await page.screenshot({
          path: filepath,
          clip: {
            x: clipArea.x,
            y: clipArea.y,
            width: Math.min(clipArea.width, 900),
            height: Math.min(clipArea.height, 650)
          }
        });
      } else {
        await page.screenshot({ path: filepath, fullPage: false });
      }
      await removeHighlight(page);

      // Collapse the dropdown back
      try {
        const count2 = await page.locator(step.selector).count();
        if (count2 > 0) {
          const selectEl = await page.locator(step.selector).first();
          await selectEl.evaluate(el => {
            if (el.tagName === 'SELECT') el.removeAttribute('size');
          }, { timeout: 3000 });
        }
      } catch (_) {}
      break;
    }

    default:
      console.log(`  [WARN] Unknown step type: ${step.type}`);
      await page.screenshot({ path: filepath, fullPage: false });
  }

  console.log(`    -> ${step.screenshotFile}`);
  return filepath;
}

/**
 * Capture all screenshots for a section
 */
async function captureSection(browser, sectionData) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${sectionData.title} (${sectionData.steps.length} steps)`);
  console.log('='.repeat(60));

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to first page
    const firstPage = sectionData.pages[0] || sectionData.steps[0]?.pageFile;
    if (firstPage) {
      await page.goto(`${BASE_URL}/${firstPage}`, { waitUntil: 'networkidle', timeout: 30000 });
      await delay(1500);
      await hideNavBar(page);
      await collapseSidebar(page);
    }

    let captured = 0;
    for (const step of sectionData.steps) {
      try {
        await captureStep(page, step);
        captured++;
        await delay(300);
      } catch (err) {
        console.log(`  [ERROR] Step ${step.stepId}: ${err.message}`);
      }
    }

    console.log(`\n  Captured ${captured}/${sectionData.steps.length} screenshots`);
  } catch (error) {
    console.error(`  [FATAL] Section error: ${error.message}`);
  } finally {
    await context.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const sectionArg = args.find(a => a.startsWith('--section'));
  const targetSection = sectionArg ? args[args.indexOf('--section') + 1] || args[args.indexOf(sectionArg) + 1] : null;
  const runAll = args.includes('--all') || !targetSection;

  console.log('\n' + '='.repeat(60));
  console.log('  MPP Portal eLearning - Screenshot Capture');
  console.log('='.repeat(60));
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Output: ${SCREENSHOTS_DIR}\n`);

  // Load section data
  const sections = [];
  for (const file of SECTION_FILES) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  [SKIP] ${file} not found`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (runAll || file.includes(targetSection) || data.id?.includes(targetSection)) {
      sections.push(data);
    }
  }

  if (sections.length === 0) {
    console.log('  No sections to process. Check --section argument.');
    process.exit(1);
  }

  console.log(`  Processing ${sections.length} section(s)\n`);

  const browser = await chromium.launch({ headless: true });

  try {
    let totalSteps = 0;
    for (const section of sections) {
      await captureSection(browser, section);
      totalSteps += section.steps.length;
    }

    console.log('\n' + '='.repeat(60));
    console.log('  Screenshot capture complete!');
    console.log(`  Total: ${totalSteps} screenshots across ${sections.length} sections`);
    console.log('='.repeat(60) + '\n');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
