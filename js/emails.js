/**
 * Módulo de Gerenciamento de E-mails e Senhas dos Colaboradores
 * Integrado ao Cofre de Senhas da VieiraCred (/api/employee-emails)
 */

import { api } from './api.js';

export function getDepartmentStyle(dept) {
  const d = (dept || '').toUpperCase();
  if (d.includes('DIRETORIA') || d.includes('CEO')) {
    return {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/25',
      icon: 'fa-solid fa-crown',
      gradient: 'from-purple-600 to-indigo-600'
    };
  }
  if (d.includes('FINAN')) {
    return {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
      icon: 'fa-solid fa-coins',
      gradient: 'from-emerald-600 to-teal-600'
    };
  }
  if (d.includes('RH') || d.includes('DP')) {
    return {
      bg: 'bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/25',
      icon: 'fa-solid fa-id-card-clip',
      gradient: 'from-pink-600 to-rose-600'
    };
  }
  if (d.includes('TI') || d.includes('VIEIRATECH')) {
    return {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/25',
      icon: 'fa-solid fa-microchip',
      gradient: 'from-blue-600 to-cyan-600'
    };
  }
  if (d.includes('MKT') || d.includes('MARKETING')) {
    return {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/25',
      icon: 'fa-solid fa-bullhorn',
      gradient: 'from-amber-600 to-orange-600'
    };
  }
  if (d.includes('RECEP')) {
    return {
      bg: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/25',
      icon: 'fa-solid fa-bell-concierge',
      gradient: 'from-teal-600 to-emerald-600'
    };
  }
  if (d.includes('PLANEJAMENTO')) {
    return {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
      icon: 'fa-solid fa-chart-line',
      gradient: 'from-indigo-600 to-violet-600'
    };
  }
  if (d.includes('GERENCIA')) {
    return {
      bg: 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/25',
      icon: 'fa-solid fa-user-tie',
      gradient: 'from-violet-600 to-purple-600'
    };
  }
  if (d.includes('QUALIDADE') || d.includes('MESA')) {
    return {
      bg: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/25',
      icon: 'fa-solid fa-clipboard-check',
      gradient: 'from-sky-600 to-blue-600'
    };
  }
  if (d.includes('EXPANDE')) {
    return {
      bg: 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/25',
      icon: 'fa-solid fa-rocket',
      gradient: 'from-orange-600 to-amber-600'
    };
  }
  if (d.includes('BACKOFFICE')) {
    return {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
      icon: 'fa-solid fa-headset',
      gradient: 'from-cyan-600 to-blue-600'
    };
  }
  if (d.includes('OPERAÇÃO') || d.includes('OPERACAO')) {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/25',
      icon: 'fa-solid fa-phone-volume',
      gradient: 'from-rose-600 to-red-600'
    };
  }
  return {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/25',
    icon: 'fa-solid fa-user',
    gradient: 'from-slate-600 to-slate-700'
  };
}

export function getInitials(name) {
  if (!name) return 'VT';
  const clean = name.replace(/\([^)]*\)/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'VT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export class EmployeeEmailsManager {
  constructor(showToastCallback, initialViewMode = 'grid') {
    this.showToast = showToastCallback;
    this.viewMode = initialViewMode;
    this.emails = [];
    this.searchTerm = '';
    this.activeDepartment = 'Todos';
    this.revealedSet = new Set();
    this.editingId = null;
    this.activeSubtab = 'credentials'; // 'credentials' | 'emails'

    this.initDOMElements();
    this.bindEvents();
    this.loadEmails();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.renderCards();
  }

  initDOMElements() {
    this.container = document.getElementById('emails-cards-container');
    this.departmentsContainer = document.getElementById('emails-departments-container');
    this.searchInput = document.getElementById('emails-search-input');
    this.searchClearBtn = document.getElementById('emails-search-clear-btn');
    this.totalCounter = document.getElementById('emails-total-count');
    this.filteredCounter = document.getElementById('emails-filtered-count');
    this.tabBadge = document.getElementById('vault-tab-emails-count');

    // Sub-abas de alternância dentro do Cofre
    this.subtabCredentialsBtn = document.getElementById('vault-subtab-credentials-btn');
    this.subtabEmailsBtn = document.getElementById('vault-subtab-emails-btn');
    this.subviewCredentials = document.getElementById('vault-subview-credentials');
    this.subviewEmails = document.getElementById('vault-subview-emails');

    // Botões de topo
    this.openAddBtn = document.getElementById('open-add-email-btn');
    this.openGeneratorBtn = document.getElementById('open-email-generator-btn');
    this.exportCsvBtn = document.getElementById('export-emails-csv-btn');

    // Modal E-mail
    this.modal = document.getElementById('email-modal');
    this.modalTitle = document.getElementById('email-modal-title');
    this.modalForm = document.getElementById('email-modal-form');
    this.closeModalBtn = document.getElementById('email-modal-close-btn');
    this.cancelModalBtn = document.getElementById('email-modal-cancel-btn');
    this.adminOnlyWrapper = document.getElementById('email-admin-only-wrapper');
    this.adminOnlyCheckbox = document.getElementById('email-form-admin-only');
    this.modalOpenGeneratorBtn = document.getElementById('open-generator-from-email-btn');
    this.modalPasswordInput = document.getElementById('email-form-password');
    this.modalTogglePassBtn = document.getElementById('toggle-email-modal-pass-btn');
  }

  bindEvents() {
    // Alternância de sub-abas dentro do Cofre
    if (this.subtabCredentialsBtn) {
      this.subtabCredentialsBtn.addEventListener('click', () => this.switchSubTab('credentials'));
    }
    if (this.subtabEmailsBtn) {
      this.subtabEmailsBtn.addEventListener('click', () => this.switchSubTab('emails'));
    }

    // Busca de e-mails
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

    // Botão Adicionar E-mail
    if (this.openAddBtn) {
      this.openAddBtn.addEventListener('click', () => this.openModal());
    }

    // Botão Gerador de Senhas no Hero
    if (this.openGeneratorBtn) {
      this.openGeneratorBtn.addEventListener('click', () => {
        const genBtn = document.getElementById('open-generator-btn');
        if (genBtn) genBtn.click();
      });
    }

    // Botão Gerar Senha dentro do Modal de E-mail
    if (this.modalOpenGeneratorBtn) {
      this.modalOpenGeneratorBtn.addEventListener('click', () => {
        const genBtn = document.getElementById('open-generator-btn');
        if (genBtn) genBtn.click();
      });
    }

    // Toggle de visualização de senha no modal
    if (this.modalTogglePassBtn && this.modalPasswordInput) {
      this.modalTogglePassBtn.addEventListener('click', () => {
        const isPass = this.modalPasswordInput.type === 'password';
        this.modalPasswordInput.type = isPass ? 'text' : 'password';
        const icon = this.modalTogglePassBtn.querySelector('i');
        if (icon) {
          icon.className = isPass ? 'fa-solid fa-eye-slash text-xs' : 'fa-solid fa-eye text-xs';
        }
      });
    }

    // Fechar Modal
    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.cancelModalBtn) {
      this.cancelModalBtn.addEventListener('click', () => this.closeModal());
    }

    // Salvar Formulário
    if (this.modalForm) {
      this.modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSave();
      });
    }

    // Exportar CSV
    if (this.exportCsvBtn) {
      this.exportCsvBtn.addEventListener('click', () => this.exportCSV());
    }

    // Delegação de eventos no container de cards
    if (this.container) {
      this.container.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const action = target.getAttribute('data-action');
        const id = target.getAttribute('data-id');

        if (action === 'toggle-reveal' && id) {
          this.togglePasswordReveal(id);
        } else if (action === 'copy-email') {
          const email = target.getAttribute('data-email');
          if (email) this.copyToClipboard(email, 'E-mail copiado!', target);
        } else if (action === 'copy-password') {
          const pass = target.getAttribute('data-password');
          if (pass) this.copyToClipboard(pass, 'Senha copiada!', target);
        } else if (action === 'edit' && id) {
          const item = this.emails.find((m) => m.id === id);
          if (item) this.openModal(item);
        } else if (action === 'delete' && id) {
          this.handleDelete(id);
        }
      });
    }
  }

  switchSubTab(tab) {
    this.activeSubtab = tab;

    if (!this.subtabCredentialsBtn || !this.subtabEmailsBtn) return;

    if (tab === 'credentials') {
      // Ativa sub-aba Credenciais
      this.subtabCredentialsBtn.className =
        'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs';
      this.subtabEmailsBtn.className =
        'px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer';

      if (this.subviewCredentials) this.subviewCredentials.classList.remove('hidden');
      if (this.subviewEmails) this.subviewEmails.classList.add('hidden');
    } else {
      // Ativa sub-aba E-mails
      this.subtabEmailsBtn.className =
        'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs';
      this.subtabCredentialsBtn.className =
        'px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer';

      if (this.subviewCredentials) this.subviewCredentials.classList.add('hidden');
      if (this.subviewEmails) this.subviewEmails.classList.remove('hidden');

      this.render();
    }
  }

  async loadEmails() {
    try {
      if (api.isAuthenticated()) {
        const data = await api.get('/api/employee-emails');
        if (Array.isArray(data)) {
          this.emails = data;
          this.updateBadges();
          this.render();
          return;
        }
      }
    } catch (e) {
      console.error('[EmployeeEmails] Erro ao carregar e-mails da API:', e);
    }
    this.emails = [];
    this.updateBadges();
    this.render();
  }

  updateBadges() {
    if (this.tabBadge) {
      this.tabBadge.textContent = this.emails.length;
    }
  }

  openModal(item = null) {
    this.editingId = item ? item.id : null;
    if (this.modalTitle) {
      this.modalTitle.textContent = item
        ? 'Editar E-mail de Colaborador'
        : 'Cadastrar Novo E-mail de Colaborador';
    }

    const form = this.modalForm;
    if (form) {
      form.elements['email-name'].value = item ? item.name : '';
      form.elements['email-address'].value = item ? item.email : '';
      form.elements['email-department'].value = item ? item.department || 'Geral' : '';
      form.elements['email-password'].value = item ? item.password : '';
      form.elements['email-notes'].value = item ? item.notes || '' : '';
    }

    // Reset password input type to password
    if (this.modalPasswordInput) {
      this.modalPasswordInput.type = 'password';
      if (this.modalTogglePassBtn) {
        const icon = this.modalTogglePassBtn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-eye text-xs';
      }
    }

    // Restrição adminOnly
    if (this.adminOnlyWrapper && this.adminOnlyCheckbox) {
      if (api.isAdmin()) {
        this.adminOnlyWrapper.classList.remove('hidden');
        this.adminOnlyCheckbox.checked = item ? !!item.adminOnly : false;
      } else {
        this.adminOnlyWrapper.classList.add('hidden');
        this.adminOnlyCheckbox.checked = false;
      }
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

    const name = form.elements['email-name'].value.trim();
    const email = form.elements['email-address'].value.trim();
    const department = form.elements['email-department'].value.trim() || 'Geral';
    const password = form.elements['email-password'].value.trim();
    const notes = form.elements['email-notes'].value.trim();
    const adminOnly =
      api.isAdmin() && this.adminOnlyCheckbox ? this.adminOnlyCheckbox.checked : false;

    if (!name || !email || !password) {
      alert('Por favor, preencha o Nome, E-mail Corporativo e Senha.');
      return;
    }

    const payload = { name, email, department, password, notes, adminOnly };

    try {
      if (this.editingId) {
        await api.put(`/api/employee-emails/${this.editingId}`, payload);
        this.showToast(`E-mail de "${name}" atualizado com sucesso!`);
      } else {
        await api.post('/api/employee-emails', payload);
        this.showToast(`Novo e-mail de "${name}" cadastrado com sucesso!`);
      }
      this.closeModal();
      await this.loadEmails();
    } catch (err) {
      alert('Erro ao salvar no servidor: ' + err.message);
    }
  }

  async handleDelete(id) {
    const item = this.emails.find((m) => m.id === id);
    if (!item) return;

    if (
      window.confirm(
        `Tem certeza que deseja remover o e-mail de "${item.name}" (${item.email}) do cofre?`
      )
    ) {
      try {
        await api.delete(`/api/employee-emails/${id}`);
        this.showToast(`E-mail de "${item.name}" removido com sucesso.`);
        await this.loadEmails();
      } catch (err) {
        alert('Erro ao excluir do servidor: ' + err.message);
      }
    }
  }

  togglePasswordReveal(id) {
    if (this.revealedSet.has(id)) {
      this.revealedSet.delete(id);
    } else {
      this.revealedSet.add(id);
    }
    this.renderCards();
  }

  copyToClipboard(text, message = 'Copiado para a área de transferência!', triggerBtn = null) {
    if (!navigator.clipboard) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } else {
      navigator.clipboard.writeText(text);
    }

    if (triggerBtn) {
      const icon = triggerBtn.querySelector('i');
      if (icon) {
        const originalClass = icon.className;
        icon.className = 'fa-solid fa-check text-emerald-500 text-xs';
        setTimeout(() => {
          icon.className = originalClass;
        }, 1200);
      }
    }

    this.showToast(message);
  }

  getFilteredList() {
    const q = this.searchTerm.toLowerCase().trim();

    return this.emails.filter((item) => {
      // Filtro por departamento
      if (this.activeDepartment !== 'Todos') {
        const dept = (item.department || '').trim();
        if (dept !== this.activeDepartment) return false;
      }

      // Filtro por texto
      if (!q) return true;

      const name = (item.name || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const dept = (item.department || '').toLowerCase();
      const notes = (item.notes || '').toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        dept.includes(q) ||
        notes.includes(q)
      );
    });
  }

  render() {
    this.renderDepartments();
    this.renderCards();

    const filtered = this.getFilteredList();
    if (this.totalCounter) this.totalCounter.textContent = this.emails.length;
    if (this.filteredCounter) this.filteredCounter.textContent = filtered.length;
    this.updateBadges();
  }

  renderDepartments() {
    if (!this.departmentsContainer) return;

    // Coleta todos os departamentos distintos
    const deptMap = new Map();
    this.emails.forEach((it) => {
      const d = (it.department || 'Geral').trim();
      deptMap.set(d, (deptMap.get(d) || 0) + 1);
    });

    const depts = Array.from(deptMap.keys()).sort();

    let html = `
      <button
        type="button"
        data-dept="Todos"
        class="dept-filter-btn px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
          this.activeDepartment === 'Todos'
            ? 'bg-blue-600 text-white font-bold shadow-xs'
            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
        }"
      >
        <span>Todos</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] ${
          this.activeDepartment === 'Todos'
            ? 'bg-white/20 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        }">${this.emails.length}</span>
      </button>
    `;

    depts.forEach((d) => {
      const count = deptMap.get(d);
      const isActive = this.activeDepartment === d;
      const style = getDepartmentStyle(d);

      html += `
        <button
          type="button"
          data-dept="${d}"
          class="dept-filter-btn px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
          }"
        >
          <i class="${style.icon} text-[10px] ${isActive ? 'text-white' : ''}"></i>
          <span>${d}</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] ${
            isActive
              ? 'bg-white/20 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }">${count}</span>
        </button>
      `;
    });

    this.departmentsContainer.innerHTML = html;

    // Listeners nos botões de departamento
    this.departmentsContainer.querySelectorAll('.dept-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeDepartment = btn.getAttribute('data-dept') || 'Todos';
        this.render();
      });
    });
  }

  renderCards() {
    if (!this.container) return;

    const items = this.getFilteredList();

    if (items.length === 0) {
      this.container.className = 'w-full';
      this.container.innerHTML = `
        <div class="col-span-full p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div class="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-4 text-2xl">
            <i class="fa-solid fa-envelope-open-text"></i>
          </div>
          <h4 class="text-base font-bold text-slate-900 dark:text-white mb-1">Nenhum e-mail de colaborador encontrado</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            ${
              this.searchTerm || this.activeDepartment !== 'Todos'
                ? 'Tente ajustar os filtros ou a busca para localizar o colaborador desejado.'
                : 'Cadastre o primeiro e-mail corporativo de colaborador para organizar os acessos da equipe.'
            }
          </p>
          ${
            this.searchTerm || this.activeDepartment !== 'Todos'
              ? `<button id="reset-email-filters-btn" type="button" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">Limpar Filtros</button>`
              : `<button id="empty-add-email-btn" type="button" class="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors cursor-pointer"><i class="fa-solid fa-plus text-xs mr-1.5"></i>Novo E-mail</button>`
          }
        </div>
      `;

      const resetBtn = document.getElementById('reset-email-filters-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.searchTerm = '';
          this.activeDepartment = 'Todos';
          if (this.searchInput) this.searchInput.value = '';
          if (this.searchClearBtn) this.searchClearBtn.classList.add('hidden');
          this.render();
        });
      }

      const emptyAddBtn = document.getElementById('empty-add-email-btn');
      if (emptyAddBtn) {
        emptyAddBtn.addEventListener('click', () => this.openModal());
      }

      return;
    }

    const isAdmin = api.isAdmin();

    if (this.viewMode === 'compact') {
      this.container.className = 'flex flex-col gap-2.5';
      this.container.innerHTML = items
        .map((item) => this.renderCompactRow(item, isAdmin))
        .join('');
    } else {
      this.container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
      this.container.innerHTML = items
        .map((item) => this.renderGridCard(item, isAdmin))
        .join('');
    }
  }

  renderGridCard(item, isAdmin) {
    const isRevealed = this.revealedSet.has(item.id);
    const displayedPass = isRevealed ? item.password : '••••••••••••';
    const deptStyle = getDepartmentStyle(item.department);
    const initials = getInitials(item.name);

    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div>
          <!-- Header do Cartão de E-mail -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr ${deptStyle.gradient} flex items-center justify-center text-white text-xs font-extrabold shadow-xs shrink-0">
                <span>${initials}</span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white leading-snug truncate" title="${item.name}">${item.name}</h4>
                  ${
                    item.adminOnly
                      ? `
                    <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0" title="Credencial restrita: visível apenas para Administradores">
                      <i class="fa-solid fa-user-shield text-[8px]"></i> Admin
                    </span>
                  `
                      : ''
                  }
                </div>
                <div class="flex items-center gap-1 mt-0.5">
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border ${deptStyle.bg} flex items-center gap-1">
                    <i class="${deptStyle.icon} text-[9px]"></i>
                    <span class="truncate max-w-[140px]">${item.department || 'Geral'}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Ações (Editar / Excluir) -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-action="edit"
                data-id="${item.id}"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Editar E-mail"
              >
                <i class="fa-solid fa-pen-to-square text-xs"></i>
              </button>
              ${
                isAdmin
                  ? `
              <button
                type="button"
                data-action="delete"
                data-id="${item.id}"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Excluir E-mail"
              >
                <i class="fa-solid fa-trash-can text-xs"></i>
              </button>
              `
                  : ''
              }
            </div>
          </div>

          <!-- Caixa de E-mail com Cópia Rápida -->
          <div class="mb-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 overflow-hidden min-w-0">
              <i class="fa-regular fa-envelope text-blue-500 text-xs shrink-0"></i>
              <span class="font-mono text-xs text-slate-700 dark:text-slate-300 truncate select-all" title="${item.email}">${item.email}</span>
            </div>
            <button
              type="button"
              data-action="copy-email"
              data-email="${item.email}"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="Copiar E-mail"
            >
              <i class="fa-regular fa-copy text-xs"></i>
            </button>
          </div>

          <!-- Caixa de Senha com Eye e Cópia Rápida -->
          <div class="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2 overflow-hidden min-w-0">
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
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="${isRevealed ? 'Ocultar Senha' : 'Exibir Senha'}"
              >
                <i class="fa-solid ${isRevealed ? 'fa-eye-slash' : 'fa-eye'} text-xs"></i>
              </button>
              <button
                type="button"
                data-action="copy-password"
                data-password="${item.password}"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copiar Senha"
              >
                <i class="fa-regular fa-copy text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Observações / Detalhes (se houver) -->
          ${
            item.notes
              ? `
            <div class="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl px-2.5 py-1.5 border border-slate-100 dark:border-slate-800/40 mt-2 flex items-start gap-1.5 leading-snug">
              <i class="fa-solid fa-circle-info text-[10px] text-slate-400 mt-0.5 shrink-0"></i>
              <span class="break-words line-clamp-2">${item.notes}</span>
            </div>
          `
              : ''
          }
        </div>

        <!-- Rodapé do Cartão -->
        <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
          <span class="flex items-center gap-1">
            <i class="fa-solid fa-shield-halved text-emerald-500 text-[9px]"></i>
            <span>Cofre VieiraCred</span>
          </span>
          <span>${item.updatedAt ? `Atualizado: ${item.updatedAt}` : ''}</span>
        </div>
      </div>
    `;
  }

  renderCompactRow(item, isAdmin) {
    const isRevealed = this.revealedSet.has(item.id);
    const displayedPass = isRevealed ? item.password : '••••••••••••';
    const deptStyle = getDepartmentStyle(item.department);
    const initials = getInitials(item.name);

    return `
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-3 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group">
        <!-- Colaborador & Departamento -->
        <div class="flex items-center gap-3 min-w-[220px]">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr ${deptStyle.gradient} flex items-center justify-center text-white text-[11px] font-extrabold shadow-2xs shrink-0">
            <span>${initials}</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <h4 class="text-xs font-bold text-slate-900 dark:text-white truncate" title="${item.name}">${item.name}</h4>
              ${
                item.adminOnly
                  ? `
                <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0" title="Apenas Administradores">
                  <i class="fa-solid fa-user-shield text-[8px]"></i> Admin
                </span>
              `
                  : ''
              }
            </div>
            <span class="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <i class="${deptStyle.icon} text-[9px] text-blue-500"></i>
              <span class="truncate">${item.department || 'Geral'}</span>
            </span>
          </div>
        </div>

        <!-- E-mail -->
        <div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/60 rounded-lg px-2.5 py-1.5 border border-slate-100 dark:border-slate-800/80 min-w-[200px] justify-between">
          <div class="flex items-center gap-2 overflow-hidden">
            <i class="fa-regular fa-envelope text-blue-500 text-xs shrink-0"></i>
            <span class="font-mono text-xs text-slate-700 dark:text-slate-300 truncate select-all">${item.email}</span>
          </div>
          <button
            type="button"
            data-action="copy-email"
            data-email="${item.email}"
            class="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Copiar E-mail"
          >
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>

        <!-- Senha -->
        <div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/60 rounded-lg px-2.5 py-1.5 border border-slate-100 dark:border-slate-800/80 min-w-[180px] justify-between">
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
              class="text-xs text-slate-400 hover:text-amber-500 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="${isRevealed ? 'Ocultar' : 'Exibir'}"
            >
              <i class="fa-solid ${isRevealed ? 'fa-eye-slash' : 'fa-eye'}"></i>
            </button>
            <button
              type="button"
              data-action="copy-password"
              data-password="${item.password}"
              class="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copiar Senha"
            >
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>
        </div>

        <!-- Ações -->
        <div class="flex items-center gap-1 justify-end shrink-0">
          <button
            type="button"
            data-action="edit"
            data-id="${item.id}"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Editar E-mail"
          >
            <i class="fa-solid fa-pen-to-square text-xs"></i>
          </button>
          ${
            isAdmin
              ? `
          <button
            type="button"
            data-action="delete"
            data-id="${item.id}"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Excluir E-mail"
          >
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  exportCSV() {
    if (!this.emails || this.emails.length === 0) {
      alert('Não há e-mails de colaboradores para exportar.');
      return;
    }

    const headers = ['Nome do Colaborador', 'E-mail Corporativo', 'Senha', 'Departamento', 'Observações', 'Apenas Admin', 'Última Atualização'];
    const rows = this.emails.map((it) => [
      `"${(it.name || '').replace(/"/g, '""')}"`,
      `"${(it.email || '').replace(/"/g, '""')}"`,
      `"${(it.password || '').replace(/"/g, '""')}"`,
      `"${(it.department || '').replace(/"/g, '""')}"`,
      `"${(it.notes || '').replace(/"/g, '""')}"`,
      `"${it.adminOnly ? 'Sim' : 'Não'}"`,
      `"${it.updatedAt || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `emails_colaboradores_vieiracred_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('Planilha de e-mails exportada com sucesso!');
  }
}
