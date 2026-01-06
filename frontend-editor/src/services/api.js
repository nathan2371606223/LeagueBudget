import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

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

export async function fetchTeams() {
  const res = await axios.get(`${API_BASE}/teams`);
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

