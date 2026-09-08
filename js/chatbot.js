/**
 * Módulo de Chatbot Especialista de TI com IA Gemini
 */

export class ChatbotManager {
  constructor(getToolsListCallback, showToastCallback) {
    this.getToolsList = getToolsListCallback;
    this.showToast = showToastCallback;
    this.isOpen = false;
    this.isLoading = false;
    this.messages = [
      {
        role: 'model',
        content: 'Olá! Sou o **IT Bot & Assistente Especialista de Infraestrutura do VieiraTech HUB**.\n\nComo posso ajudar você hoje? Posso sugerir IPs, comandos de terminal (PowerShell, Bash, Winbox), diagnósticos de rede e procedimentos de TI.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    this.initDOMElements();
    this.bindEvents();
    this.renderMessages();
  }

  initDOMElements() {
    this.drawer = document.getElementById('chat-drawer');
    this.backdrop = document.getElementById('chat-backdrop');
    this.openBtn = document.getElementById('chat-open-btn');
    this.closeBtn = document.getElementById('chat-close-btn');
    this.clearBtn = document.getElementById('chat-clear-btn');
    this.form = document.getElementById('chat-form');
    this.input = document.getElementById('chat-input');
    this.messagesContainer = document.getElementById('chat-messages');
    this.sendBtn = document.getElementById('chat-send-btn');
    this.quickChips = document.querySelectorAll('.chat-quick-chip');
  }

  bindEvents() {
    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => this.toggleChat(true));
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.toggleChat(false));
    }
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.toggleChat(false));
    }
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clearChat());
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    if (this.quickChips) {
      this.quickChips.forEach((chip) => {
        chip.addEventListener('click', () => {
          const text = chip.getAttribute('data-prompt') || chip.textContent.trim();
          this.input.value = text;
          this.sendMessage();
        });
      });
    }

    // Auto resize textarea or handle Enter to send (Shift+Enter for new line)
    if (this.input) {
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  }

  toggleChat(forceState) {
    this.isOpen = typeof forceState === 'boolean' ? forceState : !this.isOpen;

    if (this.isOpen) {
      this.drawer.classList.remove('translate-x-full');
      this.backdrop.classList.remove('hidden');
      setTimeout(() => {
        this.backdrop.classList.add('opacity-100');
        this.input.focus();
        this.scrollToBottom();
      }, 10);
    } else {
      this.drawer.classList.add('translate-x-full');
      this.backdrop.classList.remove('opacity-100');
      setTimeout(() => {
        this.backdrop.classList.add('hidden');
      }, 200);
    }
  }

  clearChat() {
    this.messages = [
      {
        role: 'model',
        content: 'Histórico de conversa reiniciado. Em que posso ajudar você agora?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    this.renderMessages();
    this.showToast('Histórico do chat limpo.');
  }

  async sendMessage() {
    const text = this.input.value.trim();
    if (!text || this.isLoading) return;

    // Add user message
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.messages.push(userMsg);
    this.input.value = '';
    this.renderMessages();
    this.setLoading(true);

    try {
      const tools = this.getToolsList();
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: this.messages.map((m) => ({ role: m.role, content: m.content })),
          toolsContext: tools
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      const modelReply = data.text || 'Nenhuma resposta retornada.';

      this.messages.push({
        role: 'model',
        content: modelReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (error) {
      console.error('Erro na comunicação com o assistente Gemini:', error);
      this.messages.push({
        role: 'model',
        content: `⚠️ **Ops, não foi possível obter a resposta do assistente.**\n\n*Detalhes:* ${error.message}\n\n*Dica:* Verifique se a variável \`GEMINI_API_KEY\` está configurada corretamente no arquivo \`.env\` e se o servidor backend está rodando.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      this.setLoading(false);
      this.renderMessages();
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    if (this.sendBtn) {
      this.sendBtn.disabled = loading;
      this.sendBtn.innerHTML = loading
        ? '<i class="fa-solid fa-spinner fa-spin text-sm"></i>'
        : '<i class="fa-solid fa-paper-plane text-sm"></i>';
    }

    const typingIndicator = document.getElementById('chat-typing-indicator');
    if (typingIndicator) {
      if (loading) {
        typingIndicator.classList.remove('hidden');
      } else {
        typingIndicator.classList.add('hidden');
      }
    }
    this.scrollToBottom();
  }

  renderMessages() {
    if (!this.messagesContainer) return;

    this.messagesContainer.innerHTML = this.messages
      .map((msg) => {
        const isUser = msg.role === 'user';
        let formattedContent = msg.content;

        // Use marked for markdown formatting if available, otherwise sanitize basic formatting
        if (typeof window.marked !== 'undefined' && typeof window.marked.parse === 'function') {
          formattedContent = window.marked.parse(msg.content);
        } else {
          formattedContent = this.escapeHtml(msg.content).replace(/\n/g, '<br>');
        }

        if (isUser) {
          return `
            <div class="flex items-start justify-end gap-2.5 animate-fade-in">
              <div class="flex flex-col items-end max-w-[85%]">
                <div class="bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-xs text-xs sm:text-sm">
                  ${this.escapeHtml(msg.content).replace(/\n/g, '<br>')}
                </div>
                <span class="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">${msg.timestamp}</span>
              </div>
              <div class="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                <i class="fa-solid fa-user"></i>
              </div>
            </div>
          `;
        } else {
          return `
            <div class="flex items-start gap-2.5 animate-fade-in">
              <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                <i class="fa-solid fa-robot"></i>
              </div>
              <div class="flex flex-col items-start max-w-[88%]">
                <div class="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm prose-chat leading-relaxed overflow-hidden">
                  ${formattedContent}
                </div>
                <span class="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">${msg.timestamp} &bull; IT Assistant</span>
              </div>
            </div>
          `;
        }
      })
      .join('');

    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
