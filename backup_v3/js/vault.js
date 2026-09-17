/**
 * Módulo de Gerenciamento de Senhas Corporativas & Gerador de Senhas (Cofre de TI)
 * Conectado à API segura do servidor (/api/vault) - Zero senhas estáticas no front-end!
 */

import { api } from './api.js';

export class PasswordGenerator {
  static generate({
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = {}) {
    const charsUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charsLower = 'abcdefghijklmnopqrstuvwxyz';
    const charsNum = '0123456789';
    const charsSym = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let pool = '';
    let guaranteed = '';

    if (uppercase) {
      pool += charsUpper;
      guaranteed += charsUpper[Math.floor(Math.random() * charsUpper.length)];
    }
    if (lowercase) {
      pool += charsLower;
      guaranteed += charsLower[Math.floor(Math.random() * charsLower.length)];
    }
    if (numbers) {
      pool += charsNum;
      guaranteed += charsNum[Math.floor(Math.random() * charsNum.length)];
    }
    if (symbols) {
      pool += charsSym;
      guaranteed += charsSym[Math.floor(Math.random() * charsSym.length)];
    }

    if (!pool) pool = charsLower + charsNum;

    let result = guaranteed;
    const remaining = Math.max(0, length - guaranteed.length);

    for (let i = 0; i < remaining; i++) {
      result += pool[Math.floor(Math.random() * pool.length)];
    }

    // Embaralha os caracteres
    return result
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }
}

export class VaultManager {
  constructor(showToastCallback) {
    this.showToast = showToastCallback;
    this.passwords = [];
    this.searchTerm = '';
    this.activeCategory = 'Todos';
    this.revealedSet = new Set();
    this.editingId = null;

    this.initDOMElements();
    this.bindEvents();
    this.loadPasswords();
  }

  async loadPasswords() {
    try {
      if (api.isAuthenticated()) {
        const data = await api.get('/api/vault');
        if (Array.isArray(data)) {
          this.passwords = data;
          this.render();
          return;
        }
      }
    } catch (e) {
      console.error('[Vault] Erro ao carregar senhas da API:', e);
    }
    this.passwords = [];
    this.render();
  }

  initDOMElements() {
    this.container = document.getElementById('vault-passwords-container');
    this.searchInput = document.getElementById('vault-search-input');
    this.searchClearBtn = document.getElementById('vault-search-clear-btn');
    this.categoriesContainer = document.getElementById('vault-categories-container');
    this.totalCounter = document.getElementById('vault-total-count');
    this.filteredCounter = document.getElementById('vault-filtered-count');

    // Modal Adicionar / Editar
    this.modal = document.getElementById('vault-modal');
    this.modalTitle = document.getElementById('vault-modal-title');
    this.modalForm = document.getElementById('vault-modal-form');
    this.openAddBtn = document.getElementById('open-add-password-btn');
    this.closeModalBtn = document.getElementById('vault-modal-close-btn');
    this.cancelModalBtn = document.getElementById('vault-modal-cancel-btn');

    // Modal Gerador de Senhas
    this.generatorModal = document.getElementById('generator-modal');
    this.openGeneratorBtn = document.getElementById('open-generator-btn');
    this.closeGeneratorBtn = document.getElementById('generator-modal-close-btn');
    this.genLengthRange = document.getElementById('gen-length-range');
    this.genLengthDisplay = document.getElementById('gen-length-display');
    this.genResultInput = document.getElementById('gen-result-input');
    this.genRefreshBtn = document.getElementById('gen-refresh-btn');
    this.genCopyBtn = document.getElementById('gen-copy-btn');
    this.genApplyBtn = document.getElementById('gen-apply-btn');

    // Opções do Gerador
    this.genOptUpper = document.getElementById('gen-opt-upper');
    this.genOptLower = document.getElementById('gen-opt-lower');
    this.genOptNumbers = document.getElementById('gen-opt-numbers');
    this.genOptSymbols = document.getElementById('gen-opt-symbols');
  }

  bindEvents() {
    // Busca
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
        this.render();
      });
    }

    if (this.searchClearBtn) {
      this.searchClearBtn.addEventListener('click', () => {
        this.searchTerm = '';
        this.searchInput.value = '';
        this.searchClearBtn.classList.add('hidden');
        this.render();
      });
    }

    // Modal de Adição
    if (this.openAddBtn) {
      this.openAddBtn.addEventListener('click', () => this.openModal());
    }
    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.cancelModalBtn) {
      this.cancelModalBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.modalForm) {
      this.modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSave();
      });
    }

    // Gerador de Senhas
    if (this.openGeneratorBtn) {
      this.openGeneratorBtn.addEventListener('click', () => this.openGenerator());
    }
    if (this.closeGeneratorBtn) {
      this.closeGeneratorBtn.addEventListener('click', () => this.closeGenerator());
    }
    if (this.genLengthRange) {
      this.genLengthRange.addEventListener('input', (e) => {
        if (this.genLengthDisplay) this.genLengthDisplay.textContent = e.target.value;
        this.generateNewPassword();
      });
    }

    const checkInputs = [this.genOptUpper, this.genOptLower, this.genOptNumbers, this.genOptSymbols];
    checkInputs.forEach((inp) => {
      if (inp) {
        inp.addEventListener('change', () => this.generateNewPassword());
      }
    });

    if (this.genRefreshBtn) {
      this.genRefreshBtn.addEventListener('click', () => this.generateNewPassword());
    }
    if (this.genCopyBtn) {
      this.genCopyBtn.addEventListener('click', () => {
        const val = this.genResultInput?.value;
        if (val) {
          this.copyToClipboard(val, 'Senha gerada copiada para a área de transferência!');
        }
      });
    }
    if (this.genApplyBtn) {
      this.genApplyBtn.addEventListener('click', () => {
        const val = this.genResultInput?.value;
        if (val) {
          const passInput = document.getElementById('vault-password');
          if (passInput) passInput.value = val;
          this.showToast('Senha aplicada no formulário do cofre!');
          this.closeGenerator();
        }
      });
    }
  }

  openGenerator() {
    this.generateNewPassword();
    if (this.generatorModal) this.generatorModal.classList.remove('hidden');
  }

  closeGenerator() {
    if (this.generatorModal) this.generatorModal.classList.add('hidden');
  }

  generateNewPassword() {
    const len = parseInt(this.genLengthRange?.value || '16', 10);
    const pass = PasswordGenerator.generate({
      length: len,
      uppercase: this.genOptUpper?.checked ?? true,
      lowercase: this.genOptLower?.checked ?? true,
      numbers: this.genOptNumbers?.checked ?? true,
      symbols: this.genOptSymbols?.checked ?? true
    });
    if (this.genResultInput) this.genResultInput.value = pass;
  }

  openModal(item = null) {
    this.editingId = item ? item.id : null;
    if (this.modalTitle) {
      this.modalTitle.textContent = item ? 'Editar Senha Corporativa' : 'Cadastrar Nova Senha Corporativa';
    }

    const form = this.modalForm;
    if (form) {
      form.elements['vault-title'].value = item ? item.title : '';
      form.elements['vault-category'].value = item ? item.category : 'Wi-Fi';
      form.elements['vault-username'].value = item ? item.username : '';
      form.elements['vault-password'].value = item ? item.password : '';
      form.elements['vault-notes'].value = item ? item.notes || '' : '';
    }

    if (this.modal) this.modal.classList.remove('hidden');
  }

  closeModal() {
    if (this.modal) this.modal.classList.add('hidden');
    this.editingId = null;
  }

  async handleSave() {
    const form = this.modalForm;
    if (!form) return;

    const title = form.elements['vault-title'].value.trim();
    const category = form.elements['vault-category'].value.trim();
    const username = form.elements['vault-username'].value.trim();
    const password = form.elements['vault-password'].value.trim();
    const notes = form.elements['vault-notes'].value.trim();

    if (!title || !password) {
      alert('Por favor, informe pelo menos o Título/Serviço e a Senha.');
      return;
    }

    const payload = { title, category, username, password, notes };

    try {
      if (this.editingId) {
        await api.put(`/api/vault/${this.editingId}`, payload);
        this.showToast(`Senha "${title}" atualizada no servidor!`);
      } else {
        await api.post('/api/vault', payload);
        this.showToast(`Nova senha "${title}" cadastrada no cofre corporativo!`);
      }
      this.closeModal();
      await this.loadPasswords();
    } catch (err) {
      alert('Erro ao salvar no servidor: ' + err.message);
    }
  }

  async handleDelete(id) {
    const item = this.passwords.find((p) => p.id === id);
    if (!item) return;

    if (window.confirm(`Tem certeza que deseja remover a credencial "${item.title}" do cofre corporativo?`)) {
      try {
        await api.delete(`/api/vault/${id}`);
        this.showToast(`Credencial "${item.title}" removida do servidor.`);
        await this.loadPasswords();
      } catch (err) {
        alert('Erro ao excluir do servidor: ' + err.message);
      }
    }
  }

  getFilteredList() {
    const q = this.searchTerm.toLowerCase().trim();

    return this.passwords.filter((p) => {
      if (this.activeCategory !== 'Todos' && p.category !== this.activeCategory) {
        return false;
      }
      if (q) {
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchUser = p.username?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        const matchNotes = p.notes?.toLowerCase().includes(q);
        return matchTitle || matchUser || matchCat || matchNotes;
      }
      return true;
    });
  }

  renderCategories() {
    if (!this.categoriesContainer) return;
    const cats = ['Todos', 'Wi-Fi', 'Infra TI', 'Servidores', 'Contas / Web'];

    const counts = { Todos: this.passwords.length };
    this.passwords.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    this.categoriesContainer.innerHTML = cats
      .map((cat) => {
        const isActive = this.activeCategory === cat;
        const count = counts[cat] || 0;

        const activeClass = isActive
          ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800';

        const badgeClass = isActive
          ? 'bg-blue-700/60 text-white'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

        return `
          <button
            type="button"
            data-cat="${cat}"
            class="vault-cat-btn px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeClass}"
          >
            <span>${cat}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-semibold ${badgeClass}">${count}</span>
          </button>
        `;
      })
      .join('');

    this.categoriesContainer.querySelectorAll('.vault-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeCategory = btn.getAttribute('data-cat') || 'Todos';
        this.render();
      });
    });
  }

  renderCards() {
    if (!this.container) return;

    const list = this.getFilteredList();
    const isAdmin = api.isAdmin();

    if (this.totalCounter) this.totalCounter.textContent = this.passwords.length;
    if (this.filteredCounter) this.filteredCounter.textContent = list.length;

    if (list.length === 0) {
      this.container.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
            <i class="fa-solid fa-key text-2xl"></i>
          </div>
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Nenhuma credencial encontrada</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            ${this.searchTerm ? 'Tente buscar com outro termo ou limpe os filtros.' : 'Cadastre sua primeira senha corporativa usando o botão acima.'}
          </p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = list
      .map((item) => {
        const isRevealed = this.revealedSet.has(item.id);
        const displayedPass = isRevealed ? item.password : '••••••••••••••••';

        let categoryIcon = 'fa-solid fa-key';
        let categoryColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';

        if (item.category === 'Wi-Fi') {
          categoryIcon = 'fa-solid fa-wifi';
          categoryColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        } else if (item.category === 'Infra TI') {
          categoryIcon = 'fa-solid fa-network-wired';
          categoryColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        } else if (item.category === 'Servidores') {
          categoryIcon = 'fa-solid fa-server';
          categoryColor = 'text-purple-500 bg-purple-500/10 border-purple-500/20';
        }

        return `
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            
            <div>
              <!-- Header do Cartão -->
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center border ${categoryColor}">
                    <i class="${categoryIcon} text-sm"></i>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white leading-snug">${item.title}</h4>
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full border ${categoryColor}">${item.category}</span>
                  </div>
                </div>

                <!-- Ações do Cartão (Editar / Excluir) -->
                <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    data-action="edit"
                    data-id="${item.id}"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                    title="Editar Credencial"
                  >
                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                  </button>
                  ${isAdmin ? `
                  <button
                    type="button"
                    data-action="delete"
                    data-id="${item.id}"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    title="Excluir Credencial"
                  >
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>
                  ` : ''}
                </div>
              </div>

              <!-- Usuário / Login (se houver) -->
              ${
                item.username
                  ? `
                <div class="mb-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div class="flex items-center gap-2 overflow-hidden">
                    <i class="fa-regular fa-user text-slate-400 text-xs shrink-0"></i>
                    <span class="font-mono text-xs text-slate-700 dark:text-slate-300 truncate">${item.username}</span>
                  </div>
                  <button
                    type="button"
                    data-copy="${item.username}"
                    data-label="Usuário"
                    class="vault-copy-btn text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-1.5 py-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors shrink-0"
                    title="Copiar Usuário"
                  >
                    <i class="fa-regular fa-copy"></i>
                  </button>
                </div>
              `
                  : ''
              }

              <!-- Senha Protegida -->
              <div class="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between mb-3">
                <div class="flex items-center gap-2 overflow-hidden">
                  <i class="fa-solid fa-lock text-amber-500 text-xs shrink-0"></i>
                  <span class="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate ${isRevealed ? '' : 'tracking-widest'}">
                    ${displayedPass}
                  </span>
                </div>
                
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    data-action="toggle-reveal"
                    data-id="${item.id}"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                    title="${isRevealed ? 'Ocultar Senha' : 'Ver Senha'}"
                  >
                    <i class="${isRevealed ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'} text-xs"></i>
                  </button>
                  <button
                    type="button"
                    data-copy="${item.password}"
                    data-label="Senha"
                    class="vault-copy-btn w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                    title="Copiar Senha"
                  >
                    <i class="fa-regular fa-copy text-xs"></i>
                  </button>
                </div>
              </div>

              <!-- Observações (se houver) -->
              ${
                item.notes
                  ? `
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                  <i class="fa-regular fa-note-sticky mr-1 text-[10px] text-slate-400"></i>${item.notes}
                </p>
              `
                  : ''
              }
            </div>

            <!-- Rodapé do Cartão -->
            <div class="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Atualizado: ${item.updatedAt || 'Recente'}</span>
              <span class="text-emerald-500 flex items-center gap-1 font-sans font-medium">
                <i class="fa-solid fa-shield-halved text-[9px]"></i> Servidor
              </span>
            </div>

          </div>
        `;
      })
      .join('');

    this.bindCardEvents();
  }

  bindCardEvents() {
    if (!this.container) return;

    // Ações de Editar e Excluir
    this.container.querySelectorAll('button[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = this.passwords.find((p) => p.id === id);
        if (item) this.openModal(item);
      });
    });

    this.container.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.handleDelete(id);
      });
    });

    // Alternar Visualização da Senha
    this.container.querySelectorAll('button[data-action="toggle-reveal"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          if (this.revealedSet.has(id)) {
            this.revealedSet.delete(id);
          } else {
            this.revealedSet.add(id);
          }
          this.renderCards();
        }
      });
    });

    // Copiar para área de transferência
    this.container.querySelectorAll('.vault-copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy');
        const label = btn.getAttribute('data-label') || 'Item';
        if (text) {
          this.copyToClipboard(text, `${label} copiado para a área de transferência!`);
        }
      });
    });
  }

  copyToClipboard(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(successMessage);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.showToast(successMessage);
      } catch (err) {
        console.error('Falha ao copiar:', err);
      }
      document.body.removeChild(textarea);
    }
  }

  render() {
    this.renderCategories();
    this.renderCards();
  }
}
