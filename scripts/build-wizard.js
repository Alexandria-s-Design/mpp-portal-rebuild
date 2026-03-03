/**
 * Build wizard/ directory from docs/ source files.
 *
 * Creates:
 *   wizard/protege-signup/   (5 HTML pages + screenshots)
 *   wizard/agreement-team/   (8 HTML pages + screenshots)
 *   wizard/assets/           (shared CSS, logo, images)
 *   wizard/README.md
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const STATIC = path.join(ROOT, 'static');
const SCREENSHOTS = path.join(ROOT, 'storyboard', 'screenshots');
const WIZARD = path.join(ROOT, 'wizard');

// Page mappings: source file -> wizard file
const PROTEGE_SIGNUP = [
  { src: '01-Protege-Company-Info.html', dest: 'step-1-company-info.html', label: 'Company Info' },
  { src: '02-Company-Info-Wizard.html', dest: 'step-2-sdb-certification.html', label: 'SDB Certification' },
  { src: '03-Company-info-Wizard.html', dest: 'step-3-agreement-details.html', label: 'Agreement Details' },
  { src: '04-Company-Info-Wizard.html', dest: 'step-4-review.html', label: 'Review' },
  { src: '05-Congratulations-Page.html', dest: 'step-5-congratulations.html', label: 'Congratulations' },
];

const AGREEMENT_TEAM = [
  { src: '07-Agreement-Team.html', dest: 'page-01-mentor-team.html', label: 'Mentor Team' },
  { src: '08-Agreement-Team.html', dest: 'page-02-mentor-roles.html', label: 'Mentor Roles' },
  { src: '09-Agreement-Team.html', dest: 'page-03-protege-team.html', label: 'Protégé Team' },
  { src: '10-Agreement-Team.html', dest: 'page-04-protege-roles.html', label: 'Protégé Roles' },
  { src: '11-Agreement-Team.html', dest: 'page-05-subcontractors.html', label: 'Subcontractors' },
  { src: '12-Sponsoring-Agency.html', dest: 'page-06-sponsoring-agency.html', label: 'Sponsoring Agency' },
  { src: '13-Agreement-Team.html', dest: 'page-07-review.html', label: 'Review' },
  { src: '14-Agreement-Team.html', dest: 'page-08-final-review.html', label: 'Final Review' },
];

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  mkdirp(dest);
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Generate the wizard step indicator HTML
 */
function makeStepIndicator(pages, currentIndex, wizardName) {
  const steps = pages.map((p, i) => {
    let cls = 'wizard-step';
    if (i < currentIndex) cls += ' completed';
    else if (i === currentIndex) cls += ' active';
    return `      <a href="${p.dest}" class="${cls}" title="${p.label}">
        <span class="step-number">${i + 1}</span>
        <span class="step-label">${p.label}</span>
      </a>`;
  });

  return `
  <!-- Wizard Step Indicator -->
  <div class="wizard-nav" data-wizard="${wizardName}">
    <div class="wizard-steps">
${steps.join('\n')}
    </div>
  </div>`;
}

/**
 * Generate prev/next navigation
 */
function makeWizardButtons(pages, currentIndex) {
  const prev = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const next = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  let html = '\n  <!-- Wizard Navigation -->\n  <div class="wizard-bottom-nav">\n';
  if (prev) {
    html += `    <a href="${prev.dest}" class="wizard-btn wizard-btn-back">&larr; Back: ${prev.label}</a>\n`;
  } else {
    html += `    <span></span>\n`;
  }
  if (next) {
    html += `    <a href="${next.dest}" class="wizard-btn wizard-btn-next">Next: ${next.label} &rarr;</a>\n`;
  }
  html += '  </div>\n';
  return html;
}

const WIZARD_CSS = `
<style id="wizard-nav-css">
  .wizard-nav {
    background: #0C1F5B;
    padding: 16px 24px;
    margin: -20px -20px 24px -20px;
    border-radius: 8px 8px 0 0;
  }
  .wizard-steps {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }
  .wizard-step {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 6px;
    text-decoration: none;
    font-family: Inter, Roboto, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255,255,255,0.5);
    background: transparent;
    transition: all 0.2s;
  }
  .wizard-step:hover { background: rgba(255,255,255,0.1); }
  .wizard-step.active {
    background: rgba(164,208,249,0.2);
    color: #A4D0F9;
    font-weight: 600;
  }
  .wizard-step.completed {
    color: rgba(255,255,255,0.8);
  }
  .wizard-step.completed .step-number {
    background: #22c55e;
    color: white;
  }
  .step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.7);
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .wizard-step.active .step-number {
    background: #A4D0F9;
    color: #0C1F5B;
  }
  .step-label { white-space: nowrap; }
  .wizard-bottom-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 0;
    margin-top: 24px;
    border-top: 1px solid #e5e7eb;
  }
  .wizard-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-family: Inter, Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }
  .wizard-btn-back {
    background: #f3f4f6;
    color: #374151;
  }
  .wizard-btn-back:hover { background: #e5e7eb; }
  .wizard-btn-next {
    background: #0C1F5B;
    color: white;
  }
  .wizard-btn-next:hover { background: #1a3180; }
</style>`;

function processHtml(html, pages, currentIndex, wizardName) {
  // Fix asset paths: ./assets/ -> ../assets/
  html = html.replace(/href="\.\/assets\//g, 'href="../assets/');
  html = html.replace(/src="\.\/assets\//g, 'src="../assets/');

  // Fix Protege -> Protégé in visible text (not in attribute values, selectors, etc.)
  // Only fix in text content between > and <
  html = html.replace(/>([^<]*?)Protege([^<]*?)</g, (match, before, after) => {
    return `>${before}Protégé${after}<`;
  });

  // Remove old nav bar
  html = html.replace(/<div id="mpp-nav-bar"[\s\S]*?<\/div>\s*<\/div>/g, '');

  // Inject wizard CSS before </head>
  html = html.replace('</head>', WIZARD_CSS + '\n</head>');

  // Build step indicator
  const stepIndicator = makeStepIndicator(pages, currentIndex, wizardName);

  // Build bottom nav
  const bottomNav = makeWizardButtons(pages, currentIndex);

  // Inject step indicator after first <main> or after opening body content area
  // Try to find the main content area
  const mainMatch = html.match(/<main[^>]*>/);
  if (mainMatch) {
    const idx = html.indexOf(mainMatch[0]) + mainMatch[0].length;
    html = html.slice(0, idx) + stepIndicator + html.slice(idx);
  }

  // Inject bottom nav before </main> or before </body>
  const mainClose = html.lastIndexOf('</main>');
  if (mainClose !== -1) {
    html = html.slice(0, mainClose) + bottomNav + html.slice(mainClose);
  } else {
    const bodyClose = html.lastIndexOf('</body>');
    if (bodyClose !== -1) {
      html = html.slice(0, bodyClose) + bottomNav + html.slice(bodyClose);
    }
  }

  return html;
}

function buildWizardSection(sectionPages, sectionDir, wizardName) {
  const outDir = path.join(WIZARD, sectionDir);
  mkdirp(outDir);

  for (let i = 0; i < sectionPages.length; i++) {
    const page = sectionPages[i];
    const srcFile = path.join(DOCS, page.src);
    if (!fs.existsSync(srcFile)) {
      console.log(`  [WARN] Source not found: ${page.src}`);
      continue;
    }
    let html = fs.readFileSync(srcFile, 'utf8');
    html = processHtml(html, sectionPages, i, wizardName);
    fs.writeFileSync(path.join(outDir, page.dest), html, 'utf8');
    console.log(`  ${page.src} -> ${sectionDir}/${page.dest}`);
  }
}

function main() {
  console.log('\n=== Building Wizard Directory ===\n');

  // Clean and create wizard/
  if (fs.existsSync(WIZARD)) {
    fs.rmSync(WIZARD, { recursive: true });
  }
  mkdirp(WIZARD);

  // 1. Copy shared assets
  console.log('Copying shared assets...');
  const assetsOut = path.join(WIZARD, 'assets');
  copyDir(path.join(DOCS, 'assets'), assetsOut);
  console.log(`  -> wizard/assets/ (${fs.readdirSync(assetsOut).length} files)\n`);

  // 2. Build protege-signup
  console.log('Building protege-signup...');
  buildWizardSection(PROTEGE_SIGNUP, 'protege-signup', 'protege-signup');

  // Copy screenshots
  const psScreenshots = path.join(SCREENSHOTS, 'protege-signup');
  if (fs.existsSync(psScreenshots)) {
    copyDir(psScreenshots, path.join(WIZARD, 'protege-signup', 'screenshots'));
    console.log(`  -> screenshots/ (${fs.readdirSync(psScreenshots).length} files)\n`);
  }

  // 3. Build agreement-team
  console.log('Building agreement-team...');
  buildWizardSection(AGREEMENT_TEAM, 'agreement-team', 'agreement-team');

  // Copy screenshots
  const atScreenshots = path.join(SCREENSHOTS, 'agreement-team');
  if (fs.existsSync(atScreenshots)) {
    copyDir(atScreenshots, path.join(WIZARD, 'agreement-team', 'screenshots'));
    console.log(`  -> screenshots/ (${fs.readdirSync(atScreenshots).length} files)\n`);
  }

  // 4. Write README
  console.log('Writing README.md...');
  const readme = `# MPP Portal Wizard Flows

Two wizard flows extracted from the MPP Portal reference site for eLearning development.

## Protégé Signup Wizard (5 steps)

| Step | Page | Description |
|------|------|-------------|
${PROTEGE_SIGNUP.map((p, i) => `| ${i + 1} | [${p.label}](protege-signup/${p.dest}) | ${p.label} |`).join('\n')}

**Screenshots**: \`protege-signup/screenshots/\` (23 images)

## Agreement Team Wizard (8 steps)

| Step | Page | Description |
|------|------|-------------|
${AGREEMENT_TEAM.map((p, i) => `| ${i + 1} | [${p.label}](agreement-team/${p.dest}) | ${p.label} |`).join('\n')}

**Screenshots**: \`agreement-team/screenshots/\` (28 images)

## How to View

1. Start the dev server: \`npm run serve\` (serves from \`static/\` on port 3005)
2. Or open HTML files directly in a browser — they are self-contained with relative asset paths.

## Screenshot Index

See [screenshots.html](screenshots.html) for a visual gallery of all wizard screenshots organized by section.

## Assets

Shared CSS, logos, and diagram images are in \`assets/\`.

## Source

Built from the 50-page MPP Portal reference site (\`docs/\`). Screenshots captured via Playwright (\`storyboard/capture-screenshots.mjs\`).
`;
  fs.writeFileSync(path.join(WIZARD, 'README.md'), readme, 'utf8');

  // Summary
  const totalFiles = [
    ...fs.readdirSync(path.join(WIZARD, 'protege-signup')).filter(f => f.endsWith('.html')),
    ...fs.readdirSync(path.join(WIZARD, 'agreement-team')).filter(f => f.endsWith('.html')),
  ];

  console.log('\n=== Wizard Build Complete ===');
  console.log(`  HTML pages: ${totalFiles.length}`);
  console.log(`  Assets: ${fs.readdirSync(assetsOut).length} files`);
  console.log(`  Screenshots: ${fs.readdirSync(path.join(WIZARD, 'protege-signup', 'screenshots')).length + fs.readdirSync(path.join(WIZARD, 'agreement-team', 'screenshots')).length}`);
  console.log(`  Output: wizard/\n`);
}

main();
