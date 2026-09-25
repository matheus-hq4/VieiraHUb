/**
 * Módulo de Controle de Estoque de TI (Inventário de Equipamentos & Periféricos)
 * Conectado à API centralizada do servidor (/api/inventory)
 */

import { api } from './api.js';

export class InventoryManager {
  constructor(showToastCallback, initialViewMode = 'grid') {
    this.showToast = showToastCallback;
    this.viewMode = initialViewMode;
    this.items = [];
    this.searchTerm = '';
    this.activeCategory = 'Favoritos';
    this.editingId = null;

    this.initDOMElements();
    this.bindEvents();
    this.loadItems();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.renderCards();
  }

  async loadItems() {
    try {
      if (api.isAuthenticated()) {
        const data = await api.get('/api/inventory');
        if (Array.isArray(data)) {
          this.items = data;
          const pinnedCount = this.items.filter((it) => it.pinned).length;
          if (pinnedCount > 0) {
            this.activeCategory = 'Favoritos';
          } else {
            this.activeCategory = 'Todos';
          }
          this.render();
          return;
        }
      }
    } catch (e) {
      console.error('[Inventory] Erro ao carregar estoque da API:', e);
    }
    this.items = [];
    this.render();
  }

  initDOMElements() {
    this.container = document.getElementById('inventory-items-container');
    this.searchInput = document.getElementById('inventory-search-input');
    this.searchClearBtn = document.getElementById('inventory-search-clear-btn');
    this.categoriesContainer = document.getElementById('inventory-categories-container');
    this.totalCounter = document.getElementById('inventory-total-count');
    this.lowStockCounter = document.getElementById('inventory-low-count');

    // Add / Edit Modal
    this.modal = document.getElementById('inventory-modal');
    this.modalTitle = document.getElementById('inventory-modal-title');
    this.modalForm = document.getElementById('inventory-modal-form');
    this.openAddBtn = document.getElementById('open-add-inventory-btn');
    this.closeModalBtn = document.getElementById('inventory-modal-close-btn');
    this.cancelModalBtn = document.getElementById('inventory-modal-cancel-btn');

    // Export & History Controls
    this.exportCsvBtn = document.getElementById('export-inventory-csv-btn');
    this.printReportBtn = document.getElementById('print-inventory-report-btn');
    this.openLogsBtn = document.getElementById('open-inventory-logs-btn');

    // Logs Modal
    this.logsModal = document.getElementById('inventory-logs-modal');
    this.logsCloseBtn = document.getElementById('inventory-logs-close-btn');
    this.logsRefreshBtn = document.getElementById('inventory-logs-refresh-btn');
    this.logsTableBody = document.getElementById('inventory-logs-table-body');
    this.logsCountEl = document.getElementById('inventory-logs-count');
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

    // Exportar CSV
    if (this.exportCsvBtn) {
      this.exportCsvBtn.addEventListener('click', () => this.exportCSV());
    }

    // Imprimir Relatório
    if (this.printReportBtn) {
      this.printReportBtn.addEventListener('click', () => this.printReport());
    }

    // Modal de Auditoria e Histórico
    if (this.openLogsBtn) {
      this.openLogsBtn.addEventListener('click', () => this.openLogsModal());
    }
    if (this.logsCloseBtn) {
      this.logsCloseBtn.addEventListener('click', () => this.closeLogsModal());
    }
    if (this.logsRefreshBtn) {
      this.logsRefreshBtn.addEventListener('click', () => this.loadLogs());
    }
  }

  openModal(item = null) {
    this.editingId = item ? item.id : null;
    if (this.modalTitle) {
      this.modalTitle.textContent = item ? 'Editar Item de Estoque' : 'Cadastrar Item de Estoque';
    }

    const form = this.modalForm;
    if (form) {
      form.elements['inv-name'].value = item ? item.name : '';
      form.elements['inv-category'].value = item ? item.category : 'Periféricos';
      form.elements['inv-quantity'].value = item ? item.quantity : 1;
      form.elements['inv-min-quantity'].value = item ? item.minQuantity : 2;
      form.elements['inv-location'].value = item ? item.location || '' : '';
      form.elements['inv-status'].value = item ? item.status : 'Disponível';
      form.elements['inv-notes'].value = item ? item.notes || '' : '';
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

    const name = form.elements['inv-name'].value.trim();
    const category = form.elements['inv-category'].value.trim();
    const quantity = parseInt(form.elements['inv-quantity'].value, 10) || 0;
    const minQuantity = parseInt(form.elements['inv-min-quantity'].value, 10) || 0;
    const location = form.elements['inv-location'].value.trim();
    const status = form.elements['inv-status'].value.trim();
    const notes = form.elements['inv-notes'].value.trim();

    if (!name) {
      alert('Por favor, informe o Nome do item.');
      return;
    }

    const payload = { name, category, quantity, minQuantity, location, status, notes };

    try {
      if (this.editingId) {
        await api.put(`/api/inventory/${this.editingId}`, payload);
        this.showToast(`Item "${name}" atualizado no estoque do servidor!`);
      } else {
        await api.post('/api/inventory', payload);
        this.showToast(`Item "${name}" adicionado ao estoque do servidor!`);
      }
      this.closeModal();
      await this.loadItems();
    } catch (err) {
      alert('Erro ao salvar no servidor: ' + err.message);
    }
  }

  async adjustQuantity(id, delta) {
    try {
      const updated = await api.patch(`/api/inventory/${id}/qty`, { delta });
      if (updated) {
        this.items = this.items.map((it) => (it.id === id ? updated : it));
        this.render();
      }
    } catch (err) {
      alert('Erro ao alterar quantidade: ' + err.message);
    }
  }

  // Exportar inventário para arquivo CSV formatado com UTF-8 BOM para Excel
  exportCSV() {
    if (!this.items || this.items.length === 0) {
      alert('Não há itens cadastrados no inventário para exportar.');
      return;
    }

    const headers = ['Nome', 'Categoria', 'Quantidade Atual', 'Estoque Mínimo', 'Localização', 'Status', 'Observações'];
    const rows = this.items.map((it) => [
      `"${(it.name || '').replace(/"/g, '""')}"`,
      `"${(it.category || '').replace(/"/g, '""')}"`,
      it.quantity || 0,
      it.minQuantity || 0,
      `"${(it.location || '').replace(/"/g, '""')}"`,
      `"${(it.status || '').replace(/"/g, '""')}"`,
      `"${(it.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_ti_vieiratech_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Inventário exportado com sucesso em CSV!');
  }

  // Imprimir relatório ou salvar em PDF para conferência física
  printReport() {
    if (!this.items || this.items.length === 0) {
      alert('Não há itens no inventário para impressão.');
      return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Por favor, permita pop-ups no seu navegador para imprimir o relatório.');
      return;
    }

    const dateStr = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const rowsHtml = this.items.map((it) => {
      const isLow = it.quantity <= it.minQuantity;
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${isLow ? 'background-color: #fffbeb;' : ''}">
          <td style="padding: 8px 12px; font-weight: bold;">${it.name}</td>
          <td style="padding: 8px 12px;">${it.category}</td>
          <td style="padding: 8px 12px; font-weight: bold; text-align: center; ${isLow ? 'color: #d97706;' : ''}">
            ${it.quantity} ${isLow ? '(BAIXO)' : ''}
          </td>
          <td style="padding: 8px 12px; text-align: center;">${it.minQuantity}</td>
          <td style="padding: 8px 12px;">${it.location || 'Armário TI'}</td>
          <td style="padding: 8px 12px;">${it.status || 'Disponível'}</td>
          <td style="padding: 8px 12px; font-size: 11px; color: #64748b;">${it.notes || '-'}</td>
        </tr>
      `;
    }).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Inventário TI - VieiraTech HUB</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; color: #1e293b; }
            h1 { font-size: 20px; margin: 0 0 4px 0; color: #0f172a; }
            p { font-size: 12px; color: #64748b; margin: 0 0 16px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
            th { background-color: #f1f5f9; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; font-weight: 600; font-size: 11px; text-transform: uppercase; }
            .header-box { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <h1>VIEIRATECH HUB - RELATÓRIO OFICIAL DE INVENTÁRIO TI</h1>
              <p>Gerado em: ${dateStr} | Total de Itens: ${this.items.length}</p>
            </div>
            <button onclick="window.print()" style="padding: 8px 16px; background-color: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
              Imprimir / Salvar PDF
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Equipamento / Periférico</th>
                <th>Categoria</th>
                <th style="text-align: center;">Qtd Atual</th>
                <th style="text-align: center;">Mínimo</th>
                <th>Localização</th>
                <th>Status</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWin.document.close();
  }

  // Abrir modal de histórico e auditoria
  async openLogsModal() {
    if (this.logsModal) {
      this.logsModal.classList.remove('hidden');
      await this.loadLogs();
    }
  }

  closeLogsModal() {
    if (this.logsModal) {
      this.logsModal.classList.add('hidden');
    }
  }

  async loadLogs() {
    if (!this.logsTableBody) return;
    try {
      const logs = await api.get('/api/inventory/logs?limit=50');
      if (this.logsCountEl) {
        this.logsCountEl.textContent = `Exibindo ${logs.length} movimentações recentes`;
      }

      if (!logs || logs.length === 0) {
        this.logsTableBody.innerHTML = `
          <tr>
            <td colspan="5" class="py-8 text-center text-slate-400">
              Nenhuma movimentação registrada até o momento.
            </td>
          </tr>
        `;
        return;
      }

      this.logsTableBody.innerHTML = logs.map((log) => {
        const isEntrada = log.action === 'entrada' || log.delta > 0;
        const isExclusao = log.action === 'exclusao';
        let actionBadge = '';

        if (isExclusao) {
          actionBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30">Exclusão</span>';
        } else if (isEntrada) {
          actionBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">+${log.delta} Entrada</span>`;
        } else {
          actionBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">${log.delta} Baixa</span>`;
        }

        const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : '-';

        return `
          <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">${dateStr}</td>
            <td class="px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200">${log.itemName || 'Item'}</td>
            <td class="px-3.5 py-2.5">${actionBadge}</td>
            <td class="px-3.5 py-2.5 font-mono text-slate-600 dark:text-slate-300">
              ${log.previousQty} &rarr; <strong>${log.newQty}</strong>
            </td>
            <td class="px-3.5 py-2.5 text-slate-500">
              <div class="flex items-center gap-1.5">
                <i class="fa-regular fa-user text-[10px] text-slate-400"></i>
                <span class="font-medium text-slate-700 dark:text-slate-300">${log.user || 'Técnico'}</span>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('[Inventory] Erro ao carregar logs:', err);
    }
  }

  async handleDelete(id) {
    const item = this.items.find((it) => it.id === id);
    if (!item) return;

    if (window.confirm(`Deseja remover o item "${item.name}" do estoque no servidor?`)) {
      try {
        await api.delete(`/api/inventory/${id}`);
        this.showToast(`Item "${item.name}" removido do estoque.`);
        await this.loadItems();
      } catch (err) {
        alert('Erro ao excluir do servidor: ' + err.message);
      }
    }
  }

  async handleTogglePin(id) {
    const item = this.items.find((it) => it.id === id);
    if (!item) return;
    const nextState = !item.pinned;
    item.pinned = nextState;

    this.showToast(
      nextState
        ? `⭐ Item "${item.name}" adicionado aos Favoritos!`
        : `Item "${item.name}" removido dos Favoritos.`
    );

    try {
      await api.put(`/api/inventory/${id}`, { pinned: nextState });
    } catch (e) {
      console.error('[Inventory] Erro ao salvar status nos favoritos:', e);
    }
    this.render();
  }

  getFilteredList() {
    const q = this.searchTerm.toLowerCase().trim();

    return this.items
      .filter((it) => {
        if (this.activeCategory === 'Favoritos') {
          if (!it.pinned) return false;
        } else if (this.activeCategory !== 'Todos') {
          if (it.category !== this.activeCategory) return false;
        }
        if (q) {
          const matchName = it.name?.toLowerCase().includes(q);
          const matchCat = it.category?.toLowerCase().includes(q);
          const matchLoc = it.location?.toLowerCase().includes(q);
          const matchNotes = it.notes?.toLowerCase().includes(q);
          return matchName || matchCat || matchLoc || matchNotes;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
  }

  renderCategories() {
    if (!this.categoriesContainer) return;
    const pinnedCount = this.items.filter((it) => it.pinned).length;
    const counts = {
      Favoritos: pinnedCount,
      Todos: this.items.length
    };

    const set = new Set(['Cabos', 'Hardware', 'Periféricos', 'Redes']);
    this.items.forEach((it) => {
      if (it.category) {
        set.add(it.category);
        counts[it.category] = (counts[it.category] || 0) + 1;
      }
    });

    const sortedCategories = Array.from(set).sort((a, b) => a.localeCompare(b));
    const list = ['Favoritos', ...sortedCategories, 'Todos'];

    this.categoriesContainer.innerHTML = list
      .map((cat) => {
        const isActive = this.activeCategory === cat;
        const count = counts[cat] || 0;
        const isFavoritos = cat === 'Favoritos';
        const isTodos = cat === 'Todos';

        let labelHtml = `<span>${cat}</span>`;
        if (isFavoritos) {
          labelHtml = `<i class="fa-solid fa-star ${isActive ? 'text-amber-300' : 'text-amber-400'} text-xs"></i><span>Favoritos</span>`;
        } else if (isTodos) {
          labelHtml = `<i class="fa-solid fa-list-check text-xs opacity-75"></i><span>Todos</span>`;
        }

        let activeClass = '';
        let badgeClass = '';

        if (isActive) {
          if (isFavoritos) {
            activeClass = 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-sm shadow-amber-500/25 ring-1 ring-amber-400/40';
            badgeClass = 'bg-amber-700/60 text-white';
          } else {
            activeClass = 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-500/20';
            badgeClass = 'bg-emerald-700/60 text-white';
          }
        } else {
          activeClass = 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800';
          badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
        }

        return `
          <button
            type="button"
            data-cat="${cat}"
            class="inv-cat-btn px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeClass}"
          >
            ${labelHtml}
            <span class="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-semibold ${badgeClass}">${count}</span>
          </button>
        `;
      })
      .join('');

    this.categoriesContainer.querySelectorAll('.inv-cat-btn').forEach((btn) => {
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

    const lowStockCount = this.items.filter((it) => it.quantity <= it.minQuantity).length;
    if (this.totalCounter) this.totalCounter.textContent = this.items.length;
    if (this.lowStockCounter) this.lowStockCounter.textContent = lowStockCount;

    if (list.length === 0) {
      this.container.className = 'col-span-full';
      this.container.innerHTML = `
        <div class="py-16 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
            <i class="fa-solid fa-boxes-stacked text-2xl"></i>
          </div>
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            ${this.activeCategory === 'Favoritos' ? 'Nenhum item nos Favoritos' : 'Nenhum item encontrado no estoque'}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            ${
              this.activeCategory === 'Favoritos'
                ? 'Clique na estrela (⭐) em qualquer item para marcá-lo como favorito no seu estoque.'
                : this.searchTerm
                ? 'Tente buscar com outro termo ou limpe os filtros.'
                : 'Cadastre seu primeiro equipamento ou periférico no botão acima.'
            }
          </p>
        </div>
      `;
      return;
    }

    if (this.viewMode === 'compact') {
      this.container.className = 'flex flex-col gap-2.5';
      this.container.innerHTML = list.map((item) => this.createCompactCard(item, isAdmin)).join('');
    } else {
      this.container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
      this.container.innerHTML = list.map((item) => this.createGridCard(item, isAdmin)).join('');
    }

    this.bindCardEvents();
  }

  createGridCard(item, isAdmin) {
    const isLow = item.quantity <= item.minQuantity;

    let icon = 'fa-solid fa-box';
    let color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';

    if (item.category === 'Periféricos') {
      icon = 'fa-solid fa-headphones';
      color = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    } else if (item.category === 'Cabos') {
      icon = 'fa-solid fa-ethernet';
      color = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    } else if (item.category === 'Hardware') {
      icon = 'fa-solid fa-microchip';
      color = 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    } else if (item.category === 'Redes') {
      icon = 'fa-solid fa-network-wired';
      color = 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
    }

    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl border ${isLow ? 'border-amber-500/60 shadow-amber-500/5' : 'border-slate-200/80 dark:border-slate-800'} p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div>
          <!-- Header do Item -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center border ${color} shrink-0">
                <i class="${icon} text-sm"></i>
              </div>
              <div class="min-w-0">
                <h4 class="text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">${item.name}</h4>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full border ${color}">${item.category}</span>
                  ${
                    isLow
                      ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1"><i class="fa-solid fa-triangle-exclamation text-[9px]"></i> Estoque Baixo</span>'
                      : ''
                  }
                </div>
              </div>
            </div>

            <!-- Ações de Favoritar / Editar / Excluir -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-action="toggle-pin"
                data-id="${item.id}"
                class="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  item.pinned
                    ? 'text-amber-400 bg-amber-400/15 shadow-2xs'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }"
                title="${item.pinned ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}"
              >
                <i class="${item.pinned ? 'fa-solid fa-star text-amber-400 text-xs' : 'fa-regular fa-star text-xs'}"></i>
              </button>
              <button
                type="button"
                data-action="edit"
                data-id="${item.id}"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Editar Item"
              >
                <i class="fa-solid fa-pen-to-square text-xs"></i>
              </button>
              ${isAdmin ? `
              <button
                type="button"
                data-action="delete"
                data-id="${item.id}"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Excluir Item"
              >
                <i class="fa-solid fa-trash-can text-xs"></i>
              </button>
              ` : ''}
            </div>
          </div>

          <!-- Quantidade & Controles Rápidos -->
          <div class="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between mb-3">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Qtd Disponível</span>
              <div class="flex items-baseline gap-1.5">
                <span class="text-2xl font-black font-mono ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}">
                  ${item.quantity}
                </span>
                <span class="text-[11px] text-slate-400 font-mono">unid. (Mín: ${item.minQuantity})</span>
              </div>
            </div>

            <!-- Botões + e - para Entrada/Saída Rápida -->
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                data-action="qty-dec"
                data-id="${item.id}"
                class="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 flex items-center justify-center font-bold text-sm shadow-xs transition-colors cursor-pointer"
                title="Dar baixa (-1)"
              >
                <i class="fa-solid fa-minus text-xs"></i>
              </button>
              <button
                type="button"
                data-action="qty-inc"
                data-id="${item.id}"
                class="w-8 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 flex items-center justify-center font-bold text-sm shadow-xs shadow-emerald-600/20 transition-colors cursor-pointer"
                title="Adicionar (+1)"
              >
                <i class="fa-solid fa-plus text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Localização e Detalhes -->
          <div class="space-y-1.5 mb-3 text-xs text-slate-600 dark:text-slate-400">
            ${
              item.location
                ? `
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-location-dot text-slate-400 text-xs w-3.5 text-center"></i>
                <span class="truncate font-medium text-slate-700 dark:text-slate-300">${item.location}</span>
              </div>
            `
                : ''
            }
            ${
              item.notes
                ? `
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mt-1">
                <i class="fa-regular fa-note-sticky mr-1 text-[10px] text-slate-400"></i>${item.notes}
              </p>
            `
                : ''
            }
          </div>
        </div>

        <!-- Rodapé do Cartão -->
        <div class="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Status: <strong class="${item.status === 'Disponível' ? 'text-emerald-500' : 'text-slate-400'}">${item.status}</strong></span>
          <span class="text-emerald-500 flex items-center gap-1 font-sans font-medium">
            <i class="fa-solid fa-cloud-arrow-up text-[9px]"></i> Sincronizado
          </span>
        </div>
      </div>
    `;
  }

  createCompactCard(item, isAdmin) {
    const isLow = item.quantity <= item.minQuantity;

    let icon = 'fa-solid fa-box';
    let color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';

    if (item.category === 'Periféricos') {
      icon = 'fa-solid fa-headphones';
      color = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    } else if (item.category === 'Cabos') {
      icon = 'fa-solid fa-ethernet';
      color = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    } else if (item.category === 'Hardware') {
      icon = 'fa-solid fa-microchip';
      color = 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    } else if (item.category === 'Redes') {
      icon = 'fa-solid fa-network-wired';
      color = 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
    }

    return `
      <div class="group bg-white dark:bg-slate-900 rounded-xl p-3 border ${isLow ? 'border-amber-500/60' : 'border-slate-200/80 dark:border-slate-800'} hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3" data-id="${item.id}">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            data-action="toggle-pin"
            data-id="${item.id}"
            class="inv-pin-btn text-xs ${item.pinned ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'} cursor-pointer shrink-0 transition-colors p-1"
            title="${item.pinned ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}"
          >
            <i class="${item.pinned ? 'fa-solid fa-star' : 'fa-regular fa-star'}"></i>
          </button>

          <div class="w-8 h-8 rounded-lg flex items-center justify-center border ${color} shrink-0">
            <i class="${icon} text-sm"></i>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">${item.name}</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded font-medium border ${color}">${item.category}</span>
              ${isLow ? '<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">Estoque Baixo</span>' : ''}
            </div>
            <div class="flex items-center gap-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              <span><i class="fa-solid fa-location-dot text-[10px] mr-1 text-slate-400"></i>${item.location || 'Sem local'}</span>
              <span>• Status: <strong class="${item.status === 'Disponível' ? 'text-emerald-500' : 'text-slate-400'}">${item.status || 'Disponível'}</strong></span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/60 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              data-action="qty-dec"
              data-id="${item.id}"
              class="w-6 h-6 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-rose-600 text-xs flex items-center justify-center cursor-pointer border border-slate-200/60 dark:border-slate-800"
              title="Dar baixa (-1)"
            >
              <i class="fa-solid fa-minus text-[10px]"></i>
            </button>
            <span class="font-mono font-bold text-xs px-2 ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'} min-w-[28px] text-center">
              ${item.quantity}
            </span>
            <button
              type="button"
              data-action="qty-inc"
              data-id="${item.id}"
              class="w-6 h-6 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-emerald-600 text-xs flex items-center justify-center cursor-pointer border border-slate-200/60 dark:border-slate-800"
              title="Dar entrada (+1)"
            >
              <i class="fa-solid fa-plus text-[10px]"></i>
            </button>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              data-action="edit"
              data-id="${item.id}"
              class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
              title="Editar"
            >
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            ${isAdmin ? `
            <button
              type="button"
              data-action="delete"
              data-id="${item.id}"
              class="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-xs transition-colors cursor-pointer"
              title="Excluir"
            >
              <i class="fa-regular fa-trash-can"></i>
            </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  bindCardEvents() {
    if (!this.container) return;

    // Alternar Favorito / Pin
    this.container.querySelectorAll('button[data-action="toggle-pin"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.handleTogglePin(id);
      });
    });

    // Editar e Excluir
    this.container.querySelectorAll('button[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = this.items.find((it) => it.id === id);
        if (item) this.openModal(item);
      });
    });

    this.container.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.handleDelete(id);
      });
    });

    // Ajuste de Quantidade Rápido (+1 / -1)
    this.container.querySelectorAll('button[data-action="qty-inc"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.adjustQuantity(id, 1);
      });
    });

    this.container.querySelectorAll('button[data-action="qty-dec"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.adjustQuantity(id, -1);
      });
    });
  }

  render() {
    this.renderCategories();
    this.renderCards();
  }
}
