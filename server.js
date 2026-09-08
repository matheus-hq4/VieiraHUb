const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Servir arquivos estáticos (HTML, JS, CSS) diretamente da raiz do projeto
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Inicialização do cliente Gemini
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no arquivo .env.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'vieiratech-hub',
      },
    },
  });
}

// Endpoint do Chatbot com IA Gemini e suporte a contexto do IT Hub
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, toolsContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Array de 'messages' inválido ou ausente." });
    }

    const ai = getGeminiClient();

    // Monta o resumo das ferramentas cadastradas no HUB para o contexto do assistente
    const toolsSummary = Array.isArray(toolsContext) && toolsContext.length > 0
      ? `\n\nFerramentas, IPs e Serviços Atualmente Cadastrados no VieiraTech HUB:\n` +
        toolsContext
          .map(
            (t, idx) =>
              `${idx + 1}. **${t.name}** [${t.category}] - URL/IP: \`${t.url_or_ip}\` (Protocolo: ${t.protocol || 'N/A'}, Porta: ${t.port || 'Padrão'}${t.description ? ` - ${t.description}` : ''})`
          )
          .join('\n')
      : '';

    const systemInstruction = `Você é o "IT Bot & Assistente Especialista de Infraestrutura do VieiraTech HUB".
Seu objetivo é ajudar analistas de suporte, sysadmins, engenheiros de rede e técnicos de TI com:
1. Localização, recomendação rápida de ferramentas e URLs/IPs internos disponíveis no VieiraTech HUB.
2. Diagnósticos de rede e troubleshooting (MikroTik, TrueNAS, n8n, Docker/Portainer, Active Directory, DNS, VLANs, túneis VPN, pfSense, Zabbix, GLPI).
3. Geração de comandos precisos para terminal (PowerShell, Bash, CMD, Winbox/SSH, ping, traceroute, curl, docker, systemctl, netstat).
4. Procedimentos passo a passo para chamados de TI, automação e boas práticas.

${toolsSummary}

Diretrizes de Resposta:
- Seja técnico, claro, prestativo e direto ao ponto.
- Sugira comandos diretos formatados em blocos de código Markdown.
- Se o usuário perguntar por um IP ou ferramenta, mencione a ferramenta exata cadastrada no HUB e como acessá-la.
- Responda em Português do Brasil com formatação elegante.`;

    const validMessages = messages.filter((m) => m && m.content && m.content.trim().length > 0);
    const contents = validMessages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || 'Não consegui processar a resposta.';

    return res.json({
      text: replyText,
      role: 'model',
    });
  } catch (error) {
    console.error('Erro na rota /api/gemini/chat:', error);
    return res.status(500).json({
      error: error?.message || 'Ocorreu um erro interno ao comunicar com o assistente Gemini.',
    });
  }
});

// Fallback para rota principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 VieiraTech HUB rodando com sucesso em http://localhost:${PORT}\n`);
});
