// RAG X-ray: replays one real question using the data /ask returned.
// Nothing here is made up: every bar and score comes from the backend.
const Xray = (function () {
  const MAX_SCORE_ROWS = 10;
  const STEP_PAUSE_MS = REDUCED_MOTION ? 0 : 1100;

  const element = (id) => document.getElementById(id);
  const steps = element("xray-steps");
  const replayButton = element("xray-replay");
  let lastData = null;
  let runId = 0; // a new replay bumps this, which stops any older replay

  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    // textContent keeps PDF text as plain text, so it can never run as code.
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function activate(name) {
    const step = steps.querySelector(`[data-step="${name}"]`);
    step.classList.add("active");
    // Keep the current step visible inside the panel, but don't move the page.
    const panel = element("xray");
    if (panel.scrollHeight > panel.clientHeight) {
      panel.scrollTo({ top: step.offsetTop - 60, behavior: REDUCED_MOTION ? "auto" : "smooth" });
    }
  }

  async function typeQuestion(text, id) {
    const target = element("xray-question");
    if (REDUCED_MOTION) {
      target.textContent = text;
      return;
    }
    const delay = Math.max(6, Math.min(28, 700 / text.length));
    for (let length = 1; length <= text.length; length++) {
      if (id !== runId) return;
      target.textContent = text.slice(0, length);
      await pause(delay);
    }
  }

  function drawVector(data) {
    const bars = element("xray-vector");
    const biggest = Math.max(...data.vector_preview.map(Math.abs));
    bars.replaceChildren(
      ...data.vector_preview.map((value, index) => {
        const bar = make("span", value < 0 ? "negative" : "");
        bar.style.setProperty("--size", `${10 + (Math.abs(value) / biggest) * 90}%`);
        bar.style.setProperty("--index", index);
        bar.title = String(value);
        return bar;
      })
    );
    element("xray-vector-note").textContent =
      `Your question is now ${data.vector_dimensions} numbers. ` +
      `These are the first ${data.vector_preview.length}, scaled to fit. Purple bars are negative.`;
    requestAnimationFrame(() => requestAnimationFrame(() => bars.classList.add("shown")));
  }

  function drawScores(data) {
    const topIds = new Set(data.top_chunks.map((chunk) => chunk.id));
    const best = [...data.scores].sort((a, b) => b.score - a.score).slice(0, MAX_SCORE_ROWS);
    const fills = [];
    element("xray-scores").replaceChildren(
      ...best.map((item, index) => {
        const row = make("div", topIds.has(item.id) ? "score-row top" : "score-row");
        const track = make("span", "score-track");
        const fill = make("span", "score-fill");
        fill.style.setProperty("--index", index);
        fills.push([fill, item.score]);
        track.append(fill);
        row.append(
          make("span", "", `#${item.id} page ${item.page}`),
          track,
          make("span", "", item.score.toFixed(3))
        );
        return row;
      })
    );
    const total = data.scores.length;
    element("xray-scores-note").textContent =
      `All ${total} chunk${total === 1 ? "" : "s"} scored against your question. ` +
      `A score of 1.000 would mean the same direction. ` +
      (total > MAX_SCORE_ROWS ? `Showing the best ${MAX_SCORE_ROWS}.` : "");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        for (const [fill, score] of fills) fill.style.width = `${Math.max(0, score) * 100}%`;
      })
    );
  }

  function drawTopChunks(data) {
    element("xray-top").replaceChildren(
      ...data.top_chunks.map((chunk, index) => {
        const card = make("div", "top-chunk");
        card.style.setProperty("--index", index);
        card.append(
          make("span", "source-meta", `#${chunk.id} / page ${chunk.page} / score ${chunk.score.toFixed(3)}`),
          make("span", "", chunk.text.length > 180 ? `${chunk.text.slice(0, 180)}...` : chunk.text)
        );
        return card;
      })
    );
  }

  function reset() {
    steps.querySelectorAll(".xray-step").forEach((step) => step.classList.remove("active"));
    element("xray-question").textContent = "";
    element("xray-vector").className = "vector-bars";
    element("xray-vector").replaceChildren();
    element("xray-vector-note").textContent = "";
    element("xray-scores").replaceChildren();
    element("xray-scores-note").textContent = "";
    element("xray-top").replaceChildren();
    element("xray-answer").textContent = "";
    element("xray-answer").className = "xray-answer";
  }

  async function play({ xray, answer, found }) {
    lastData = { xray, answer, found };
    const id = ++runId;
    element("xray-empty").hidden = true;
    steps.hidden = false;
    replayButton.hidden = false;
    reset();

    activate("question");
    await typeQuestion(xray.question, id);

    // Each stage draws, then waits. A newer replay makes this one stop.
    const stages = [
      ["vector", () => drawVector(xray)],
      ["scores", () => drawScores(xray)],
      ["top", () => drawTopChunks(xray)],
      ["answer", () => {
        element("xray-answer").textContent = answer;
        element("xray-answer").classList.toggle("not-found", !found);
      }],
    ];
    for (const [name, draw] of stages) {
      await pause(STEP_PAUSE_MS);
      if (id !== runId) return;
      draw();
      activate(name);
    }
  }

  replayButton.addEventListener("click", () => {
    if (lastData) play(lastData);
  });

  return { play };
})();
