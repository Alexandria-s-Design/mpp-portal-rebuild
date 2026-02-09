const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW = path.join(ROOT, 'raw-export');
const STATIC = path.join(ROOT, 'static');
const ASSETS = path.join(STATIC, 'assets');

// Ensure output dirs exist
[STATIC, ASSETS].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// Clean static/ first (except assets/)
fs.readdirSync(STATIC).forEach(f => {
  const fp = path.join(STATIC, f);
  if (f === 'assets') return;
  if (fs.statSync(fp).isFile()) fs.unlinkSync(fp);
});
// Clean assets/
fs.readdirSync(ASSETS).forEach(f => fs.unlinkSync(path.join(ASSETS, f)));

console.log('=== CONSOLIDATION SCRIPT ===\n');

// 1. Copy unique assets from any _files folder
const assetMap = {
  'hero-logo-COArL1B5.svg': 'hero-logo.svg',
  'index-Cum_zetF.css': 'index-main.css',
  'index-DmnPfckf.css': 'index-alt.css',
  'index-Blpt8JxB.js.download': 'index-main.js',
  'index-DBFOPriK.js.download': 'index-alt.js',
  'agreement_overview-BaxnY638.png': 'agreement_overview.png',
  'agreement_proposal-BrNJByzh.png': 'agreement_proposal.png',
  'agreement_team-R20xhWQ1.png': 'agreement_team.png',
  'assistance_benefits-D1nJuvQE.png': 'assistance_benefits.png',
  'mentor_company_info-DMPBDmK7.png': 'mentor_company_info.png',
  'protege_company_info-DtJNPc7g.png': 'protege_company_info.png',
  'protege_needs_assessment-p8IDfvNg.png': 'protege_needs_assessment.png',
  'whitepaper-B5TPoVzf.png': 'whitepaper.png',
};

// Find asset source from _files folders
const filesDirs = fs.readdirSync(RAW).filter(f => f.endsWith('_files'));
const copiedAssets = new Set();

for (const [origName, newName] of Object.entries(assetMap)) {
  for (const dir of filesDirs) {
    const src = path.join(RAW, dir, origName);
    if (fs.existsSync(src) && !copiedAssets.has(newName)) {
      fs.copyFileSync(src, path.join(ASSETS, newName));
      copiedAssets.add(newName);
      console.log(`  Asset: ${origName} → assets/${newName}`);
      break;
    }
  }
}

console.log(`\n  Copied ${copiedAssets.size} unique assets\n`);

// 2. HTML file rename mapping
// Source names → target names (spaces→hyphens, zero-padded numbers)
const htmlFiles = fs.readdirSync(RAW).filter(f => f.endsWith('.html'));

const renameMap = {};
for (const file of htmlFiles) {
  let newName;
  if (file.startsWith('Mentor-Prot')) {
    // Dashboard - has accented é in source
    newName = 'Mentor-Protege-Program.html';
  } else {
    // Replace spaces with hyphens
    newName = file.replace(/ /g, '-');
    // Zero-pad single digit numbers at the start
    newName = newName.replace(/^(\d)-/, (m, d) => `0${d}-`);
  }
  renameMap[file] = newName;
}

console.log('  HTML file renames:');
for (const [src, dst] of Object.entries(renameMap).sort((a, b) => a[1].localeCompare(b[1]))) {
  fs.copyFileSync(path.join(RAW, src), path.join(STATIC, dst));
  console.log(`    ${src} → ${dst}`);
}

console.log(`\n  Copied ${Object.keys(renameMap).length} HTML files\n`);

// 3. Copy the xlsx file if it exists
const xlsxName = 'MPP Dashboard and Agreement Modals and Voiceovers (1).xlsx';
const xlsxSrc = path.join(RAW, xlsxName);
if (fs.existsSync(xlsxSrc)) {
  fs.copyFileSync(xlsxSrc, path.join(ROOT, 'MPP-Dashboard-Voiceovers.xlsx'));
  console.log(`  Copied xlsx: ${xlsxName}`);
}

// Export the rename map for other scripts
const mapFile = path.join(ROOT, 'scripts', '_rename-map.json');
fs.writeFileSync(mapFile, JSON.stringify(renameMap, null, 2));
console.log(`\n  Wrote rename map to scripts/_rename-map.json`);

console.log('\n=== CONSOLIDATION COMPLETE ===');
