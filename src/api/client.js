// API Configuration for Flask Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

// Helper function for API requests with error handling
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}/api${endpoint}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
    // Add auth token if available
    ...(localStorage.getItem('authToken') && {
      "Authorization": `Bearer ${localStorage.getItem('authToken')}`
    }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// ===== FILE UPLOAD =====
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/api/upload`;
  const headers = {
    ...(localStorage.getItem('authToken') && {
      "Authorization": `Bearer ${localStorage.getItem('authToken')}`
    }),
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

// ===== AUTHENTICATION =====
export const auth = {
  // Get current user
  me: async () => {
    try {
      return await apiCall("/auth/me");
    } catch (error) {
      console.error("Auth error:", error);
      return null;
    }
  },

  // Login
  login: async (email, password) => {
    const data = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem("authToken", data.token);
    }
    return data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  },

  // Register
  register: async (userData) => {
    return apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Email/Phone OTP verification for limited preview access
  sendOtp: async ({ email, phone }) => {
    return apiCall("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email, phone }),
    });
  },

  verifyOtp: async ({ email, phone, otp }) => {
    return apiCall("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, phone, otp }),
    });
  },

  // Doctor registry verification (NMC/SMC/NBE) based on degree
  verifyDoctor: async (doctorData) => {
    return apiCall("/auth/verify-doctor", {
      method: "POST",
      body: JSON.stringify(doctorData),
    });
  },

  getAdminUsers: async () => {
    return apiCall("/auth/admin/users");
  },

  adminVerifyUser: async (userId) => {
    return apiCall("/auth/admin/verify-user", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, verification_state: 'verified' }),
    });
  },
};

// ===== DOCTOR PROFILE =====
export const doctorProfile = {
  // Get doctor profiles with filters
  filter: async (filters = {}, sortBy = "") => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    if (sortBy) {
      queryParams.append("sort", sortBy);
    }
    return apiCall(`/doctor-profiles?${queryParams.toString()}`);
  },

  // Get single doctor profile
  get: async (id) => {
    return apiCall(`/doctor-profiles/${id}`);
  },

  // Create doctor profile
  create: async (data) => {
    return apiCall("/doctor-profiles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update doctor profile
  update: async (id, data) => {
    return apiCall(`/doctor-profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete doctor profile
  delete: async (id) => {
    return apiCall(`/doctor-profiles/${id}`, {
      method: "DELETE",
    });
  },
};

// ===== PATIENT CASE =====
export const patientCase = {
  // Get patient cases with filters
  filter: async (filters = {}, sortBy = "") => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    if (sortBy) {
      queryParams.append("sort", sortBy);
    }
    return apiCall(`/patient-cases?${queryParams.toString()}`);
  },

  // Get single case
  get: async (id) => {
    return apiCall(`/patient-cases/${id}`);
  },

  // Create case
  create: async (data) => {
    return apiCall("/patient-cases", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update case
  update: async (id, data) => {
    return apiCall(`/patient-cases/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete case
  delete: async (id) => {
    return apiCall(`/patient-cases/${id}`, {
      method: "DELETE",
    });
  },
};

// ===== CASE COMMENT =====
export const caseComment = {
  // Get comments for a case
  filter: async (filters = {}, sortBy = "") => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    if (sortBy) {
      queryParams.append("sort", sortBy);
    }
    return apiCall(`/case-comments?${queryParams.toString()}`);
  },

  // Get single comment
  get: async (id) => {
    return apiCall(`/case-comments/${id}`);
  },

  // Create comment
  create: async (data) => {
    return apiCall("/case-comments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update comment
  update: async (id, data) => {
    return apiCall(`/case-comments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete comment
  delete: async (id) => {
    return apiCall(`/case-comments/${id}`, {
      method: "DELETE",
    });
  },

  // Add reply to comment
  addReply: async (commentId, replyData) => {
    return apiCall(`/case-comments/${commentId}/reply`, {
      method: "POST",
      body: JSON.stringify(replyData),
    });
  },
};

// ===== CONVERSATION =====
export const conversation = {
  // Get conversations
  filter: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    return apiCall(`/conversations?${queryParams.toString()}`);
  },

  // Get single conversation
  get: async (id) => {
    return apiCall(`/conversations/${id}`);
  },

  // Create conversation
  create: async (data) => {
    return apiCall("/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update conversation
  update: async (id, data) => {
    return apiCall(`/conversations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete conversation
  delete: async (id) => {
    return apiCall(`/conversations/${id}`, {
      method: "DELETE",
    });
  },
};

// ===== MESSAGE =====
export const message = {
  // Get messages
  filter: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    return apiCall(`/messages?${queryParams.toString()}`);
  },

  // Get single message
  get: async (id) => {
    return apiCall(`/messages/${id}`);
  },

  // Send message
  create: async (data) => {
    return apiCall("/messages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update message
  update: async (id, data) => {
    return apiCall(`/messages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete message
  delete: async (id) => {
    return apiCall(`/messages/${id}`, {
      method: "DELETE",
    });
  },
};

// ===== MEDICAL EVENT =====
export const medicalEvent = {
  // Get events
  filter: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    return apiCall(`/medical-events?${queryParams.toString()}`);
  },

  // Get single event
  get: async (id) => {
    return apiCall(`/medical-events/${id}`);
  },

  // Create event
  create: async (data) => {
    return apiCall("/medical-events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update event
  update: async (id, data) => {
    return apiCall(`/medical-events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// Re-export with entities namespace for backward compatibility
export const entities = {
  DoctorProfile: doctorProfile,
  PatientCase: patientCase,
  CaseComment: caseComment,
  Conversation: conversation,
  Message: message,
  MedicalEvent: medicalEvent,
};

export default {
  auth,
  entities,
};
