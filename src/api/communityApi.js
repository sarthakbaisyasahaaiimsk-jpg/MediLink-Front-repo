const BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/community`
  : "https://medilink-back-repo.onrender.com/api/community";

/**
 * Safe JSON handler
 * prevents crashes when backend returns HTML/errors
 */
const safeJson = async (res) => {
  const contentType = res.headers.get("content-type");

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON but got: ${text.slice(0, 100)}`);
  }

  return res.json();
};

/* =========================
   FORUMS
========================= */

export const getForums = async () => {
  const res = await fetch(`${BASE}/forums`);
  return safeJson(res);
};

export const createForum = async (data) => {
  const res = await fetch(`${BASE}/forums`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return safeJson(res);
};

/* =========================
   THREADS
========================= */

export const getThreads = async (forumId, page = 1) => {
  const res = await fetch(
    `${BASE}/forums/${forumId}/threads?page=${page}`
  );

  return safeJson(res);
};

export const createThread = async (forumId, data) => {
  const res = await fetch(
    `${BASE}/forums/${forumId}/threads`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  return safeJson(res);
};

/* =========================
   SINGLE THREAD
========================= */

export const getThread = async (threadId, page = 1) => {
  const res = await fetch(`${BASE}/threads/${threadId}?page=${page}`);
  return safeJson(res);
};

/* =========================
   COMMENTS
========================= */

export const addComment = async (threadId, data) => {
  const res = await fetch(
    `${BASE}/threads/${threadId}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  return safeJson(res);
};