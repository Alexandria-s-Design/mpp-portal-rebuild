const fs = require('fs');
const path = require('path');

const STATIC = path.resolve(__dirname, '..', 'static');

// CSS for sidebar expanded state
const SIDEBAR_CSS = `
<style id="sidebar-toggle-css">
  .sidebar-expanded { width: 260px !important; }
  .sidebar-expanded .sidebarNav a,
  .sidebar-expanded .account-section a,
  .sidebar-expanded .account-section div[title],
  .sidebar-expanded .account-section button {
    justify-content: flex-start !important;
    padding-left: 20px !important;
    gap: 12px;
  }
  .sidebar-label {
    display: none;
    color: white;
    font-family: Inter, Roboto, sans-serif;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0.85;
  }
  .sidebar-expanded .sidebar-label { display: inline; }
  .sidebar-expanded .expand-chevron { transform: rotate(180deg); }
  .expand-chevron { transition: transform 0.3s ease; }
  .sidebar-expanded img[alt="MPP Logo"] {
    width: 100px !important;
    height: auto !important;
    margin-bottom: 20px !important;
  }
</style>`;

// JS for sidebar toggle
const SIDEBAR_JS = `
<script id="sidebar-toggle-js">
(function() {
  var btn = document.querySelector('[aria-label="Expand sidebar"]');
  if (!btn) return;

  // Mark the chevron SVG for rotation
  btn.querySelector('svg').classList.add('expand-chevron');

  // Find the sidebar container (parent chain up to the w-[72px] div)
  var sidebar = btn.closest('.h-full.flex.flex-col.relative');
  if (!sidebar) {
    // fallback: walk up from button
    var el = btn.parentElement;
    while (el && !el.className.includes('w-[72px]')) el = el.parentElement;
    sidebar = el;
  }
  if (!sidebar) return;

  // Inject text labels into nav links
  var navLinks = sidebar.querySelectorAll('.sidebarNav a[title], .account-section a[title], .account-section div[title], .account-section button[title]');
  navLinks.forEach(function(link) {
    var title = link.getAttribute('title');
    if (!title) return;
    // Find the icon container (the flex div with the svg)
    var iconDiv = link.querySelector('.flex.items-center.relative') || link.querySelector('svg');
    if (!iconDiv) return;
    var span = document.createElement('span');
    span.className = 'sidebar-label';
    span.textContent = title;
    if (iconDiv.parentElement === link || iconDiv.closest('[class*="flex"]') === link) {
      link.appendChild(span);
    } else {
      iconDiv.parentElement.appendChild(span);
    }
  });

  btn.addEventListener('click', function() {
    sidebar.classList.toggle('sidebar-expanded');
    var expanded = sidebar.classList.contains('sidebar-expanded');
    btn.setAttribute('aria-label', expanded ? 'Collapse sidebar' : 'Expand sidebar');
  });
})();
<\/script>`;

const files = fs.readdirSync(STATIC).filter(f => f.endsWith('.html') && f !== 'index.html');

let count = 0;
files.forEach(f => {
  const fp = path.join(STATIC, f);
  let html = fs.readFileSync(fp, 'utf8');

  // Skip if already injected
  if (html.includes('sidebar-toggle-css')) return;

  // Inject CSS before </head>
  html = html.replace('</head>', SIDEBAR_CSS + '\n</head>');

  // Inject JS before </body>
  html = html.replace('</body>', SIDEBAR_JS + '\n</body>');

  fs.writeFileSync(fp, html, 'utf8');
  count++;
});

console.log(`Added sidebar toggle to ${count} pages`);
