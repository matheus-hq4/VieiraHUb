/**
 * Lista padrão de ferramentas e serviços de TI do VieiraTech HUB.
 */
export const defaultToolsList = [
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
    notes: `### 📌 Anotações & Procedimentos - MikroTik
- **Acesso Principal:** Conectar via Winbox na porta \`8728\` (ou WebFig na porta 80).
- **VLANs Ativas:**
  - VLAN 10: Gerenciamento (192.168.10.0/24)
  - VLAN 20: Servidores (192.168.20.0/24)
  - VLAN 30: Estações de Trabalho (192.168.30.0/24)
- **Backup:** Script de exportação automática executado diariamente às 03:00.
\`\`\`bash
/system backup save name=backup-diario
/export file=config-diaria
\`\`\`
- **Contato do Link Dedicado:** NOC Provedor (0800-123-4567 - Contrato #9872).`
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
    notes: `### 📌 Anotações - TrueNAS Enterprise
- **Pools de Armazenamento:**
  - \`tank01\` (RAID-Z2) - 8x 8TB Enterprise HDDs (Arquivos Gerais)
  - \`nvme-pool\` (Mirror) - 4x 2TB NVMe (Bancos e VMs Proxmox)
- **Compartilhamentos:**
  - \`\\\\192.168.1.50\\Arquivos\` (SMB autenticado via Active Directory)
  - \`192.168.1.50:/mnt/tank01/nfs-proxmox\` (NFS)
- **Scrub ZFS:** Programado para o 1º e 15º dia de cada mês.`
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
    notes: `### 📌 Anotações - n8n Automations
- **Fluxos Ativos:**
  1. Notificação de chamados do GLPI para o Telegram/Discord.
  2. Backup dos switches MikroTik para o repositório Git.
  3. Monitoramento de certificados SSL com alerta 15 dias antes de expirar.
- **Webhook Endpoint:** \`http://192.168.1.120:5678/webhook/...\`
- **Variáveis de Ambiente:** Configuradas no arquivo \`/opt/n8n/.env\` no servidor Docker.`
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
    notes: `### 📌 Anotações - Portainer Docker
- **Stacks em Produção:**
  - \`traefik-proxy\` (Reverse Proxy & Let's Encrypt)
  - \`n8n-automation\`
  - \`vaultwarden-server\`
  - \`grafana-loki-prometheus\`
- **Diretório de Volumes:** \`/var/lib/docker/volumes/\`
- **Comando Rápido via SSH:**
\`\`\`bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
\`\`\``
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
    notes: `### 📌 Anotações - PDQ Deploy & Inventory
- **Pacotes de Onboarding Padrão:**
  - Google Chrome Enterprise, 7-Zip, Adobe Reader, FortiClient VPN, Office 365.
- **Varredura de Inventário:** Diária às 12:00 e 18:00.`
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
    notes: `### 📌 Anotações - Active Directory Domain Controller
- **Domínio:** \`corp.vieiratech.local\`
- **Controladores de Domínio:**
  - DC01: \`192.168.1.11\` (Primário - FSMO Roles)
  - DC02: \`192.168.1.12\` (Secundário)
- **GPOs Principais:** Bloqueio de USB, Mapeamento de Unidades de Rede, Papel de Parede Corporativo.`
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
    notes: `### 📌 Anotações - Proxmox VE
- **Nodes do Cluster:**
  - \`pve-node01\` (192.168.1.20)
  - \`pve-node02\` (192.168.1.21)
- **Backups (Proxmox Backup Server):** Executados todas as noites às 01:00 com retenção de 14 dias.`
  },
  {
    id: 'pfsense-firewall',
    name: 'pfSense Gateway Firewall',
    url_or_ip: 'https://192.168.1.1',
    category: 'Infraestrutura',
    icon: 'fa-solid fa-shield-halved',
    description: 'Gateway perimetral, túneis OpenVPN / IPsec e IDS/IPS Suricata',
    port: '443',
    protocol: 'HTTPS',
    environment: 'Produção',
    pinned: false,
    status: 'online',
    notes: `### 📌 Anotações - pfSense Firewall
- **Túneis VPN Site-to-Site:**
  - Matriz <-> Filial 01 (IPsec AES-256-GCM)
  - Acesso Remoto Usuários (OpenVPN porta UDP 1194)
- **Regras de Bloqueio:** GeoIP ativo para países de alto risco.`
  },
  {
    id: 'zabbix-monitoring',
    name: 'Zabbix Enterprise',
    url_or_ip: 'http://192.168.1.100/zabbix',
    category: 'Infraestrutura',
    icon: 'fa-solid fa-chart-line',
    description: 'Monitoramento SNMP de switches, telemetria de servidores e alertas',
    port: '80',
    protocol: 'HTTP',
    environment: 'Produção',
    pinned: false,
    status: 'online',
    notes: `### 📌 Anotações - Zabbix
- **Comunidade SNMP v2c:** \`public-vt-mon\` (Somente Leitura)
- **Alertas Críticos:** Disparados para o canal de incidentes no Telegram quando ping > 100ms ou disco > 90%.`
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
    notes: `### 📌 Anotações - GLPI
- **Integração:** Autenticação LDAP sincronizada com o Active Directory a cada 1 hora.
- **SLA de Atendimento:**
  - Crítico: 1h resposta / 4h resolução
  - Alto: 2h resposta / 8h resolução
  - Normal: 4h resposta / 24h resolução`
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
    notes: `### 📌 Anotações - Vaultwarden
- **Organização:** Equipe TI & Infraestrutura
- **Políticas:** Obrigatório uso de 2FA (TOTP via Google Authenticator ou YubiKey) para todos os membros.`
  },
  {
    id: 'grafana-observability',
    name: 'Grafana Observability',
    url_or_ip: 'http://192.168.1.105:3000',
    category: 'Infraestrutura',
    icon: 'fa-solid fa-gauge-high',
    description: 'Dashboards analíticos de rede, métricas Prometheus e Loki logs',
    port: '3000',
    protocol: 'HTTP',
    environment: 'Produção',
    pinned: false,
    status: 'online',
    notes: `### 📌 Anotações - Grafana
- **Data Sources Conectados:**
  - Prometheus (Métricas de hardware de servidores)
  - Loki (Agregação de logs do Docker e Linux)
  - Zabbix Plugin (Gráficos unificados)`
  },
  {
    id: 'ansible-semaphore',
    name: 'Ansible Semaphore',
    url_or_ip: 'http://192.168.1.125:3000',
    category: 'Automação',
    icon: 'fa-solid fa-terminal',
    description: 'Execução de Playbooks de automação e patch management programado',
    port: '3000',
    protocol: 'HTTP',
    environment: 'Produção',
    pinned: false,
    status: 'online',
    notes: `### 📌 Anotações - Ansible Semaphore
- **Playbooks Frequentes:**
  - \`update-ubuntu-servers.yml\` (Atualização de pacotes de segurança)
  - \`provision-docker-host.yml\` (Configuração inicial de novo nó)
  - \`backup-network-configs.yml\` (Backup de switches)`
  },
  {
    id: 'unifi-controller',
    name: 'UniFi Network Controller',
    url_or_ip: 'https://192.168.1.10:8443',
    category: 'Infraestrutura',
    icon: 'fa-solid fa-wifi',
    description: 'Gerenciador central de Access Points Wi-Fi, Switches e VLANs',
    port: '8443',
    protocol: 'HTTPS',
    environment: 'Produção',
    pinned: false,
    status: 'online',
    notes: `### 📌 Anotações - UniFi Controller
- **SSIDs Configurados:**
  - \`VieiraTech_Corp\` (WPA3 Enterprise com RADIUS 802.1X - VLAN 30)
  - \`VieiraTech_Visitantes\` (Portal Captivo com voucher - VLAN 90 isolada)`
  },
  {
    id: 'snipe-it-inventory',
    name: 'Snipe-IT Asset Tracker',
    url_or_ip: 'https://assets.corp.local',
    category: 'Suporte',
    icon: 'fa-solid fa-barcode',
    description: 'Rastreamento de patrimônio, termos de responsabilidade e periféricos',
    port: '443',
    protocol: 'HTTPS',
    environment: 'Produção',
    pinned: false,
    status: 'online',
    notes: `### 📌 Anotações - Snipe-IT
- **Fluxo de Entrada:** Todo novo notebook ou monitor deve receber etiqueta com QR Code e ter o termo de responsabilidade assinado digitalmente antes da entrega.`
  },
  {
    id: 'graylog-siem',
    name: 'Graylog Log SIEM',
    url_or_ip: 'http://192.168.1.130:9000',
    category: 'Servidores',
    icon: 'fa-solid fa-file-shield',
    description: 'Servidor de agregação de Syslog para auditoria de segurança e acessos',
    port: '9000',
    protocol: 'HTTP',
    environment: 'Produção',
    pinned: false,
    status: 'online',
    notes: `### 📌 Anotações - Graylog SIEM
- **Entradas Syslog:** UDP porta 514 (Firewalls, Switches e MikroTik).
- **Retenção de Índices Elasticsearch:** 90 dias em disco local + cópia compactada no TrueNAS.`
  }
];
