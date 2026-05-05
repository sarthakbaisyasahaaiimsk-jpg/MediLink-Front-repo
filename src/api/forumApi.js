const BASE = "https://medilink-back-repo.onrender.com/api/community";

export const getCases = (page = 1) =>
  fetch(`${BASE}/cases?page=${page}`).then(res => res.json());

export const getCase = (id) =>
  fetch(`${BASE}/cases/${id}`).then(res => res.json());

export const createCase = (data) =>
  fetch(`${BASE}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(res => res.json());

export const addComment = (caseId, data) =>
  fetch(`${BASE}/cases/${caseId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(res => res.json());