/**
 * Módulo de Controle de Estoque de TI (Inventário de Equipamentos & Periféricos)
 */

const INVENTORY_STORAGE_KEY = 'vieiratech_inventory_items_v1';

export const defaultInventoryItems = [
  {
    id: 'inv-1',
    name: 'Headset USB com Cancelamento de Ruído (Intelbras/Jabra)',
    category: 'Periféricos',
    quantity: 14,
    minQuantity: 5,
    location: 'Armário TI - Prateleira 1',
    status: 'Disponível',
    notes: 'Uso prioritário para os operadores e supervisores da VieiraCred.'
  },
  {
    id: 'inv-2',
    name: 'Mouse Óptico USB Dell / Logitech',
    category: 'Periféricos',
    quantity: 8,
    minQuantity: 4,
    location: 'Armário TI - Gaveta 2',
    status: 'Disponível',
    notes: 'Mouses novos padrão ABNT.'
  },
  {
    id: 'inv-3',
    name: 'Teclado USB Slim Dell / Multilaser',
    category: 'Periféricos',
    quantity: 6,
    minQuantity: 4,
    location: 'Armário TI - Gaveta 2',
    status: 'Disponível',
    notes: 'Teclados ABNT2 com teclado numérico.'
  },
  {
    id: 'inv-4',
    name: 'Patch Cord Cat6 Azul Furukawa 1.5m',
    category: 'Cabos',
    quantity: 28,
    minQuantity: 10,
    location: 'Armário TI - Caixa Cabos',
    status: 'Disponível',
    notes: 'Cabos de rede homologados para pontos de estações.'
  },
  {
    id: 'inv-5',
    name: 'Patch Cord Cat6 Amarelo Furukawa 2.5m',
    category: 'Cabos',
    quantity: 15,
    minQuantity: 8,
    location: 'Armário TI - Caixa Cabos',
    status: 'Disponível',
    notes: 'Cabos de interligação para racks e switches.'
  },
  {
    id: 'inv-6',
    name: 'Cabo HDMI Blindado 1.8m',
    category: 'Cabos',
    quantity: 7,
    minQuantity: 3,
    location: 'Armário TI - Gaveta 1',
    status: 'Disponível',
    notes: 'Conexão para monitores e TV de dashboards.'
  },
  {
    id: 'inv-7',
    name: 'Monitor LED 21.5" Full HD Dell / LG',
    category: 'Hardware',
    quantity: 3,
    minQuantity: 2,
    location: 'Sala de TI - Bancada',
    status: 'Disponível',
    notes: 'Monitores reserva para troca rápida de postos.'
  },
  {
    id: 'inv-8',
    name: 'Switch 24 Portas Gigabit Reserva (TP-Link/D-Link)',
    category: 'Redes',
    quantity: 2,
    minQuantity: 1,
    location: 'Rack Servidores - Reserva',
    status: 'Disponível',
    notes: 'Switch não gerenciável pronto para backup imediato de espinha.'
  },
  {
    id: 'inv-9',
    name: 'Fonte de Alimentação 12V 2A Padrão P4',
    category: 'Hardware',
    quantity: 5,
    minQuantity: 3,
    location: 'Armário TI - Gaveta 3',
    status: 'Disponível',
    notes: 'Para roteadores MikroTik, conversores de mídia e modems.'
  },
  {
    id: 'inv-10',
    name: 'Adaptador DisplayPort para HDMI 4K',
    category: 'Cabos',
    quantity: 4,
    minQuantity: 2,
    location: 'Armário TI - Gaveta 1',
    status: 'Disponível',
    notes: 'Para máquinas que só possuem saída DP na placa-mãe.'
  }
];

export class InventoryManager {
  constructor(showToastCallback) {
    this.showToast = showToastCallback;
    this.items = this.loadItems();
    this.searchTerm = '';
    this.activeCategory = 'Todos';
    this.editingId = null;

    this.initDOMElements();
    this.bindEvents();
  }

  loadItems() {
    try {
      const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler estoque:', e);
    }
    return [...defaultInventoryItems];
  }

  saveItems() {
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.error('Erro ao salvar estoque:', e);
    }
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

    // Modal
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
      this.modalTitle.textContent = item ? 'Editar Item de Estoque' : 'Cadastrar Item no Estoque';
    }

    const form = this.modalForm;
    if (form) {
      form.elements['inv-name'].value = item ? item.name : '';
      form.elements['inv-category'].value = item ? item.category : 'Periféricos';
      form.elements['inv-quantity'].value = item ? item.quantity : 1;
      form.elements['inv-min'].value = item ? item.minQuantity : 2;
      form.elements['inv-location'].value = item ? item.location : 'Armário TI';
      form.elements['inv-status'].value = item ? item.status : 'Disponível';
      form.elements['inv-notes'].value = item ? item.notes || '' : '';
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

    const name = form.elements['inv-name'].value.trim();
    const category = form.elements['inv-category'].value.trim();
    const quantity = parseInt(form.elements['inv-quantity'].value, 10) || 0;
    const minQuantity = parseInt(form.elements['inv-min'].value, 10) || 0;
    const location = form.elements['inv-location'].value.trim() || 'Armário TI';
    const status = form.elements['inv-status'].value.trim() || 'Disponível';
    const notes = form.elements['inv-notes'].value.trim();

    if (!name) {
      alert('Por favor, informe o Nome do item.');
      return;
    }

    if (this.editingId) {
      this.items = this.items.map((it) => {
        if (it.id === this.editingId) {
          return { ...it, name, category, quantity, minQuantity, location, status, notes };
        }
        return it;
      });
      this.showToast(`Item "${name}" atualizado no estoque!`);
    } else {
      const newItem = {
        id: 'inv-' + Date.now(),
        name,
        category,
        quantity,
        minQuantity,
        location,
        status,
        notes
      };
      this.items.unshift(newItem);
      this.showToast(`Item "${name}" adicionado ao estoque!`);
    }

    this.saveItems();
    this.closeModal();
    this.render();
  }

  adjustQuantity(id, delta) {
    this.items = this.items.map((it) => {
      if (it.id === id) {
        const nextQty = Math.max(0, it.quantity + delta);
        return { ...it, quantity: nextQty };
      }
      return it;
    });

    this.saveItems();
    this.render();
  }

  handleDelete(id) {
    const item = this.items.find((it) => it.id === id);
    if (!item) return;

    if (window.confirm(`Deseja remover o item "${item.name}" do estoque?`)) {
      this.items = this.items.filter((it) => it.id !== id);
      this.saveItems();
      this.showToast(`Item "${item.name}" removido.`);
      this.render();
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
          ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800';

        const badgeClass = isActive
          ? 'bg-blue-700/60 text-white'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

        return `
          <button
            type="button"
            data-cat="${cat}"
            class="inv-cat-btn px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeClass}"
          >
            <span>${cat}</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-md font-mono font-semibold ${badgeClass}">${count}</span>
          </button>
        `;
      })
      .join('');

    this.categoriesContainer.querySelectorAll('.inv-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeCategory = btn.getAttribute('data-cat');
        this.render();
      });
    });
  }

  getItemIcon(cat) {
    switch (cat) {
      case 'Periféricos':
        return 'fa-solid fa-headphones text-blue-500';
      case 'Cabos':
        return 'fa-solid fa-ethernet text-amber-500';
      case 'Hardware':
        return 'fa-solid fa-microchip text-purple-500';
      case 'Redes':
        return 'fa-solid fa-network-wired text-cyan-500';
      default:
        return 'fa-solid fa-box text-slate-400';
    }
  }

  renderCards() {
    if (!this.container) return;
    const items = this.getFilteredList();

    const lowStockCount = this.items.filter((it) => it.quantity <= it.minQuantity).length;

    if (this.totalCounter) this.totalCounter.textContent = this.items.length;
    if (this.lowStockCounter) this.lowStockCounter.textContent = lowStockCount;

    if (items.length === 0) {
      this.container.innerHTML = `
        <div class="col-span-full py-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <i class="fa-solid fa-boxes-stacked text-3xl text-slate-400 mb-2"></i>
          <h4 class="font-bold text-sm text-slate-800 dark:text-slate-200">Nenhum item de estoque encontrado</h4>
          <p class="text-xs text-slate-400 dark:text-slate-500">Tente buscar por outro termo ou cadastre um novo equipamento.</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = items
      .map((it) => {
        const isLow = it.quantity <= it.minQuantity;
        const isZero = it.quantity === 0;

        let statusBadge = '';
        if (isZero) {
          statusBadge = '<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">Esgotado</span>';
        } else if (isLow) {
          statusBadge = '<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Estoque Baixo</span>';
        } else {
          statusBadge = '<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Em Estoque</span>';
        }

        const iconClass = this.getItemIcon(it.category);

        return `
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-xs flex flex-col justify-between transition-all" data-id="${it.id}">
            
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm shrink-0 shadow-2xs">
                    <i class="${iconClass}"></i>
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate" title="${it.name}">
                      ${it.name}
                    </h4>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        ${it.category}
                      </span>
                      <span>&bull;</span>
                      ${statusBadge}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    class="inv-edit-btn p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Editar item"
                    data-id="${it.id}"
                  >
                    <i class="fa-regular fa-pen-to-square"></i>
                  </button>
                  <button
                    type="button"
                    class="inv-delete-btn p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Excluir item"
                    data-id="${it.id}"
                  >
                    <i class="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </div>

              <!-- Quantity Quick Adjust Box -->
              <div class="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span class="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Quantidade</span>
                  <div class="flex items-baseline gap-1.5">
                    <span class="font-black text-xl text-slate-900 dark:text-white font-mono">${it.quantity}</span>
                    <span class="text-[10px] text-slate-400 font-mono">unidades (Mín: ${it.minQuantity})</span>
                  </div>
                </div>

                <!-- Quick +/- Controls -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="qty-btn-minus w-8 h-8 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer active:scale-95"
                    title="Dar baixa (-1)"
                    data-id="${it.id}"
                  >
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <button
                    type="button"
                    class="qty-btn-plus w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer active:scale-95 shadow-sm shadow-blue-500/20"
                    title="Dar entrada (+1)"
                    data-id="${it.id}"
                  >
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>

              <!-- Location & Details -->
              <div class="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div class="flex items-center gap-1.5">
                  <i class="fa-solid fa-location-dot text-[10px] text-slate-400 shrink-0"></i>
                  <span class="font-medium text-slate-700 dark:text-slate-300">${it.location}</span>
                </div>
                ${
                  it.notes
                    ? `<p class="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 italic">${it.notes}</p>`
                    : ''
                }
              </div>
            </div>

            <div class="pt-2 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Inventário TI VieiraCred</span>
              <span>ID: ${it.id}</span>
            </div>

          </div>
        `;
      })
      .join('');

    this.bindCardEvents();
  }

  bindCardEvents() {
    // Minus Qty
    this.container.querySelectorAll('.qty-btn-minus').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.adjustQuantity(id, -1);
      });
    });

    // Plus Qty
    this.container.querySelectorAll('.qty-btn-plus').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.adjustQuantity(id, 1);
      });
    });

    // Edit
    this.container.querySelectorAll('.inv-edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const item = this.items.find((it) => it.id === id);
        if (item) this.openModal(item);
      });
    });

    // Delete
    this.container.querySelectorAll('.inv-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.handleDelete(id);
      });
    });
  }

  render() {
    this.renderCategories();
    this.renderCards();
  }
}
