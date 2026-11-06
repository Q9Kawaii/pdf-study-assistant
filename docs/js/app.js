// The main page: upload a PDF, ask questions, show answers and sources.
(function () {
  const MAX_PDF_BYTES = 2 * 1024 * 1024; // same limit as the backend

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const dropzoneTitle = document.getElementById("dropzone-title");
  const dropzoneHint = document.getElementById("dropzone-hint");
  const uploadStatus = document.getElementById("upload-status");
  const chat = document.getElementById("chat");
  const chatEmpty = document.getElementById("chat-empty");
  const form = document.getElementById("ask-form");
  const question = document.getElementById("question");
  const askButton = document.getElementById("ask-button");
  const counter = document.getElementById("counter");

  let sessionId = null;
  let busy = false;

  function setStatus(message, isError = false) {
    uploadStatus.textContent = message;
    uploadStatus.classList.toggle("error", isError);
  }

  function refreshControls() {
    const ready = sessionId !== null;
    question.disabled = !ready;
    question.placeholder = ready ? "Ask something about your PDF" : "Upload a PDF first";
    askButton.disabled = !ready || busy || !question.value.trim();
    fileInput.disabled = busy;
  }

  function addMessage(className, text) {
    chatEmpty.hidden = true;
    const message = document.createElement("div");
    message.className = `message ${className}`;
    const paragraph = document.createElement("p");
    paragraph.textContent = text; // plain text only, never HTML
    message.append(paragraph);
    chat.append(message);
    chat.scrollTop = chat.scrollHeight;
    return message;
  }

  function addSources(message, sources) {
    const details = document.createElement("details");
    details.className = "sources";
    details.open = true;
    const pages = [...new Set(sources.map((source) => source.page))].sort((a, b) => a - b);
    const summary = document.createElement("summary");
    summary.textContent = `Sources: page${pages.length > 1 ? "s" : ""} ${pages.join(", ")}`;
    details.append(summary);

    for (const source of sources) {
      const item = document.createElement("div");
      item.className = "source";
      const meta = document.createElement("span");
      meta.className = "source-meta";
      meta.textContent = `Page ${source.page} / score ${source.score.toFixed(3)}`;
      item.append(meta, source.text);
      details.append(item);
    }
    message.append(details);
    // Sources can be long, so scroll to where the answer starts, not the end.
    chat.scrollTop = message.offsetTop;
  }

  async function uploadPdf(file) {
    if (busy || !file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("That file isn't a PDF. Please upload a .pdf file.", true);
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setStatus("That PDF is too big. The limit is 2 MB.", true);
      return;
    }

    busy = true;
    refreshControls();
    setStatus("");
    Loader.show();
    try {
      if (!(await wakeBackend())) {
        throw new Error("The server didn't wake up. Please try again in a minute.");
      }
      const data = new FormData();
      data.append("file", file);
      const result = await apiRequest("/upload", { method: "POST", body: data }, UPLOAD_TIMEOUT_MS);
      sessionId = result.session_id;
      dropzone.classList.add("ready");
      dropzoneTitle.textContent = file.name;
      dropzoneHint.textContent =
        `${result.pages} page${result.pages === 1 ? "" : "s"}, ` +
        `${result.chunks} chunk${result.chunks === 1 ? "" : "s"} indexed. Tap to replace.`;
      question.focus();
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      busy = false;
      Loader.hide();
      fileInput.value = ""; // lets you pick the same file again
      refreshControls();
    }
  }

  function forgetUpload() {
    sessionId = null;
    dropzone.classList.remove("ready");
    dropzoneTitle.textContent = "Drop a PDF here, or tap to choose";
    dropzoneHint.textContent = "Up to 2 MB and 20 pages. It must have real text, not scanned images.";
  }

  async function askQuestion(text) {
    busy = true;
    refreshControls();
    addMessage("user", text);
    Loader.show();
    try {
      const result = await postJson("/ask", { session_id: sessionId, question: text });
      const message = addMessage(result.found ? "bot" : "bot not-found", result.answer);
      if (result.sources.length) addSources(message, result.sources);
      Xray.play(result);
    } catch (error) {
      addMessage("bot error", error.message);
      // A 404 means the server restarted, so this upload no longer exists.
      if (error.status === 404) forgetUpload();
    } finally {
      busy = false;
      Loader.hide();
      refreshControls();
    }
  }

  fileInput.addEventListener("change", () => uploadPdf(fileInput.files[0]));

  // preventDefault stops the browser from opening the dropped file.
  for (const name of ["dragenter", "dragover"]) {
    dropzone.addEventListener(name, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragging");
    });
  }
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragging"));
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragging");
    uploadPdf(event.dataTransfer.files[0]);
  });

  question.addEventListener("input", () => {
    counter.textContent = `${question.value.length} / 500`;
    refreshControls();
  });

  // Enter sends. Shift+Enter makes a new line.
  question.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = question.value.trim();
    if (!text || busy || !sessionId) return;
    question.value = "";
    counter.textContent = "0 / 500";
    askQuestion(text);
  });

  // Start waking the free server as soon as someone opens the page.
  wakeBackend();
})();
