// After an upload, draw what the server really built: a thumbnail for each page,
// with one line per chunk, and a badge on pages that were read with OCR.
const MAX_THUMB_LINES = 6;

function statTile(name, value, label) {
  const tile = el("div", "stat");
  tile.append(icon(name), el("strong", "", String(value)), el("span", "", label));
  return tile;
}

function pageThumb(page, index) {
  const unread = page.chunks === undefined;
  const thumb = el("div", unread ? "thumb unread" : "thumb");
  thumb.style.setProperty("--i", index);
  thumb.title = unread
    ? `Page ${page.page}: couldn't be read`
    : `Page ${page.page}: ${page.chunks} chunk${page.chunks === 1 ? "" : "s"}${page.ocr ? ", read with OCR" : ""}`;

  const sheet = el("div", "thumb-sheet");
  if (unread) sheet.append(icon("missing"));
  for (let line = 0; line < Math.min(page.chunks || 0, MAX_THUMB_LINES); line++) {
    sheet.append(el("span", "thumb-line"));
  }
  if (page.ocr) {
    const badge = el("span", "thumb-badge");
    badge.append(icon("scan"));
    sheet.append(badge);
  }
  thumb.append(sheet, el("span", "thumb-number", String(page.page)));
  return thumb;
}

function drawPageMap(target, result) {
  const stats = el("div", "stats");
  stats.append(statTile("pdf", result.pages, "pages"), statTile("chunk", result.chunks, "chunks"));
  if (result.ocr_pages) stats.append(statTile("scan", result.ocr_pages, "OCR"));

  // page_map can be missing for a moment while a new backend version deploys.
  const pages = [...(result.page_map || []), ...result.unread_pages.map((page) => ({ page }))];
  pages.sort((a, b) => a.page - b.page);
  const thumbs = el("div", "thumbs");
  thumbs.append(...pages.map(pageThumb));

  target.replaceChildren(stats, thumbs);
}
