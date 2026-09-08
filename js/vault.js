/**
 * Módulo de Gerenciamento de Senhas Corporativas & Gerador de Senhas (Cofre de TI)
 */

const VAULT_STORAGE_KEY = 'vieiratech_vault_passwords_v1';

export const defaultVaultPasswords = [
  {
    id: 'pass-wifi-1',
    title: 'Wi-Fi - Diretoria & Gerência',
    category: 'Wi-Fi',
    username: 'VieiraCred_Diretoria',
    password: 'Dir@Cred#2026!Wf',
    notes: 'SSID oculto na rede corporativa 5GHz. Roteadores Ubiquiti.',
    updatedAt: '2026-03-01'
  },
  {
    id: 'pass-wifi-2',
    title: 'Wi-Fi - Operação & Geral',
    category: 'Wi-Fi',
    username: 'VieiraCred_Corporativo',
    password: 'Op3r@c4o#Vcred26',
    notes: 'VLAN 30 isolada. Distribuição via DHCP com controle de banda.',
    updatedAt: '2026-03-01'
  },
  {
    id: 'pass-wifi-3',
    title: 'Wi-Fi - Visitantes / Clientes',
    category: 'Wi-Fi',
    username: 'VieiraCred_Visitantes',
    password: 'B3m-Vindo@Vieira26',
    notes: 'Rede guest com isolamento de clientes (Client Isolation ativo).',
    updatedAt: '2026-03-01'
  },
  {
    id: 'pass-ti-1',
    title: 'Acesso Root - Servidores Linux (Debian / Proxmox)',
    category: 'Infra TI',
    username: 'root',
    password: 'R00t#Adm!Vtech2026',
    notes: 'Acesso apenas via rede de gerenciamento ou SSH key.',
    updatedAt: '2026-02-15'
  },
  {
    id: 'pass-ti-2',
    title: 'Conta Admin - Active Directory / Controlador de Domínio',
    category: 'Infra TI',
    username: 'CORP\\administrator',
    password: '$Adm1n@DC01#VieiraTech',
    notes: 'DC primário (ad-dc01.corp.local). Não usar em estações comuns.',
    updatedAt: '2026-02-10'
  },
  {
    id: 'pass-ti-3',
    title: 'MikroTik Borda - Usuário Winbox Master',
    category: 'Infra TI',
    username: 'admin_vieiratech',
    password: 'M1kr0#B0rd4!2026Tech',
    notes: 'Porta Winbox alterada para 8728. IP 192.168.88.1.',
    updatedAt: '2026-02-20'
  },
  {
    id: 'pass-ti-4',
    title: 'Switch Core Gigabit - Gerenciamento Web',
    category: 'Infra TI',
    username: 'admin',
    password: 'Sw1tch#Core!Vtech26',
    notes: 'IP 192.168.88.2. VLAN de gerência 99.',
    updatedAt: '2026-01-20'
  },
  {
    id: 'pass-srv-1',
    title: 'TrueNAS Enterprise - Console Web GUI',
    category: 'Servidores',
    username: 'admin',
    password: 'Tru3N4s#St0r@g3!26',
    notes: 'Pool ZFS de backup e compartilhamento corporativo.',
    updatedAt: '2026-02-25'
  },
  {
    id: 'pass-srv-2',
    title: 'Portainer CE / Docker Stacks',
    category: 'Servidores',
    username: 'admin',
    password: 'P0rt41n3r#D0ck3r!26',
    notes: 'Gerenciador dos containers n8n, Zabbix e GLPI.',
    updatedAt: '2026-02-28'
  },
  {
    id: 'pass-srv-3',
    title: 'pfSense Firewall - Painel HTTPS',
    category: 'Servidores',
    username: 'admin',
    password: 'pfS3ns3#F1r3w4ll!26',
    notes: 'IP de gestão: 192.168.88.254:8443.',
    updatedAt: '2026-02-18'
  }
];

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
    const charsSym = '!@#$%^&*()_+~`|}{[]:;?><,.-=';

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

    // Shuffle characters
    return result
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }
}

export class VaultManager {
  constructor(showToastCallback) {
    this.showToast = showToastCallback;
    this.passwords = this.loadPasswords();
    this.searchTerm = '';
    this.activeCategory = 'Todos';
    this.revealedSet = new Set();
    this.editingId = null;

    this.initDOMElements();
    this.bindEvents();
  }

  loadPasswords() {
    try {
      const saved = localStorage.getItem(VAULT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler cofre de senhas:', e);
    }
    return [...defaultVaultPasswords];
  }

  savePasswords() {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(this.passwords));
    } catch (e) {
      console.error('Erro ao salvar cofre de senhas:', e);
    }
  }

  initDOMElements() {
    this.container = document.getElementById('vault-passwords-container');
    this.searchInput = document.getElementById('vault-search-input');
    this.searchClearBtn = document.getElementById('vault-search-clear-btn');
    this.categoriesContainer = document.getElementById('vault-categories-container');
    this.totalCounter = document.getElementById('vault-total-count');
    this.filteredCounter = document.getElementById('vault-filtered-count');

    // Add / Edit Modal
    this.modal = document.getElementById('vault-modal');
    this.modalTitle = document.getElementById('vault-modal-title');
    this.modalForm = document.getElementById('vault-modal-form');
    this.openAddBtn = document.getElementById('open-add-password-btn');
    this.closeModalBtn = document.getElementById('vault-modal-close-btn');
    this.cancelModalBtn = document.getElementById('vault-modal-cancel-btn');

    // Generator Modal / Popover
    this.generatorModal = document.getElementById('generator-modal');
    this.openGeneratorBtn = document.getElementById('open-generator-btn');
    this.closeGeneratorBtn = document.getElementById('generator-modal-close-btn');
    this.genLengthRange = document.getElementById('gen-length-range');
    this.genLengthDisplay = document.getElementById('gen-length-display');
    this.genResultInput = document.getElementById('gen-result-input');
    this.genRefreshBtn = document.getElementById('gen-refresh-btn');
    this.genCopyBtn = document.getElementById('gen-copy-btn');
    this.genApplyBtn = document.getElementById('gen-apply-btn');

    // Generator options
    this.genOptUpper = document.getElementById('gen-opt-upper');
    this.genOptLower = document.getElementById('gen-opt-lower');
    this.genOptNumbers = document.getElementById('gen-opt-numbers');
    this.genOptSymbols = document.getElementById('gen-opt-symbols');
  }

  bindEvents() {
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

    // Add Modal
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

    // Password Generator
    if (this.openGeneratorBtn) {
      this.openGeneratorBtn.addEventListener('click', () => this.openGenerator());
    }
    if (this.closeGeneratorBtn) {
      this.closeGeneratorBtn.addEventListener('click', () => this.closeGenerator());
    }
    if (this.genLengthRange && this.genLengthDisplay) {
      this.genLengthRange.addEventListener('input', (e) => {
        this.genLengthDisplay.textContent = e.target.value;
        this.generateNewPassword();
      });
    }
    [this.genOptUpper, this.genOptLower, this.genOptNumbers, this.genOptSymbols].forEach((el) => {
      if (el) el.addEventListener('change', () => this.generateNewPassword());
    });
    if (this.genRefreshBtn) {
      this.genRefreshBtn.addEventListener('click', () => this.generateNewPassword());
    }
    if (this.genCopyBtn) {
      this.genCopyBtn.addEventListener('click', () => {
        if (this.genResultInput && this.genResultInput.value) {
          this.copyToClipboard(this.genResultInput.value, 'Senha gerada copiada com sucesso!');
        }
      });
    }
    if (this.genApplyBtn) {
      this.genApplyBtn.addEventListener('click', () => {
        if (this.genResultInput && this.genResultInput.value) {
          const passInput = document.getElementById('vault-form-password');
          if (passInput) {
            passInput.value = this.genResultInput.value;
          }
          this.closeGenerator();
          if (this.modal && this.modal.classList.contains('hidden')) {
            this.openModal();
          }
          this.showToast('Senha gerada aplicada no formulário!');
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
    const length = parseInt(this.genLengthRange?.value || '16', 10);
    const uppercase = this.genOptUpper?.checked ?? true;
    const lowercase = this.genOptLower?.checked ?? true;
    const numbers = this.genOptNumbers?.checked ?? true;
    const symbols = this.genOptSymbols?.checked ?? true;

    const pass = PasswordGenerator.generate({ length, uppercase, lowercase, numbers, symbols });
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

  handleSave() {
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

    const today = new Date().toISOString().slice(0, 10);

    if (this.editingId) {
      this.passwords = this.passwords.map((p) => {
        if (p.id === this.editingId) {
          return { ...p, title, category, username, password, notes, updatedAt: today };
        }
        return p;
      });
      this.showToast(`Senha "${title}" atualizada!`);
    } else {
      const newItem = {
        id: 'pass-' + Date.now(),
        title,
        category,
        username,
        password,
        notes,
        updatedAt: today
      };
      this.passwords.unshift(newItem);
      this.showToast(`Nova senha "${title}" cadastrada no cofre!`);
    }

    this.savePasswords();
    this.closeModal();
    this.render();
  }

  handleDelete(id) {
    const item = this.passwords.find((p) => p.id === id);
    if (!item) return;

    if (window.confirm(`Tem certeza que deseja remover a credencial "${item.title}" do cofre?`)) {
      this.passwords = this.passwords.filter((p) => p.id !== id);
      this.savePasswords();
      this.showToast(`Credencial "${item.title}" removida.`);
      this.render();
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
            <span class="text-[10px] px-1.5 py-0.2 rounded-md font-mono font-semibold ${badgeClass}">${count}</span>
          </button>
        `;
      })
      .join('');

    this.categoriesContainer.querySelectorAll('.vault-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeCategory = btn.getAttribute('data-cat');
        this.render();
      });
    });
  }

  getCategoryBadge(cat) {
    switch (cat) {
      case 'Wi-Fi':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20';
      case 'Infra TI':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'Servidores':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    }
  }

  getCategoryIcon(cat) {
    switch (cat) {
      case 'Wi-Fi':
        return 'fa-solid fa-wifi text-cyan-500';
      case 'Infra TI':
        return 'fa-solid fa-server text-blue-500';
      case 'Servidores':
        return 'fa-solid fa-hard-drive text-purple-500';
      default:
        return 'fa-solid fa-key text-amber-500';
    }
  }

  renderCards() {
    if (!this.container) return;
    const items = this.getFilteredList();

    if (this.totalCounter) this.totalCounter.textContent = this.passwords.length;
    if (this.filteredCounter) this.filteredCounter.textContent = items.length;

    if (items.length === 0) {
      this.container.innerHTML = `
        <div class="col-span-full py-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <i class="fa-solid fa-key text-3xl text-slate-400 mb-2"></i>
          <h4 class="font-bold text-sm text-slate-800 dark:text-slate-200">Nenhuma credencial encontrada</h4>
          <p class="text-xs text-slate-400 dark:text-slate-500">Tente buscar por outro termo ou cadastre uma nova senha.</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = items
      .map((item) => {
        const isRevealed = this.revealedSet.has(item.id);
        const displayPass = isRevealed ? item.password : '••••••••••••';
        const catBadge = this.getCategoryBadge(item.category);
        const catIcon = this.getCategoryIcon(item.category);

        return `
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-xs flex flex-col justify-between transition-all" data-id="${item.id}">
            
            <!-- Top Section -->
            <div>
              <div class="flex items-start justify-between gap-2.5 mb-2.5">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm shrink-0 shadow-2xs">
                    <i class="${catIcon}"></i>
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate" title="${item.title}">
                      ${item.title}
                    </h4>
                    <span class="text-[10px] font-semibold px-2 py-0.2 rounded-md ${catBadge}">
                      ${item.category}
                    </span>
                  </div>
                </div>

                <!-- Card Actions (Edit, Delete) -->
                <div class="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    class="vault-edit-btn p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Editar credencial"
                    data-id="${item.id}"
                  >
                    <i class="fa-regular fa-pen-to-square"></i>
                  </button>
                  <button
                    type="button"
                    class="vault-delete-btn p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Excluir credencial"
                    data-id="${item.id}"
                  >
                    <i class="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </div>

              <!-- Username / SSID Row -->
              ${
                item.username
                  ? `
                <div class="mb-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 font-mono text-xs">
                  <div class="flex items-center gap-1.5 min-w-0 flex-1">
                    <span class="text-[10px] text-slate-400 font-sans select-none">Usuário:</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-100 truncate select-all" title="${item.username}">
                      ${item.username}
                    </span>
                  </div>
                  <button
                    type="button"
                    class="vault-copy-btn p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer shrink-0"
                    title="Copiar usuário"
                    data-copy="${item.username}"
                  >
                    <i class="fa-regular fa-copy text-xs"></i>
                  </button>
                </div>
              `
                  : ''
              }

              <!-- Password Row with Eye & Copy -->
              <div class="mb-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 font-mono text-xs">
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                  <i class="fa-solid fa-lock text-[10px] text-slate-400 shrink-0"></i>
                  <span class="font-semibold text-slate-800 dark:text-slate-100 truncate select-all tracking-wider" title="${isRevealed ? item.password : 'Clique no olho para revelar'}">
                    ${displayPass}
                  </span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    class="vault-toggle-eye-btn p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    title="${isRevealed ? 'Ocultar senha' : 'Ver senha'}"
                    data-id="${item.id}"
                  >
                    <i class="${isRevealed ? 'fa-regular fa-eye-slash text-blue-500' : 'fa-regular fa-eye'} text-xs"></i>
                  </button>
                  <button
                    type="button"
                    class="vault-copy-btn p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    title="Copiar senha"
                    data-copy="${item.password}"
                  >
                    <i class="fa-regular fa-copy text-xs"></i>
                  </button>
                </div>
              </div>

              <!-- Notes (Optional) -->
              ${
                item.notes
                  ? `
                <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed bg-slate-100/60 dark:bg-slate-800/40 p-2 rounded-lg">
                  ${item.notes}
                </p>
              `
                  : ''
              }
            </div>

            <!-- Footer date -->
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Atualizado:</span>
              <span>${item.updatedAt || 'Recente'}</span>
            </div>

          </div>
        `;
      })
      .join('');

    this.bindCardEvents();
  }

  bindCardEvents() {
    // Copy button
    this.container.querySelectorAll('.vault-copy-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-copy');
        if (text) {
          this.copyToClipboard(text, 'Copiado para a área de transferência!');
        }
      });
    });

    // Eye toggle
    this.container.querySelectorAll('.vault-toggle-eye-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
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

    // Edit
    this.container.querySelectorAll('.vault-edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const item = this.passwords.find((p) => p.id === id);
        if (item) this.openModal(item);
      });
    });

    // Delete
    this.container.querySelectorAll('.vault-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.handleDelete(id);
      });
    });
  }

  copyToClipboard(text, msg) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(msg || 'Copiado!');
    }).catch(() => {
      this.showToast('Falha ao copiar.');
    });
  }

  render() {
    this.renderCategories();
    this.renderCards();
  }
}
