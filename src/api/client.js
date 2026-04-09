// API Configuration for Flask Backend

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://medilink-back-repo-1.onrender.com"; // <-- replace if needed

// Helper function for API requests with error handling
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}/api${endpoint}`;

  const token = localStorage.getItem("authToken");

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error || error.message || `API Error: ${response.status}`
    );
  }

  return response.json();
}

// ========================
// FILE UPLOAD
// ========================
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("authToken");

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

// ========================
// AUTH
// ========================
export const auth = {
  me: async () => apiCall("/auth/me"),

  login: async (email, password) => {
    const data = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.token) localStorage.setItem("authToken", data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  },

  register: async (userData) =>
    apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  sendOtp: async ({ email, phone }) =>
    apiCall("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email, phone }),
    }),

  verifyOtp: async ({ email, phone, otp }) =>
    apiCall("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, phone, otp }),
    }),

  verifyDoctor: async (doctorData) =>
    apiCall("/auth/verify-doctor", {
      method: "POST",
      body: JSON.stringify(doctorData),
    }),

  getAdminUsers: async () => apiCall("/auth/admin/users"),

  adminVerifyUser: async (userId) =>
    apiCall("/auth/admin/verify-user", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        verification_state: "verified",
      }),
    }),
};

// ========================
// DOCTOR PROFILE
// ========================
export const doctorProfile = {
  filter: async (filters = {}, sortBy = "") => {
    const queryParams = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) =>
      queryParams.append(k, v)
    );
    if (sortBy) queryParams.append("sort", sortBy);

    return apiCall(`/doctor-profiles?${queryParams.toString()}`);
  },

  get: async (id) => apiCall(`/doctor-profiles/${id}`),

  create: async (data) =>
    apiCall("/doctor-profiles", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: async (id, data) =>
    apiCall(`/doctor-profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: async (id) =>
    apiCall(`/doctor-profiles/${id}`, { method: "DELETE" }),
};

// ========================
// PATIENT CASE
// ========================
export const patientCase = {
  filter: async (filters = {}, sortBy = "") => {
    const queryParams = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) =>
      queryParams.append(k, v)
    );
    if (sortBy) queryParams.append("sort", sortBy);

    return apiCall(`/patient-cases?${queryParams.toString()}`);
  },

  get: async (id) => apiCall(`/patient-cases/${id}`),

  create: async (data) =>
    apiCall("/patient-cases", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: async (id, data) =>
    apiCall(`/patient-cases/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: async (id) =>
    apiCall(`/patient-cases/${id}`, { method: "DELETE" }),
};

// ========================
// CASE COMMENTS
// ========================
export const caseComment = {
  filter: async (filters = {}, sortBy = "") => {
    const queryParams = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) =>
      queryParams.append(k, v)
    );
    if (sortBy) queryParams.append("sort", sortBy);

    return apiCall(`/case-comments?${queryParams.toString()}`);
  },

  get: async (id) => apiCall(`/case-comments/${id}`),

  create: async (data) =>
    apiCall("/case-comments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: async (id, data) =>
    apiCall(`/case-comments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: async (id) =>
    apiCall(`/case-comments/${id}`, { method: "DELETE" }),

  addReply: async (commentId, replyData) =>
    apiCall(`/case-comments/${commentId}/reply`, {
      method: "POST",
      body: JSON.stringify(replyData),
    }),
};

// ========================
// CONVERSATION
// ========================
export const conversation = {
  filter: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) =>
      queryParams.append(k, v)
    );

    return apiCall(`/conversations?${queryParams.toString()}`);
  },

  get: async (id) => apiCall(`/conversations/${id}`),

  create: async (data) =>
    apiCall("/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: async (id, data) =>
    apiCall(`/conversations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: async (id) =>
    apiCall(`/conversations/${id}`, { method: "DELETE" }),
};

// ========================
// MESSAGES
// ========================
export const message = {
  filter: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) =>
      queryParams.append(k, v)
    );

    return apiCall(`/messages?${queryParams.toString()}`);
  },

  get: async (id) => apiCall(`/messages/${id}`),

  create: async (data) =>
    apiCall("/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: async (id, data) =>
    apiCall(`/messages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: async (id) =>
    apiCall(`/messages/${id}`, { method: "DELETE" }),
};

// ========================
// MEDICAL EVENTS
// ========================
export const medicalEvent = {
  filter: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) =>
      queryParams.append(k, v)
    );

    return apiCall(`/medical-events?${queryParams.toString()}`);
  },

  get: async (id) => apiCall(`/medical-events/${id}`),

  create: async (data) =>
    apiCall("/medical-events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: async (id, data) =>
    apiCall(`/medical-events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ========================
// EXPORT GROUP
// ========================
export const entities = {
  DoctorProfile: doctorProfile,
  PatientCase: patientCase,
  CaseComment: caseComment,
  Conversation: conversation,
  Message: message,
  MedicalEvent: medicalEvent,
};

export default { auth, entities };