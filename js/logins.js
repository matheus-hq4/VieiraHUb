import { defaultLoginsText } from './defaultLogins.js';
import { loadTheme, saveTheme } from './storage.js';
import { AuthManager } from './auth.js';
import { api } from './api.js';

const LOGINS_STORAGE_KEY = 'vieiratech_mapeamento_logins_v1';

class LoginsApp {
  constructor() {
    this.rawText = '';
    this.isDarkMode = loadTheme();
    this.activeView = 'explorer'; // 'explorer' | 'editor'
    this.searchTerm = '';
    this.revealedPasswords = new Set(); // Stores IDs of users whose passwords are visible
    this.autoSaveTimer = null;

    this.initTheme();
    this.initDOMElements();
    this.bindEvents();
    this.loadData();
  }

  async loadData() {
    this.rawText = await this.loadLoginsText();
    this.render();
  }

  async loadLoginsText() {
    try {
      const res = await api.get('/api/ad-logins');
      if (res && typeof res.rawText === 'string' && res.rawText.trim().length > 0) {
        localStorage.setItem(LOGINS_STORAGE_KEY, res.rawText);
        return res.rawText;
      }
    } catch (e) {
      console.warn('[LoginsApp] Erro ao carregar do servidor, usando cache local:', e);
    }
    const saved = localStorage.getItem(LOGINS_STORAGE_KEY);
    if (saved && saved.trim().length > 0) {
      return saved;
    }
    return defaultLoginsText;
  }

  async saveLoginsText(text) {
    this.rawText = text;
    try {
      localStorage.setItem(LOGINS_STORAGE_KEY, text);
    } catch (e) {
      console.error('[LoginsApp] Erro ao salvar localmente:', e);
    }

    try {
      await api.post('/api/ad-logins', { rawText: text });
      this.indicateSaved('Salvo no servidor');
    } catch (err) {
      console.error('[LoginsApp] Erro ao sincronizar com servidor:', err);
      this.indicateSaved('Salvo no navegador (offline)');
    }
  }

  initTheme() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.initTheme();
    saveTheme(this.isDarkMode);
    this.updateThemeToggleIcon();
  }

  updateThemeToggleIcon() {
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      icon.className = this.isDarkMode ? 'fa-solid fa-sun text-amber-400' : 'fa-solid fa-moon text-slate-600';
    }
  }

  initDOMElements() {
    this.toggleThemeBtn = document.getElementById('toggle-theme-btn');
    this.viewExplorerBtn = document.getElementById('view-explorer-btn');
    this.viewEditorBtn = document.getElementById('view-editor-btn');

    this.explorerSection = document.getElementById('explorer-section');
    this.editorSection = document.getElementById('editor-section');

    this.searchInput = document.getElementById('search-logins-input');
    this.searchClearBtn = document.getElementById('search-logins-clear-btn');
    this.totalEntriesCount = document.getElementById('total-entries-count');
    this.filteredEntriesCount = document.getElementById('filtered-entries-count');
    this.departmentsContainer = document.getElementById('departments-container');

    // Add User Modal Elements
    this.openAddUserBtn = document.getElementById('open-add-user-btn');
    this.addUserModal = document.getElementById('add-user-modal');
    this.closeAddUserModalBtn = document.getElementById('close-add-user-modal-btn');
    this.cancelAddUserModalBtn = document.getElementById('cancel-add-user-modal-btn');
    this.addUserForm = document.getElementById('add-user-form');
    this.modalUserDept = document.getElementById('modal-user-dept');
    this.modalUserSubDept = document.getElementById('modal-user-subdept');
    this.modalUserName = document.getElementById('modal-user-name');
    this.modalUserPass = document.getElementById('modal-user-pass');
    this.modalUserActive = document.getElementById('modal-user-active');

    // Editor elements
    this.editorTextarea = document.getElementById('logins-textarea');
    this.saveStatus = document.getElementById('editor-save-status');
    this.copyAllBtn = document.getElementById('copy-all-btn');
    this.downloadTxtBtn = document.getElementById('download-txt-btn');
    this.importTxtInput = document.getElementById('import-txt-input');
    this.resetDefaultBtn = document.getElementById('reset-default-btn');
    this.editorLineCount = document.getElementById('editor-line-count');
    this.editorCharCount = document.getElementById('editor-char-count');

    // Toast
    this.toastContainer = document.getElementById('toast-container');
    this.toastMessage = document.getElementById('toast-message');
  }

  bindEvents() {
    if (this.toggleThemeBtn) {
      this.toggleThemeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // View Switching
    if (this.viewExplorerBtn) {
      this.viewExplorerBtn.addEventListener('click', () => this.switchView('explorer'));
    }
    if (this.viewEditorBtn) {
      this.viewEditorBtn.addEventListener('click', () => this.switchView('editor'));
    }

    // Search
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        if (this.searchClearBtn) {
          if (this.searchTerm) {
            this.searchClearBtn.classList.remove('hidden');
          } else {
            this.searchClearBtn.classList.add('hidden');
          }
        }
        this.renderExplorer();
      });
    }

    if (this.searchClearBtn) {
      this.searchClearBtn.addEventListener('click', () => {
        this.searchTerm = '';
        this.searchInput.value = '';
        this.searchClearBtn.classList.add('hidden');
        this.renderExplorer();
      });
    }

    // Add User Modal
    if (this.openAddUserBtn) {
      this.openAddUserBtn.addEventListener('click', () => this.openAddModal());
    }
    if (this.closeAddUserModalBtn) {
      this.closeAddUserModalBtn.addEventListener('click', () => this.closeAddModal());
    }
    if (this.cancelAddUserModalBtn) {
      this.cancelAddUserModalBtn.addEventListener('click', () => this.closeAddModal());
    }
    if (this.addUserForm) {
      this.addUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateUser();
      });
    }

    // Editor typing & auto-save
    if (this.editorTextarea) {
      this.editorTextarea.addEventListener('input', () => {
        this.updateEditorCounters();
        this.indicateSaving();
        if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
          this.saveLoginsText(this.editorTextarea.value);
          this.indicateSaved();
        }, 300);
      });

      // Tab key support
      this.editorTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = this.editorTextarea.selectionStart;
          const end = this.editorTextarea.selectionEnd;
          this.editorTextarea.value = this.editorTextarea.value.substring(0, start) + '\t' + this.editorTextarea.value.substring(end);
          this.editorTextarea.selectionStart = this.editorTextarea.selectionEnd = start + 1;
          this.editorTextarea.dispatchEvent(new Event('input'));
        }
      });
    }

    // Action buttons
    if (this.copyAllBtn) {
      this.copyAllBtn.addEventListener('click', () => {
        this.copyToClipboard(this.rawText, 'Mapeamento completo copiado para a área de transferência!');
      });
    }

    if (this.downloadTxtBtn) {
      this.downloadTxtBtn.addEventListener('click', () => {
        this.downloadAsTxt();
      });
    }

    if (this.importTxtInput) {
      this.importTxtInput.addEventListener('change', (e) => this.handleImportTxt(e));
    }

    if (this.resetDefaultBtn) {
      this.resetDefaultBtn.addEventListener('click', async () => {
        if (window.confirm('Deseja realmente restaurar o mapeamento para o modelo padrão da VieiraCred no servidor?')) {
          await this.saveLoginsText(defaultLoginsText);
          if (this.editorTextarea) this.editorTextarea.value = defaultLoginsText;
          this.showToast('Mapeamento padrão restaurado no servidor!');
          this.render();
        }
      });
    }

    this.updateThemeToggleIcon();
  }

  switchView(view) {
    this.activeView = view;
    if (view === 'explorer') {
      this.viewExplorerBtn.classList.add('bg-blue-600', 'text-white', 'font-bold', 'shadow-xs');
      this.viewExplorerBtn.classList.remove('text-slate-600', 'dark:text-slate-400');
      this.viewEditorBtn.classList.remove('bg-blue-600', 'text-white', 'font-bold', 'shadow-xs');
      this.viewEditorBtn.classList.add('text-slate-600', 'dark:text-slate-400');

      this.explorerSection.classList.remove('hidden');
      this.editorSection.classList.add('hidden');
      this.renderExplorer();
    } else {
      this.viewEditorBtn.classList.add('bg-blue-600', 'text-white', 'font-bold', 'shadow-xs');
      this.viewEditorBtn.classList.remove('text-slate-600', 'dark:text-slate-400');
      this.viewExplorerBtn.classList.remove('bg-blue-600', 'text-white', 'font-bold', 'shadow-xs');
      this.viewExplorerBtn.classList.add('text-slate-600', 'dark:text-slate-400');

      this.explorerSection.classList.add('hidden');
      this.editorSection.classList.remove('hidden');
      if (this.editorTextarea) {
        this.editorTextarea.value = this.rawText;
        this.updateEditorCounters();
        this.editorTextarea.focus();
      }
    }
  }

  openAddModal(deptName = '', subDeptName = '') {
    if (this.modalUserDept) this.modalUserDept.value = deptName;
    if (this.modalUserSubDept) this.modalUserSubDept.value = subDeptName;
    if (this.modalUserName) this.modalUserName.value = '';
    if (this.modalUserPass) this.modalUserPass.value = '';
    if (this.modalUserActive) this.modalUserActive.checked = true;

    if (this.addUserModal) this.addUserModal.classList.remove('hidden');
    if (this.modalUserName) this.modalUserName.focus();
  }

  closeAddModal() {
    if (this.addUserModal) this.addUserModal.classList.add('hidden');
  }

  handleCreateUser() {
    const dept = this.modalUserDept?.value.trim();
    const subDept = this.modalUserSubDept?.value.trim();
    const userName = this.modalUserName?.value.trim();
    const userPass = this.modalUserPass?.value.trim();
    const isActive = this.modalUserActive?.checked ?? true;

    if (!dept || !userName || !userPass) {
      alert('Por favor, preencha o Departamento, o Usuário e a Senha.');
      return;
    }

    const statusPrefix = isActive ? '✔' : '❌';
    const userLine = `\t\t${statusPrefix} ${userName} | user/senha: ${userPass}`;

    // Insert user into rawText
    let lines = this.rawText.split('\n');
    let targetIndex = -1;

    // Search for section
    for (let i = 0; i < lines.length; i++) {
      const lineTrim = lines[i].trim();
      if (subDept && lineTrim.toLowerCase().includes(subDept.toLowerCase())) {
        targetIndex = i + 1;
        break;
      }
      if (!subDept && lineTrim.toLowerCase().includes(dept.toLowerCase()) && lineTrim.startsWith('<')) {
        targetIndex = i + 1;
        break;
      }
    }

    if (targetIndex !== -1) {
      lines.splice(targetIndex, 0, userLine);
    } else {
      // Append new department at the end
      lines.push('');
      lines.push(`\t<${dept.toUpperCase()}`);
      if (subDept) {
        lines.push(`\t\t<${subDept}`);
      }
      lines.push(userLine);
    }

    const updatedText = lines.join('\n');
    await this.saveLoginsText(updatedText);
    if (this.editorTextarea) this.editorTextarea.value = updatedText;

    this.showToast(`Usuário "${userName}" adicionado e salvo no servidor!`);
    this.closeAddModal();
    this.render();
  }

  async handleDeleteUser(userIdentifier) {
    if (!window.confirm(`Tem certeza que deseja remover o usuário "${userIdentifier}"?`)) {
      return;
    }

    const lines = this.rawText.split('\n');
    const filteredLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (trimmed.includes(userIdentifier) && (trimmed.includes('| user/senha:') || trimmed.includes('|'))) {
        return false;
      }
      return true;
    });

    const updatedText = filteredLines.join('\n');
    await this.saveLoginsText(updatedText);
    if (this.editorTextarea) this.editorTextarea.value = updatedText;

    this.showToast(`Usuário "${userIdentifier}" removido do servidor.`);
    this.render();
  }

  /**
   * Robust Hierarchical Parser supporting Multi-Level Sections
   * (e.g. VieiraCred -> OPERAÇÃO -> OPERADOR(A) -> Espinha 01..08)
   */
  parseLogins(rawText) {
    const lines = rawText.split('\n');
    const departments = [];
    let deptMap = new Map();

    let currentDeptName = 'GERAL';
    let currentSubSection = '';
    let totalEntries = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('Mapeamento organizacional')) continue;
      if (trimmed.startsWith('<VieiraCred')) continue;

      // Section Header (e.g. <CEO / DIRETORIA, <OPERAÇÃO VIERACRED, <SUPERVISOR(A), <Espinha 01)
      if (trimmed.startsWith('<')) {
        const title = trimmed.replace(/^<+/, '').trim();

        if (title.startsWith('Espinha')) {
          currentSubSection = title;
        } else if (title.includes('SUPERVISOR')) {
          currentSubSection = 'SUPERVISOR(A)';
        } else if (title.includes('OPERADOR')) {
          currentSubSection = 'OPERADOR(A)';
        } else {
          currentDeptName = title;
          currentSubSection = '';
        }

        // Ensure department exists in map
        if (!deptMap.has(currentDeptName)) {
          const deptObj = {
            name: currentDeptName,
            subSections: new Map(), // subName -> array of users
            directUsers: []
          };
          deptMap.set(currentDeptName, deptObj);
          departments.push(deptObj);
        }
        continue;
      }

      // User line matching: contains '|' and login info
      if (
        trimmed.includes('| user/senha:') ||
        trimmed.includes('|') ||
        trimmed.startsWith('✔') ||
        trimmed.startsWith('❌') ||
        trimmed.startsWith('X') ||
        trimmed.startsWith('>')
      ) {
        const parts = trimmed.split('|');
        let userPart = parts[0] ? parts[0].trim() : '';
        let passPart = parts[1] ? parts[1].replace(/user\/senha:\s*/i, '').trim() : '';

        // Status & User extraction
        const isInactive = userPart.startsWith('❌') || userPart.startsWith('X');
        userPart = userPart.replace(/^[✔❌X>]\s*/, '').trim();

        if (!userPart) continue;

        totalEntries++;
        const userId = 'user-' + totalEntries + '-' + userPart.replace(/[^a-zA-Z0-9]/g, '_');

        const userObj = {
          id: userId,
          user: userPart,
          pass: passPart,
          status: isInactive ? 'inactive' : 'active',
          deptName: currentDeptName,
          subSection: currentSubSection
        };

        if (!deptMap.has(currentDeptName)) {
          const deptObj = {
            name: currentDeptName,
            subSections: new Map(),
            directUsers: []
          };
          deptMap.set(currentDeptName, deptObj);
          departments.push(deptObj);
        }

        const dept = deptMap.get(currentDeptName);

        if (currentSubSection) {
          if (!dept.subSections.has(currentSubSection)) {
            dept.subSections.set(currentSubSection, []);
          }
          dept.subSections.get(currentSubSection).push(userObj);
        } else {
          dept.directUsers.push(userObj);
        }
      }
    }

    return { departments, totalEntries };
  }

  renderExplorer() {
    if (!this.departmentsContainer) return;
    const { departments, totalEntries } = this.parseLogins(this.rawText);

    if (this.totalEntriesCount) this.totalEntriesCount.textContent = totalEntries;

    const query = this.searchTerm.toLowerCase().trim();
    let visibleEntries = 0;
    let html = '';

    departments.forEach((dept) => {
      const deptHtml = this.renderDepartmentNode(dept, query);
      if (deptHtml.matchedCount > 0) {
        visibleEntries += deptHtml.matchedCount;
        html += deptHtml.html;
      }
    });

    if (this.filteredEntriesCount) this.filteredEntriesCount.textContent = visibleEntries;

    if (visibleEntries === 0) {
      this.departmentsContainer.innerHTML = `
        <div class="py-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <i class="fa-solid fa-user-xmark text-2xl text-slate-400 mb-2"></i>
          <h4 class="font-bold text-sm text-slate-700 dark:text-slate-300">Nenhum login encontrado</h4>
          <p class="text-xs text-slate-400 dark:text-slate-500">Tente buscar por outro termo, e-mail ou departamento.</p>
        </div>
      `;
    } else {
      this.departmentsContainer.innerHTML = html;
      this.bindExplorerEvents();
    }
  }

  renderDepartmentNode(dept, query) {
    let matchedCount = 0;
    let contentHtml = '';

    // 1. Direct Users in Department
    if (dept.directUsers && dept.directUsers.length > 0) {
      const filteredUsers = dept.directUsers.filter((u) => this.matchUser(u, query, dept.name));
      matchedCount += filteredUsers.length;
      if (filteredUsers.length > 0) {
        contentHtml += `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            ${filteredUsers.map((u) => this.renderUserCard(u)).join('')}
          </div>
        `;
      }
    }

    // 2. Sub-Sections (e.g. SUPERVISOR(A), Espinha 01, Espinha 02, etc.)
    if (dept.subSections && dept.subSections.size > 0) {
      for (let [subName, users] of dept.subSections.entries()) {
        const filteredUsers = users.filter((u) => this.matchUser(u, query, `${dept.name} ${subName}`));
        matchedCount += filteredUsers.length;

        if (filteredUsers.length > 0) {
          contentHtml += `
            <div class="mb-4 bg-slate-50/60 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/50 dark:border-slate-800/60">
              <div class="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
                <h5 class="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <i class="fa-solid fa-layer-group text-blue-500 text-[10px]"></i>
                  <span>${subName}</span>
                </h5>
                <span class="text-[10px] font-mono px-2 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                  ${filteredUsers.length} ${filteredUsers.length === 1 ? 'conta' : 'contas'}
                </span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                ${filteredUsers.map((u) => this.renderUserCard(u)).join('')}
              </div>
            </div>
          `;
        }
      }
    }

    if (matchedCount === 0) {
      return { html: '', matchedCount: 0 };
    }

    const html = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-5">
        
        <!-- Department Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shadow-2xs shrink-0">
              <i class="fa-solid fa-building-user text-sm"></i>
            </div>
            <div>
              <h4 class="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                ${dept.name}
              </h4>
              <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                ${matchedCount} ${matchedCount === 1 ? 'conta listada' : 'contas listadas'}
              </span>
            </div>
          </div>

          <button
            type="button"
            class="add-user-in-dept-btn self-start sm:self-auto px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            data-dept="${dept.name}"
            title="Adicionar usuário neste departamento"
          >
            <i class="fa-solid fa-plus text-[10px] text-blue-500"></i>
            <span>Adicionar</span>
          </button>
        </div>

        ${contentHtml}
      </div>
    `;

    return { html, matchedCount };
  }

  matchUser(u, query, contextText) {
    if (!query) return true;
    const full = `${u.user} ${u.pass} ${u.deptName} ${u.subSection || ''} ${contextText}`.toLowerCase();
    return full.includes(query);
  }

  renderUserCard(u) {
    const isInactive = u.status === 'inactive';
    const isRevealed = this.revealedPasswords.has(u.id);
    const displayPass = isRevealed ? u.pass : '••••••••••••';

    return `
      <div class="bg-white dark:bg-slate-950/80 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/90 shadow-2xs hover:border-blue-500/50 flex flex-col justify-between gap-2 transition-all">
        
        <!-- Top: User info & Delete button -->
        <div class="flex items-start justify-between gap-2 min-w-0">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="w-2.5 h-2.5 rounded-full ${isInactive ? 'bg-red-500' : 'bg-emerald-500'} shrink-0 shadow-2xs" title="${isInactive ? 'Inativo' : 'Ativo'}"></span>
            <span class="font-bold text-xs text-slate-900 dark:text-slate-100 truncate select-all" title="${u.user}">
              ${u.user}
            </span>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <!-- Copy User -->
            <button
              type="button"
              class="copy-login-btn text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copiar usuário"
              data-copy="${u.user}"
            >
              <i class="fa-regular fa-copy text-xs"></i>
            </button>

            <!-- Delete User -->
            <button
              type="button"
              class="delete-user-btn text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
              title="Excluir usuário"
              data-user="${u.user}"
            >
              <i class="fa-regular fa-trash-can text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Bottom: Masked Password with Eye Toggle & Copy -->
        <div class="flex items-center justify-between gap-2 min-w-0 bg-slate-50 dark:bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 font-mono text-xs">
          <div class="flex items-center gap-1.5 min-w-0 flex-1">
            <i class="fa-solid fa-lock text-[10px] text-slate-400 shrink-0"></i>
            <span class="font-semibold text-slate-800 dark:text-slate-200 truncate select-all tracking-wider" title="${isRevealed ? u.pass : 'Clique no olho para revelar'}">
              ${displayPass || '<em class="text-slate-400 text-[10px] font-sans">Sem senha</em>'}
            </span>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <!-- Toggle Eye Visibility -->
            <button
              type="button"
              class="toggle-pass-btn p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="${isRevealed ? 'Ocultar senha' : 'Ver senha'}"
              data-id="${u.id}"
            >
              <i class="${isRevealed ? 'fa-regular fa-eye-slash text-xs text-blue-500' : 'fa-regular fa-eye text-xs'}"></i>
            </button>

            <!-- Copy Password (Plaintext) -->
            <button
              type="button"
              class="copy-login-btn p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copiar senha"
              data-copy="${u.pass}"
            >
              <i class="fa-regular fa-copy text-xs"></i>
            </button>
          </div>
        </div>

      </div>
    `;
  }

  bindExplorerEvents() {
    // Copy button
    this.departmentsContainer.querySelectorAll('.copy-login-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-copy');
        if (text) {
          this.copyToClipboard(text, `"${text}" copiado!`);
        }
      });
    });

    // Eye toggle button
    this.departmentsContainer.querySelectorAll('.toggle-pass-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          if (this.revealedPasswords.has(id)) {
            this.revealedPasswords.delete(id);
          } else {
            this.revealedPasswords.add(id);
          }
          this.renderExplorer();
        }
      });
    });

    // Delete user button
    this.departmentsContainer.querySelectorAll('.delete-user-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const user = btn.getAttribute('data-user');
        if (user) {
          this.handleDeleteUser(user);
        }
      });
    });

    // Add user in specific department
    this.departmentsContainer.querySelectorAll('.add-user-in-dept-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dept = btn.getAttribute('data-dept');
        this.openAddModal(dept);
      });
    });
  }

  updateEditorCounters() {
    const text = this.editorTextarea?.value || '';
    const lines = text ? text.split('\n').length : 1;
    const chars = text.length;

    if (this.editorLineCount) this.editorLineCount.textContent = `Linhas: ${lines}`;
    if (this.editorCharCount) this.editorCharCount.textContent = `Caracteres: ${chars}`;
  }

  indicateSaving() {
    if (this.saveStatus) {
      this.saveStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-blue-500 text-xs"></i><span>Salvando...</span>';
      this.saveStatus.className = 'text-xs text-blue-500 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60';
    }
  }

  indicateSaved(label = 'Salvo no servidor central') {
    if (this.saveStatus) {
      this.saveStatus.innerHTML = `<i class="fa-solid fa-cloud-arrow-up text-emerald-500 text-xs"></i><span>${label}</span>`;
      this.saveStatus.className = 'text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60';
    }
  }

  downloadAsTxt() {
    const blob = new Blob([this.rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapeamento-organizacional-logins-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Arquivo de mapeamento .txt exportado!');
  }

  handleImportTxt(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target.result;
        if (typeof content === 'string') {
          await this.saveLoginsText(content);
          if (this.editorTextarea) this.editorTextarea.value = content;
          this.showToast('Mapeamento importado e sincronizado com o servidor!');
          this.render();
        }
      } catch (err) {
        alert('Erro ao carregar arquivo de texto: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  copyToClipboard(text, successMsg) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(successMsg || 'Copiado para a área de transferência!');
    }).catch(() => {
      this.showToast('Falha ao copiar.');
    });
  }

  showToast(msg) {
    if (!this.toastContainer || !this.toastMessage) return;

    this.toastMessage.textContent = msg;
    this.toastContainer.classList.remove('translate-y-20', 'opacity-0');
    this.toastContainer.classList.add('translate-y-0', 'opacity-100');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastContainer.classList.add('translate-y-20', 'opacity-0');
      this.toastContainer.classList.remove('translate-y-0', 'opacity-100');
    }, 2800);
  }

  render() {
    this.renderExplorer();
    if (this.editorTextarea) {
      this.editorTextarea.value = this.rawText;
      this.updateEditorCounters();
    }
  }
}

// Initialize on DOM ready with authentication gate
document.addEventListener('DOMContentLoaded', () => {
  AuthManager.initAuthGate(() => {
    window.loginsApp = new LoginsApp();
  });
});
