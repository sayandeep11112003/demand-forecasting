// In production the backend serves the built frontend from the same origin,
// so requests are relative. In dev (`vite`), the backend runs separately on
// its own port, so default to that unless VITE_API_BASE overrides it.
const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? "http://localhost:4000" : "");

async function request(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export async function apiRegister(payload) {
  return request("/api/auth/register", payload);
}

export async function apiLogin(payload) {
  const data = await request("/api/auth/login", payload);
  return data.user;
}

export async function apiContact(payload) {
  return request("/api/contact", payload);
}
