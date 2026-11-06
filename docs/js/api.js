// Talks to the backend. Shared by the main page and the quiz.
const REQUEST_TIMEOUT_MS = 90000;
const UPLOAD_TIMEOUT_MS = 180000; // a long PDF may wait for the AI's per-minute limit
const WAKE_TIMEOUT_MS = 90000; // Render's free server can take about a minute
const WAKE_POLL_MS = 5000;

// /health is kept for the uptime monitor. While Render starts, it answers 503,
// and a browser can then fail that URL by itself for a while, even once the
// server is fine. So the page checks a different address.
const WAKE_PATH = "/openapi.json";

let serverAnswered = false; // true after any real reply from the server

async function apiRequest(path, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  let response;
  try {
    response = await fetch(API_BASE + path, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (failure) {
    if (failure.name === "TimeoutError") {
      throw new Error("That took too long. Please try again.");
    }
    // No status means no reply at all, which is what a server that's starting looks like.
    const error = new Error("Couldn't reach the server. Please check your connection and try again.");
    error.unreachable = true;
    throw error;
  }

  serverAnswered = true;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // Our API sends a friendly message as "detail", so we show that as it is.
    const friendly = typeof body?.detail === "string";
    const error = new Error(friendly ? body.detail : "Something went wrong. Please try again.");
    error.status = response.status;
    throw error;
  }
  return body;
}

function postJson(path, data) {
  return apiRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

async function isAwake(timeoutMs) {
  try {
    await apiRequest(WAKE_PATH, {}, timeoutMs);
    return true;
  } catch {
    return false;
  }
}

async function checkAwake() {
  if (await isAwake(1500)) return true;
  Loader.setWaking(true);
  const deadline = Date.now() + WAKE_TIMEOUT_MS;
  try {
    // Any reply counts, so an upload that gets through ends this check too.
    while (!serverAnswered && Date.now() < deadline) {
      if (await isAwake(15000)) return true;
      await new Promise((resolve) => setTimeout(resolve, WAKE_POLL_MS));
    }
    return serverAnswered;
  } finally {
    Loader.setWaking(false);
  }
}

// Wake the server in the background and show that it's happening. This never
// holds up a request: Render keeps requests waiting while it starts by itself.
// Only one check runs at a time, and it always ends when the deadline passes.
let wakeCheck = null;
function wakeBackend() {
  wakeCheck ??= checkAwake().finally(() => (wakeCheck = null));
  return wakeCheck;
}
