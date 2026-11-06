// Two pictures of the real similarity scores.
// Radar: the question sits in the middle and every chunk is a dot. Closer means
// more similar. Page heat map: where in the document those matches are.
const RADAR_SIZE = 320;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_INNER = 38; // the best score lands here
const RADAR_OUTER = 142; // the worst score lands here
const GOLDEN_ANGLE = 2.39996; // spreads dots evenly without any randomness

// 0 means the best score in this search and 1 means the worst. Real scores bunch
// together (0.50 to 0.71 is typical), so we stretch them to show the differences.
function closeness(scores) {
  const values = scores.map((item) => item.score);
  const best = Math.max(...values);
  const span = best - Math.min(...values) || 1;
  return (score) => (best - score) / span;
}

function polar(radius, angle) {
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}

function drawRadar(target, xray) {
  const distance = closeness(xray.scores);
  const topRanks = new Map(xray.top_chunks.map((chunk, index) => [chunk.id, index + 1]));
  const best = xray.top_chunks[0];
  const svg = svgEl("svg", {
    class: "radar",
    viewBox: `0 0 ${RADAR_SIZE} ${RADAR_SIZE}`,
    role: "img",
    "aria-label": `${xray.scores.length} chunks plotted around your question. The closest is on page ${best.page}, with a score of ${best.score.toFixed(3)}.`,
  });

  for (const radius of [RADAR_INNER, 90, RADAR_OUTER]) {
    svg.append(svgEl("circle", { class: "radar-ring", cx: RADAR_CENTER, cy: RADAR_CENTER, r: radius }));
  }

  // A sweeping wedge, like a real radar scanning for matches.
  const edge = polar(RADAR_OUTER, -0.6);
  svg.append(
    svgEl("path", {
      class: "radar-sweep",
      d: `M${RADAR_CENTER} ${RADAR_CENTER}L${RADAR_CENTER + RADAR_OUTER} ${RADAR_CENTER}A${RADAR_OUTER} ${RADAR_OUTER} 0 0 0 ${RADAR_CENTER + edge.x} ${RADAR_CENTER + edge.y}Z`,
    })
  );

  const links = svgEl("g");
  const others = svgEl("g");
  const winners = svgEl("g");
  const moves = [];

  xray.scores.forEach((item, index) => {
    const angle = item.id * GOLDEN_ANGLE;
    const rank = topRanks.get(item.id);
    const end = polar(RADAR_INNER + distance(item.score) * (RADAR_OUTER - RADAR_INNER), angle);
    const start = polar(RADAR_OUTER + 12, angle);

    const dot = svgEl("circle", {
      class: rank ? "radar-dot top" : "radar-dot",
      cx: RADAR_CENTER,
      cy: RADAR_CENTER,
      r: rank ? 7 : 4,
    });
    const tip = svgEl("title");
    tip.textContent = `Chunk ${item.id}, page ${item.page}, score ${item.score.toFixed(3)}`;
    dot.append(tip);
    dot.style.transform = `translate(${start.x}px, ${start.y}px)`;
    dot.style.transitionDelay = `${Math.min(index * 12, 500)}ms`;
    moves.push([dot, end]);
    (rank ? winners : others).append(dot);

    if (rank) {
      links.append(
        svgEl("line", {
          class: "radar-link",
          x1: RADAR_CENTER,
          y1: RADAR_CENTER,
          x2: RADAR_CENTER + end.x,
          y2: RADAR_CENTER + end.y,
          pathLength: 1,
        })
      );
      const label = svgEl("text", {
        class: "radar-rank",
        x: RADAR_CENTER + end.x,
        y: RADAR_CENTER + end.y + 3.5,
        "text-anchor": "middle",
      });
      label.textContent = rank;
      winners.append(label);
    }
  });

  const core = svgEl("g", { class: "radar-core" });
  core.append(
    svgEl("circle", { cx: RADAR_CENTER, cy: RADAR_CENTER, r: 18 }),
    svgEl("use", { href: "#i-ask", x: RADAR_CENTER - 11, y: RADAR_CENTER - 11, width: 22, height: 22 })
  );

  svg.append(links, others, winners, core);
  target.replaceChildren(svg);

  // Two frames later, so the browser has drawn the start position to move from.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      for (const [dot, end] of moves) dot.style.transform = `translate(${end.x}px, ${end.y}px)`;
      svg.classList.add("settled");
    })
  );
}

function drawHeatMap(target, xray) {
  const distance = closeness(xray.scores);
  const topIds = new Set(xray.top_chunks.map((chunk) => chunk.id));
  const pages = new Map();
  for (const item of xray.scores) {
    if (!pages.has(item.page)) pages.set(item.page, []);
    pages.get(item.page).push(item);
  }

  let cellIndex = 0;
  target.replaceChildren(
    ...[...pages].map(([page, items]) => {
      const column = el("div", "heat-page");
      const cells = el("div", "heat-cells");
      for (const item of items) {
        const cell = el("span", topIds.has(item.id) ? "heat-cell top" : "heat-cell");
        cell.style.setProperty("--heat", (1 - distance(item.score)).toFixed(2));
        cell.style.setProperty("--i", Math.min(cellIndex++, 40));
        cell.title = `Chunk ${item.id}, page ${item.page}, score ${item.score.toFixed(3)}`;
        cells.append(cell);
      }
      column.append(cells, el("span", "heat-label", String(page)));
      return column;
    })
  );
}
