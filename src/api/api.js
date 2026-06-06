// API Configuration (Production Safe)

const PRIMARY_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://medilink-back-repo-1.onrender.com";

const FALLBACK_URL = "https://tiny-colts-feel.loca.lt";

// Check which URL is alive and cache it
let resolvedBaseURL = null;

async function getBaseURL() {
  if (resolvedBaseURL) return resolvedBaseURL; // use cached result

  try {
    const response = await fetch(`${PRIMARY_URL}/health`, {
      signal: AbortSignal.timeout(5000), // wait max 5 seconds
    });
    if (response.ok) {
      resolvedBaseURL = PRIMARY_URL;
      console.log("✅ Using primary server:", PRIMARY_URL);
      return resolvedBaseURL;
    }
  } catch {
    console.warn("⚠️ Primary server unreachable, switching to fallback...");
  }

  resolvedBaseURL = FALLBACK_URL;
  console.log("🔄 Using fallback server:", FALLBACK_URL);
  return resolvedBaseURL;
}

// ========================
// Helper function
// ========================
async function apiCall(endpoint, options = {}) {
  const baseURL = await getBaseURL(); // auto picks working URL
  const url = `${baseURL}${endpoint}`;

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true", // needed for localtunnel/ngrok
      ...options.headers,
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    let errorMessage = "API Error";
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch (e) {}

    throw new Error(errorMessage);
  }

  return response.json();
}

// ========================
// EVENTS API
// ========================

export const getEvents = async () => {
  return apiCall("/events");
};

export const addEvent = async (data) => {
  return apiCall("/events/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const markInterested = async (id) => {
  return apiCall(`/events/${id}/interested`, {
    method: "POST",
  });
};

export const markAttending = async (id) => {
  return apiCall(`/events/${id}/attend`, {
    method: "POST",
  });
};