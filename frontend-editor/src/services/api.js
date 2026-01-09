import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

// Global handler for token expiration
let onTokenExpired = null;

export function setTokenExpiredHandler(handler) {
  onTokenExpired = handler;
}

// Axios response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Check if it's a token expiration error
      const message = error.response?.data?.message || "";
      if (message.includes("过期") || message.includes("未授权") || message.includes("登录")) {
        // Clear token and notify app
        localStorage.removeItem("token");
        if (onTokenExpired) {
          onTokenExpired();
        }
      }
    }
    return Promise.reject(error);
  }
);

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(password) {
  const res = await axios.post(`${API_BASE}/auth/login`, { password });
  return res.data;
}

export async function changePassword(token, oldPassword, newPassword) {
  const res = await axios.post(
    `${API_BASE}/auth/change-password`,
    { oldPassword, newPassword },
    { headers: authHeaders(token) }
  );
  return res.data;
}

export async function initCheck() {
  const res = await axios.get(`${API_BASE}/teams/init-check`);
  return res.data;
}

export async function initializeTeams() {
  const res = await axios.post(`${API_BASE}/teams/initialize`);
  return res.data;
}

export async function fetchTeams(token) {
  const res = await axios.get(`${API_BASE}/teams`, { headers: authHeaders(token) });
  return res.data;
}

export async function fetchLevels() {
  const res = await axios.get(`${API_BASE}/teams/levels`);
  return res.data;
}

export async function updateLevels(token, payload) {
  const res = await axios.put(`${API_BASE}/teams/levels`, payload, { headers: authHeaders(token) });
  return res.data;
}

export async function updateTeam(token, id, data) {
  const res = await axios.put(`${API_BASE}/teams/${id}`, data, { headers: authHeaders(token) });
  return res.data;
}

export async function swapTeams(token, team1Id, team2Id) {
  const res = await axios.post(
    `${API_BASE}/teams/swap`,
    { team1Id, team2Id },
    { headers: authHeaders(token) }
  );
  return res.data;
}

export async function processTransfers(token, transfers) {
  const res = await axios.post(
    `${API_BASE}/transfers/process`,
    { transfers },
    { headers: authHeaders(token) }
  );
  return res.data;
}

export async function clearHistory(token) {
  const res = await axios.delete(`${API_BASE}/history`, { headers: authHeaders(token) });
  return res.data;
}

export async function exportHistoryCsv() {
  const res = await axios.get(`${API_BASE}/history/export`, { responseType: "blob" });
  return res.data;
}

export async function fetchHistory(token, page = 1, pageSize = 10) {
  const res = await axios.get(`${API_BASE}/history`, { 
    params: { page, pageSize },
    headers: authHeaders(token)
  });
  return res.data;
}

// Token alerts (shared table)
export async function fetchTokenAlerts(token, resolved = false) {
  const res = await axios.get(`${API_BASE}/token-alerts`, {
    params: { resolved },
    headers: authHeaders(token)
  });
  return res.data;
}

export async function resolveTokenAlert(token, id) {
  const res = await axios.post(`${API_BASE}/token-alerts/${id}/resolve`, {}, { headers: authHeaders(token) });
  return res.data;
}

export async function deleteTokenAlert(token, id) {
  const res = await axios.delete(`${API_BASE}/token-alerts/${id}`, { headers: authHeaders(token) });
  return res.data;
}

// Announcement
export async function fetchAnnouncement(token) {
  const res = await axios.get(`${API_BASE}/announcement`, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function updateAnnouncement(token, content) {
  const res = await axios.put(`${API_BASE}/announcement`, { content }, {
    headers: authHeaders(token)
  });
  return res.data;
}
