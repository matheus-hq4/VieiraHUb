# VieiraTech HUB

Central de acessos corporativos, catálogo de ferramentas de TI, servidores, storages, roteadores e assistente de IA Gemini.

Construído de forma direta e simples em **HTML5, CSS3, JavaScript Puro (Vanilla JS), Tailwind CSS e Node.js**.

---

## 🚀 Como Executar

### Pré-requisitos
* [Node.js](https://nodejs.org/) instalado

### Passos:
1. Instale as dependências mínimas (Express, Dotenv e SDK do Google Gemini):
   ```bash
   npm install
   ```
2. Crie o arquivo `.env` com sua chave de API do Gemini:
   ```env
   GEMINI_API_KEY="sua_chave_aqui"
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
4. Acesse no navegador:
   `http://localhost:3000`

---

## 📁 Estrutura do Projeto

```
VIEIRATECH HUB/
├── index.html       # Interface completa com Tailwind CSS e componentes
├── css/
│   └── styles.css   # Estilos adicionais e formatação de Markdown
├── js/
│   ├── app.js       # Controle principal, busca, filtros e modais
│   ├── data.js      # Lista inicial de ferramentas cadastradas
│   ├── storage.js   # Persistência local (localStorage) e temas
│   └── chatbot.js   # Integração do IT Bot com IA Gemini
├── server.js        # Servidor Express simples para arquivos e API
└── package.json     # Dependências mínimas
```
