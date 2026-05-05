function normalizeBase(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function resolveBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return normalizeBase(configured);
  if (import.meta.env.DEV) return "http://localhost:8000";
  return "https://api.fotografia.fbautomacao.space";
}

const BASE = resolveBaseUrl();

function getToken() { return localStorage.getItem("fa_token") || ""; }
export function setToken(t: string) { localStorage.setItem("fa_token", t); }
export function clearToken() { localStorage.removeItem("fa_token"); }
export function isLoggedIn() { return !!getToken(); }

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...opts.headers },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      const e: any = new Error(err.detail || "Erro na requisição");
      e.status = res.status;
      throw e;
    }
    return res.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Falha de conexão com a API. Verifique o deploy do backend e a URL pública da API.");
    }
    throw error;
  }
}

// Auth
export const apiRegister = (data: { name: string; email: string; password: string; studio_name: string }) =>
  req<{ access_token: string }>("/auth/register", { method: "POST", body: JSON.stringify(data) });
export const apiLogin = (email: string, password: string) =>
  req<{ access_token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const apiMe = () => req<{ id: number; name: string; email: string; role: string; tenant_id: number }>("/auth/me");
export const apiModules = () => req<Record<string, boolean>>("/auth/me/modules");

// Clients
export const apiGetClients = () => req<any[]>("/clients");
export const apiSaveClient = (c: any) => req<any>(`/clients/${c.id}`, { method: "PUT", body: JSON.stringify(c) });
export const apiDeleteClient = (id: string) => req<void>(`/clients/${id}`, { method: "DELETE" });

// Shoots
export const apiGetShoots = () => req<any[]>("/shoots");
export const apiSaveShoot = (s: any) => req<any>(`/shoots/${s.id}`, { method: "PUT", body: JSON.stringify(s) });
export const apiDeleteShoot = (id: string) => req<void>(`/shoots/${id}`, { method: "DELETE" });

// Hermes
export const apiHermesChat = (message: string, history: any[]) =>
  req<{ reply: string; messages_used: number; messages_limit: number; plan: string }>("/hermes/chat", {
    method: "POST", body: JSON.stringify({ message, history }),
  });

// Admin
export const adminListTenants = () => req<any[]>("/admin/tenants");
export const adminUpdateTenant = (id: number, data: any) =>
  req<any>(`/admin/tenants/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const adminToggleModule = (tenantId: number, module_name: string, enabled: boolean) =>
  req<any>(`/admin/tenants/${tenantId}/modules`, { method: "PATCH", body: JSON.stringify({ module_name, enabled }) });
export const adminGetHermesUsage = (tenantId: number) => req<any>(`/admin/tenants/${tenantId}/hermes-usage`);
export const adminSetHermesPlan = (tenantId: number, plan: string) =>
  req<any>(`/admin/tenants/${tenantId}/hermes-plan`, { method: "PATCH", body: JSON.stringify({ plan }) });
export const adminResetHermesUsage = (tenantId: number) =>
  req<any>(`/admin/tenants/${tenantId}/hermes-reset`, { method: "POST" });
