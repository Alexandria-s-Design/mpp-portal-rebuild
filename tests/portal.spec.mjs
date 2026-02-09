import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const STATIC_DIR = path.resolve('static');

// Get all HTML files from static/
const allHtmlFiles = fs.readdirSync(STATIC_DIR).filter(f => f.endsWith('.html'));
const portalPages = allHtmlFiles.filter(f => f !== 'index.html');

const SCREENSHOT_DIR = path.resolve('test-results', 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// ==================================================================
// TEST 1: All Pages Load (no errors)
// ==================================================================
test.describe('Test 1: All Pages Load', () => {
  for (const file of allHtmlFiles) {
    test(`${file} loads without errors`, async ({ page }) => {
      const errors = [];
      const failedRequests = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      page.on('requestfailed', req => {
        // Ignore favicon requests and Google Fonts (may fail offline)
        const url = req.url();
        if (url.includes('favicon') || url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) return;
        failedRequests.push(`${req.failure().errorText}: ${url}`);
      });

      const response = await page.goto(`/${file}`, { waitUntil: 'networkidle' });
      expect(response.status()).toBeLessThan(400);

      // For portal pages (not index), verify #root has content
      if (file !== 'index.html') {
        const rootContent = await page.$eval('#root', el => el.innerHTML.trim().length);
        expect(rootContent).toBeGreaterThan(100);
      }

      // Allow Google Fonts console errors (may happen offline) but nothing else
      const realErrors = errors.filter(e =>
        !e.includes('fonts.googleapis') &&
        !e.includes('fonts.gstatic') &&
        !e.includes('favicon')
      );

      expect(realErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    });
  }
});

// ==================================================================
// TEST 2: CSS Renders Correctly
// ==================================================================
test.describe('Test 2: CSS Renders Correctly', () => {
  test('Dashboard has navy background sidebar', async ({ page }) => {
    await page.goto('/Mentor-Protege-Program.html', { waitUntil: 'networkidle' });

    // Check the main container has the navy background
    const bgColor = await page.$eval('.flex.min-h-screen', el => {
      return getComputedStyle(el).backgroundColor;
    });
    // #0C1F5B = rgb(12, 31, 91)
    expect(bgColor).toContain('12');
    expect(bgColor).toContain('31');
    expect(bgColor).toContain('91');
  });

  test('Page 06 has sidebarNav', async ({ page }) => {
    await page.goto('/06-Agreement.html', { waitUntil: 'networkidle' });
    const sidebar = await page.$('.sidebarNav');
    expect(sidebar).not.toBeNull();
  });

  test('Hero logo renders with non-zero dimensions', async ({ page }) => {
    await page.goto('/Mentor-Protege-Program.html', { waitUntil: 'networkidle' });
    const logo = await page.$('img[alt="MPP Logo"]');
    expect(logo).not.toBeNull();
    const box = await logo.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('Roboto font is referenced', async ({ page }) => {
    await page.goto('/Mentor-Protege-Program.html', { waitUntil: 'networkidle' });
    // Check that font-roboto class exists in the page
    const hasRoboto = await page.evaluate(() => {
      return document.querySelector('.font-roboto') !== null;
    });
    expect(hasRoboto).toBe(true);
  });
});

// ==================================================================
// TEST 3: Navigation Works
// ==================================================================
test.describe('Test 3: Navigation Works', () => {
  test('Next link on page 06 goes to 07', async ({ page }) => {
    await page.goto('/06-Agreement.html', { waitUntil: 'networkidle' });
    const nextLink = await page.$('#mpp-nav-bar a[href*="07-Agreement-Team"]');
    expect(nextLink).not.toBeNull();
    await nextLink.click();
    await page.waitForLoadState('networkidle');
    // serve may strip .html extension from URL
    expect(page.url()).toContain('07-Agreement-Team');
  });

  test('Previous link on page 07 goes to 06', async ({ page }) => {
    await page.goto('/07-Agreement-Team.html', { waitUntil: 'networkidle' });
    const prevLink = await page.$('#mpp-nav-bar a[href*="06-Agreement"]');
    expect(prevLink).not.toBeNull();
    await prevLink.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('06-Agreement');
  });

  test('Page counter link on page 25 goes to index', async ({ page }) => {
    await page.goto('/25-Protege-Needs-Assessment.html', { waitUntil: 'networkidle' });
    const indexLink = await page.$('#mpp-nav-bar a[href*="index.html"]');
    expect(indexLink).not.toBeNull();
    await indexLink.click();
    await page.waitForLoadState('networkidle');
    // serve may serve index.html at root /
    expect(page.url()).toMatch(/\/(index\.html)?$/);
  });

  test('Page 06 sidebar link to Dashboard works', async ({ page }) => {
    await page.goto('/06-Agreement.html', { waitUntil: 'networkidle' });
    // Pages 6+ have sidebar with title attributes
    const dashLink = await page.$('a[title="Dashboard"]');
    expect(dashLink).not.toBeNull();
    const href = await dashLink.getAttribute('href');
    expect(href).toContain('Mentor-Protege-Program');
  });

  test('index.html links all resolve', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    const links = await page.$$eval('.page-list a', els => els.map(e => e.getAttribute('href')));
    expect(links.length).toBe(50); // 50 portal pages
    for (const link of links) {
      const file = link.replace('./', '');
      expect(fs.existsSync(path.join(STATIC_DIR, file))).toBe(true);
    }
  });
});

// ==================================================================
// TEST 4: Images Load
// ==================================================================
test.describe('Test 4: Images Load', () => {
  test('Page 06 (Agreement) has PNG diagrams with non-zero dimensions', async ({ page }) => {
    await page.goto('/06-Agreement.html', { waitUntil: 'networkidle' });
    const pngs = await page.$$('img[src*="assets/"][src$=".png"]');
    expect(pngs.length).toBeGreaterThan(0);
    for (const img of pngs) {
      const box = await img.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    }
  });

  test('Dashboard hero logo renders', async ({ page }) => {
    await page.goto('/Mentor-Protege-Program.html', { waitUntil: 'networkidle' });
    const logo = await page.$('img[src*="hero-logo"]');
    expect(logo).not.toBeNull();
    const box = await logo.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });
});

// ==================================================================
// TEST 5: Visual Regression (screenshots)
// ==================================================================
test.describe('Test 5: Visual Regression Screenshots', () => {
  const samplePages = [
    'Mentor-Protege-Program.html',
    '06-Agreement.html',
    '15-Mentor-Company-Info.html',
    '24-Protege-Needs-Assessment.html',
    '35-DAP.html',
    '42-MPA-Proposal.html',
    'index.html',
  ];

  for (const file of samplePages) {
    test(`screenshot: ${file}`, async ({ page }) => {
      await page.goto(`/${file}`, { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, file.replace('.html', '.png')),
        fullPage: true,
      });
    });
  }
});
