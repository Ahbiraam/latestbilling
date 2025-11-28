// =====================
// API BASE URL
// =====================
export const API_BASE_URL = "https://rms-billing-backend.onrender.com";

// =====================
// DEV MODE (ENABLE DURING DEVELOPMENT ONLY)
// =====================
const DEV_MODE = true; // ❗ turn OFF in production
const DEV_TOKEN = "test-dev-token"; // any string works

// =====================
// MAIN FETCH WRAPPER
// =====================
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_BASE_URL}${endpoint}`;

  let token = localStorage.getItem("token");

  // Inject DEV TOKEN if no real token exists
  if (DEV_MODE && !token) {
    token = DEV_TOKEN;
  }

  const finalOptions: RequestInit = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  };

  return fetch(url, finalOptions);
}

// =====================
// STORE TOKENS
// =====================
export function setTokens(tokens: {
  access_token: string;
  refresh_token: string | null;
}) {
  if (tokens.access_token) {
    localStorage.setItem("token", tokens.access_token);
  }
  if (tokens.refresh_token) {
    localStorage.setItem("refresh_token", tokens.refresh_token);
  }
}
