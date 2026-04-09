// API Configuration (Production Safe)

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://medilink-back-repo-1.onrender.com";

// ========================
// Helper function
// ========================
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
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

// 📥 GET EVENTS
export const getEvents = async () => {
  return apiCall("/events");
};

// ➕ ADD EVENT
export const addEvent = async (data) => {
  return apiCall("/events/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// ⭐ MARK INTERESTED
export const markInterested = async (id) => {
  return apiCall(`/events/${id}/interested`, {
    method: "POST",
  });
};

// ✅ MARK ATTENDING
export const markAttending = async (id) => {
  return apiCall(`/events/${id}/attend`, {
    method: "POST",
  });
};