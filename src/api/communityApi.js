const BASE = "https://medilink-back-repo.onrender.com/api/community";

// Forums
export const getForums = () =>
  fetch(`${BASE}/forums`).then(res => res.json());

export const createForum = (data) =>
  fetch(`${BASE}/forums`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json());

// Threads
export const getThreads = (forumId, page = 1) =>
  fetch(`${BASE}/forums/${forumId}/threads?page=${page}`)
    .then(res => res.json());

export const createThread = (forumId, data) =>
  fetch(`${BASE}/forums/${forumId}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json());

// Single thread
export const getThread = (threadId) =>
  fetch(`${BASE}/threads/${threadId}`)
    .then(res => res.json());

// Comments
export const addComment = (threadId, data) =>
  fetch(`${BASE}/threads/${threadId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json());