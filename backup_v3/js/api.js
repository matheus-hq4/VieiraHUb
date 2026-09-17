/**
 * Cliente HTTP Unificado para a API do VieiraTech HUB
 * Gerencia tokens de sessão Bearer, requisições autenticadas e tratamento de erros.
 */

const TOKEN_KEY = 'vieiratech_auth_token_v1';
const USER_KEY = 'vieiratech_auth_user_v1';

export class ApiClient {
  static getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  }

  static getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  static setAuth(token, user, remember = true) {
    try {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, token);
      storage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('[API] Erro ao salvar sessão:', e);
    }
  }

  static clearAuth() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('[API] Erro ao limpar sessão:', e);
    }
  }

  static isAuthenticated() {
    return !!ApiClient.getToken();
  }

  static isAdmin() {
    const user = ApiClient.getUser();
    return user && user.role === 'admin';
  }

  static async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = ApiClient.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(endpoint, config);

      // Tratamento de sessão expirada ou não autorizada
      if (response.status === 401) {
        ApiClient.clearAuth();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Sessão expirada. Faça login novamente.');
      }

      if (response.status === 403) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Acesso negado. Privilégios insuficientes.');
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[API Request Error] ${options.method || 'GET'} ${endpoint}:`, error.message);
      throw error;
    }
  }

  static get(endpoint) {
    return ApiClient.request(endpoint, { method: 'GET' });
  }

  static post(endpoint, body) {
    return ApiClient.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  static put(endpoint, body) {
    return ApiClient.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  static patch(endpoint, body) {
    return ApiClient.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  static delete(endpoint) {
    return ApiClient.request(endpoint, { method: 'DELETE' });
  }
}

export const api = ApiClient;
