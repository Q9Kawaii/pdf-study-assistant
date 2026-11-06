// The main page: upload a PDF, ask questions, show answers and sources.
(function () {
  const MAX_PDF_BYTES = 2 * 1024 * 1024; // same limit as the backend

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const dropzoneTitle = document.getElementById("dropzone-title");
  const dropzoneHint = document.getElementById("dropzone-hint");
  const uploadStatus = document.getElementById("upload-status");
  const pageMap = document.getElementById("page-map");
  const chat = document.getElementById("chat");
  const chatEmpty = document.getElementById("chat-empty");
  const form = document.getElementById("ask-form");
  const question = document.getElementById("question");
  const askButton = document.getElementById("ask-button");
  const counter = document.getElementById("counter");

  const SLOW_UPLOAD_SECONDS = 15;
  const RETRY_WAITS_MS = [3000, 8000, 15000];

  let sessionId = null;
  let busy = false;
  let uploadTimer = null; // set while an upload is running
  let uploadNotice = "";

  function setStatus(message, isError = false) {
    uploadStatus.textContent = message;
    uploadStatus.classList.toggle("error", isError);
    uploadStatus.classList.remove("working");
  }

  // Show right away that a file arrived, with a real count of the seconds.
  function startUploadStatus(fileName) {
    const started = Date.now();
    uploadNotice = "";
    const draw = () => {
      const seconds = Math.round((Date.now() - started) / 1000);
      const hint = seconds >= SLOW_UPLOAD_SECONDS ? " Scans and long PDFs can take a minute." : "";
      setStatus(`Reading ${fileName}... ${seconds}s.${hint}${uploadNotice}`);
      uploadStatus.classList.add("working");
    };
    draw();
    uploadTimer = setInterval(draw, 1000);
  }

  function stopUploadStatus() {
    clearInterval(uploadTimer);
    uploadTimer = null;
    setStatus("");
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
    const summary = document.createElement("summary");
    summary.setAttribute("aria-label", "Show the source passages");
    const chips = el("span", "source-chips");
    for (const source of sources) {
      const chip = el("span", "source-chip");
      const meter = el("span", "meter");
      const fill = el("i");
      fill.style.width = `${Math.max(0, source.score) * 100}%`; // real score, 0 to 1
      meter.append(fill);
      chip.append(pageChip(source.page), meter);
      chips.append(chip);
    }
    summary.append(chips);
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

  async function sendPdf(file) {
    const send = () => {
      const data = new FormData();
      data.append("file", file);
      return apiRequest("/upload", { method: "POST", body: data }, UPLOAD_TIMEOUT_MS);
    };
    // A server that's still starting can drop a request, so we try a few more
    // times. These waits are fixed, so nothing here depends on the wake check.
    for (const wait of RETRY_WAITS_MS) {
      try {
        return await send();
      } catch (error) {
        if (!error.unreachable) throw error;
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
    return send();
  }

  async function uploadPdf(file) {
    if (!file) {
      setStatus("Couldn't read that file. Try tapping the box to choose it instead.", true);
      return;
    }
    if (busy) {
      // Never ignore a file silently, or it looks like nothing happened.
      const notice = "Please wait for the current task to finish, then try again.";
      if (uploadTimer) uploadNotice = ` ${notice}`;
      else setStatus(notice, true);
      return;
    }
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
    startUploadStatus(file.name);
    Loader.show({ kind: "upload" });
    wakeBackend(); // runs in the background and never holds up the upload
    try {
      const result = await sendPdf(file);
      stopUploadStatus();
      sessionId = result.session_id;
      dropzone.classList.add("ready");
      dropzoneTitle.textContent = file.name;
      dropzoneHint.textContent = "Tap to replace";
      drawPageMap(pageMap, result);
      // Some pages failed, but the rest are usable, so we warn and carry on.
      if (result.unread_pages.length) {
        setStatus(`Couldn't read page ${result.unread_pages.join(", ")}. Answers won't include it.`, true);
      }
      question.focus();
    } catch (error) {
      stopUploadStatus();
      // Naming the file makes it clear the upload happened but was refused.
      setStatus(`${file.name}: ${error.message}`, true);
    } finally {
      busy = false;
      Loader.hide();
      fileInput.value = ""; // lets you pick the same file again
      refreshControls();
    }
  }

  function forgetUpload() {
    sessionId = null;
    pageMap.replaceChildren();
    dropzone.classList.remove("ready");
    dropzoneTitle.textContent = "Drop a PDF here, or tap to choose";
    dropzoneHint.textContent = "Up to 2 MB and 20 pages. Scanned PDFs work too.";
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

  // Accept a file dropped anywhere on the page. Otherwise, missing the box makes
  // the browser leave this page to open the PDF. preventDefault stops that.
  const hasFile = (event) => event.dataTransfer.types.includes("Files");

  for (const name of ["dragenter", "dragover"]) {
    window.addEventListener(name, (event) => {
      if (!hasFile(event)) return; // leave dragged text alone
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      dropzone.classList.add("dragging");
    });
  }
  window.addEventListener("dragleave", (event) => {
    // relatedTarget is empty only when the drag leaves the window itself.
    if (!event.relatedTarget) dropzone.classList.remove("dragging");
  });
  window.addEventListener("drop", (event) => {
    if (!hasFile(event)) return;
    event.preventDefault();
    dropzone.classList.remove("dragging");
    // A file can land anywhere, so bring its status into view.
    dropzone.scrollIntoView({ block: "center", behavior: REDUCED_MOTION ? "auto" : "smooth" });
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
