// RAG X-ray: replays one real question using the data /ask returned.
// Nothing here is made up: every bar, dot and ring comes from the backend.
const Xray = (function () {
  const STEP_PAUSE_MS = REDUCED_MOTION ? 0 : 1000;
  const RADAR_PAUSE_MS = REDUCED_MOTION ? 0 : 2400; // the radar needs longer to read

  const byId = (id) => document.getElementById(id);
  const panel = byId("xray");
  const rail = byId("xray-rail");
  const railStops = rail.querySelectorAll("li");
  const stagesBox = byId("xray-stages");
  const stages = stagesBox.querySelectorAll(".xray-stage");
  const replayButton = byId("xray-replay");
  let lastData = null;
  let runId = 0; // a new replay bumps this, which stops any older replay

  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Move the packet to a stage, light up the rail, and reveal that stage.
  function goTo(index) {
    rail.style.setProperty("--at", index);
    rail.classList.add("running");
    railStops.forEach((stop, position) => {
      stop.classList.toggle("done", position < index);
      stop.classList.toggle("active", position === index);
    });
    stages[index].hidden = false;
    // Keep the new stage in view inside the panel, without moving the page.
    if (panel.scrollHeight > panel.clientHeight) {
      panel.scrollTo({
        top: stages[index].offsetTop - rail.offsetHeight - 70,
        behavior: REDUCED_MOTION ? "auto" : "smooth",
      });
    }
  }

  async function typeQuestion(text, id) {
    const target = byId("xray-question");
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

  // Each bar is one real number. Up is positive and down is negative.
  function drawVector(xray) {
    const bars = byId("xray-vector");
    const biggest = Math.max(...xray.vector_preview.map(Math.abs));
    bars.replaceChildren(
      ...xray.vector_preview.map((value, index) => {
        const column = el("span", value < 0 ? "negative" : "");
        column.style.setProperty("--size", `${6 + (Math.abs(value) / biggest) * 94}%`);
        column.style.setProperty("--i", index);
        column.title = String(value);
        column.append(el("i"));
        return column;
      })
    );
    byId("xray-dimensions").textContent = xray.vector_dimensions;
    byId("xray-preview-size").textContent = xray.vector_preview.length;
    requestAnimationFrame(() => requestAnimationFrame(() => bars.classList.add("shown")));
  }

  function reset() {
    stages.forEach((stage) => (stage.hidden = true));
    railStops.forEach((stop) => stop.classList.remove("done", "active"));
    rail.style.setProperty("--at", 0);
    rail.classList.remove("finished");
    byId("xray-question").textContent = "";
    byId("xray-vector").className = "vector-bars";
    for (const id of ["xray-vector", "xray-radar", "xray-heat", "xray-top", "xray-answer-box"]) {
      byId(id).replaceChildren();
    }
  }

  async function play({ xray, answer, found }) {
    lastData = { xray, answer, found };
    const id = ++runId;
    byId("xray-empty").hidden = true;
    stagesBox.hidden = false;
    replayButton.hidden = false;
    reset();

    goTo(0);
    await typeQuestion(xray.question, id);

    // Each stage draws, then waits. A newer replay makes this one stop.
    const steps = [
      [STEP_PAUSE_MS, () => drawVector(xray)],
      [STEP_PAUSE_MS * 1.5, () => {
        drawRadar(byId("xray-radar"), xray);
        drawHeatMap(byId("xray-heat"), xray);
      }],
      [RADAR_PAUSE_MS, () => drawTopChunks(byId("xray-top"), xray.top_chunks)],
      [STEP_PAUSE_MS * 1.5, () => drawAnswer(byId("xray-answer-box"), answer, found, xray.top_chunks)],
    ];
    for (const [index, [wait, draw]] of steps.entries()) {
      await pause(wait);
      if (id !== runId) return;
      draw();
      goTo(index + 1);
    }
    railStops[railStops.length - 1].classList.add("done");
    rail.classList.add("finished");
  }

  replayButton.addEventListener("click", () => {
    if (lastData) play(lastData);
  });

  return { play };
})();
