const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STATIC = path.join(ROOT, 'static');
const ASSETS = path.join(STATIC, 'assets');

console.log('========================================');
console.log('  MPP PORTAL DEEP AUDIT');
console.log('========================================\n');

const issues = [];
let totalIssues = 0;

// Get all files
const htmlFiles = fs.readdirSync(STATIC).filter(f => f.endsWith('.html'));
const assetFiles = fs.existsSync(ASSETS) ? fs.readdirSync(ASSETS) : [];

// -------------------------------------------------------
// 1. HTML FILE COUNT
// -------------------------------------------------------
console.log('1. HTML FILES CHECK');
console.log('-------------------');
// 50 portal pages + 1 index.html = 51
const expectedHtml = 51;
console.log(`   Found ${htmlFiles.length} HTML files (expected ${expectedHtml})`);
if (htmlFiles.length !== expectedHtml) {
  issues.push(`Expected ${expectedHtml} HTML files, found ${htmlFiles.length}`);
  totalIssues++;
}
htmlFiles.forEach(f => console.log(`     ${f}`));
console.log('');

// -------------------------------------------------------
// 2. ASSET FILES CHECK
// -------------------------------------------------------
console.log('2. ASSET FILES CHECK');
console.log('--------------------');
const expectedAssets = [
  'hero-logo.svg',
  'index-main.css',
  'index-alt.css',
  'index-main.js',
  'index-alt.js',
  'agreement_overview.png',
  'agreement_proposal.png',
  'agreement_team.png',
  'assistance_benefits.png',
  'mentor_company_info.png',
  'protege_company_info.png',
  'protege_needs_assessment.png',
  'whitepaper.png',
];
let missingAssets = 0;
for (const asset of expectedAssets) {
  if (fs.existsSync(path.join(ASSETS, asset))) {
    console.log(`   OK ${asset}`);
  } else {
    console.log(`   MISSING ${asset}`);
    issues.push(`Missing asset: ${asset}`);
    missingAssets++;
  }
}
totalIssues += missingAssets;
console.log('');

// -------------------------------------------------------
// 3. NO _files/ DIRECTORY REFERENCES
// -------------------------------------------------------
console.log('3. NO _files/ REFERENCES');
console.log('------------------------');
let filesRefCount = 0;
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(STATIC, file), 'utf8');
  const matches = content.match(/_files\//g);
  if (matches) {
    console.log(`   BAD ${file}: ${matches.length} _files references`);
    issues.push(`${file} has ${matches.length} _files references`);
    filesRefCount += matches.length;
  }
}
if (filesRefCount === 0) {
  console.log('   OK No _files references found');
} else {
  totalIssues += filesRefCount;
}
console.log('');

// -------------------------------------------------------
// 4. NO ECCALON URL REFERENCES (except form values)
// -------------------------------------------------------
console.log('4. ECCALON URL CHECK');
console.log('--------------------');
let eccalonCount = 0;
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(STATIC, file), 'utf8');
  // Check for href/src pointing to eccalon (not value= or form data)
  const hrefMatches = content.match(/(?:href|src)="https?:\/\/[^"]*eccalon[^"]*"/g) || [];
  if (hrefMatches.length > 0) {
    console.log(`   WARN ${file}: ${hrefMatches.length} eccalon href/src references`);
    hrefMatches.forEach(m => console.log(`        ${m}`));
    issues.push(`${file} has eccalon href/src references`);
    eccalonCount += hrefMatches.length;
  }
}
if (eccalonCount === 0) {
  console.log('   OK No eccalon href/src references');
}
totalIssues += eccalonCount;
console.log('');

// -------------------------------------------------------
// 5. NO <script> TAGS
// -------------------------------------------------------
console.log('5. NO SCRIPT TAGS');
console.log('-----------------');
let scriptCount = 0;
for (const file of htmlFiles) {
  if (file === 'index.html') continue; // index.html is ours, skip
  const content = fs.readFileSync(path.join(STATIC, file), 'utf8');
  const matches = content.match(/<script/gi);
  if (matches) {
    console.log(`   BAD ${file}: ${matches.length} script tags`);
    issues.push(`${file} has script tags`);
    scriptCount += matches.length;
  }
}
if (scriptCount === 0) {
  console.log('   OK No script tags found');
} else {
  totalIssues += scriptCount;
}
console.log('');

// -------------------------------------------------------
// 6. INTERNAL LINKS RESOLVE
// -------------------------------------------------------
console.log('6. INTERNAL LINKS CHECK');
console.log('-----------------------');
let brokenLinks = 0;
const brokenSet = new Set();
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(STATIC, file), 'utf8');
  const hrefMatches = content.match(/href="([^"]+)"/g) || [];
  for (const match of hrefMatches) {
    const href = match.match(/href="([^"]+)"/)[1];
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript') ||
        href.startsWith('mailto') || href.startsWith('data:') || href.startsWith('tel:') ||
        href.startsWith('about:')) continue;
    let target = href.replace('./', '').split('#')[0].split('?')[0];
    if (!target) continue;
    const fullPath = path.join(STATIC, target);
    if (!fs.existsSync(fullPath) && !brokenSet.has(target)) {
      brokenSet.add(target);
      console.log(`   BROKEN ${target} (from ${file})`);
      issues.push(`Broken link: ${target}`);
      brokenLinks++;
    }
  }
}
if (brokenLinks === 0) {
  console.log('   OK All internal links resolve');
} else {
  totalIssues += brokenLinks;
}
console.log('');

// -------------------------------------------------------
// 7. NAVIGATION BAR PRESENT
// -------------------------------------------------------
console.log('7. NAVIGATION BAR CHECK');
console.log('-----------------------');
let navMissing = 0;
for (const file of htmlFiles) {
  if (file === 'index.html') continue;
  const content = fs.readFileSync(path.join(STATIC, file), 'utf8');
  if (!content.includes('id="mpp-nav-bar"')) {
    console.log(`   MISSING nav bar: ${file}`);
    issues.push(`${file} missing nav bar`);
    navMissing++;
  }
}
if (navMissing === 0) {
  console.log('   OK All pages have nav bar');
} else {
  totalIssues += navMissing;
}
console.log('');

// -------------------------------------------------------
// 8. FAVICON CHECK
// -------------------------------------------------------
console.log('8. FAVICON CHECK');
console.log('----------------');
let faviconIssues = 0;
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(STATIC, file), 'utf8');
  if (!content.includes('href="./assets/hero-logo.svg"')) {
    console.log(`   WARN ${file}: favicon not pointing to local asset`);
    faviconIssues++;
  }
}
if (faviconIssues === 0) {
  console.log('   OK All favicons point to local asset');
} else {
  totalIssues += faviconIssues;
}
console.log('');

// -------------------------------------------------------
// 9. CSS REFERENCES CHECK
// -------------------------------------------------------
console.log('9. CSS REFERENCES CHECK');
console.log('-----------------------');
let cssIssues = 0;
for (const file of htmlFiles) {
  if (file === 'index.html') continue;
  const content = fs.readFileSync(path.join(STATIC, file), 'utf8');
  const cssRefs = content.match(/href="([^"]*\.css)"/g) || [];
  for (const match of cssRefs) {
    const cssPath = match.match(/href="([^"]+)"/)[1];
    const fullPath = path.join(STATIC, cssPath.replace('./', ''));
    if (!fs.existsSync(fullPath)) {
      console.log(`   MISSING CSS ${cssPath} (from ${file})`);
      issues.push(`Missing CSS: ${cssPath} in ${file}`);
      cssIssues++;
    }
  }
}
if (cssIssues === 0) {
  console.log('   OK All CSS files exist');
} else {
  totalIssues += cssIssues;
}
console.log('');

// -------------------------------------------------------
// 10. TOTAL SIZE CHECK
// -------------------------------------------------------
console.log('10. TOTAL SIZE CHECK');
console.log('--------------------');
function dirSize(dir) {
  let total = 0;
  for (const file of fs.readdirSync(dir)) {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      total += dirSize(fp);
    } else {
      total += stat.size;
    }
  }
  return total;
}
const totalBytes = dirSize(STATIC);
const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
console.log(`   Total static/ size: ${totalMB} MB`);
if (totalBytes > 15 * 1024 * 1024) {
  console.log(`   WARN Over 15MB target`);
  issues.push(`static/ folder is ${totalMB}MB, target is under 15MB`);
  totalIssues++;
} else {
  console.log('   OK Under 15MB target');
}
console.log('');

// -------------------------------------------------------
// SUMMARY
// -------------------------------------------------------
console.log('========================================');
console.log('  AUDIT SUMMARY');
console.log('========================================');
if (totalIssues === 0) {
  console.log('\n  ALL CHECKS PASSED! Portal is ready.\n');
} else {
  console.log(`\n  Found ${totalIssues} issue(s):\n`);
  issues.forEach((issue, i) => console.log(`    ${i + 1}. ${issue}`));
  console.log('');
}

process.exit(totalIssues > 0 ? 1 : 0);
