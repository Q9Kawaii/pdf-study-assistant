// The loading card: "Spinning up the RAG pipeline..." with a sample question
// flowing through each stage. It's labelled as a sample because it isn't real
// data. The real data appears in the X-ray panel once the answer arrives.
const Loader = (function () {
  const SAMPLE_STAGES = [
    "What do mitochondria do?",
    "[0.021, -0.113, 0.067, 0.094, ...]",
    "chunk 4: 0.82   chunk 9: 0.71   chunk 2: 0.33",
    "chunk 4 (page 2), chunk 9 (page 5), chunk 1 (page 1)",
    "They make most of the cell's energy.",
  ];
  const STAGE_MS = 1100;

  const card = document.createElement("div");
  card.className = "loader";
  card.setAttribute("role", "status");
  card.innerHTML = `
    <p class="loader-title">Spinning up the RAG pipeline...</p>
    <p class="loader-note" hidden>The free server sleeps when nobody is using it. Waking up can take up to a minute.</p>
    <div class="loader-sample">
      Sample question
      <span class="loader-stage"></span>
      <ol class="flow" aria-hidden="true">
        <li>Question</li><li>Vector</li><li>Scores</li><li>Top 3</li><li>Answer</li>
      </ol>
    </div>`;
  document.body.append(card);

  const note = card.querySelector(".loader-note");
  const stageText = card.querySelector(".loader-stage");
  const stageLabels = card.querySelectorAll(".flow li");
  let activeJobs = 0; // several tasks can overlap, so we count them
  let timer = null;

  function showStage(index) {
    stageText.textContent = SAMPLE_STAGES[index];
    stageLabels.forEach((label, position) => {
      label.classList.toggle("active", position === index);
    });
  }

  function show({ cold = false } = {}) {
    activeJobs += 1;
    if (cold) note.hidden = false;
    if (timer !== null) return;
    card.classList.add("visible");
    let stage = 0;
    showStage(stage);
    timer = setInterval(() => {
      stage = (stage + 1) % SAMPLE_STAGES.length;
      showStage(stage);
    }, STAGE_MS);
  }

  function hide() {
    activeJobs = Math.max(0, activeJobs - 1);
    if (activeJobs > 0) return;
    card.classList.remove("visible");
    clearInterval(timer);
    timer = null;
    note.hidden = true;
  }

  return { show, hide };
})();
