// Where the backend lives. Change RENDER_URL if your Render service URL differs.
const RENDER_URL = "https://pdf-study-assistant-ngor.onrender.com";

// Opened on your laptop, the page talks to your local server instead.
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const API_BASE = isLocal ? "http://127.0.0.1:8000" : RENDER_URL;

// True if the person asked their device for less motion.
const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;
