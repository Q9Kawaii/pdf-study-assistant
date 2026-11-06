// The loading card: "Spinning up the RAG pipeline..." above a looping diagram of
// the pipeline. The loop only shows that work is happening. It isn't a progress
// bar, and the question in it is labelled as a sample because it isn't real data.
const Loader = (function () {
  const PIPELINES = {
    ask: [["ask", "Ask"], ["vector", "Vector"], ["compare", "Compare"], ["top", "Top 3"], ["answer", "Answer"]],
    upload: [["pdf", "Read"], ["chunk", "Chunk"], ["vector", "Embed"], ["ready", "Index"]],
  };

  const card = el("div", "loader");
  card.setAttribute("role", "status");

  const wake = el("p", "loader-wake");
  wake.append(icon("power"), "Waking the server, up to 1 minute");
  wake.hidden = true;

  const sample = el("p", "loader-sample");
  sample.append(icon("ask"), "What do mitochondria do?", el("span", "sample-tag", "SAMPLE"));

  const scan = el("div", "doc-scan");
  scan.setAttribute("aria-hidden", "true");
  scan.append(icon("pdf", "icon doc-scan-page"), el("span", "doc-scan-beam"));
  for (let index = 0; index < 8; index++) {
    const piece = el("span", "doc-scan-chunk");
    piece.style.setProperty("--i", index);
    scan.append(piece);
  }

  const pipe = el("div", "pipe");
  pipe.setAttribute("aria-hidden", "true");

  card.append(el("p", "loader-title", "Spinning up the RAG pipeline..."), wake, sample, scan, pipe);
  document.body.append(card);

  let activeJobs = 0; // several tasks can overlap, so we count them

  function drawPipeline(kind) {
    const stages = PIPELINES[kind];
    pipe.style.setProperty("--n", stages.length);
    const list = el("ol");
    stages.forEach(([name, label], index) => {
      const stage = el("li");
      stage.style.setProperty("--i", index);
      const node = el("span", "pipe-node");
      node.append(icon(name));
      stage.append(node, label);
      list.append(stage);
    });
    pipe.replaceChildren(list, el("span", "pipe-packet"));
    sample.hidden = kind !== "ask";
    scan.hidden = kind !== "upload";
  }

  function show({ kind } = {}) {
    activeJobs += 1;
    // A real task replaces the diagram, but waking alone keeps what's on screen.
    if (kind || !card.classList.contains("visible")) drawPipeline(kind || "ask");
    card.classList.add("visible");
  }

  function hide() {
    activeJobs = Math.max(0, activeJobs - 1);
    if (activeJobs > 0) return;
    card.classList.remove("visible");
  }

  // The waking note follows the server, not whatever other task is running.
  function setWaking(waking) {
    wake.hidden = !waking;
    if (waking) show();
    else hide();
  }

  return { show, hide, setWaking };
})();
