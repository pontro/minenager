const CLOUD_API_URL = process.env.NEXT_PUBLIC_CLOUD_API_URL || "http://localhost:8080/api/v1";

export interface User {
  id: string;
  username: string;
  email: string;
  tier: "free" | "pro";
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface TunnelInfo {
  id: string;
  subdomain: string;
  public_port: number;
  is_online: boolean;
  vanilla_address?: string;
  public_address?: string;
}

export interface TunnelConfig {
  id: string;
  subdomain: string;
  public_address: string;
  vanilla_address: string;
  public_port: number;
  relay_server_host: string;
  relay_server_port: number;
  relay_auth_token: string;
  tunnel_secret_token: string;
  is_online: boolean;
  last_heartbeat?: string;
}

export async function loginUser(username_or_email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${CLOUD_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username_or_email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to log in.");
  }
  return data;
}

export async function registerUser(username: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${CLOUD_API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to create account.");
  }
  return data;
}

export async function fetchCurrentUser(token: string): Promise<User> {
  const res = await fetch(`${CLOUD_API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Session expired.");
  }
  return data;
}

export async function fetchTunnelConfig(token: string): Promise<TunnelConfig | null> {
  try {
    const res = await fetch(`${CLOUD_API_URL}/tunnels/config`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function createCheckoutSession(token: string): Promise<{ client_secret: string }> {
  const res = await fetch(`${CLOUD_API_URL}/billing/create-checkout-session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to start checkout session.");
  }
  return data;
}
