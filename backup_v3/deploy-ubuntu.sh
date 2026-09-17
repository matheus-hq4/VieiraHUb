#!/usr/bin/env bash
# ==============================================================================
# 🚀 VieiraTech HUB - Script de Instalação e Deploy Automático no Ubuntu Server
# ==============================================================================
set -e

echo "--------------------------------------------------------"
echo "  Iniciando Deploy do VieiraTech HUB no Ubuntu Server   "
echo "--------------------------------------------------------"

# 1. Atualiza repositórios do sistema
echo "[1/6] Atualizando pacotes do sistema..."
sudo apt update -y

# 2. Instala Node.js 20 LTS se não estiver instalado
if ! command -v node &> /dev/null; then
    echo "[2/6] Instalando Node.js 20 LTS e dependências..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs build-essential
else
    echo "[2/6] Node.js já está instalado: $(node -v)"
fi

# 3. Instala PM2 globalmente se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    echo "[3/6] Instalando gerenciador de processos PM2..."
    sudo npm install -g pm2
else
    echo "[3/6] PM2 já está instalado."
fi

# 4. Cria diretórios de dados e logs com permissões adequadas
echo "[4/6] Configurando diretórios de dados persistentes e logs..."
mkdir -p data logs
chmod 750 data logs

# 5. Instala dependências do projeto
echo "[5/6] Instalando dependências npm do VieiraTech HUB..."
npm install --omit=dev

# 6. Inicia ou reinicia a aplicação via PM2
echo "[6/6] Iniciando VieiraTech HUB 24/7 com PM2..."
pm2 startOrReload ecosystem.config.js

# Salva a lista de processos para inicialização automática no boot do Linux
pm2 save

echo ""
echo "========================================================"
echo "  🎉 Deploy concluído com sucesso no Ubuntu Server!     "
echo "  O VieiraTech HUB está rodando e persistido via PM2.   "
echo "  Acesse na rede: http://$(hostname -I | awk '{print $1}'):3000"
echo "========================================================"
