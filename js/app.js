import { loadTools, saveTools, deleteTool, resetToDefaults, loadTheme, saveTheme } from './storage.js';
import { AuthManager } from './auth.js';
import { VaultManager } from './vault.js';
import { InventoryManager } from './inventory.js';
import { api } from './api.js';

const TAB_STORAGE_KEY = 'vieiratech_active_tab_v1';

class App {
  constructor() {
    this.tools = [];
    this.isDarkMode = loadTheme();
    this.searchTerm = '';
    this.activeCategory = 'Favoritos';
    this.onlyPinned = false;
    this.viewMode = 'grid'; // 'grid' | 'compact'
    this.editingToolId = null;

    // Active primary tab
    this.activeTab = localStorage.getItem(TAB_STORAGE_KEY) || 'apps';

    // AD Logins in 4th tab
    this.adRawText = '';
    this.adSearchTerm = '';
    this.adRevealedPasswords = new Set();

    this.initTheme();
    this.initDOMElements();
    this.initModules();
    this.bindEvents();
    this.initUserManagement();
    this.switchTab(this.activeTab, false);
    this.loadInitialData();
  }

  async loadInitialData() {
    try {
      this.tools = await loadTools();
      this.adRawText = await this.loadAdLogins();
      // Se houver ferramentas favoritadas com estrela, inicia em Favoritos; senão inicia em Mais Acessados
      const pinnedCount = this.tools.filter((t) => t.pinned).length;
      if (pinnedCount > 0) {
        this.activeCategory = 'Favoritos';
      } else {
        this.activeCategory = 'Mais Acessados';
      }
      this.render();
      this.renderAdPane();
    } catch (e) {
      console.error('[App] Erro ao carregar dados iniciais:', e);
    }
  }

  async loadAdLogins() {
    try {
      const data = await api.get('/api/ad-logins');
      return data.rawText || '';
    } catch (e) {
      console.error('[App] Erro ao ler mapeamento AD do servidor:', e);
      return '';
    }
  }

  initModules() {
    this.vault = new VaultManager((msg) => this.showToast(msg));
    this.inventory = new InventoryManager((msg) => this.showToast(msg));
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
    // Search & Counters
    this.searchInput = document.getElementById('search-input');
    this.searchClearBtn = document.getElementById('search-clear-btn');
    this.totalToolsCounter = document.getElementById('total-tools-count');
    this.filteredToolsCounter = document.getElementById('filtered-tools-count');
    this.pinnedCounter = document.getElementById('pinned-tools-count');
    this.heroTotalCounter = document.getElementById('hero-total-count');

    // Hero KPI Cards
    this.heroCardTotal = document.getElementById('hero-card-total');
    this.heroCardPinned = document.getElementById('hero-card-pinned');
    this.heroCardMostUsed = document.getElementById('hero-card-most-used');
    this.heroCardCategories = document.getElementById('hero-card-categories');
    this.heroCardSearch = document.getElementById('hero-card-search');

    // Filter controls
    this.categoriesContainer = document.getElementById('categories-container');
    this.togglePinnedBtn = document.getElementById('toggle-pinned-btn');
    this.toggleViewBtn = document.getElementById('toggle-view-btn');
    this.toggleThemeBtn = document.getElementById('toggle-theme-btn');

    // Tools container
    this.toolsContainer = document.getElementById('tools-container');
    this.emptyState = document.getElementById('empty-state');
    this.emptyStateClearBtn = document.getElementById('empty-state-clear-btn');

    // Modals
    this.toolModal = document.getElementById('tool-modal');
    this.toolModalForm = document.getElementById('tool-modal-form');
    this.toolModalTitle = document.getElementById('tool-modal-title');
    this.toolModalCloseBtn = document.getElementById('tool-modal-close-btn');
    this.toolModalCancelBtn = document.getElementById('tool-modal-cancel-btn');
    this.openAddToolBtn = document.getElementById('open-add-tool-btn');
    this.heroAddToolBtn = document.getElementById('hero-add-tool-btn');

    // JSON Editor Modal
    this.jsonModal = document.getElementById('json-modal');
    this.openJsonModalBtn = document.getElementById('open-json-modal-btn');
    this.jsonModalCloseBtn = document.getElementById('json-modal-close-btn');
    this.jsonTextarea = document.getElementById('json-textarea');
    this.jsonSaveBtn = document.getElementById('json-save-btn');
    this.jsonCopyBtn = document.getElementById('json-copy-btn');
    this.jsonDownloadBtn = document.getElementById('json-download-btn');
    this.jsonUploadInput = document.getElementById('json-upload-input');
    this.jsonResetBtn = document.getElementById('json-reset-btn');

    // Tool Modal Icon Picker
    this.toolIconInput = document.getElementById('tool-icon-input');
    this.iconPreviewIcon = document.getElementById('icon-preview-icon');
    this.presetIconsGrid = document.getElementById('preset-icons-grid');

    // Primary Tab Navigation
    this.tabButtons = document.querySelectorAll('.tab-nav-btn');
    this.tabPanes = document.querySelectorAll('.tab-pane');

    // AD Logins Pane Elements
    this.paneAdSearchInput = document.getElementById('pane-ad-search-input');
    this.paneAdContainer = document.getElementById('pane-ad-departments-container');

    // Toast
    this.toastContainer = document.getElementById('toast-container');
    this.toastMessage = document.getElementById('toast-message');
  }

  bindEvents() {
    // Primary Tab Switching
    this.tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // AD Logins Search in Tab 4
    if (this.paneAdSearchInput) {
      this.paneAdSearchInput.addEventListener('input', (e) => {
        this.adSearchTerm = e.target.value;
        this.renderAdPane();
      });
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

    if (this.emptyStateClearBtn) {
      this.emptyStateClearBtn.addEventListener('click', () => {
        this.searchTerm = '';
        this.searchInput.value = '';
        this.activeCategory = 'Todos';
        this.onlyPinned = false;
        if (this.searchClearBtn) this.searchClearBtn.classList.add('hidden');
        this.render();
      });
    }

    // Toggle Pinned
    if (this.togglePinnedBtn) {
      this.togglePinnedBtn.addEventListener('click', () => {
        this.onlyPinned = !this.onlyPinned;
        this.updatePinnedButtonState();
        this.render();
      });
    }

    // Toggle View Mode (Grid / Compact)
    if (this.toggleViewBtn) {
      this.toggleViewBtn.addEventListener('click', () => {
        this.viewMode = this.viewMode === 'grid' ? 'compact' : 'grid';
        this.updateViewButtonState();
        this.render();
      });
    }

    // Toggle Theme
    if (this.toggleThemeBtn) {
      this.toggleThemeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Open Add Tool Modal
    const handleOpenAdd = () => {
      this.openToolModal(null);
    };
    if (this.openAddToolBtn) this.openAddToolBtn.addEventListener('click', handleOpenAdd);
    if (this.heroAddToolBtn) this.heroAddToolBtn.addEventListener('click', handleOpenAdd);

    // Hero KPI Cards Click Actions
    if (this.heroCardTotal) {
      this.heroCardTotal.addEventListener('click', () => {
        this.activeCategory = 'Todos';
        this.render();
      });
    }
    if (this.heroCardPinned) {
      this.heroCardPinned.addEventListener('click', () => {
        this.activeCategory = 'Favoritos';
        this.render();
      });
    }
    if (this.heroCardMostUsed) {
      this.heroCardMostUsed.addEventListener('click', () => {
        this.activeCategory = 'Mais Acessados';
        this.render();
      });
    }
    if (this.heroCardCategories) {
      this.heroCardCategories.addEventListener('click', () => {
        if (this.categoriesContainer) {
          this.categoriesContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
    if (this.heroCardSearch) {
      this.heroCardSearch.addEventListener('click', () => {
        if (this.searchInput) {
          this.searchInput.focus();
          this.searchInput.select();
        }
      });
    }

    // Close Tool Modal
    if (this.toolModalCloseBtn) this.toolModalCloseBtn.addEventListener('click', () => this.closeToolModal());
    if (this.toolModalCancelBtn) this.toolModalCancelBtn.addEventListener('click', () => this.closeToolModal());

    // Save Tool Form
    if (this.toolModalForm) {
      this.toolModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveTool();
      });
    }

    // JSON Modal events
    if (this.openJsonModalBtn) {
      this.openJsonModalBtn.addEventListener('click', () => this.openJsonModal());
    }
    if (this.jsonModalCloseBtn) {
      this.jsonModalCloseBtn.addEventListener('click', () => this.closeJsonModal());
    }
    if (this.jsonSaveBtn) {
      this.jsonSaveBtn.addEventListener('click', () => this.handleSaveJson());
    }
    if (this.jsonCopyBtn) {
      this.jsonCopyBtn.addEventListener('click', () => this.handleCopyJson());
    }
    if (this.jsonDownloadBtn) {
      this.jsonDownloadBtn.addEventListener('click', () => this.handleDownloadJson());
    }
    if (this.jsonUploadInput) {
      this.jsonUploadInput.addEventListener('change', (e) => this.handleUploadJson(e));
    }
    if (this.jsonResetBtn) {
      this.jsonResetBtn.addEventListener('click', () => this.handleResetDefaults());
    }

    // Icon Picker Events
    if (this.presetIconsGrid) {
      this.presetIconsGrid.querySelectorAll('.preset-icon-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const icon = btn.getAttribute('data-icon');
          this.setSelectedIcon(icon);
        });
      });
    }

    if (this.toolIconInput) {
      this.toolIconInput.addEventListener('input', (e) => {
        const val = e.target.value.trim() || 'fa-solid fa-server';
        if (this.iconPreviewIcon) this.iconPreviewIcon.className = val;
        this.highlightPresetIcon(val);
      });
    }

    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (this.searchInput) this.searchInput.focus();
      }
      if (e.key === 'Escape') {
        this.closeToolModal();
        this.closeJsonModal();
        if (this.vault) {
          this.vault.closeModal();
          this.vault.closeGenerator();
        }
        if (this.inventory) {
          this.inventory.closeModal();
        }
      }
    });

    this.updateThemeToggleIcon();
    this.updatePinnedButtonState();
    this.updateViewButtonState();
  }

  updatePinnedButtonState() {
    if (!this.togglePinnedBtn) return;
    if (this.onlyPinned) {
      this.togglePinnedBtn.classList.add('bg-amber-500/10', 'border-amber-500/50', 'text-amber-600', 'dark:text-amber-400');
      this.togglePinnedBtn.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-400');
    } else {
      this.togglePinnedBtn.classList.remove('bg-amber-500/10', 'border-amber-500/50', 'text-amber-600', 'dark:text-amber-400');
      this.togglePinnedBtn.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-400');
    }
  }

  updateViewButtonState() {
    if (!this.toggleViewBtn) return;
    const icon = this.toggleViewBtn.querySelector('i');
    if (icon) {
      icon.className = this.viewMode === 'grid' ? 'fa-solid fa-list text-sm' : 'fa-solid fa-table-cells-large text-sm';
    }
  }

  // Filter and sort tools
  getFilteredTools() {
    const query = this.searchTerm.toLowerCase().trim();

    const filtered = this.tools.filter((tool) => {
      // Category filter: Favoritos, Mais Acessados, Todos, or specific category
      if (this.activeCategory === 'Favoritos') {
        if (!tool.pinned) return false;
      } else if (this.activeCategory === 'Mais Acessados' || this.activeCategory === 'Todos') {
        // Exibe todas as ferramentas
      } else {
        if (tool.category !== this.activeCategory) return false;
      }

      // Explicit Pinned filter toggle if active
      if (this.onlyPinned && !tool.pinned) {
        return false;
      }

      // Search text
      if (query) {
        const matchName = tool.name?.toLowerCase().includes(query);
        const matchUrl = tool.url_or_ip?.toLowerCase().includes(query);
        const matchCat = tool.category?.toLowerCase().includes(query);
        const matchDesc = tool.description?.toLowerCase().includes(query);
        const matchPort = tool.port?.toString().includes(query);
        const matchProto = tool.protocol?.toLowerCase().includes(query);

        return matchName || matchUrl || matchCat || matchDesc || matchPort || matchProto;
      }

      return true;
    });

    // Se estiver em Mais Acessados, ordena por acessos acumulados (mais usados no topo!)
    if (this.activeCategory === 'Mais Acessados') {
      return filtered.sort((a, b) => {
        const countA = a.accessCount || 0;
        const countB = b.accessCount || 0;
        if (countB !== countA) return countB - countA;
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    return filtered.sort((a, b) => {
      // Pinned first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  // Get dynamic categories list with counts
  // Structure: ['Favoritos', 'Mais Acessados', ...sortedCategories, 'Todos']
  getCategoriesData() {
    const pinnedCount = this.tools.filter((t) => t.pinned).length;
    const counts = {
      Favoritos: pinnedCount,
      'Mais Acessados': this.tools.length,
      Todos: this.tools.length
    };
    const set = new Set(['Infraestrutura', 'Servidores', 'Automação', 'Suporte']);

    this.tools.forEach((t) => {
      if (t.category) {
        set.add(t.category);
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    });

    const sortedCategories = Array.from(set).sort((a, b) => a.localeCompare(b));

    return {
      list: ['Favoritos', 'Mais Acessados', ...sortedCategories, 'Todos'],
      counts
    };
  }

  renderCategories() {
    if (!this.categoriesContainer) return;
    const { list, counts } = this.getCategoriesData();

    this.categoriesContainer.innerHTML = list
      .map((cat) => {
        const isActive = this.activeCategory === cat;
        const count = counts[cat] || 0;
        const isFavoritos = cat === 'Favoritos';
        const isMaisAcessados = cat === 'Mais Acessados';
        const isTodos = cat === 'Todos';

        let labelHtml = `<span>${cat}</span>`;
        if (isFavoritos) {
          labelHtml = `<i class="fa-solid fa-star ${isActive ? 'text-amber-300' : 'text-amber-400'} text-xs"></i><span>Favoritos</span>`;
        } else if (isMaisAcessados) {
          labelHtml = `<i class="fa-solid fa-fire ${isActive ? 'text-orange-300' : 'text-orange-400'} text-xs"></i><span>Mais Acessados</span>`;
        } else if (isTodos) {
          labelHtml = `<i class="fa-solid fa-list-check text-xs opacity-75"></i><span>Todos</span>`;
        }

        let activeClass = '';
        let badgeClass = '';

        if (isActive) {
          if (isFavoritos) {
            activeClass = 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-sm shadow-amber-500/25 ring-1 ring-amber-400/40';
            badgeClass = 'bg-amber-700/60 text-white';
          } else if (isMaisAcessados) {
            activeClass = 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-sm shadow-orange-500/25 ring-1 ring-orange-400/40';
            badgeClass = 'bg-orange-700/60 text-white';
          } else {
            activeClass = 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20';
            badgeClass = 'bg-blue-700/60 text-white';
          }
        } else {
          activeClass = 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800';
          badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
        }

        return `
          <button
            type="button"
            data-category="${cat}"
            class="category-btn px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeClass}"
          >
            ${labelHtml}
            <span class="text-[10px] px-1.5 py-0.5 rounded-md font-mono ${badgeClass}">${count}</span>
          </button>
        `;
      })
      .join('');

    // Category click events
    this.categoriesContainer.querySelectorAll('.category-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeCategory = btn.getAttribute('data-category');
        this.render();
      });
    });
  }

  renderTools() {
    if (!this.toolsContainer) return;
    const filtered = this.getFilteredTools();

    if (filtered.length === 0) {
      this.toolsContainer.innerHTML = '';
      this.toolsContainer.className = 'hidden';
      if (this.emptyState) {
        this.emptyState.classList.remove('hidden');
        const isFavoritos = this.activeCategory === 'Favoritos';
        const isMaisAcessados = this.activeCategory === 'Mais Acessados';
        const titleEl = this.emptyState.querySelector('h3');
        const descEl = this.emptyState.querySelector('p');
        const iconEl = this.emptyState.querySelector('.rounded-2xl i');
        const btnEl = this.emptyStateClearBtn;

        if (isFavoritos && !this.searchTerm) {
          if (iconEl) iconEl.className = 'fa-solid fa-star text-amber-400';
          if (titleEl) titleEl.textContent = 'Nenhum app marcado nos Favoritos';
          if (descEl) descEl.textContent = 'Clique na estrela (⭐) em qualquer ferramenta para marcá-la como favorita e fixar seu acesso!';
          if (btnEl) btnEl.textContent = 'Ver Todos os Apps';
        } else if (isMaisAcessados && !this.searchTerm) {
          if (iconEl) iconEl.className = 'fa-solid fa-fire text-orange-400';
          if (titleEl) titleEl.textContent = 'Nenhum app disponível';
          if (descEl) descEl.textContent = 'Cadastre ferramentas ou utilize o portal para registrar acessos automáticos.';
          if (btnEl) btnEl.textContent = 'Ver Todos os Apps';
        } else {
          if (iconEl) iconEl.className = 'fa-solid fa-magnifying-glass text-blue-500';
          if (titleEl) titleEl.textContent = 'Nenhuma ferramenta encontrada';
          if (descEl) descEl.textContent = 'Não encontramos nenhum item correspondente ao filtro de busca atual.';
          if (btnEl) btnEl.textContent = 'Limpar Filtros';
        }
      }
      return;
    }

    if (this.emptyState) this.emptyState.classList.add('hidden');

    if (this.viewMode === 'grid') {
      this.toolsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
    } else {
      this.toolsContainer.className = 'flex flex-col gap-2.5';
    }

    this.toolsContainer.innerHTML = filtered
      .map((tool) => (this.viewMode === 'grid' ? this.createGridCard(tool) : this.createCompactCard(tool)))
      .join('');

    this.bindCardEvents();
  }

  createGridCard(tool) {
    const isPinned = !!tool.pinned;
    const protocolColor = this.getProtocolColor(tool.protocol);
    const categoryColor = this.getCategoryColor(tool.category);
    const launchUrl = this.formatLaunchUrl(tool.url_or_ip);
    const detailsUrl = `details.html?id=${encodeURIComponent(tool.id)}`;

    return `
      <div class="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between" data-id="${tool.id}">
        <!-- Top Row: Icon, Category Badge & Pin Button -->
        <div>
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex items-center gap-3">
              <a
                href="${detailsUrl}"
                target="_blank"
                class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg group-hover:scale-105 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all cursor-pointer shrink-0"
                title="Abrir anotações e detalhes do app em nova aba"
              >
                <i class="${tool.icon || 'fa-solid fa-server'}"></i>
              </a>
              <div>
                <a
                  href="${detailsUrl}"
                  target="_blank"
                  class="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block cursor-pointer"
                  title="Abrir anotações e detalhes do app em nova aba"
                >
                  ${tool.name}
                </a>
                <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${categoryColor}">
                  ${tool.category}
                </span>
              </div>
            </div>

            <!-- Star / Favoritos Button -->
            <button
              type="button"
              class="pin-btn w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isPinned
                  ? 'text-amber-500 bg-amber-500/15 hover:bg-amber-500/25 shadow-2xs'
                  : 'text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }"
              title="${isPinned ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}"
              data-id="${tool.id}"
            >
              <i class="${isPinned ? 'fa-solid fa-star text-amber-400 text-xs' : 'fa-regular fa-star text-xs'}"></i>
            </button>
          </div>

          <!-- Description -->
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed h-8">
            ${tool.description || 'Sem descrição informada.'}
          </p>

          <!-- IP / Address Box -->
          <div class="mb-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 rounded-xl p-2 flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0 font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
              <i class="fa-solid fa-network-wired text-[10px] text-slate-400"></i>
              <span class="truncate select-all" title="${tool.url_or_ip}">${tool.url_or_ip}</span>
            </div>
            <button
              type="button"
              class="copy-ip-btn shrink-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copiar endereço IP / URL"
              data-url="${tool.url_or_ip}"
            >
              <i class="fa-regular fa-copy text-xs"></i>
            </button>
          </div>

          <!-- Metadata Badges (Protocol, Port, Env) -->
          <div class="flex flex-wrap items-center gap-1.5 mb-4 text-[10px] font-mono">
            ${
              tool.protocol
                ? `<span class="px-2 py-0.5 rounded-md font-semibold ${protocolColor}">${tool.protocol}</span>`
                : ''
            }
            ${
              tool.port
                ? `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">Porta: ${tool.port}</span>`
                : ''
            }
            ${
              tool.environment
                ? `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">${tool.environment}</span>`
                : ''
            }
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="edit-btn p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
              title="Editar ferramenta"
              data-id="${tool.id}"
            >
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button
              type="button"
              class="delete-btn p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-xs transition-colors cursor-pointer"
              title="Excluir ferramenta"
              data-id="${tool.id}"
              data-name="${tool.name}"
            >
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- Notes in new tab button -->
            <a
              href="${detailsUrl}"
              target="_blank"
              class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="Abrir anotações e procedimentos em nova aba"
            >
              <i class="fa-solid fa-book-bookmark text-[10px] text-blue-500"></i>
              <span>Notas</span>
            </a>

            <!-- Launch / Open URL button -->
            <a
              href="${launchUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="launch-tool-btn px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Acessar endereço da ferramenta"
              data-id="${tool.id}"
            >
              <span>Acessar</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  createCompactCard(tool) {
    const isPinned = !!tool.pinned;
    const protocolColor = this.getProtocolColor(tool.protocol);
    const launchUrl = this.formatLaunchUrl(tool.url_or_ip);
    const detailsUrl = `details.html?id=${encodeURIComponent(tool.id)}`;

    return `
      <div class="group bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3" data-id="${tool.id}">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            class="pin-btn text-xs ${isPinned ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'} cursor-pointer shrink-0 transition-colors p-1"
            title="${isPinned ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}"
            data-id="${tool.id}"
          >
            <i class="${isPinned ? 'fa-solid fa-star' : 'fa-regular fa-star'}"></i>
          </button>

          <a
            href="${detailsUrl}"
            target="_blank"
            class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm shrink-0 transition-colors cursor-pointer"
            title="Abrir anotações em nova aba"
          >
            <i class="${tool.icon || 'fa-solid fa-server'}"></i>
          </a>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <a
                href="${detailsUrl}"
                target="_blank"
                class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate cursor-pointer"
                title="Abrir anotações em nova aba"
              >
                ${tool.name}
              </a>
              <span class="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                ${tool.category}
              </span>
            </div>
            <div class="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
              <span class="truncate">${tool.url_or_ip}</span>
              ${tool.port ? `<span>&bull; Porta: ${tool.port}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            class="copy-ip-btn p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
            title="Copiar IP / URL"
            data-url="${tool.url_or_ip}"
          >
            <i class="fa-regular fa-copy"></i>
          </button>
          <a
            href="${detailsUrl}"
            target="_blank"
            class="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
            title="Abrir anotações em nova aba"
          >
            <i class="fa-solid fa-book-bookmark"></i>
          </a>
          <button
            type="button"
            class="edit-btn p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
            title="Editar"
            data-id="${tool.id}"
          >
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button
            type="button"
            class="delete-btn p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-xs transition-colors cursor-pointer"
            title="Excluir"
            data-id="${tool.id}"
            data-name="${tool.name}"
          >
            <i class="fa-regular fa-trash-can"></i>
          </button>
          <a
            href="${launchUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="launch-tool-btn px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
            data-id="${tool.id}"
          >
            <span>Acessar</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
          </a>
        </div>
      </div>
    `;
  }

  bindCardEvents() {
    // Launch click tracking
    this.toolsContainer.querySelectorAll('.launch-tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.recordToolAccess(id);
      });
    });

    // Copy IP
    this.toolsContainer.querySelectorAll('.copy-ip-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        this.copyToClipboard(url, `Endereço "${url}" copiado para a área de transferência!`);
      });
    });

    // Toggle Pin
    this.toolsContainer.querySelectorAll('.pin-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.handleTogglePin(id);
      });
    });

    // Edit
    this.toolsContainer.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const tool = this.tools.find((t) => t.id === id);
        if (tool) this.openToolModal(tool);
      });
    });

    // Delete
    this.toolsContainer.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        if (window.confirm(`Tem certeza que deseja remover a ferramenta "${name}"?`)) {
          this.handleDeleteTool(id);
        }
      });
    });
  }

  async handleTogglePin(id) {
    const tool = this.tools.find((t) => t.id === id);
    if (!tool) return;
    const nextState = !tool.pinned;

    this.tools = this.tools.map((t) => {
      if (t.id === id) {
        return { ...t, pinned: nextState };
      }
      return t;
    });

    this.showToast(
      nextState
        ? `⭐ "${tool.name}" adicionado aos Favoritos!`
        : `"${tool.name}" removido dos Favoritos.`
    );

    try {
      await saveTools(this.tools);
    } catch (e) {
      console.error('[App] Erro ao salvar status nos Favoritos:', e);
      this.showToast('Aviso: Erro ao sincronizar com servidor.');
    }
    this.render();
  }

  async handleDeleteTool(id) {
    const target = this.tools.find((t) => t.id === id);
    try {
      await deleteTool(id);
      this.tools = this.tools.filter((t) => t.id !== id);
      this.showToast(`Ferramenta "${target?.name || ''}" removida com sucesso.`);
      this.render();
    } catch (e) {
      alert('Erro ao excluir ferramenta: ' + e.message);
    }
  }

  openToolModal(tool = null) {
    this.editingToolId = tool ? tool.id : null;
    if (this.toolModalTitle) {
      this.toolModalTitle.textContent = tool ? 'Editar Ferramenta' : 'Cadastrar Nova Ferramenta';
    }

    const form = this.toolModalForm;
    if (form) {
      form.elements['tool-name'].value = tool ? tool.name : '';
      form.elements['tool-url'].value = tool ? tool.url_or_ip : '';
      form.elements['tool-category'].value = tool ? tool.category : 'Infraestrutura';
      form.elements['tool-port'].value = tool && tool.port ? tool.port : '';
      form.elements['tool-protocol'].value = tool && tool.protocol ? tool.protocol : 'HTTPS';
      form.elements['tool-environment'].value = tool && tool.environment ? tool.environment : 'Produção';
      const selectedIcon = tool && tool.icon ? tool.icon : 'fa-solid fa-server';
      form.elements['tool-icon'].value = selectedIcon;
      this.setSelectedIcon(selectedIcon);
      form.elements['tool-description'].value = tool && tool.description ? tool.description : '';
      if (form.elements['tool-notes']) {
        form.elements['tool-notes'].value = tool && tool.notes ? tool.notes : '';
      }
      form.elements['tool-pinned'].checked = tool ? !!tool.pinned : false;
    }

    if (this.toolModal) {
      this.toolModal.classList.remove('hidden');
    }
  }

  setSelectedIcon(iconClass) {
    const safeIcon = iconClass || 'fa-solid fa-server';
    if (this.toolIconInput) this.toolIconInput.value = safeIcon;
    if (this.iconPreviewIcon) this.iconPreviewIcon.className = safeIcon;
    this.highlightPresetIcon(safeIcon);
  }

  highlightPresetIcon(iconClass) {
    if (!this.presetIconsGrid) return;
    this.presetIconsGrid.querySelectorAll('.preset-icon-btn').forEach((btn) => {
      const btnIcon = btn.getAttribute('data-icon');
      if (btnIcon === iconClass) {
        btn.classList.add('bg-blue-600', 'text-white', 'shadow-xs', 'ring-2', 'ring-blue-400');
        btn.classList.remove('text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white', 'shadow-xs', 'ring-2', 'ring-blue-400');
        btn.classList.add('text-slate-600', 'dark:text-slate-300');
      }
    });
  }

  closeToolModal() {
    if (this.toolModal) {
      this.toolModal.classList.add('hidden');
    }
    this.editingToolId = null;
  }

  async handleSaveTool() {
    const form = this.toolModalForm;
    if (!form) return;

    const name = form.elements['tool-name'].value.trim();
    const url_or_ip = form.elements['tool-url'].value.trim();
    const category = form.elements['tool-category'].value.trim();
    const port = form.elements['tool-port'].value.trim();
    const protocol = form.elements['tool-protocol'].value.trim();
    const environment = form.elements['tool-environment'].value.trim();
    const icon = form.elements['tool-icon'].value.trim() || 'fa-solid fa-server';
    const description = form.elements['tool-description'].value.trim();
    const notes = form.elements['tool-notes'] ? form.elements['tool-notes'].value : '';
    const pinned = form.elements['tool-pinned'].checked;

    if (!name || !url_or_ip) {
      alert('Por favor, informe ao menos o Nome e a URL/IP da ferramenta.');
      return;
    }

    if (this.editingToolId) {
      // Update
      this.tools = this.tools.map((t) => {
        if (t.id === this.editingToolId) {
          return {
            ...t,
            name,
            url_or_ip,
            category,
            port,
            protocol,
            environment,
            icon,
            description,
            notes,
            pinned
          };
        }
        return t;
      });
      this.showToast(`Ferramenta "${name}" atualizada!`);
    } else {
      // Create new
      const newTool = {
        id: 'tool-' + Date.now(),
        name,
        url_or_ip,
        category,
        port,
        protocol,
        environment,
        icon,
        description,
        notes,
        pinned,
        status: 'online',
        custom: true
      };
      this.tools = [newTool, ...this.tools];
      this.showToast(`Nova ferramenta "${name}" cadastrada com sucesso!`);
    }

    try {
      await saveTools(this.tools);
    } catch (e) {
      alert('Erro ao salvar ferramenta no servidor: ' + e.message);
    }
    this.closeToolModal();
    this.render();
  }

  // JSON Modal Handlers
  openJsonModal() {
    if (this.jsonTextarea) {
      this.jsonTextarea.value = JSON.stringify(this.tools, null, 2);
    }
    if (this.jsonModal) {
      this.jsonModal.classList.remove('hidden');
    }
  }

  closeJsonModal() {
    if (this.jsonModal) {
      this.jsonModal.classList.add('hidden');
    }
  }

  async handleSaveJson() {
    try {
      const parsed = JSON.parse(this.jsonTextarea.value);
      if (!Array.isArray(parsed)) {
        throw new Error('O JSON deve ser um array de ferramentas.');
      }
      this.tools = parsed;
      await saveTools(this.tools);
      this.showToast('JSON importado e salvo com sucesso no servidor!');
      this.closeJsonModal();
      this.render();
    } catch (err) {
      alert('Erro ao validar ou salvar JSON: ' + err.message);
    }
  }

  handleCopyJson() {
    if (this.jsonTextarea) {
      this.copyToClipboard(this.jsonTextarea.value, 'JSON completo copiado para a área de transferência!');
    }
  }

  handleDownloadJson() {
    const jsonStr = JSON.stringify(this.tools, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vieiratech-hub-tools-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Backup JSON exportado!');
  }

  handleUploadJson(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          throw new Error('O arquivo JSON deve conter um array de ferramentas.');
        }
        if (this.jsonTextarea) {
          this.jsonTextarea.value = JSON.stringify(parsed, null, 2);
        }
        this.showToast('Arquivo carregado no editor! Clique em "Salvar Alterações".');
      } catch (err) {
        alert('Erro ao ler arquivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  handleResetDefaults() {
    if (window.confirm('Deseja realmente restaurar as ferramentas para os valores padrão de fábrica?')) {
      this.tools = resetToDefaults();
      if (this.jsonTextarea) {
        this.jsonTextarea.value = JSON.stringify(this.tools, null, 2);
      }
      this.showToast('Lista restaurada para os padrões.');
      this.closeJsonModal();
      this.render();
    }
  }

  // Utilities
  formatLaunchUrl(url) {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `http://${url}`;
  }

  getProtocolColor(proto) {
    switch (proto) {
      case 'HTTPS':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'HTTP':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Winbox':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20';
      case 'SSH':
      case 'Telnet':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
      case 'RDP':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    }
  }

  getCategoryColor(cat) {
    switch (cat) {
      case 'Infraestrutura':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400';
      case 'Servidores':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400';
      case 'Automação':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400';
      case 'Suporte':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  }

  initUserManagement() {
    this.adminUsersBtn = document.getElementById('admin-users-btn');
    this.usersModal = document.getElementById('users-modal');
    this.usersModalCloseBtn = document.getElementById('users-modal-close-btn');
    this.newUserForm = document.getElementById('new-user-form');
    this.usersTableBody = document.getElementById('users-table-body');
    this.usersCountBadge = document.getElementById('users-count-badge');

    if (this.adminUsersBtn) {
      this.adminUsersBtn.addEventListener('click', () => {
        this.openUsersModal();
      });
    }

    if (this.usersModalCloseBtn) {
      this.usersModalCloseBtn.addEventListener('click', () => {
        if (this.usersModal) this.usersModal.classList.add('hidden');
      });
    }

    if (this.newUserForm) {
      this.newUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('user-form-name')?.value?.trim();
        const username = document.getElementById('user-form-username')?.value?.trim();
        const password = document.getElementById('user-form-password')?.value?.trim();
        const role = document.getElementById('user-form-role')?.value || 'operador';

        if (!name || !username || !password) {
          alert('Preencha todos os campos.');
          return;
        }

        try {
          await api.post('/api/users', { name, username, password, role });
          this.showToast(`Usuário "${username}" criado com sucesso!`);
          this.newUserForm.reset();
          await this.loadUsersTable();
        } catch (err) {
          alert('Erro ao criar usuário: ' + err.message);
        }
      });
    }
  }

  async openUsersModal() {
    if (!api.isAdmin()) {
      alert('Acesso restrito apenas para administradores.');
      return;
    }
    if (this.usersModal) this.usersModal.classList.remove('hidden');
    await this.loadUsersTable();
  }

  async loadUsersTable() {
    if (!this.usersTableBody) return;
    try {
      const users = await api.get('/api/users');
      if (this.usersCountBadge) this.usersCountBadge.textContent = users.length;

      const currentLogged = AuthManager.getCurrentUser();

      this.usersTableBody.innerHTML = users.map((u) => {
        const isSelf = currentLogged && currentLogged.id === u.id;
        const roleBadge = u.role === 'admin'
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Administrador</span>'
          : '<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">Técnico / Operador</span>';

        return `
          <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="px-3.5 py-2.5 font-medium text-slate-800 dark:text-slate-200">${u.name}</td>
            <td class="px-3.5 py-2.5 font-mono text-slate-600 dark:text-slate-400">${u.username}</td>
            <td class="px-3.5 py-2.5">${roleBadge}</td>
            <td class="px-3.5 py-2.5 text-right">
              ${isSelf ? '<span class="text-[11px] text-slate-400 italic">Conectado</span>' : `
                <button
                  type="button"
                  data-user-id="${u.id}"
                  data-username="${u.username}"
                  class="user-delete-btn text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Excluir Usuário"
                >
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              `}
            </td>
          </tr>
        `;
      }).join('');

      this.usersTableBody.querySelectorAll('.user-delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-user-id');
          const username = btn.getAttribute('data-username');
          if (window.confirm(`Deseja realmente remover o usuário "${username}"?`)) {
            try {
              await api.delete('/api/users/' + id);
              this.showToast(`Usuário "${username}" removido.`);
              await this.loadUsersTable();
            } catch (err) {
              alert('Erro ao excluir usuário: ' + err.message);
            }
          }
        });
      });
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
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
    }, 3200);
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    localStorage.setItem(TAB_STORAGE_KEY, tabId);

    // Update Tab Buttons UI
    this.tabButtons.forEach((btn) => {
      const bTab = btn.getAttribute('data-tab');
      if (bTab === tabId) {
        btn.classList.add('bg-blue-600', 'text-white', 'font-bold', 'shadow-xs');
        btn.classList.remove('text-slate-600', 'dark:text-slate-400');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white', 'font-bold', 'shadow-xs');
        btn.classList.add('text-slate-600', 'dark:text-slate-400');
      }
    });

    // Update Panes Visibility
    this.tabPanes.forEach((pane) => {
      const paneId = pane.id.replace('pane-', '');
      if (paneId === tabId) {
        pane.classList.remove('hidden');
      } else {
        pane.classList.add('hidden');
      }
    });

    // Render active pane com sincronização em tempo real do servidor
    if (tabId === 'vault' && this.vault) {
      this.vault.loadPasswords();
    } else if (tabId === 'inventory' && this.inventory) {
      this.inventory.loadItems();
    } else if (tabId === 'logins') {
      this.renderAdPane();
      this.loadAdLogins().then((fresh) => {
        if (fresh && fresh !== this.adRawText) {
          this.adRawText = fresh;
          this.renderAdPane();
        }
      });
    } else if (tabId === 'apps') {
      this.render();
    }
  }

  parseAdLogins(rawText) {
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

        if (!deptMap.has(currentDeptName)) {
          const deptObj = {
            name: currentDeptName,
            subSections: new Map(),
            directUsers: []
          };
          deptMap.set(currentDeptName, deptObj);
          departments.push(deptObj);
        }
        continue;
      }

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

        const isInactive = userPart.startsWith('❌') || userPart.startsWith('X');
        userPart = userPart.replace(/^[✔❌X>]\s*/, '').trim();
        if (!userPart) continue;

        totalEntries++;
        const userId = 'ad-user-' + totalEntries + '-' + userPart.replace(/[^a-zA-Z0-9]/g, '_');

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

  renderAdPane() {
    if (!this.paneAdContainer) return;
    const { departments } = this.parseAdLogins(this.adRawText);
    const q = (this.adSearchTerm || '').toLowerCase().trim();

    const filteredDepts = departments
      .map((dept) => {
        const matchDeptName = dept.name.toLowerCase().includes(q);

        const filteredDirect = dept.directUsers.filter((u) => {
          if (!q) return true;
          return matchDeptName || u.user.toLowerCase().includes(q) || u.pass.toLowerCase().includes(q);
        });

        const filteredSubs = new Map();
        dept.subSections.forEach((users, subName) => {
          const matchSub = subName.toLowerCase().includes(q);
          const matchedUsers = users.filter((u) => {
            if (!q) return true;
            return matchDeptName || matchSub || u.user.toLowerCase().includes(q) || u.pass.toLowerCase().includes(q);
          });
          if (matchedUsers.length > 0) {
            filteredSubs.set(subName, matchedUsers);
          }
        });

        if (filteredDirect.length > 0 || filteredSubs.size > 0) {
          return {
            name: dept.name,
            directUsers: filteredDirect,
            subSections: filteredSubs
          };
        }
        return null;
      })
      .filter(Boolean);

    if (filteredDepts.length === 0) {
      this.paneAdContainer.innerHTML = `
        <div class="py-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <i class="fa-solid fa-users-slash text-3xl text-slate-400 mb-2"></i>
          <h4 class="font-bold text-sm text-slate-800 dark:text-slate-200">Nenhum usuário AD encontrado</h4>
          <p class="text-xs text-slate-400 dark:text-slate-500">Tente buscar por outro termo ou nome.</p>
        </div>
      `;
      return;
    }

    this.paneAdContainer.innerHTML = filteredDepts
      .map((dept) => {
        let subSectionsHtml = '';
        let deptTotalUsers = dept.directUsers.length;

        dept.subSections.forEach((users, subTitle) => {
          deptTotalUsers += users.length;
          const isEspinha = subTitle.startsWith('Espinha');
          const badgeClass = isEspinha
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
          const icon = isEspinha ? 'fa-solid fa-layer-group' : 'fa-solid fa-user-tie';

          const usersRows = users.map((u) => this.renderAdUserRow(u)).join('');

          subSectionsHtml += `
            <div class="mb-4 last:mb-0 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-3 border border-slate-200/50 dark:border-slate-800/60">
              <div class="flex items-center justify-between gap-2 mb-2.5 pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${badgeClass} flex items-center gap-1.5">
                  <i class="${icon}"></i>
                  <span>${subTitle}</span>
                </span>
                <span class="text-[10px] text-slate-400 font-mono font-bold">(${users.length} ${users.length === 1 ? 'login' : 'logins'})</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                ${usersRows}
              </div>
            </div>
          `;
        });

        const directUsersHtml =
          dept.directUsers.length > 0
            ? `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
              ${dept.directUsers.map((u) => this.renderAdUserRow(u)).join('')}
            </div>
          `
            : '';

        return `
          <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-5">
            <div class="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shadow-2xs shrink-0">
                  <i class="fa-solid fa-building-user text-sm"></i>
                </div>
                <div>
                  <h3 class="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                    ${dept.name}
                  </h3>
                  <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    ${deptTotalUsers} ${deptTotalUsers === 1 ? 'conta ativa' : 'contas ativas'}
                  </span>
                </div>
              </div>
            </div>

            ${directUsersHtml}
            ${subSectionsHtml}
          </div>
        `;
      })
      .join('');

    this.bindAdPaneEvents();
  }

  renderAdUserRow(u) {
    const isRevealed = this.adRevealedPasswords.has(u.id);
    const displayPass = isRevealed ? u.pass : '••••••••••••';
    const isInactive = u.status === 'inactive';

    return `
      <div class="bg-white dark:bg-slate-950/80 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/90 shadow-2xs hover:border-blue-500/50 flex flex-col justify-between gap-2 transition-all">
        <!-- Top: User info & Copy User -->
        <div class="flex items-start justify-between gap-2 min-w-0">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="w-2.5 h-2.5 rounded-full ${isInactive ? 'bg-red-500' : 'bg-emerald-500'} shrink-0 shadow-2xs" title="${isInactive ? 'Inativo' : 'Ativo'}"></span>
            <span class="font-bold text-xs text-slate-900 dark:text-slate-100 truncate select-all ${isInactive ? 'line-through text-slate-400' : ''}" title="${u.user}">
              ${u.user}
            </span>
          </div>

          <button
            type="button"
            class="ad-copy-user-btn text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Copiar usuário"
            data-user="${u.user}"
          >
            <i class="fa-regular fa-copy text-xs"></i>
          </button>
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
            <button
              type="button"
              class="ad-eye-btn p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="${isRevealed ? 'Ocultar senha' : 'Ver senha'}"
              data-id="${u.id}"
            >
              <i class="${isRevealed ? 'fa-regular fa-eye-slash text-xs text-blue-500' : 'fa-regular fa-eye text-xs'}"></i>
            </button>
            <button
              type="button"
              class="ad-copy-btn p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

  bindAdPaneEvents() {
    if (!this.paneAdContainer) return;

    // Eye toggle
    this.paneAdContainer.querySelectorAll('.ad-eye-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          if (this.adRevealedPasswords.has(id)) {
            this.adRevealedPasswords.delete(id);
          } else {
            this.adRevealedPasswords.add(id);
          }
          this.renderAdPane();
        }
      });
    });

    // Copy user
    this.paneAdContainer.querySelectorAll('.ad-copy-user-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const copyUser = btn.getAttribute('data-user');
        if (copyUser) {
          this.copyToClipboard(copyUser, 'Usuário copiado com sucesso!');
        }
      });
    });

    // Copy password
    this.paneAdContainer.querySelectorAll('.ad-copy-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const copyText = btn.getAttribute('data-copy');
        if (copyText) {
          this.copyToClipboard(copyText, 'Senha copiada com sucesso!');
        }
      });
    });
  }

  renderCounters() {
    const filtered = this.getFilteredTools();
    const pinnedCount = this.tools.filter((t) => t.pinned).length;
    const totalAccesses = this.tools.reduce((sum, t) => sum + (t.accessCount || 0), 0);
    const categoriesCount = new Set(this.tools.map((t) => t.category).filter(Boolean)).size;

    if (this.totalToolsCounter) this.totalToolsCounter.textContent = this.tools.length;
    if (this.filteredToolsCounter) this.filteredToolsCounter.textContent = filtered.length;
    if (this.pinnedCounter) this.pinnedCounter.textContent = pinnedCount;
    if (this.heroTotalCounter) this.heroTotalCounter.textContent = this.tools.length;

    // Atualiza os cartões KPI do Hero Banner
    const heroStatTotal = document.getElementById('hero-stat-total');
    const heroStatPinned = document.getElementById('hero-stat-pinned');
    const heroStatAccesses = document.getElementById('hero-stat-accesses');
    const heroStatCategories = document.getElementById('hero-stat-categories');

    if (heroStatTotal) heroStatTotal.textContent = this.tools.length;
    if (heroStatPinned) heroStatPinned.textContent = pinnedCount;
    if (heroStatAccesses) heroStatAccesses.textContent = totalAccesses;
    if (heroStatCategories) heroStatCategories.textContent = categoriesCount || 4;
  }

  async recordToolAccess(id) {
    const tool = this.tools.find((t) => t.id === id);
    if (!tool) return;

    tool.accessCount = (tool.accessCount || 0) + 1;
    tool.lastAccessedAt = new Date().toISOString();
    this.renderCounters();

    try {
      await api.post(`/api/tools/${encodeURIComponent(id)}/access`, {});
    } catch (e) {
      console.warn('[App] Erro ao registrar acesso individual via API:', e);
    }
  }

  render() {
    this.renderCounters();
    this.renderCategories();
    this.renderTools();
  }
}

// Initialize with robust DOM ready check
function boot() {
  AuthManager.initAuthGate(() => {
    window.vieiratechApp = new App();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
