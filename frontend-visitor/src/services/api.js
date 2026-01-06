import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

export async function fetchTeams() {
  const res = await axios.get(`${API_BASE}/teams`);
  return res.data;
}

export async function fetchLevels() {
  const res = await axios.get(`${API_BASE}/teams/levels`);
  return res.data;
}

export async function fetchHistory(page = 1, pageSize = 10) {
  const res = await axios.get(`${API_BASE}/history`, { params: { page, pageSize } });
  return res.data;
}

