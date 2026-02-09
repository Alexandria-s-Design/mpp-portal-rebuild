const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STATIC = path.join(ROOT, 'static');

console.log('=== FIX PATHS & STRIP JS ===\n');

const htmlFiles = fs.readdirSync(STATIC).filter(f => f.endsWith('.html'));
let totalFixes = 0;

// Pages that use Bundle B (alt CSS): Dashboard + pages 01-05
const bundleBPages = new Set([
  'Mentor-Protege-Program.html',
  '01-Protege-Company-Info.html',
  '02-Company-Info-Wizard.html',
  '03-Company-info-Wizard.html',
  '04-Company-Info-Wizard.html',
  '05-Congratulations-Page.html',
]);

// Asset rename map: original hashed names → clean names
const assetRenames = {
  'hero-logo-COArL1B5.svg': 'hero-logo.svg',
  'agreement_overview-BaxnY638.png': 'agreement_overview.png',
  'agreement_proposal-BrNJByzh.png': 'agreement_proposal.png',
  'agreement_team-R20xhWQ1.png': 'agreement_team.png',
  'assistance_benefits-D1nJuvQE.png': 'assistance_benefits.png',
  'mentor_company_info-DMPBDmK7.png': 'mentor_company_info.png',
  'protege_company_info-DtJNPc7g.png': 'protege_company_info.png',
  'protege_needs_assessment-p8IDfvNg.png': 'protege_needs_assessment.png',
  'whitepaper-B5TPoVzf.png': 'whitepaper.png',
};

for (const file of htmlFiles) {
  const filePath = path.join(STATIC, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let fixes = 0;

  // 1. Remove ALL <script> tags (including multiline)
  const beforeScript = content.length;
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<script[^>]*\/>/gi, '');
  // Also remove standalone script tags (self-closed with src)
  content = content.replace(/<script[^>]*>[^<]*$/gim, '');
  if (content.length !== beforeScript) {
    fixes++;
  }

  // 2. Fix CSS paths: ./PageName_files/index-*.css → ./assets/index-main.css or index-alt.css
  const cssFile = bundleBPages.has(file) ? 'index-alt.css' : 'index-main.css';
  content = content.replace(
    /href="\.\/[^"]*_files\/index-[A-Za-z_]+\.css"/g,
    `href="./assets/${cssFile}"`
  );
  fixes++;

  // 3. Fix SVG paths: ./PageName_files/hero-logo-*.svg → ./assets/hero-logo.svg
  content = content.replace(
    /src="\.\/[^"]*_files\/hero-logo-[A-Za-z0-9]+\.svg"/g,
    'src="./assets/hero-logo.svg"'
  );
  fixes++;

  // 4. Fix PNG paths: ./PageName_files/name-hash.png → ./assets/name.png
  for (const [origName, newName] of Object.entries(assetRenames)) {
    if (origName.endsWith('.png')) {
      // Match any _files path referencing this asset
      const escapedOrig = origName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(src|href)="\\./[^"]*_files/${escapedOrig}"`, 'g');
      content = content.replace(regex, `$1="./assets/${newName}"`);
    }
  }
  fixes++;

  // 5. Fix favicon: href="https://(dev-mpp|mpp).eccalon.com/*/logo.svg" → ./assets/hero-logo.svg
  content = content.replace(
    /href="https?:\/\/(dev-mpp|mpp)\.eccalon\.com\/[^"]*\/logo\.svg"/g,
    'href="./assets/hero-logo.svg"'
  );
  fixes++;

  // 6. Remove crossorigin attributes on link tags
  content = content.replace(/(<link[^>]*)\s+crossorigin(?:="[^"]*")?/gi, '$1');
  fixes++;

  // 6b. Remove "saved from url" comments referencing eccalon
  content = content.replace(/<!-- saved from url=\([^)]*\)https?:\/\/[^>]*eccalon[^>]*-->\s*/gi, '');
  fixes++;

  // 6c. Fix href links pointing to eccalon.com URLs (sidebar account links etc.)
  // Replace with javascript:void(0) since these are non-functional without the live server
  content = content.replace(/href="https?:\/\/(dev-mpp|mpp)\.eccalon\.com\/[^"]*"/g, 'href="javascript:void(0)"');
  fixes++;

  // 7. Fix any remaining _files references for images we might have missed
  // Generic catch-all for _files references
  for (const [origName, newName] of Object.entries(assetRenames)) {
    const escapedOrig = origName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\.\/[^"]*_files\\/${escapedOrig}`, 'g');
    content = content.replace(regex, `./assets/${newName}`);
  }

  totalFixes += fixes;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ${file}: ${fixes} fix categories applied`);
}

console.log(`\n  Processed ${htmlFiles.length} files, ${totalFixes} total fix categories`);

// Verify no _files references remain
console.log('\n  Checking for remaining _files references...');
let remaining = 0;
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(STATIC, file), 'utf8');
  const matches = content.match(/_files\//g);
  if (matches) {
    console.log(`    WARNING: ${file} still has ${matches.length} _files references`);
    remaining += matches.length;
  }
}
if (remaining === 0) {
  console.log('    None found - all clean!');
}

// Verify no script tags remain
console.log('\n  Checking for remaining <script> tags...');
let scriptCount = 0;
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(STATIC, file), 'utf8');
  const matches = content.match(/<script/gi);
  if (matches) {
    console.log(`    WARNING: ${file} still has ${matches.length} script tags`);
    scriptCount += matches.length;
  }
}
if (scriptCount === 0) {
  console.log('    None found - all clean!');
}

console.log('\n=== FIX PATHS COMPLETE ===');
