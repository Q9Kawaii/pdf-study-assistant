// One shared set of line icons, plus two tiny helpers for building the page.
const ICON_SHAPES = {
  ask: '<path d="M4 5h16v11H9l-5 4z"/><path d="M9 9h6M9 12h4"/>',
  vector: '<path d="M5 20v-6M10 20V6M15 20v-9M20 20V9"/>',
  compare: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6"/>',
  top: '<path d="M9 21v-9h6v9M3 21v-5h6M15 21v-7h6v7M2 21h20"/><path d="m12 3 1 2 2 .3-1.500 1.500.4 2.200-1.900-1-1.900 1 .4-2.200L9 5.300l2-.3z"/>',
  answer: '<circle cx="12" cy="12" r="9"/><path d="m8 12.500 3 3 5-6"/>',
  pdf: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  scan: '<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M3 12h18"/>',
  chunk: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  ready: '<path d="M4 7c0-2 16-2 16 0s-16 2-16 0zM4 7v10c0 2 16 2 16 0V7M4 12c0 2 16 2 16 0"/>',
  missing: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9.500 11.500l5 5M14.500 11.500l-5 5"/>',
  folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
  power: '<path d="M12 3v9M6.500 7a8 8 0 1 0 11 0"/>',
};

// Add every icon to the page once, so <use href="#i-name"> can draw it anywhere.
document.body.insertAdjacentHTML(
  "afterbegin",
  `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(ICON_SHAPES)
    .map(([name, shape]) => `<symbol id="i-${name}" viewBox="0 0 24 24">${shape}</symbol>`)
    .join("")}</svg>`
);

const SVG_NS = "http://www.w3.org/2000/svg";

// Build an SVG element and set its attributes.
function svgEl(tag, attributes = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

function icon(name, className = "icon") {
  const svg = svgEl("svg", { class: className, "aria-hidden": "true" });
  svg.append(svgEl("use", { href: `#i-${name}` }));
  return svg;
}

// Build an HTML element. textContent keeps PDF text as plain text, never code.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
