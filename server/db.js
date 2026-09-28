const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Garante que o diretório data/ existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper para hash seguro de senha com salt
function hashPassword(password, salt = null) {
  const userSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, userSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: userSalt };
}

// Sementes iniciais
const SEED_DATA = {
  users: [
    {
      id: 'usr-admin-1',
      username: 'admin',
      name: 'Administrador Master',
      role: 'admin', // 'admin' | 'operador'
      plainPassword: '$Vi3ir@Tech',
      salt: 'b5a8f4c2e1d09876',
      passwordHash: crypto.pbkdf2Sync('$Vi3ir@Tech', 'b5a8f4c2e1d09876', 10000, 64, 'sha512').toString('hex'),
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-admin-2',
      username: 'vieiratech',
      name: 'VieiraTech TI',
      role: 'admin',
      plainPassword: '$Vi3ir@Tech',
      salt: '7c8d9e0f1a2b3c4d',
      passwordHash: crypto.pbkdf2Sync('$Vi3ir@Tech', '7c8d9e0f1a2b3c4d', 10000, 64, 'sha512').toString('hex'),
      createdAt: new Date().toISOString()
    }
  ],
  tools: [
    {
      id: 'mikrotik-core',
      name: 'MikroTik RouterOS',
      url_or_ip: '192.168.88.1:8728',
      category: 'Infraestrutura',
      icon: 'fa-solid fa-network-wired',
      description: 'Roteador de Borda, BGP, Queues de Banda e Firewall Winbox',
      port: '8728 / 80',
      protocol: 'Winbox',
      environment: 'Produção',
      pinned: true,
      status: 'online',
      notes: `### 📌 Anotações & Procedimentos - MikroTik\n- **Acesso Principal:** Conectar via Winbox na porta \`8728\` (ou WebFig na porta 80).\n- **VLANs Ativas:**\n  - VLAN 10: Gerenciamento (192.168.10.0/24)\n  - VLAN 20: Servidores (192.168.20.0/24)\n  - VLAN 30: Estações de Trabalho (192.168.30.0/24)\n- **Backup:** Script de exportação automática executado diariamente às 03:00.`
    },
    {
      id: 'truenas-storage',
      name: 'TrueNAS Enterprise',
      url_or_ip: 'https://192.168.1.50',
      category: 'Servidores',
      icon: 'fa-solid fa-hard-drive',
      description: 'Storage NAS corporativo, Pools ZFS, Snapshots e NFS/SMB Shares',
      port: '443',
      protocol: 'HTTPS',
      environment: 'Produção',
      pinned: true,
      status: 'online',
      notes: `### 📌 Anotações - TrueNAS Enterprise\n- **Pools de Armazenamento:**\n  - \`tank01\` (RAID-Z2) - 8x 8TB Enterprise HDDs\n  - \`nvme-pool\` (Mirror) - 2x 2TB NVMe\n- **Compartilhamentos:** \`\\\\192.168.1.50\\Arquivos\` (SMB autenticado via Active Directory).`
    },
    {
      id: 'n8n-workflows',
      name: 'n8n Automation Engine',
      url_or_ip: 'http://192.168.1.120:5678',
      category: 'Automação',
      icon: 'fa-solid fa-diagram-project',
      description: 'Orquestrador de fluxos low-code, webhooks e integrações de APIs',
      port: '5678',
      protocol: 'HTTP',
      environment: 'Produção',
      pinned: true,
      status: 'online',
      notes: `### 📌 Anotações - n8n Automations\n- **Fluxos Ativos:** Notificação de chamados GLPI para Telegram, Backup dos switches MikroTik.`
    },
    {
      id: 'portainer-cluster',
      name: 'Portainer CE',
      url_or_ip: 'https://192.168.1.110:9443',
      category: 'Servidores',
      icon: 'fa-brands fa-docker',
      description: 'Gestão visual de containers Docker, Stacks Compose e Nodes',
      port: '9443',
      protocol: 'HTTPS',
      environment: 'Produção',
      pinned: true,
      status: 'online',
      notes: `### 📌 Anotações - Portainer Docker\n- **Stacks:** traefik-proxy, n8n-automation, vaultwarden-server, grafana-loki-prometheus.`
    },
    {
      id: 'pdq-deploy',
      name: 'PDQ Deploy & Inventory',
      url_or_ip: 'http://pdq-server.local:8080',
      category: 'Suporte',
      icon: 'fa-solid fa-box-archive',
      description: 'Distribuição remota de softwares e inventário automatizado de PCs',
      port: '8080',
      protocol: 'HTTP',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - PDQ Deploy & Inventory\n- **Pacotes Padrão:** Chrome Enterprise, 7-Zip, Adobe Reader, FortiClient VPN, Office 365.`
    },
    {
      id: 'active-directory-wac',
      name: 'Active Directory / WAC',
      url_or_ip: 'https://ad-dc01.corp.local:6516',
      category: 'Servidores',
      icon: 'fa-solid fa-users-gear',
      description: 'Windows Admin Center, Gestão de Usuários, Grupos e GPOs de Domínio',
      port: '6516',
      protocol: 'HTTPS',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - Active Directory\n- **Domínio:** corp.vieiratech.local\n- **Controladores:** DC01: 192.168.1.11, DC02: 192.168.1.12.`
    },
    {
      id: 'proxmox-cluster',
      name: 'Proxmox VE Cluster',
      url_or_ip: 'https://192.168.1.20:8006',
      category: 'Servidores',
      icon: 'fa-solid fa-layer-group',
      description: 'Hypervisor KVM para Máquinas Virtuais e Containers LXC',
      port: '8006',
      protocol: 'HTTPS',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - Proxmox VE\n- **Nodes:** pve-node01 (192.168.1.20), pve-node02 (192.168.1.21).`
    },
    {
      id: 'pfsense-firewall',
      name: 'pfSense Gateway',
      url_or_ip: 'https://192.168.1.1',
      category: 'Infraestrutura',
      icon: 'fa-solid fa-shield-halved',
      description: 'Gateway perimetral, túneis OpenVPN / IPSec e IDS/IPS Suricata',
      port: '443',
      protocol: 'HTTPS',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - pfSense Gateway\n- **Túneis VPN Site-to-Site:** Matriz -> Filial 01 (IPsec AES-256-GCM).`
    },
    {
      id: 'zabbix-monitoring',
      name: 'Zabbix',
      url_or_ip: 'http://192.168.1.100/zabbix',
      category: 'Infraestrutura',
      icon: 'fa-solid fa-chart-line',
      description: 'Monitoramento SNMP de switches, telemetria de servidores e alertas',
      port: '80',
      protocol: 'HTTP',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - Zabbix\n- **SNMP v2c:** public-vt-mon.\n- Alertas disparados para canal do Telegram quando ping > 100ms.`
    },
    {
      id: 'glpi-servicedesk',
      name: 'GLPI Helpdesk & ITSM',
      url_or_ip: 'http://192.168.1.140/glpi',
      category: 'Suporte',
      icon: 'fa-solid fa-headset',
      description: 'Central de chamados de TI, inventário de ativos e SLA de suporte',
      port: '80',
      protocol: 'HTTP',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - GLPI Helpdesk\n- Autenticação LDAP sincronizada com o Active Directory a cada 1 hora.`
    },
    {
      id: 'vaultwarden-secrets',
      name: 'Vaultwarden (Bitwarden)',
      url_or_ip: 'https://vault.corp.local',
      category: 'Suporte',
      icon: 'fa-solid fa-key',
      description: 'Cofre corporativo de senhas da equipe e tokens criptografados',
      port: '443',
      protocol: 'HTTPS',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - Vaultwarden\n- Cofre com criptografia de ponta a ponta para credenciais compartilhadas.`
    },
    {
      id: 'graylog-siem',
      name: 'Graylog SIEM',
      url_or_ip: 'http://192.168.1.105:9000',
      category: 'Infraestrutura',
      icon: 'fa-solid fa-file-shield',
      description: 'Centralização de Syslogs de roteadores, switches e eventos do Windows',
      port: '9000',
      protocol: 'HTTP',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - Graylog\n- Recebe logs dos servidores Windows DC e Firewall pfSense.`
    },
    {
      id: 'pihole-dns',
      name: 'Pi-hole DNS Sinkhole',
      url_or_ip: 'http://192.168.1.53/admin',
      category: 'Infraestrutura',
      icon: 'fa-solid fa-filter',
      description: 'Bloqueio de telemetria, anúncios e DNS recursivo para a rede',
      port: '80 / 53',
      protocol: 'HTTP / DNS',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - Pi-hole\n- DNS Primário corporativo 192.168.1.53.`
    },
    {
      id: 'guacamole-bastion',
      name: 'Apache Guacamole',
      url_or_ip: 'https://bastion.corp.local:8443',
      category: 'Suporte',
      icon: 'fa-solid fa-desktop',
      description: 'Bastion host RDP, SSH e VNC via navegador sem cliente instalado',
      port: '8443',
      protocol: 'HTTPS',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - Guacamole\n- Gateway HTML5 para acesso remoto a servidores Windows e Linux.`
    },
    {
      id: 'grafana-dashboards',
      name: 'Grafana Dashboards',
      url_or_ip: 'http://192.168.1.102:3001',
      category: 'Automação',
      icon: 'fa-solid fa-chart-pie',
      description: 'Dashboards executivos de uptime, tráfego de rede e consumo de CPU/RAM',
      port: '3001',
      protocol: 'HTTP',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - Grafana\n- Painéis conectados ao Prometheus e Zabbix.`
    },
    {
      id: 'minio-s3',
      name: 'MinIO S3 Storage',
      url_or_ip: 'https://192.168.1.55:9001',
      category: 'Servidores',
      icon: 'fa-solid fa-cloud-arrow-up',
      description: 'Armazenamento de objetos compatível com API AWS S3 para backups',
      port: '9001',
      protocol: 'HTTPS',
      environment: 'Produção',
      pinned: false,
      status: 'online',
      notes: `### 📌 Anotações - MinIO\n- Bucket \`veeam-backups\` com imutabilidade ativa (Object Lock 30 dias).`
    }
  ],
  vault: [
    {
      id: 'pass-wifi-1',
      title: 'Wi-Fi - Diretoria & Gerência',
      category: 'Wi-Fi',
      username: 'VieiraCred_Diretoria',
      password: 'Dir@Cred#2026!Wf',
      notes: 'SSID oculto na rede corporativa 5GHz. Roteadores Ubiquiti.',
      updatedAt: '2026-03-01'
    },
    {
      id: 'pass-wifi-2',
      title: 'Wi-Fi - Operação & Geral',
      category: 'Wi-Fi',
      username: 'VieiraCred_Corporativo',
      password: 'Op3r@c4o#Vcred26',
      notes: 'VLAN 30 isolada. Distribuição via DHCP com controle de banda.',
      updatedAt: '2026-03-01'
    },
    {
      id: 'pass-wifi-3',
      title: 'Wi-Fi - Visitantes / Clientes',
      category: 'Wi-Fi',
      username: 'VieiraCred_Visitantes',
      password: 'B3m-Vindo@Vieira26',
      notes: 'Rede guest com isolamento de clientes (Client Isolation ativo).',
      updatedAt: '2026-03-01'
    },
    {
      id: 'pass-ti-1',
      title: 'Acesso Root - Servidores Linux (Debian / Proxmox)',
      category: 'Infra TI',
      username: 'root',
      password: 'R00t#Adm!Vtech2026',
      notes: 'Acesso apenas via rede de gerenciamento ou SSH key.',
      updatedAt: '2026-02-15'
    },
    {
      id: 'pass-ti-2',
      title: 'Conta Admin - Active Directory / Controlador de Domínio',
      category: 'Infra TI',
      username: 'CORP\\administrator',
      password: '$Adm1n@DC01#VieiraTech',
      notes: 'DC primário (ad-dc01.corp.local). Não usar em estações comuns.',
      updatedAt: '2026-02-10'
    },
    {
      id: 'pass-ti-3',
      title: 'MikroTik Borda - Usuário Winbox Master',
      category: 'Infra TI',
      username: 'admin_vieiratech',
      password: 'M1kr0#B0rd4!2026Tech',
      notes: 'Porta Winbox alterada para 8728. IP 192.168.88.1.',
      updatedAt: '2026-02-20'
    },
    {
      id: 'pass-ti-4',
      title: 'Switch Core Gigabit - Gerenciamento Web',
      category: 'Infra TI',
      username: 'admin',
      password: 'Sw1tch#Core!Vtech26',
      notes: 'IP 192.168.88.2. VLAN de gerência 99.',
      updatedAt: '2026-01-20'
    },
    {
      id: 'pass-srv-1',
      title: 'TrueNAS Enterprise - Console Web GUI',
      category: 'Servidores',
      username: 'admin',
      password: 'Tru3N4s#St0r@g3!26',
      notes: 'Pool ZFS de backup e compartilhamento corporativo.',
      updatedAt: '2026-02-25'
    },
    {
      id: 'pass-srv-2',
      title: 'Portainer CE / Docker Stacks',
      category: 'Servidores',
      username: 'admin',
      password: 'P0rt41n3r#D0ck3r!26',
      notes: 'Gerenciador dos containers n8n, Zabbix e GLPI.',
      updatedAt: '2026-02-28'
    },
    {
      id: 'pass-srv-3',
      title: 'pfSense Firewall - Painel HTTPS',
      category: 'Servidores',
      username: 'admin',
      password: 'pfS3ns3#F1r3w4ll!26',
      notes: 'IP de gestão: 192.168.88.254:8443.',
      updatedAt: '2026-02-18'
    }
  ],
  inventory: [
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
      notes: 'Para máquinas com saída DP conectando a monitores HDMI.'
    }
  ],
  ad_logins: {
    rawText: `GERAL:
RECEPÇÃO 01 | user/senha: recepcao.vc | $Vcred#2026
RECEPÇÃO 02 | user/senha: recepcao2.vc | $Vcred#2026
SALA DE REUNIÃO 01 | user/senha: reuniao1.vc | $Vcred#2026
SALA DE REUNIÃO 02 | user/senha: reuniao2.vc | $Vcred#2026

RH & DP:
RH 01 (Analista) | user/senha: rh.analista | $Vcred#2026
RH 02 (Recrutamento) | user/senha: rh.recrutamento | $Vcred#2026
DP 01 (Folha de Pagamento) | user/senha: dp.folha | $Vcred#2026
DP 02 (Benefícios) | user/senha: dp.beneficios | $Vcred#2026

FINANCEIRO:
FINANCEIRO 01 (Contas a Pagar) | user/senha: fin.pagar | $Vcred#2026
FINANCEIRO 02 (Contas a Receber) | user/senha: fin.receber | $Vcred#2026
FINANCEIRO 03 (Tesouraria) | user/senha: fin.tesouraria | $Vcred#2026
FINANCEIRO 04 (Controladoria) | user/senha: fin.controladoria | $Vcred#2026

OPERAÇÃO VIEIRACRED:
SUPERVISOR 01 (Espinhas 01 e 02) | user/senha: sup.operacao01 | $Vcred#2026
SUPERVISOR 02 (Espinhas 03 e 04) | user/senha: sup.operacao02 | $Vcred#2026
SUPERVISOR 03 (Espinhas 05 e 06) | user/senha: sup.operacao03 | $Vcred#2026
SUPERVISOR 04 (Espinhas 07 e 08) | user/senha: sup.operacao04 | $Vcred#2026

Espinha 01
01: PA01.E01 | user/senha: op01.e01 | $Vcred#2026
02: PA02.E01 | user/senha: op02.e01 | $Vcred#2026
03: PA03.E01 | user/senha: op03.e01 | $Vcred#2026
04: PA04.E01 | user/senha: op04.e01 | $Vcred#2026
05: PA05.E01 | user/senha: op05.e01 | $Vcred#2026
06: PA06.E01 | user/senha: op06.e01 | $Vcred#2026
07: PA07.E01 | user/senha: op07.e01 | $Vcred#2026
08: PA08.E01 | user/senha: op08.e01 | $Vcred#2026
09: PA09.E01 | user/senha: op09.e01 | $Vcred#2026
10: PA10.E01 | user/senha: op10.e01 | $Vcred#2026
11: PA11.E01 | user/senha: op11.e01 | $Vcred#2026
12: PA12.E01 | user/senha: op12.e01 | $Vcred#2026
13: PA13.E01 | user/senha: op13.e01 | $Vcred#2026
14: PA14.E01 | user/senha: op14.e01 | $Vcred#2026
15: PA15.E01 | user/senha: op15.e01 | $Vcred#2026
16: PA16.E01 | user/senha: op16.e01 | $Vcred#2026

Espinha 02
01: PA01.E02 | user/senha: op01.e02 | $Vcred#2026
02: PA02.E02 | user/senha: op02.e02 | $Vcred#2026
03: PA03.E02 | user/senha: op03.e02 | $Vcred#2026
04: PA04.E02 | user/senha: op04.e02 | $Vcred#2026
05: PA05.E02 | user/senha: op05.e02 | $Vcred#2026
06: PA06.E02 | user/senha: op06.e02 | $Vcred#2026
07: PA07.E02 | user/senha: op07.e02 | $Vcred#2026
08: PA08.E02 | user/senha: op08.e02 | $Vcred#2026
09: PA09.E02 | user/senha: op09.e02 | $Vcred#2026
10: PA10.E02 | user/senha: op10.e02 | $Vcred#2026
11: PA11.E02 | user/senha: op11.e02 | $Vcred#2026
12: PA12.E02 | user/senha: op12.e02 | $Vcred#2026
13: PA13.E02 | user/senha: op13.e02 | $Vcred#2026
14: PA14.E02 | user/senha: op14.e02 | $Vcred#2026
15: PA15.E02 | user/senha: op15.e02 | $Vcred#2026
16: PA16.E02 | user/senha: op16.e02 | $Vcred#2026

Espinha 03
01: PA01.E03 | user/senha: op01.e03 | $Vcred#2026
02: PA02.E03 | user/senha: op02.e03 | $Vcred#2026
03: PA03.E03 | user/senha: op03.e03 | $Vcred#2026
04: PA04.E03 | user/senha: op04.e03 | $Vcred#2026
05: PA05.E03 | user/senha: op05.e03 | $Vcred#2026
06: PA06.E03 | user/senha: op06.e03 | $Vcred#2026
07: PA07.E03 | user/senha: op07.e03 | $Vcred#2026
08: PA08.E03 | user/senha: op08.e03 | $Vcred#2026
09: PA09.E03 | user/senha: op09.e03 | $Vcred#2026
10: PA10.E03 | user/senha: op10.e03 | $Vcred#2026
11: PA11.E03 | user/senha: op11.e03 | $Vcred#2026
12: PA12.E03 | user/senha: op12.e03 | $Vcred#2026
13: PA13.E03 | user/senha: op13.e03 | $Vcred#2026
14: PA14.E03 | user/senha: op14.e03 | $Vcred#2026
15: PA15.E03 | user/senha: op15.e03 | $Vcred#2026
16: PA16.E03 | user/senha: op16.e03 | $Vcred#2026

Espinha 04
01: PA01.E04 | user/senha: op01.e04 | $Vcred#2026
02: PA02.E04 | user/senha: op02.e04 | $Vcred#2026
03: PA03.E04 | user/senha: op03.e04 | $Vcred#2026
04: PA04.E04 | user/senha: op04.e04 | $Vcred#2026
05: PA05.E04 | user/senha: op05.e04 | $Vcred#2026
06: PA06.E04 | user/senha: op06.e04 | $Vcred#2026
07: PA07.E04 | user/senha: op07.e04 | $Vcred#2026
08: PA08.E04 | user/senha: op08.e04 | $Vcred#2026
09: PA09.E04 | user/senha: op09.e04 | $Vcred#2026
10: PA10.E04 | user/senha: op10.e04 | $Vcred#2026
11: PA11.E04 | user/senha: op11.e04 | $Vcred#2026
12: PA12.E04 | user/senha: op12.e04 | $Vcred#2026
13: PA13.E04 | user/senha: op13.e04 | $Vcred#2026
14: PA14.E04 | user/senha: op14.e04 | $Vcred#2026
15: PA15.E04 | user/senha: op15.e04 | $Vcred#2026
16: PA16.E04 | user/senha: op16.e04 | $Vcred#2026

Espinha 05
01: PA01.E05 | user/senha: op01.e05 | $Vcred#2026
02: PA02.E05 | user/senha: op02.e05 | $Vcred#2026
03: PA03.E05 | user/senha: op03.e05 | $Vcred#2026
04: PA04.E05 | user/senha: op04.e05 | $Vcred#2026
05: PA05.E05 | user/senha: op05.e05 | $Vcred#2026
06: PA06.E05 | user/senha: op06.e05 | $Vcred#2026
07: PA07.E05 | user/senha: op07.e05 | $Vcred#2026
08: PA08.E05 | user/senha: op08.e05 | $Vcred#2026
09: PA09.E05 | user/senha: op09.e05 | $Vcred#2026
10: PA10.E05 | user/senha: op10.e05 | $Vcred#2026
11: PA11.E05 | user/senha: op11.e05 | $Vcred#2026
12: PA12.E05 | user/senha: op12.e05 | $Vcred#2026
13: PA13.E05 | user/senha: op13.e05 | $Vcred#2026
14: PA14.E05 | user/senha: op14.e05 | $Vcred#2026
15: PA15.E05 | user/senha: op15.e05 | $Vcred#2026
16: PA16.E05 | user/senha: op16.e05 | $Vcred#2026

Espinha 06
01: PA01.E06 | user/senha: op01.e06 | $Vcred#2026
02: PA02.E06 | user/senha: op02.e06 | $Vcred#2026
03: PA03.E06 | user/senha: op03.e06 | $Vcred#2026
04: PA04.E06 | user/senha: op04.e06 | $Vcred#2026
05: PA05.E06 | user/senha: op05.e06 | $Vcred#2026
06: PA06.E06 | user/senha: op06.e06 | $Vcred#2026
07: PA07.E06 | user/senha: op07.e06 | $Vcred#2026
08: PA08.E06 | user/senha: op08.e06 | $Vcred#2026
09: PA09.E06 | user/senha: op09.e06 | $Vcred#2026
10: PA10.E06 | user/senha: op10.e06 | $Vcred#2026
11: PA11.E06 | user/senha: op11.e06 | $Vcred#2026
12: PA12.E06 | user/senha: op12.e06 | $Vcred#2026
13: PA13.E06 | user/senha: op13.e06 | $Vcred#2026
14: PA14.E06 | user/senha: op14.e06 | $Vcred#2026
15: PA15.E06 | user/senha: op15.e06 | $Vcred#2026
16: PA16.E06 | user/senha: op16.e06 | $Vcred#2026

Espinha 07
01: PA01.E07 | user/senha: op01.e07 | $Vcred#2026
02: PA02.E07 | user/senha: op02.e07 | $Vcred#2026
03: PA03.E07 | user/senha: op03.e07 | $Vcred#2026
04: PA04.E07 | user/senha: op04.e07 | $Vcred#2026
05: PA05.E07 | user/senha: op05.e07 | $Vcred#2026
06: PA06.E07 | user/senha: op06.e07 | $Vcred#2026
07: PA07.E07 | user/senha: op07.e07 | $Vcred#2026
08: PA08.E07 | user/senha: op08.e07 | $Vcred#2026
09: PA09.E07 | user/senha: op09.e07 | $Vcred#2026
10: PA10.E07 | user/senha: op10.e07 | $Vcred#2026
11: PA11.E07 | user/senha: op11.e07 | $Vcred#2026
12: PA12.E07 | user/senha: op12.e07 | $Vcred#2026
13: PA13.E07 | user/senha: op13.e07 | $Vcred#2026
14: PA14.E07 | user/senha: op14.e07 | $Vcred#2026
15: PA15.E07 | user/senha: op15.e07 | $Vcred#2026
16: PA16.E07 | user/senha: op16.e07 | $Vcred#2026

Espinha 08
01: PA01.E08 | user/senha: op01.e08 | $Vcred#2026
02: PA02.E08 | user/senha: op02.e08 | $Vcred#2026
03: PA03.E08 | user/senha: op03.e08 | $Vcred#2026
04: PA04.E08 | user/senha: op04.e08 | $Vcred#2026
05: PA05.E08 | user/senha: op05.e08 | $Vcred#2026
06: PA06.E08 | user/senha: op06.e08 | $Vcred#2026
07: PA07.E08 | user/senha: op07.e08 | $Vcred#2026
08: PA08.E08 | user/senha: op08.e08 | $Vcred#2026
09: PA09.E08 | user/senha: op09.e08 | $Vcred#2026
10: PA10.E08 | user/senha: op10.e08 | $Vcred#2026
11: PA11.E08 | user/senha: op11.e08 | $Vcred#2026
12: PA12.E08 | user/senha: op12.e08 | $Vcred#2026
13: PA13.E08 | user/senha: op13.e08 | $Vcred#2026
14: PA14.E08 | user/senha: op14.e08 | $Vcred#2026
15: PA15.E08 | user/senha: op15.e08 | $Vcred#2026
16: PA16.E08 | user/senha: op16.e08 | $Vcred#2026`
  },
  inventory_logs: []
};

class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.write(SEED_DATA);
    }
  }

  read() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        this.write(SEED_DATA);
      }
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('[DB] Erro ao ler banco de dados. Restaurando snapshot de segurança:', e);
      return SEED_DATA;
    }
  }

  write(data) {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  get(collection) {
    const data = this.read();
    return data[collection] || [];
  }

  set(collection, items) {
    const data = this.read();
    data[collection] = items;
    this.write(data);
    return items;
  }

  findById(collection, id) {
    const items = this.get(collection);
    if (Array.isArray(items)) {
      return items.find((it) => it.id === id);
    }
    return null;
  }

  insert(collection, item) {
    const data = this.read();
    if (!Array.isArray(data[collection])) {
      data[collection] = [];
    }
    const newItem = { id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, ...item };
    data[collection].unshift(newItem);
    this.write(data);
    return newItem;
  }

  update(collection, id, updates) {
    const data = this.read();
    if (!Array.isArray(data[collection])) return null;

    let updated = null;
    data[collection] = data[collection].map((it) => {
      if (it.id === id) {
        updated = { ...it, ...updates };
        return updated;
      }
      return it;
    });

    if (updated) {
      this.write(data);
    }
    return updated;
  }

  delete(collection, id) {
    const data = this.read();
    if (!Array.isArray(data[collection])) return false;

    const initialLen = data[collection].length;
    data[collection] = data[collection].filter((it) => it.id !== id);
    if (data[collection].length !== initialLen) {
      this.write(data);
      return true;
    }
    return false;
  }
}

const db = new Database();

module.exports = {
  db,
  hashPassword
};
