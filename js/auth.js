/**
 * Módulo de Autenticação Simples do VieiraTech HUB
 * Credenciais fixas de acesso:
 * Usuário: vieiratech
 * Senha:   $Vi3ir@Tech
 */

const AUTH_STORAGE_KEY = 'vieiratech_auth_session_v1';
const VALID_USER = 'vieiratech';
const VALID_PASS = '$Vi3ir@Tech';

export class AuthManager {
  static isAuthenticated() {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true' || sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  static login(username, password, remember = true) {
    const user = (username || '').trim().toLowerCase();
    const pass = (password || '').trim();

    if (user === VALID_USER && pass === VALID_PASS) {
      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      }
      return true;
    }
    return false;
  }

  static logout() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Erro ao deslogar:', e);
    }
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

    // Logout button handler
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.confirm('Deseja realmente sair do VieiraTech HUB?')) {
          AuthManager.logout();
        }
      });
    }

    // Toggle password visibility
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

    // Check if already authenticated
    if (AuthManager.isAuthenticated()) {
      if (overlay) overlay.classList.add('hidden');
      if (onSuccessCallback) onSuccessCallback();
      return;
    }

    // Show login screen
    if (overlay) {
      overlay.classList.remove('hidden');
      if (userInput) userInput.focus();
    }

    // Form submit handler
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = userInput?.value || '';
        const pass = passInput?.value || '';
        const remember = document.getElementById('login-remember')?.checked ?? true;

        if (AuthManager.login(user, pass, remember)) {
          if (errorMsg) errorMsg.classList.add('hidden');
          if (overlay) overlay.classList.add('hidden');
          if (onSuccessCallback) onSuccessCallback();
        } else {
          if (errorMsg) {
            errorMsg.classList.remove('hidden');
            errorMsg.textContent = 'Usuário ou senha inválidos. Tente novamente.';
          }
          if (passInput) {
            passInput.value = '';
            passInput.focus();
          }
        }
      });
    }
  }
}
