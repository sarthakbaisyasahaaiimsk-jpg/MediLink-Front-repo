// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

// Helper function for API requests
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

// ===== EVENTS =====

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

// ⭐ INTERESTED
export const markInterested = async (id) => {
  return apiCall(`/events/${id}/interested`, {
    method: "POST",
  });
};

// ✅ ATTEND
export const markAttending = async (id) => {
  return apiCall(`/events/${id}/attend`, {
    method: "POST",
  });
};