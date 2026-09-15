/**
 * OpenClaw Portable API Client
 *
 * Removes platform lock-in by abstracting API communication.
 * Allows the frontend to point to:
 * 1. Default relative '/api' endpoints (Node.js Express / Docker / Cloud Run)
 * 2. Namecheap PHP backend ('api.php?action=...')
 * 3. Any custom remote API server specified via VITE_API_BASE_URL or user settings
 */

const STORAGE_API_BASE_KEY = 'openclaw_api_base_url';
const STORAGE_TOKEN_KEY = 'openclaw_session_token';

export function getStoredApiBaseUrl(): string {
  try {
    const custom = localStorage.getItem(STORAGE_API_BASE_KEY);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }

  // Fallback to Vite environment variable if configured during build
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return '';
}

export function setStoredApiBaseUrl(url: string): void {
  try {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_API_BASE_KEY);
    } else {
      localStorage.setItem(STORAGE_API_BASE_KEY, url.trim().replace(/\/+$/, ''));
    }
  } catch {
    // ignore
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (!token) {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } else {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
    }
  } catch {
    // ignore
  }
}

/**
 * Resolves standard /api/ endpoints to either standard REST or Namecheap PHP actions.
 */
export function resolveApiUrl(endpoint: string): string {
  const base = getStoredApiBaseUrl();

  // If base points to a PHP script (e.g. https://domain.com/namecheap/api.php or /namecheap/api.php)
  if (base.includes('.php') || endpoint.includes('.php')) {
    const phpFile = base.endsWith('.php') ? base : `${base}/api.php`;
    // Map REST routes to PHP action parameters
    if (endpoint === '/api/auth/login') return `${phpFile}?action=login`;
    if (endpoint === '/api/auth/me') return `${phpFile}?action=verify_session`;
    if (endpoint === '/api/auth/logout') return `${phpFile}?action=logout`;
    if (endpoint === '/api/auth/change-password') return `${phpFile}?action=change_password`;
    if (endpoint === '/api/status') return `${phpFile}?action=status`;
    if (endpoint === '/api/conversations') return `${phpFile}?action=conversations`;
    if (endpoint.startsWith('/api/conversations/') && endpoint.endsWith('/messages')) {
      const convId = endpoint.split('/')[3];
      return `${phpFile}?action=messages&conversation_id=${encodeURIComponent(convId)}`;
    }
    if (endpoint.startsWith('/api/conversations/')) {
      const convId = endpoint.split('/')[3];
      return `${phpFile}?action=conversation_detail&conversation_id=${encodeURIComponent(convId)}`;
    }
    if (endpoint.startsWith('/api/messages/') && endpoint.endsWith('/retry')) {
      const msgId = endpoint.split('/')[3];
      return `${phpFile}?action=retry_message&message_id=${encodeURIComponent(msgId)}`;
    }
    return `${phpFile}?action=${encodeURIComponent(endpoint.replace('/api/', ''))}`;
  }

  // Standard REST backend
  if (!base) {
    return endpoint;
  }
  return `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

/**
 * Portable, unified API fetch with automatic Auth header and CORS support.
 */
export async function portableFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = resolveApiUrl(endpoint);
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
    mode: 'cors',
  });
}
