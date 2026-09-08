/**
 * Módulo de Autenticação Segura do VieiraTech HUB
 * Comunica com o backend /api/auth/login e gerencia sessões RBAC (Admin / Operador)
 */

import { api } from './api.js';

export class AuthManager {
  static isAuthenticated() {
    return api.isAuthenticated();
  }

  static getCurrentUser() {
    return api.getUser();
  }

  static isAdmin() {
    return api.isAdmin();
  }

  static async login(username, password, remember = true) {
    const user = (username || '').trim();
    const pass = (password || '').trim();

    if (!user || !pass) {
      throw new Error('Informe o usuário e a senha.');
    }

    const data = await api.post('/api/auth/login', { username: user, password: pass });
    if (data && data.token && data.user) {
      api.setAuth(data.token, data.user, remember);
      return data.user;
    }
    throw new Error('Resposta de autenticação inválida.');
  }

  static async logout() {
    try {
      await api.post('/api/auth/logout', {});
    } catch {
      // Ignora erro de rede no logout
    }
    api.clearAuth();
    window.location.reload();
  }

  static initAuthGate(onSuccessCallback) {
    const overlay = document.getElementById('login-overlay');
    const form = document.getElementById('login-form');
    const userInput = document.getElementById('login-username');
    const passInput = document.getElementById('login-password');
    const errorMsg = document.getElementById('login-error-msg');
    const togglePassBtn = document.getElementById('toggle-pass-visibility');
    const logoutBtn = document.getElementById('logout-btn');
    const loginSubmitBtn = form ? form.querySelector('button[type="submit"]') : null;

    // Escuta expiração de sessão automática
    window.addEventListener('auth:unauthorized', () => {
      if (overlay) overlay.classList.remove('hidden');
      if (errorMsg) {
        errorMsg.textContent = 'Sessão expirada. Faça login novamente.';
        errorMsg.classList.remove('hidden');
      }
    });

    // Botão de Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.confirm('Deseja realmente sair do VieiraTech HUB?')) {
          await AuthManager.logout();
        }
      });
    }

    // Alternar visibilidade da senha no input de login
    if (togglePassBtn && passInput) {
      togglePassBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        const icon = togglePassBtn.querySelector('i');
        if (icon) {
          icon.className = isPass ? 'fa-regular fa-eye-slash text-xs' : 'fa-regular fa-eye text-xs';
        }
      });
    }

    // Atualiza cabeçalho com usuário ativo
    AuthManager.updateUserBadge();

    // Se já autenticado, fecha modal e executa callback
    if (AuthManager.isAuthenticated()) {
      if (overlay) overlay.classList.add('hidden');
      if (onSuccessCallback) onSuccessCallback(AuthManager.getCurrentUser());
      return;
    }

    // Exibir tela de login
    if (overlay) {
      overlay.classList.remove('hidden');
      if (userInput) userInput.focus();
    }

    // Submissão do formulário de login
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = userInput?.value || '';
        const pass = passInput?.value || '';
        const remember = document.getElementById('login-remember')?.checked ?? true;

        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = true;
          loginSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-sm"></i><span>Validando...</span>';
        }

        try {
          const loggedUser = await AuthManager.login(user, pass, remember);
          if (errorMsg) errorMsg.classList.add('hidden');
          if (overlay) overlay.classList.add('hidden');

          AuthManager.updateUserBadge();

          if (onSuccessCallback) {
            onSuccessCallback(loggedUser);
          }
        } catch (err) {
          if (errorMsg) {
            errorMsg.textContent = err.message || 'Credenciais inválidas.';
            errorMsg.classList.remove('hidden');
          }
          if (passInput) passInput.value = '';
        } finally {
          if (loginSubmitBtn) {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.innerHTML = '<span>Entrar no HUB</span><i class="fa-solid fa-arrow-right text-xs"></i>';
          }
        }
      });
    }
  }

  static updateUserBadge() {
    const user = AuthManager.getCurrentUser();
    const userDisplay = document.getElementById('user-profile-display');
    const userNameSpan = document.getElementById('user-profile-name');
    const userRoleSpan = document.getElementById('user-profile-role');
    const adminMenuBtn = document.getElementById('admin-users-btn');

    if (user && userDisplay) {
      userDisplay.classList.remove('hidden');
      if (userNameSpan) userNameSpan.textContent = user.name || user.username;
      if (userRoleSpan) {
        userRoleSpan.textContent = user.role === 'admin' ? 'Administrador' : 'Operador';
        userRoleSpan.className = user.role === 'admin'
          ? 'text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold'
          : 'text-[10px] px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 font-medium';
      }
    }

    // Exibe botão de gerenciamento de usuários se for admin
    if (adminMenuBtn) {
      if (user && user.role === 'admin') {
        adminMenuBtn.classList.remove('hidden');
      } else {
        adminMenuBtn.classList.add('hidden');
      }
    }
  }
}
