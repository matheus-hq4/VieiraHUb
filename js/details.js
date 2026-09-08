import { loadTools, saveTools, loadTheme, saveTheme } from './storage.js';
import { AuthManager } from './auth.js';

class ToolDetailsApp {
  constructor() {
    this.tools = [];
    this.isDarkMode = loadTheme();
    this.tool = null;
    this.autoSaveTimer = null;

    this.initTheme();
    this.initDOMElements();
    this.bindEvents();
    this.initData();
  }

  async initData() {
    this.tools = await loadTools();
    this.loadToolFromUrl();
    this.render();
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

  loadToolFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const toolId = params.get('id');

    if (toolId) {
      this.tool = this.tools.find((t) => t.id === toolId);
    }

    if (!this.tool && this.tools.length > 0) {
      this.tool = this.tools[0];
    }
  }

  initDOMElements() {
    // Header elements
    this.headerToolName = document.getElementById('header-tool-name');
    this.headerToolCategory = document.getElementById('header-tool-category');
    this.headerLaunchBtn = document.getElementById('header-launch-btn');
    this.toggleThemeBtn = document.getElementById('toggle-theme-btn');

    // Details panel
    this.toolIcon = document.getElementById('tool-icon');
    this.toolName = document.getElementById('tool-name');
    this.toolCategory = document.getElementById('tool-category');
    this.toolEnvironment = document.getElementById('tool-environment');
    this.toolProtocol = document.getElementById('tool-protocol');
    this.toolPort = document.getElementById('tool-port');
    this.toolDescription = document.getElementById('tool-description');
    this.toolUrl = document.getElementById('tool-url');
    this.copyIpBtn = document.getElementById('copy-ip-btn');
    this.mainLaunchBtn = document.getElementById('main-launch-btn');

    // Command Helpers
    this.pingCommand = document.getElementById('cmd-ping');
    this.copyPingBtn = document.getElementById('copy-ping-btn');
    this.psCommand = document.getElementById('cmd-powershell');
    this.copyPsBtn = document.getElementById('copy-powershell-btn');

    // Notepad elements
    this.notesTextarea = document.getElementById('notes-textarea');
    this.saveStatus = document.getElementById('save-status');
    this.copyNotesBtn = document.getElementById('copy-notes-btn');
    this.downloadNotesBtn = document.getElementById('download-notes-btn');
    this.clearNotesBtn = document.getElementById('clear-notes-btn');
    this.lineCounter = document.getElementById('notes-line-count');
    this.charCounter = document.getElementById('notes-char-count');

    // Toast
    this.toastContainer = document.getElementById('toast-container');
    this.toastMessage = document.getElementById('toast-message');
  }

  bindEvents() {
    if (this.toggleThemeBtn) {
      this.toggleThemeBtn.addEventListener('click', () => this.toggleTheme());
    }

    if (this.copyIpBtn) {
      this.copyIpBtn.addEventListener('click', () => {
        this.copyToClipboard(this.tool?.url_or_ip || '', 'Endereço IP/URL copiado!');
      });
    }

    if (this.copyPingBtn) {
      this.copyPingBtn.addEventListener('click', () => {
        this.copyToClipboard(this.pingCommand?.textContent || '', 'Comando ping copiado!');
      });
    }

    if (this.copyPsBtn) {
      this.copyPsBtn.addEventListener('click', () => {
        this.copyToClipboard(this.psCommand?.textContent || '', 'Comando PowerShell copiado!');
      });
    }

    // Auto-save on typing in Notepad
    if (this.notesTextarea) {
      this.notesTextarea.addEventListener('input', () => {
        this.updateCounters();
        this.indicateSaving();
        if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
          this.saveNotes(this.notesTextarea.value);
        }, 300);
      });

      // Enable Tab key support in textarea
      this.notesTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = this.notesTextarea.selectionStart;
          const end = this.notesTextarea.selectionEnd;
          this.notesTextarea.value = this.notesTextarea.value.substring(0, start) + '  ' + this.notesTextarea.value.substring(end);
          this.notesTextarea.selectionStart = this.notesTextarea.selectionEnd = start + 2;
          this.notesTextarea.dispatchEvent(new Event('input'));
        }
      });
    }

    if (this.copyNotesBtn) {
      this.copyNotesBtn.addEventListener('click', () => {
        this.copyToClipboard(this.notesTextarea?.value || '', 'Anotações copiadas para a área de transferência!');
      });
    }

    if (this.downloadNotesBtn) {
      this.downloadNotesBtn.addEventListener('click', () => {
        this.downloadNotesAsText();
      });
    }

    if (this.clearNotesBtn) {
      this.clearNotesBtn.addEventListener('click', () => {
        if (window.confirm('Deseja realmente limpar todo o conteúdo do bloco de notas?')) {
          if (this.notesTextarea) {
            this.notesTextarea.value = '';
            this.updateCounters();
            this.saveNotes('');
            this.showToast('Bloco de notas limpo.');
          }
        }
      });
    }

    this.updateThemeToggleIcon();
  }

  updateCounters() {
    const text = this.notesTextarea?.value || '';
    const lines = text ? text.split('\n').length : 1;
    const chars = text.length;

    if (this.lineCounter) this.lineCounter.textContent = `Linhas: ${lines}`;
    if (this.charCounter) this.charCounter.textContent = `Caracteres: ${chars}`;
  }

  indicateSaving() {
    if (this.saveStatus) {
      this.saveStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-blue-500 text-xs"></i><span>Salvando...</span>';
      this.saveStatus.className = 'text-xs text-blue-500 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60';
    }
  }

  async saveNotes(notesContent) {
    if (!this.tool) return;

    this.tool.notes = notesContent;
    this.tools = this.tools.map((t) => (t.id === this.tool.id ? { ...t, notes: notesContent } : t));
    await saveTools(this.tools);

    if (this.saveStatus) {
      this.saveStatus.innerHTML = '<i class="fa-solid fa-check text-emerald-500 text-xs"></i><span>Salvo</span>';
      this.saveStatus.className = 'text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60';
    }
  }

  downloadNotesAsText() {
    if (!this.tool) return;
    const content = this.notesTextarea?.value || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anotacoes-${this.tool.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Arquivo de anotações .txt baixado!');
  }

  formatLaunchUrl(url) {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `http://${url}`;
  }

  cleanHostOnly(urlOrIp) {
    if (!urlOrIp) return '127.0.0.1';
    let clean = urlOrIp.replace(/^https?:\/\//, '');
    clean = clean.split('/')[0];
    clean = clean.split(':')[0];
    return clean;
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
    if (!this.tool) {
      alert('Ferramenta não encontrada.');
      window.location.href = '/';
      return;
    }

    const t = this.tool;
    const hostOnly = this.cleanHostOnly(t.url_or_ip);
    const launchUrl = this.formatLaunchUrl(t.url_or_ip);

    // Document Title
    document.title = `${t.name} - Bloco de Notas | VieiraTech HUB`;

    // Header
    if (this.headerToolName) this.headerToolName.textContent = t.name;
    if (this.headerToolCategory) this.headerToolCategory.textContent = t.category;
    if (this.headerLaunchBtn) this.headerLaunchBtn.href = launchUrl;

    // Left Panel Details
    if (this.toolIcon) this.toolIcon.className = t.icon || 'fa-solid fa-server';
    if (this.toolName) this.toolName.textContent = t.name;
    if (this.toolCategory) this.toolCategory.textContent = t.category;
    if (this.toolEnvironment) this.toolEnvironment.textContent = t.environment || 'Produção';
    if (this.toolProtocol) this.toolProtocol.textContent = t.protocol || 'HTTPS';
    if (this.toolPort) this.toolPort.textContent = t.port ? `Porta: ${t.port}` : 'Porta Padrão';
    if (this.toolDescription) this.toolDescription.textContent = t.description || 'Nenhuma descrição técnica informada.';
    if (this.toolUrl) this.toolUrl.textContent = t.url_or_ip;
    if (this.mainLaunchBtn) this.mainLaunchBtn.href = launchUrl;

    // Commands Helpers
    if (this.pingCommand) this.pingCommand.textContent = `ping ${hostOnly}`;
    if (this.psCommand) {
      const port = t.port ? t.port.toString().split('/')[0].trim() : '80';
      this.psCommand.textContent = `Test-NetConnection -ComputerName ${hostOnly} -Port ${port}`;
    }

    // Notes Content in Notepad
    if (this.notesTextarea) {
      this.notesTextarea.value = t.notes || '';
      this.updateCounters();
    }
  }
}

// Initialize with robust DOM ready check
function bootDetails() {
  AuthManager.initAuthGate(() => {
    window.toolDetailsApp = new ToolDetailsApp();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootDetails);
} else {
  bootDetails();
}
