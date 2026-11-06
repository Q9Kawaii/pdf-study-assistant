// Talks to the backend. Shared by the main page and the quiz.
const REQUEST_TIMEOUT_MS = 90000;
const UPLOAD_TIMEOUT_MS = 240000; // a long PDF may wait for the AI's per-minute limit
const WAKE_TIMEOUT_MS = 90000; // Render's free server can take about a minute

async function apiRequest(path, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  let response;
  try {
    response = await fetch(API_BASE + path, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new Error("Couldn't reach the server. Please check your connection and try again.");
  }

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
    await apiRequest("/health", {}, timeoutMs);
    return true;
  } catch {
    return false;
  }
}

// Make sure the server is up. If it's asleep, show the loader while it wakes.
async function wakeBackend() {
  if (await isAwake(1500)) return true;
  Loader.show({ cold: true });
  const deadline = Date.now() + WAKE_TIMEOUT_MS;
  try {
    while (Date.now() < deadline) {
      if (await isAwake(15000)) return true;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return false;
  } finally {
    Loader.hide();
  }
}
