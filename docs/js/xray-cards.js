// The last two X-ray stages: the top 3 chunks, and the answer.
const RING_LENGTH = 2 * Math.PI * 15; // the circumference of the score ring

function scoreRing(score) {
  const ring = el("div", "ring");
  const svg = svgEl("svg", { viewBox: "0 0 36 36", "aria-hidden": "true" });
  const fill = svgEl("circle", { class: "ring-fill", cx: 18, cy: 18, r: 15 });
  fill.style.strokeDasharray = RING_LENGTH;
  fill.style.strokeDashoffset = RING_LENGTH;
  svg.append(svgEl("circle", { class: "ring-track", cx: 18, cy: 18, r: 15 }), fill);
  ring.append(svg, el("span", "", score.toFixed(2).replace(/^0/, "")));
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      fill.style.strokeDashoffset = RING_LENGTH * (1 - Math.max(0, score));
    })
  );
  return ring;
}

function pageChip(page) {
  const chip = el("span", "page-chip");
  chip.append(icon("pdf"), String(page));
  chip.setAttribute("aria-label", `Page ${page}`);
  return chip;
}

function drawTopChunks(target, chunks) {
  target.replaceChildren(
    ...chunks.map((chunk, index) => {
      const card = el("div", "top-chunk");
      card.style.setProperty("--i", index);
      const side = el("div", "top-side");
      side.append(el("span", "top-rank", String(index + 1)), scoreRing(chunk.score));
      const body = el("div", "top-body");
      body.append(pageChip(chunk.page), el("p", "top-text", chunk.text));
      card.append(side, body);
      return card;
    })
  );
}

function drawAnswer(target, answer, found, chunks) {
  const stamp = el("span", found ? "stamp" : "stamp missing");
  stamp.append(icon(found ? "answer" : "missing"));
  const text = el("p", "xray-answer", answer);
  const pages = el("div", "answer-pages");
  if (found) pages.append(...[...new Set(chunks.map((chunk) => chunk.page))].sort((a, b) => a - b).map(pageChip));
  const body = el("div");
  body.append(text, pages);
  target.replaceChildren(stamp, body);
}
