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

    // Dropdown do menu compacto de usuário / admin
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');

    if (userMenuBtn && userMenuDropdown) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenuDropdown.classList.toggle('hidden');
      });

      // Fechar ao clicar fora do dropdown
      document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userMenuDropdown.contains(e.target)) {
          userMenuDropdown.classList.add('hidden');
        }
      });

      // Fechar ao selecionar qualquer ação interna
      userMenuDropdown.addEventListener('click', () => {
        userMenuDropdown.classList.add('hidden');
      });
    }

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

    // Migração transparente de sessões locais anteriores
    if (localStorage.getItem('vieiratech_auth_session_v1') === 'true') {
      AuthManager.login('admin', '$Vi3ir@Tech', true).then((user) => {
        if (overlay) overlay.classList.add('hidden');
        AuthManager.updateUserBadge();
        if (onSuccessCallback) onSuccessCallback(user);
      }).catch(() => {
        if (overlay) {
          overlay.classList.remove('hidden');
          if (userInput) userInput.focus();
        }
      });
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
    const menuBtn = document.getElementById('user-menu-btn');
    const userInitial = document.getElementById('dropdown-user-initial');
    const userNameSpan = document.getElementById('dropdown-user-name');
    const userRoleSpan = document.getElementById('dropdown-user-role');
    const adminMenuBtn = document.getElementById('admin-users-btn');

    // Suporte legado se existirem elementos soltos
    const legacyUserDisplay = document.getElementById('user-profile-display');
    const legacyUserName = document.getElementById('user-profile-name');
    const legacyUserRole = document.getElementById('user-profile-role');

    if (user) {
      const displayName = user.name || user.username || 'Admin';
      const isAdmin = user.role === 'admin';

      if (userNameSpan) userNameSpan.textContent = displayName;
      if (userInitial) userInitial.textContent = displayName.charAt(0).toUpperCase();
      if (userRoleSpan) {
        userRoleSpan.textContent = isAdmin ? 'Administrador' : 'Operador';
        userRoleSpan.className = isAdmin
          ? 'text-[10px] font-semibold text-blue-600 dark:text-blue-400'
          : 'text-[10px] font-medium text-slate-500 dark:text-slate-400';
      }

      if (menuBtn) {
        menuBtn.setAttribute('title', `${displayName} (${isAdmin ? 'Administrador' : 'Operador'})`);
      }

      if (legacyUserDisplay) {
        legacyUserDisplay.classList.remove('hidden');
        legacyUserDisplay.classList.add('flex');
      }
      if (legacyUserName) legacyUserName.textContent = displayName;
      if (legacyUserRole) legacyUserRole.textContent = isAdmin ? 'Admin' : 'Operador';
    }

    // Exibe botão de gerenciamento de usuários e backup no menu caso seja admin
    const adminBackupBtn = document.getElementById('admin-backup-btn');
    if (adminBackupBtn) {
      if (user && user.role === 'admin') {
        adminBackupBtn.classList.remove('hidden');
        adminBackupBtn.classList.add('flex');
        if (!adminBackupBtn.dataset.bound) {
          adminBackupBtn.dataset.bound = 'true';
          adminBackupBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              const token = api.getToken();
              const response = await fetch('/api/admin/backup', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Falha ao baixar backup');
              }
              const blob = await response.blob();
              const disposition = response.headers.get('content-disposition');
              let filename = `vieiratech_hub_backup_${new Date().toISOString().slice(0, 10)}.json`;
              if (disposition && disposition.includes('filename=')) {
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) filename = match[1];
              }
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (err) {
              alert('Erro ao realizar backup do servidor: ' + err.message);
            }
          });
        }
      } else {
        adminBackupBtn.classList.add('hidden');
        adminBackupBtn.classList.remove('flex');
      }
    }

    if (adminMenuBtn) {
      if (user && user.role === 'admin') {
        adminMenuBtn.classList.remove('hidden');
        adminMenuBtn.classList.add('flex');
      } else {
        adminMenuBtn.classList.add('hidden');
        adminMenuBtn.classList.remove('flex');
      }
    }
  }
}
