import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

function unwrap(response) {
  return response.data.data;
}

export async function fetchSessions() {
  return unwrap(await api.get("/sessions"));
}

export async function fetchSessionDetails(sessionId) {
  return unwrap(await api.get(`/sessions/${encodeURIComponent(sessionId)}`));
}

export async function fetchHeatmap(pageUrl) {
  return unwrap(await api.get("/heatmap", { params: { page: pageUrl } }));
}

export default api;
