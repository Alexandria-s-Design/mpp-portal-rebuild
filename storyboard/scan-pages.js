const fs = require('fs');
const path = require('path');
const staticDir = path.join(__dirname, '..', 'static');
const pages = fs.readdirSync(staticDir).filter(f => f.endsWith('.html') && f !== 'index.html');

console.log('=== PROGRESS SIDEBAR & CONTENT ===');
for (const p of pages) {
  const html = fs.readFileSync(path.join(staticDir, p), 'utf8');
  const hasW286 = html.includes('w-[286px]');
  const hasComment = html.includes('Add a comment');
  const hasProgressCircle = html.includes('circle') && html.includes('stroke-dasharray');
  const pageTitle = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
  // Check for section sub-items in the aside/sidebar
  const sectionLabels = html.match(/(?:Mentor Team|Protégé Team|Company Info|Review|Sponsoring Agency|Authorized Sub|Needs Assessment|Terms|White Paper|Agreement Team|DAP|Proposal)/g) || [];
  console.log(`${p}: w286=${hasW286} comments=${hasComment} circle=${hasProgressCircle} title="${pageTitle}" labels=${sectionLabels.length}`);
}
