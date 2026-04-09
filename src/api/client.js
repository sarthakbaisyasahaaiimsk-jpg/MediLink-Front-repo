// API Configuration for Flask Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper function for API requests with error handling
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}/api${endpoint}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(localStorage.getItem('authToken') && {
      "Authorization": `Bearer ${localStorage.getItem('authToken')}`
    }),
    ...options.headers,
  };

  const token = localStorage.getItem("authToken");

if (!token && !endpoint.includes("/auth")) {
  console.warn("No token, skipping request:", endpoint);
}

const response = await fetch(url, {
  ...options,
  headers: {
    ...defaultHeaders,
    ...(token && { Authorization: `Bearer ${token}` }),
  },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const url = `${API_BASE_URL}/api/upload`;
  const headers = {
    ...(localStorage.getItem('authToken') && {
      "Authorization": `Bearer ${localStorage.getItem('authToken')}`
    }),
  };
  const response = await fetch(url, { method: "POST", headers, body: formData });
  if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
  return response.json();
};

export const auth = {
  // ✅ No longer swallows errors — lets AuthContext decide what to do
  me: async () => {
    return await apiCall("/auth/me");
  },
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
  register: async (userData) => {
    return apiCall("/auth/register", { method: "POST", body: JSON.stringify(userData) });
  },
  sendOtp: async ({ email, phone }) => {
    return apiCall("/auth/send-otp", { method: "POST", body: JSON.stringify({ email, phone }) });
  },
  verifyOtp: async ({ email, phone, otp }) => {
    return apiCall("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, phone, otp }) });
  },
  verifyDoctor: async (doctorData) => {
    return apiCall("/auth/verify-doctor", { method: "POST", body: JSON.stringify(doctorData) });
  },
  getAdminUsers: async () => apiCall("/auth/admin/users"),
  adminVerifyUser: async (userId) => {
    return apiCall("/auth/admin/verify-user", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, verification_state: 'verified' }),
    });
  },
};

export const doctorProfile = {
  filter: async (filters = {}, sortBy = "") => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => queryParams.append(key, value));
    if (sortBy) queryParams.append("sort", sortBy);
    return apiCall(`/doctor-profiles?${queryParams.toString()}`);
  },
  get: async (id) => apiCall(`/doctor-profiles/${id}`),
  create: async (data) => apiCall("/doctor-profiles", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => apiCall(`/doctor-profiles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id) => apiCall(`/doctor-profiles/${id}`, { method: "DELETE" }),
};

export const patientCase = {
  filter: async (filters = {}, sortBy = "") => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => queryParams.append(key, value));
    if (sortBy) queryParams.append("sort", sortBy);
    return apiCall(`/patient-cases?${queryParams.toString()}`);
  },
  get: async (id) => apiCall(`/patient-cases/${id}`),
  create: async (data) => apiCall("/patient-cases", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => apiCall(`/patient-cases/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id) => apiCall(`/patient-cases/${id}`, { method: "DELETE" }),
};

export const caseComment = {
  filter: async (filters = {}, sortBy = "") => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => queryParams.append(key, value));
    if (sortBy) queryParams.append("sort", sortBy);
    return apiCall(`/case-comments?${queryParams.toString()}`);
  },
  get: async (id) => apiCall(`/case-comments/${id}`),
  create: async (data) => apiCall("/case-comments", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => apiCall(`/case-comments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id) => apiCall(`/case-comments/${id}`, { method: "DELETE" }),
  addReply: async (commentId, replyData) => apiCall(`/case-comments/${commentId}/reply`, { method: "POST", body: JSON.stringify(replyData) }),
};

export const conversation = {
  filter: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => queryParams.append(key, value));
    return apiCall(`/conversations?${queryParams.toString()}`);
  },
  get: async (id) => apiCall(`/conversations/${id}`),
  create: async (data) => apiCall("/conversations", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => apiCall(`/conversations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id) => apiCall(`/conversations/${id}`, { method: "DELETE" }),
};

export const message = {
  filter: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => queryParams.append(key, value));
    return apiCall(`/messages?${queryParams.toString()}`);
  },
  get: async (id) => apiCall(`/messages/${id}`),
  create: async (data) => apiCall("/messages", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => apiCall(`/messages/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id) => apiCall(`/messages/${id}`, { method: "DELETE" }),
};

export const medicalEvent = {
  filter: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => queryParams.append(key, value));
    return apiCall(`/medical-events?${queryParams.toString()}`);
  },
  get: async (id) => apiCall(`/medical-events/${id}`),
  create: async (data) => apiCall("/medical-events", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => apiCall(`/medical-events/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

export const entities = {
  DoctorProfile: doctorProfile,
  PatientCase: patientCase,
  CaseComment: caseComment,
  Conversation: conversation,
  Message: message,
  MedicalEvent: medicalEvent,
};

export default { auth, entities };