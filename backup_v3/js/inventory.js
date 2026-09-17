/**
 * Módulo de Controle de Estoque de TI (Inventário de Equipamentos & Periféricos)
 * Conectado à API centralizada do servidor (/api/inventory)
 */

import { api } from './api.js';

export class InventoryManager {
  constructor(showToastCallback) {
    this.showToast = showToastCallback;
    this.items = [];
    this.searchTerm = '';
    this.activeCategory = 'Todos';
    this.editingId = null;

    this.initDOMElements();
    this.bindEvents();
    this.loadItems();
  }

  async loadItems() {
    try {
      if (api.isAuthenticated()) {
        const data = await api.get('/api/inventory');
        if (Array.isArray(data)) {
          this.items = data;
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

  getFilteredList() {
    const q = this.searchTerm.toLowerCase().trim();

    return this.items.filter((it) => {
      if (this.activeCategory !== 'Todos' && it.category !== this.activeCategory) {
        return false;
      }
      if (q) {
        const matchName = it.name?.toLowerCase().includes(q);
        const matchCat = it.category?.toLowerCase().includes(q);
        const matchLoc = it.location?.toLowerCase().includes(q);
        const matchNotes = it.notes?.toLowerCase().includes(q);
        return matchName || matchCat || matchLoc || matchNotes;
      }
      return true;
    });
  }

  renderCategories() {
    if (!this.categoriesContainer) return;
    const cats = ['Todos', 'Periféricos', 'Cabos', 'Hardware', 'Redes'];

    const counts = { Todos: this.items.length };
    this.items.forEach((it) => {
      counts[it.category] = (counts[it.category] || 0) + 1;
    });

    this.categoriesContainer.innerHTML = cats
      .map((cat) => {
        const isActive = this.activeCategory === cat;
        const count = counts[cat] || 0;

        const activeClass = isActive
          ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-500/20'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800';

        const badgeClass = isActive
          ? 'bg-emerald-700/60 text-white'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

        return `
          <button
            type="button"
            data-cat="${cat}"
            class="inv-cat-btn px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeClass}"
          >
            <span>${cat}</span>
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
      this.container.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
            <i class="fa-solid fa-boxes-stacked text-2xl"></i>
          </div>
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Nenhum item encontrado no estoque</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            ${this.searchTerm ? 'Tente buscar com outro termo ou limpe os filtros.' : 'Cadastre seu primeiro equipamento ou periférico no botão acima.'}
          </p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = list
      .map((item) => {
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
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center border ${color}">
                    <i class="${icon} text-sm"></i>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white leading-snug">${item.name}</h4>
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

                <!-- Ações de Editar / Excluir -->
                <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    data-action="edit"
                    data-id="${item.id}"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                    title="Editar Item"
                  >
                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                  </button>
                  ${isAdmin ? `
                  <button
                    type="button"
                    data-action="delete"
                    data-id="${item.id}"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
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
                    class="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 flex items-center justify-center font-bold text-sm shadow-xs transition-colors"
                    title="Dar baixa (-1)"
                  >
                    <i class="fa-solid fa-minus text-xs"></i>
                  </button>
                  <button
                    type="button"
                    data-action="qty-inc"
                    data-id="${item.id}"
                    class="w-8 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 flex items-center justify-center font-bold text-sm shadow-xs shadow-emerald-600/20 transition-colors"
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
      })
      .join('');

    this.bindCardEvents();
  }

  bindCardEvents() {
    if (!this.container) return;

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
