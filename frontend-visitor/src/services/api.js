import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";
const TOKEN_KEY = "team_token";

export function getStoredToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token) {
  if (typeof localStorage === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Axios instance with token header
const client = axios.create({ baseURL: API_BASE });
client.interceptors.request.use((config) => {
  // Check for admin token (JWT) first, then fall back to team token
  const adminToken = localStorage.getItem("token"); // JWT token from editor login
  const teamToken = getStoredToken(); // Team token
  
  if (adminToken) {
    // Admin token takes precedence
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${adminToken}`;
  } else if (teamToken) {
    // Fall back to team token
    config.headers = config.headers || {};
    config.headers["X-Team-Token"] = teamToken;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token invalid, remove it
      setStoredToken("");
    }
    return Promise.reject(error);
  }
);

export async function validateToken(token) {
  const res = await client.get("/teams", {
    headers: { "X-Team-Token": token }
  });
  return res.data;
}

export async function fetchTeams() {
  const res = await client.get(`${API_BASE}/teams`);
  return res.data;
}

export async function fetchLevels() {
  const res = await client.get(`${API_BASE}/teams/levels`);
  return res.data;
}

export async function fetchHistory(page = 1, pageSize = 10) {
  const res = await client.get(`${API_BASE}/history`, { params: { page, pageSize } });
  return res.data;
}

export async function fetchAnnouncement() {
  const res = await client.get(`${API_BASE}/announcement`);
  return res.data;
}
