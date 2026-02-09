const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STATIC = path.join(ROOT, 'static');

console.log('=== ADD NAVIGATION ===\n');

// Ordered page list (this is the canonical order for prev/next)
const PAGE_ORDER = [
  'Mentor-Protege-Program.html',
  '01-Protege-Company-Info.html',
  '02-Company-Info-Wizard.html',
  '03-Company-info-Wizard.html',
  '04-Company-Info-Wizard.html',
  '05-Congratulations-Page.html',
  '06-Agreement.html',
  '07-Agreement-Team.html',
  '08-Agreement-Team.html',
  '09-Agreement-Team.html',
  '10-Agreement-Team.html',
  '11-Agreement-Team.html',
  '12-Sponsoring-Agency.html',
  '13-Agreement-Team.html',
  '14-Agreement-Team.html',
  '15-Mentor-Company-Info.html',
  '16-Mentor-Company-info.html',
  '17-Mentor-Company-Info.html',
  '18-Mentor-Company-Info.html',
  '19-Mentor-Company-Info.html',
  '20-Protege-Company-Info.html',
  '21-Protege-Company-Info.html',
  '22-Protege-Company-Info.html',
  '23-Protege-Company-Info.html',
  '24-Protege-Needs-Assessment.html',
  '25-Protege-Needs-Assessment.html',
  '26-Protege-Needs-Assessment.html',
  '27-Protege-Needs-Assessment.html',
  '28-Protege-Needs-Assessment.html',
  '29-Protege-Needs-Assessment.html',
  '30-Protege-Needs-Assessment.html',
  '31-Terms-of-Agreement.html',
  '32-Terms-of-Agreement.html',
  '33-Terms-of-Agreement.html',
  '34-Terms-of-Agreement.html',
  '35-DAP.html',
  '36-DAP.html',
  '37-DAP.html',
  '38-DAP.html',
  '39-DAP.html',
  '40-DAP.html',
  '41-DAP.html',
  '41-White-Paper-Wizard.html',
  '42-MPA-Proposal.html',
  '43-MPA-Proposal.html',
  '44-MPA-Proposal.html',
  '45-MPA-Proposal.html',
  '46-MPA-Proposal.html',
  '47-MPA-Proposal.html',
  '48-MPA-Proposal.html',
];

// Friendly display names
function displayName(file) {
  return file.replace('.html', '').replace(/-/g, ' ');
}

// Section groupings for the index page
const SECTIONS = [
  { title: 'Dashboard', pages: ['Mentor-Protege-Program.html'] },
  { title: 'Protege Company Info & Wizard', pages: PAGE_ORDER.slice(1, 6) },
  { title: 'Agreement Overview', pages: ['06-Agreement.html'] },
  { title: 'Agreement Team', pages: PAGE_ORDER.filter(p => {
    const num = parseInt(p);
    return (num >= 7 && num <= 14) || p === '12-Sponsoring-Agency.html';
  }) },
  { title: 'Mentor Company Info', pages: PAGE_ORDER.filter(p => { const n = parseInt(p); return n >= 15 && n <= 19; }) },
  { title: 'Protege Company Info', pages: PAGE_ORDER.filter(p => { const n = parseInt(p); return n >= 20 && n <= 23; }) },
  { title: 'Protege Needs Assessment', pages: PAGE_ORDER.filter(p => { const n = parseInt(p); return n >= 24 && n <= 30; }) },
  { title: 'Terms of Agreement', pages: PAGE_ORDER.filter(p => { const n = parseInt(p); return n >= 31 && n <= 34; }) },
  { title: 'Developmental Assistance Plan (DAP)', pages: PAGE_ORDER.filter(p => p.includes('DAP')) },
  { title: 'White Paper Wizard', pages: ['41-White-Paper-Wizard.html'] },
  { title: 'MPA Proposal', pages: PAGE_ORDER.filter(p => p.includes('MPA-Proposal')) },
];

// ============================================================
// STEP 1: Add prev/next navigation bar to each page
// ============================================================
console.log('1. Adding prev/next navigation bar...');

for (let i = 0; i < PAGE_ORDER.length; i++) {
  const file = PAGE_ORDER[i];
  const filePath = path.join(STATIC, file);
  if (!fs.existsSync(filePath)) {
    console.log(`    SKIP: ${file} not found`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Remove any existing nav bar (idempotent)
  content = content.replace(/<div id="mpp-nav-bar"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '');

  const prev = i > 0 ? PAGE_ORDER[i - 1] : null;
  const next = i < PAGE_ORDER.length - 1 ? PAGE_ORDER[i + 1] : null;
  const pageNum = i + 1;
  const totalPages = PAGE_ORDER.length;

  const prevLink = prev
    ? `<a href="./${prev}" style="color:#A4D0F9;text-decoration:none;font-size:13px;">&larr; ${displayName(prev)}</a>`
    : '<span></span>';
  const nextLink = next
    ? `<a href="./${next}" style="color:#A4D0F9;text-decoration:none;font-size:13px;">${displayName(next)} &rarr;</a>`
    : '<span></span>';

  const navBar = `
<div id="mpp-nav-bar" style="position:fixed;bottom:0;left:0;right:0;z-index:10000;background:#0C1F5B;border-top:2px solid #A4D0F9;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;font-family:Roboto,sans-serif;">
  <div style="flex:1;text-align:left;">${prevLink}</div>
  <div style="flex:1;text-align:center;color:white;font-size:12px;">
    <a href="./index.html" style="color:#A4D0F9;text-decoration:none;">Page ${pageNum} of ${totalPages}</a>: ${displayName(file)}
  </div>
  <div style="flex:1;text-align:right;">${nextLink}</div>
</div>`;

  // Add padding to body to prevent content from being hidden behind fixed bar
  if (!content.includes('padding-bottom: 50px')) {
    content = content.replace(/<body>/, '<body style="padding-bottom: 50px;">');
    // If body already has style, append to it
    content = content.replace(/<body\s+style="(?!padding-bottom)([^"]*)">/g, '<body style="$1; padding-bottom: 50px;">');
  }

  // Insert before </body>
  content = content.replace('</body>', `${navBar}\n</body>`);

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log(`    Added nav bar to ${PAGE_ORDER.length} pages\n`);

// ============================================================
// STEP 2: Fix sidebar navigation links
// ============================================================
console.log('2. Fixing sidebar navigation links...');

// Map sidebar link titles to local pages
const sidebarLinkMap = {
  'Dashboard': './Mentor-Protege-Program.html',
  'Applications': 'javascript:void(0)',
  'Agreements & Reports': './06-Agreement.html',
  'Agreements &amp; Reports': './06-Agreement.html',
  'Team Information': 'javascript:void(0)',
  'Resources': 'javascript:void(0)',
  'About MPP': 'javascript:void(0)',
  'Edit Company Profile': 'javascript:void(0)',
  'Feedback': 'javascript:void(0)',
  'Help & FAQs': 'javascript:void(0)',
  'Help &amp; FAQs': 'javascript:void(0)',
};

for (const file of PAGE_ORDER) {
  const filePath = path.join(STATIC, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix sidebar links that have title attributes matching our map
  for (const [title, href] of Object.entries(sidebarLinkMap)) {
    // Match <a ... title="Dashboard" ... > and update or add href
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(<a[^>]*?)\\s+title="${escapedTitle}"`, 'g');
    content = content.replace(regex, (match, prefix) => {
      if (prefix.includes('href="')) {
        // Replace existing href
        let updated = prefix.replace(/href="[^"]*"/, `href="${href}"`);
        return `${updated} title="${title}"`;
      } else {
        // Add href attribute
        return `${prefix} href="${href}" title="${title}"`;
      }
    });
  }

  // Also fix sidebar links by href value (Dashboard has empty title="" but href="./Agreements.html" etc.)
  const hrefMap = {
    './Dashboard.html': './Mentor-Protege-Program.html',
    './Applications.html': 'javascript:void(0)',
    './Agreements.html': './06-Agreement.html',
    './About MPP.html': 'javascript:void(0)',
    './Resources.html': 'javascript:void(0)',
    './Team Information.html': 'javascript:void(0)',
    './Edit Company Profile.html': 'javascript:void(0)',
    './Feedback.html': 'javascript:void(0)',
    './Help and Faqs.html': 'javascript:void(0)',
  };
  for (const [oldHref, newHref] of Object.entries(hrefMap)) {
    content = content.replace(
      new RegExp(`href="${oldHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
      `href="${newHref}"`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log(`    Fixed sidebar links on ${PAGE_ORDER.length} pages\n`);

// ============================================================
// STEP 3: Generate index.html (Table of Contents)
// ============================================================
console.log('3. Generating index.html (Table of Contents)...');

let tocHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="./assets/hero-logo.svg">
  <title>MPP Portal - Table of Contents</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Roboto', sans-serif;
      background: #0C1F5B;
      color: white;
      min-height: 100vh;
      padding: 40px 60px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 2px solid #2A3A6F;
    }
    .header img { width: 80px; height: 80px; }
    .header h1 { font-size: 28px; font-weight: 700; }
    .header p { color: #A4D0F9; font-size: 14px; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    .section h2 {
      font-size: 18px;
      font-weight: 600;
      color: #A4D0F9;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #2A3A6F;
    }
    .page-list { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; }
    .page-list li a {
      display: block;
      padding: 10px 16px;
      color: white;
      text-decoration: none;
      background: #162B6B;
      border-radius: 6px;
      font-size: 13px;
      transition: background 0.2s;
    }
    .page-list li a:hover { background: #243D80; }
    .page-list li a .num { color: #A4D0F9; font-weight: 500; margin-right: 8px; }
    .stats {
      display: flex;
      gap: 32px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .stat {
      background: #162B6B;
      border-radius: 8px;
      padding: 16px 24px;
      text-align: center;
    }
    .stat .value { font-size: 28px; font-weight: 700; color: #A4D0F9; }
    .stat .label { font-size: 12px; color: #8899BB; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <img src="./assets/hero-logo.svg" alt="MPP Logo">
    <div>
      <h1>MPP Portal — Page Index</h1>
      <p>Static snapshot of the Eccalon Mentor-Prot&eacute;g&eacute; Program portal</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="value">${PAGE_ORDER.length}</div><div class="label">Total Pages</div></div>
    <div class="stat"><div class="value">${SECTIONS.length}</div><div class="label">Sections</div></div>
    <div class="stat"><div class="value">0</div><div class="label">Script Tags</div></div>
  </div>
`;

for (const section of SECTIONS) {
  tocHtml += `  <div class="section">
    <h2>${section.title} (${section.pages.length} page${section.pages.length > 1 ? 's' : ''})</h2>
    <ul class="page-list">
`;
  for (const page of section.pages) {
    const name = displayName(page);
    const num = page.match(/^(\d+)/);
    const numLabel = num ? `<span class="num">${num[1]}.</span>` : '<span class="num">&bull;</span>';
    tocHtml += `      <li><a href="./${page}">${numLabel}${name}</a></li>\n`;
  }
  tocHtml += `    </ul>
  </div>
`;
}

tocHtml += `</body>
</html>`;

fs.writeFileSync(path.join(STATIC, 'index.html'), tocHtml, 'utf8');
console.log('    Generated index.html\n');

console.log('=== NAVIGATION COMPLETE ===');
