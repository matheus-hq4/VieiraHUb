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
  "users": [
    {
      "id": "usr-1790687255002",
      "username": "admin",
      "name": "admin",
      "role": "admin",
      "plainPassword": "admin",
      "salt": "640be2600dedd453757cd4e7e7d9dd24",
      "passwordHash": "1cdeb3dd5e8a788f50c9d90c45d3cfb27537a37886f5b638bb4241a038cfcf43c24fac2b17f3d62872b19ecbb361f757be15eb74ec93447dca2543a35a14ae22",
      "createdAt": "2026-09-29T13:07:35.002Z"
    },
    {
      "id": "usr-1789742592506",
      "username": "teste",
      "name": "teste",
      "role": "operador",
      "plainPassword": "1234",
      "salt": "f09eb8ae84fa88b90a1550bb4fa4af07",
      "passwordHash": "fdba6f30e20bd7e25b59364a3e4b7de5a2f0d142bc3ef3bdb945bbb7bc6e12c21b3bf0d9a49d9e94d1a34a3f5ebd49a33be30569b3732ed4283bd3fa276d0e13",
      "createdAt": "2026-09-18T14:43:12.507Z"
    },
    {
      "id": "usr-admin-2",
      "username": "vieiratech",
      "name": "VieiraTech TI",
      "role": "admin",
      "plainPassword": "$Vi3ir@Tech",
      "salt": "7c8d9e0f1a2b3c4d",
      "passwordHash": "b8c7fe6160bc411d4f991527de8522c5fdf9dbe9a0dc702d5e47eeb114677fbe1c045e1a461c0300191091de6443826e80e47827a7b34c03d624ccad6aa105e7",
      "createdAt": "2026-09-08T19:00:16.563Z"
    }
  ],
  "tools": [
    {
      "id": "tool-1790683068892",
      "name": "VPN NetBird",
      "url_or_ip": "https://netbird.vieiracred.app:8443/team/users",
      "category": "Suporte",
      "port": "",
      "protocol": "HTTPS",
      "environment": "Produção",
      "icon": "fa-solid fa-network-wired",
      "description": "VPN para os acessos das plataformas HyperFLow e NewCorban     -\nhttps://netbird.vieiracred.app:8443",
      "notes": "",
      "pinned": true,
      "status": "online",
      "custom": true,
      "latency": 336,
      "lastPingAt": "2026-09-29T18:24:25.393Z",
      "accessCount": 1,
      "lastAccessedAt": "2026-09-29T11:58:06.541Z"
    },
    {
      "id": "tool-1790682187456",
      "name": "TRUENAS",
      "url_or_ip": "http://10.10.70.125/",
      "category": "Servidores",
      "port": "",
      "protocol": "HTTPS",
      "environment": "Produção",
      "icon": "fa-solid fa-server",
      "description": "",
      "notes": "",
      "pinned": false,
      "status": "offline",
      "custom": true,
      "latency": 2000,
      "lastPingAt": "2026-09-29T11:43:15.904Z"
    },
    {
      "id": "tool-1790619543240",
      "name": "CHAMADOS  VIEIRATECH",
      "url_or_ip": "http://10.10.70.70/",
      "category": "Suporte",
      "port": "",
      "protocol": "HTTPS",
      "environment": "Produção",
      "icon": "fa-solid fa-server",
      "description": "Orçamento, termo de empréstimo , visita técnica e etc...",
      "notes": "",
      "pinned": true,
      "status": "online",
      "custom": true,
      "accessCount": 6,
      "lastAccessedAt": "2026-09-29T14:37:16.604Z",
      "latency": 6,
      "lastPingAt": "2026-09-29T18:24:27.231Z"
    }
  ],
  "employee_emails": [
    {
        "id": "email-1700000000001",
        "name": "Erick",
        "email": "erick@vieiracred.com.br",
        "password": "jOU+ql1mz",
        "department": "CEO / DIRETORIA",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-11-11"
    },
    {
        "id": "email-1700000000002",
        "name": "Jacqueline",
        "email": "jacqueline@vieiracred.com.br",
        "password": "syDi8zudoY",
        "department": "CEO / DIRETORIA",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000003",
        "name": "VivianeVie",
        "email": "VivianeVie.Finan@vieiracred.com.br",
        "password": "syDi8zudoY",
        "department": "FINANCEIRO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000004",
        "name": "Renata",
        "email": "renata@vieiracred.com.br",
        "password": "syDi8zudoY",
        "department": "FINANCEIRO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000005",
        "name": "MelissaRod",
        "email": "MelissaRod.Finan@vieiracred.com.br",
        "password": "ZgiKfP4J1B",
        "department": "FINANCEIRO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000006",
        "name": "CarlaFel",
        "email": "CarlaFel.Finan@vieiracred.com.br",
        "password": "A1sEan4RMk",
        "department": "FINANCEIRO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000007",
        "name": "CaioAra",
        "email": "CaioAra.Finan@vieiracred.com.br",
        "password": "Ah3zWmToRP",
        "department": "FINANCEIRO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000008",
        "name": "RobertaMar",
        "email": "RobertaMar.Dp@vieiracred.com.br",
        "password": "21u9W3v3RX",
        "department": "RH/DP",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000009",
        "name": "DeboraRub",
        "email": "DeboraRub.Rh@vieiracred.com.br",
        "password": "092UgFQ37B",
        "department": "RH/DP",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000010",
        "name": "AnarleiDia",
        "email": "AnarleiDia.Dp@vieiracred.com.br",
        "password": "X2aAkCsQe1",
        "department": "RH/DP",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000011",
        "name": "Ariana Rosa",
        "email": "ariana.rosa@vieiracred.com.br",
        "password": "092UgFQ37B",
        "department": "RH/DP",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000012",
        "name": "FernandaCar",
        "email": "FernandaCar.Rh@vieiracred.com.br",
        "password": "092UgFQ37B",
        "department": "RH/DP",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000013",
        "name": "MilenaAra",
        "email": "MilenaAra.Rh@vieiracred.com.br",
        "password": "1G936Bxyuc",
        "department": "RH/DP",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000014",
        "name": "LauraQue",
        "email": "LauraQue.Rh@vieiracred.com.br",
        "password": "314MxAuGB3",
        "department": "RH/DP",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000015",
        "name": "AlinePeg",
        "email": "AlinePeg.Rh@vieiracred.com.br",
        "password": "vAWxK5VhNe",
        "department": "RH/DP",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000016",
        "name": "WesleyLin",
        "email": "WesleyLin.Rh@vieiracred.com.br",
        "password": "7Ka6j6CkPV",
        "department": "RH/DP",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000017",
        "name": "LiviaMou",
        "email": "LiviaMou.Recepcao@vieiracred.com.br",
        "password": "1BmThXgUEG",
        "department": "RECEPÇÃO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000018",
        "name": "Camila Mendes",
        "email": "camila.mendes@vieiracred.com.br",
        "password": "1BmThXgUEG",
        "department": "RECEPÇÃO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000019",
        "name": "GabrielSet",
        "email": "GabrielSet.Mkt@vieiracred.com.br",
        "password": "ofiVMfoT9o",
        "department": "MARKETING",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000020",
        "name": "PedroNat",
        "email": "PedroNat.Mkt@vieiracred.com.br",
        "password": "fC7NRLKetj",
        "department": "MARKETING",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000021",
        "name": "Gustavo Silva",
        "email": "gustavo.silva@vieiracred.com.br",
        "password": "Pl4n@2026",
        "department": "PLANEJAMENTO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000022",
        "name": "Lauany Santos",
        "email": "lauany.santos@vieiracred.com.br",
        "password": "Pl4n@2026",
        "department": "PLANEJAMENTO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000023",
        "name": "Gabriele Sorrilha",
        "email": "gabriele.sorrilha@vieiracred.com.br",
        "password": "Pl4n@2026",
        "department": "PLANEJAMENTO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000024",
        "name": "Luana Cristina",
        "email": "luana.cristina@vieiracred.com.br",
        "password": "Pl4n@2026",
        "department": "PLANEJAMENTO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000025",
        "name": "Ronaldo",
        "email": "Ronaldo@vieiracred.com.br",
        "password": "R0n4ld0",
        "department": "PLANEJAMENTO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000026",
        "name": "Willian Sanches",
        "email": "willian.sanches@vieiracred.com.br",
        "password": "Pl4n@2026",
        "department": "PLANEJAMENTO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000027",
        "name": "Gustavo Aniceto",
        "email": "gustavo.aniceto@vieiracred.com.br",
        "password": "Pl4n@2026",
        "department": "PLANEJAMENTO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000028",
        "name": "Pedro Henrique",
        "email": "pedro.henrique@vieiracred.com.br",
        "password": "Pl4n@2026",
        "department": "PLANEJAMENTO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000029",
        "name": "Andre Felipe",
        "email": "andre.felipe@vieiracred.com.br",
        "password": "Pl4n@2026",
        "department": "PLANEJAMENTO",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000030",
        "name": "Jenifer (Gerente Geral)",
        "email": "jenifer@vieiracred.com.br",
        "password": "G3r3ncia@26",
        "department": "GERENCIA",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000031",
        "name": "Jessica (Gerente Operacional)",
        "email": "jessica@vieiracred.com.br",
        "password": "G3r3ncia@26",
        "department": "GERENCIA",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000032",
        "name": "Giovana Cunha",
        "email": "giovana.cunha@vieiracred.com.br",
        "password": "B4ckup@2026",
        "department": "BACKOFFICE",
        "notes": "Supervisor(a) Backoffice",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000033",
        "name": "Danilogen",
        "email": "danilogen.bko@vieiracred.com.br",
        "password": "B4ckup@2026",
        "department": "BACKOFFICE",
        "notes": "Supervisor(a) Backoffice",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000034",
        "name": "Fernada",
        "email": "fernada@vieiracred.com.br",
        "password": "B4ckup@2026",
        "department": "BACKOFFICE",
        "notes": "Supervisor(a) Backoffice",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000035",
        "name": "Op",
        "email": "op.bko@vieiracred.com.br",
        "password": "B4ckup@2026",
        "department": "BACKOFFICE",
        "notes": "Operador(a) Backoffice",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000036",
        "name": "Mariana Souza",
        "email": "mariana.souza@vieiracred.com.br",
        "password": "B4ckup@2026",
        "department": "BACKOFFICE",
        "notes": "Operador(a) Backoffice",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000037",
        "name": "Isabeli Victoria",
        "email": "isabeli.victoria@vieiracred.com.br",
        "password": "B4ckup@2026",
        "department": "BACKOFFICE",
        "notes": "Operador(a) Backoffice",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000038",
        "name": "Qualidade",
        "email": "qualidade@vieiracred.com.br",
        "password": "syDi9zudoY",
        "department": "MESA LIBERAÇÂO / QUALIDADE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000039",
        "name": "Erika",
        "email": "erika.mesalib@vieiracred.com.br",
        "password": "syDi8zudoY",
        "department": "MESA LIBERAÇÂO / QUALIDADE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000040",
        "name": "Larissa",
        "email": "larissa.mesa01@vieiracred.com.br",
        "password": "syDi9zudoY",
        "department": "MESA LIBERAÇÂO / QUALIDADE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000041",
        "name": "Larissapereira",
        "email": "larissapereira.mesa03@vieiracred.com.br",
        "password": "syDi9zudoY",
        "department": "MESA LIBERAÇÂO / QUALIDADE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000042",
        "name": "Karoline",
        "email": "karoline.mesa04@vieiracred.com.br",
        "password": "syDi9zudoY",
        "department": "MESA LIBERAÇÂO / QUALIDADE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000043",
        "name": "Gabriel",
        "email": "gabriel.mesa05@vieiracred.com.br",
        "password": "syDi9zudoY",
        "department": "MESA LIBERAÇÂO / QUALIDADE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000044",
        "name": "Thais",
        "email": "thais.mesa06@vieiracred.com.br",
        "password": "syDi9zudoY",
        "department": "MESA LIBERAÇÂO / QUALIDADE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000045",
        "name": "Nathalie",
        "email": "nathalie.mesa00@vieiracred.com.br",
        "password": "syDi9zudoY",
        "department": "MESA LIBERAÇÂO / QUALIDADE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000046",
        "name": "Maria",
        "email": "maria.mesa07@vieiracred.com.br",
        "password": "syDi9zudoY",
        "department": "MESA LIBERAÇÂO / QUALIDADE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000047",
        "name": "Joyce",
        "email": "joyce.mesa02@vieiracred.com.br",
        "password": "syDi9zudoY",
        "department": "MESA LIBERAÇÂO / QUALIDADE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000048",
        "name": "Ellen Silva",
        "email": "ellen.silva@vieiracred.com.br",
        "password": "Qu4l1@2026",
        "department": "MESA LIBERAÇÂO / QUALIDADE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000049",
        "name": "Lucas Sinobre",
        "email": "lucas.sinobre@vieiracred.com.br",
        "password": "3xpand3@@2026",
        "department": "EXPANDE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000050",
        "name": "Fabiana",
        "email": "fabiana@vieiracred.com.br",
        "password": "3xpand3@@2026",
        "department": "EXPANDE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000051",
        "name": "Laila Santos",
        "email": "laila.santos@vieiracred.com.br",
        "password": "3xpand3@@2026",
        "department": "EXPANDE",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000052",
        "name": "Matheus",
        "email": "matheus.vieiratech@vieiracred.com.br",
        "password": "$Vi3ir@Tech",
        "department": "VIEIRATECH - TI",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    },
    {
        "id": "email-1700000000053",
        "name": "Dener",
        "email": "dener.vieiratech@vieiracred.com.br",
        "password": "$Vi3ir@Tech",
        "department": "VIEIRATECH - TI",
        "notes": "",
        "adminOnly": false,
        "updatedAt": "2026-09-29"
    }
],
  "vault": [
    {
      "id": "item-1790681692225-6d6kv",
      "title": "Vieira@Tech",
      "category": "Wi-Fi",
      "username": "",
      "password": "$Vi3ir@26",
      "notes": "",
      "updatedAt": "2026-09-29"
    },
    {
      "id": "item-1790681659585-d0o3s",
      "title": "WIFI OP",
      "category": "Wi-Fi",
      "username": "",
      "password": "$Vieir@CredOP",
      "notes": "",
      "updatedAt": "2026-09-29"
    }
  ],
  "inventory": [
    {
      "id": "item-1790684957292-zvf5g",
      "name": "Maquina Dell (OP)",
      "category": "Hardware",
      "quantity": 4,
      "minQuantity": 2,
      "location": "Armário TI",
      "status": "Disponível",
      "notes": "",
      "pinned": true
    },
    {
      "id": "item-1790684913205-646az",
      "name": "Monitor Lenovo",
      "category": "Periféricos",
      "quantity": 7,
      "minQuantity": 2,
      "location": "Bancada",
      "status": "Disponível",
      "notes": "",
      "pinned": true
    },
    {
      "id": "item-1790683134746-gfihl",
      "name": "Mouse",
      "category": "Periféricos",
      "quantity": 4,
      "minQuantity": 3,
      "location": "Bancada",
      "status": "Disponível",
      "notes": "",
      "pinned": true
    },
    {
      "id": "item-1790683117849-ii3ud",
      "name": "HeadSet",
      "category": "Periféricos",
      "quantity": 5,
      "minQuantity": 4,
      "location": "Bancada",
      "status": "Disponível",
      "notes": "",
      "pinned": true
    }
  ],
  "ad_logins": {
    "rawText": "Mapeamento organizacional\n\n<VieiraCred\n\t<CEO / DIRETORIA\n\t    ✔ erick@vieiracredsv | user/senha: jOU+ql1mz\n\t    ✔ jacqueline@vieiracredsv | user/senha: syDi8zudoY\n\n\t<FINANCEIRO\n\t\t✔ VivianeVie.Finan@vieiracredsv | user/senha: syDi8zudoY\n\t\t✔ renata@vieiracredsv | user/senha: syDi8zudoY\n\t\t✔ MelissaRod.Finan@vieiracredsv | user/senha: ZgiKfP4J1B\n\t\t✔ CarlaFel.Finan@vieiracredsv | user/senha: A1sEan4RMk\n\t\t✔ CaioAra.Finan@vieiracredsv | user/senha: Ah3zWmToRP\n\n\t<RH/DP\n\t\t✔ RobertaMar.Dp@vieiracredsv | user/senha: 21u9W3v3RX\n\t\t✔ DeboraRub.Rh@vieiracredsv | user/senha: 092UgFQ37B\n\t\t✔ AnarleiDia.Dp@vieiracredsv | user/senha: X2aAkCsQe1\n\t\t✔ ariana.rosa@vieiracredsv | user/senha: 092UgFQ37B\n\t\t✔ FernandaCar.Rh@vieiracredsv | user/senha: 092UgFQ37B\n\t\tX MilenaAra.Rh@vieiracredsv | user/senha: 1G936Bxyuc\n\t\t✔ LauraQue.Rh@vieiracredsv | user/senha: 314MxAuGB3\n\t\t✔ AlinePeg.Rh@vieiracredsv | user/senha: vAWxK5VhNe\n\t\t✔ WesleyLin.Rh@vieiracredsv | user/senha: 7Ka6j6CkPV\n\n\t<RECEPÇÃO\n\t\t✔ LiviaMou.Recepcao@vieiracredsv | user/senha: 1BmThXgUEG\n\t\t✔ camila.mendes@vieiracredsv | user/senha: 1BmThXgUEG\n\n\t<MARKETING\n\t\t✔ GabrielSet.Mkt@vieiracredsv | user/senha: ofiVMfoT9o\n\t\t✔ PedroNat.Mkt@vieiracredsv | user/senha: fC7NRLKetj\n\n\t<PLANEJAMENTO\n\t\t✔ gustavo.silva@vieiracredsv | user/senha: Pl4n@2026\n\t\t✔ lauany.santos@vieiracredsv | user/senha: Pl4n@2026\n\t\t✔ gabriele.sorrilha@vieiracredsv | user/senha: Pl4n@2026\n\t\t✔ luana.cristina@vieiracredsv | user/senha: Pl4n@2026\n\t\t✔ Ronaldo@vieiracredsv | user/senha: R0n4ld0\n\t\t✔ willian.sanches@vieiracredsv | user/senha: Pl4n@2026\n\t\t✔ gustavo.aniceto@vieiracredsv | user/senha: Pl4n@2026\n\t\t✔ pedro.henrique@vieiracredsv | user/senha: Pl4n@2026\n\n\t<GERENCIA\n\t\t>Gerente Geral   jenifer@vieiracredsv | user/senha: G3r3ncia@26\n\t\t>Gerente Oper    jessica@vieiracredsv | user/senha: G3r3ncia@26\n\n\t<BACKOFFICE\n\t\t<SUPERVISOR(A)\n\t\t\t✔ giovana.cunha@vieiracredsv | user/senha: B4ckup@2026\n\t\t\t❌ danilogen.bko@vieiracredsv | user/senha: B4ckup@2026\n\t\t\t❌ fernada@vieiracredsv | user/senha: B4ckup@2026\n\t\t<OPERADOR(A)\n\t\t\t✔ op.bko@vieiracredsv | user/senha: B4ckup@2026\n\t\t\t✔ mariana.souza@vieiracredsv | user/senha: B4ckup@2026\n\t\t\t✔ isabeli.victoria@vieiracredsv | user/senha: B4ckup@2026\n\n\t<MESA LIBERAÇÂO / QUALIDADE\n\t\t✔ qualidade@vieiracredsv | user/senha: syDi9zudoY\n\t\t✔ erika.mesalib@vieiracredsv | user/senha: syDi8zudoY\n\t\t✔ larissa.mesa01@vieiracredsv | user/senha: syDi9zudoY\n\t\t✔ larissapereira.mesa03@vieiracredsv | user/senha: syDi9zudoY\n\t\t✔ karoline.mesa04@vieiracredsv | user/senha: syDi9zudoY\n\t\t✔ gabriel.mesa05@vieiracredsv | user/senha: syDi9zudoY\n\t\t✔ thais.mesa06@vieiracredsv | user/senha: syDi9zudoY\n\t\t✔ nathalie.mesa00@vieiracredsv | user/senha: syDi9zudoY\n\t\t✔ maria.mesa07@vieiracredsv | user/senha: syDi9zudoY\n\t\t✔ joyce.mesa02@vieiracredsv | user/senha: syDi9zudoY\n\t\t✔ ellen.silva@vieiracredsv | user/senha: Qu4l1@2026\n\n\t<EXPANDE\n\t\t✔ lucas.sinobre@vieiracredsv | user/senha: 3xpand3@@2026\n\t\t✔ fabiana@vieiracredsv | user/senha: 3xpand3@@2026\n\t\t✔ laila.santos@vieiracredsv | user/senha: 3xpand3@@2026\n\n\t<VIEIRATECH - TI\n\t\t✔ matheus.vieiratech@vieiracredsv | user/senha: $Vi3ir@Tech\n\t\t✔ dener.vieiratech@vieiracredsv | user/senha: $Vi3ir@Tech\n\n\t<OPERAÇÃO VIERACRED\n\t\t<SUPERVISOR(A)\n\t\t  >Supervisor 01 | user/senha: super01 super@165\n\t\t  >Angela.sup    | user/senha: super02 super@165\n\t\t  >Supervisor 03 | user/senha: super03 super@165\n\t\t  >Supervisor 04 | user/senha: super04 super@165\n\t\t  >Supervisor 05 | user/senha: super05 super@165\n\t\t  >Supervisor 06 | user/senha: super06 super@165\n\t\t  >Supervisor 07 | user/senha: super07 Op3r4c40@2026 (RYAN)\n\t\t  >Supervisor 08 | user/senha: super08 super@165\n\n\t\t<OPERADOR(A)\n\t\t  <Espinha 01\n\t\t    >Operador 01 | user/senha: op01_01 opera@165\n\t\t    >Operador 02 | user/senha: op02_01 opera@165\n\t\t    >Operador 03 | user/senha: op03_01 opera@165\n\t\t    >Operador 04 | user/senha: op04_01 opera@165\n\t\t    >Operador 05 | user/senha: op05_01 opera@165\n\t\t    >Operador 06 | user/senha: op06_01 opera@165\n\t\t    >Operador 07 | user/senha: op07_01 opera@165\n\t\t    >Operador 08 | user/senha: op08_01 opera@165\n\t\t    >Operador 09 | user/senha: op09_01 opera@165\n\t\t    >Operador 10 | user/senha: op10_01 opera@165\n\n\t\t  <Espinha 02\n\t\t    >Operador 01 | user/senha: op01_02 opera@165\n\t\t    >Operador 02 | user/senha: op02_02 opera@165\n\t\t    >Operador 03 | user/senha: op03_02 opera@165\n\t\t    >Operador 04 | user/senha: op04_02 opera@165\n\t\t    >Operador 05 | user/senha: op05_02 opera@165\n\t\t    >Operador 06 | user/senha: op06_02 opera@165\n\t\t    >Operador 07 | user/senha: op07_02 opera@165\n\t\t    >Operador 08 | user/senha: op08_02 opera@165\n\t\t    >Operador 09 | user/senha: op09_02 opera@165\n\t\t    >Operador 10 | user/senha: op10_02 opera@165\n\n\t\t  <Espinha 03\n\t\t    >Operador 01 | user/senha: op01_03 opera@165\n\t\t    >Operador 02 | user/senha: op02_03 opera@165\n\t\t    >Operador 03 | user/senha: op03_03 opera@165\n\t\t    >Operador 04 | user/senha: op04_03 opera@165\n\t\t    >Operador 05 | user/senha: op05_03 opera@165\n\t\t    >Operador 06 | user/senha: op06_03 opera@165\n\t\t    >Operador 07 | user/senha: op07_03 opera@165\n\t\t    >Operador 08 | user/senha: op08_03 opera@165\n\t\t    >Operador 09 | user/senha: op09_03 opera@165\n\t\t    >Operador 10 | user/senha: op10_03 opera@165\n\n\t\t  <Espinha 04\n\t\t    >Operador 01 | user/senha: op01_04 opera@165\n\t\t    >Operador 02 | user/senha: op02_04 opera@165\n\t\t    >Operador 03 | user/senha: op03_04 opera@165\n\t\t    >Operador 04 | user/senha: op04_04 opera@165\n\t\t    >Operador 05 | user/senha: op05_04 opera@165\n\t\t    >Operador 06 | user/senha: op06_04 opera@165\n\t\t    >Operador 07 | user/senha: op07_04 opera@165\n\t\t    >Operador 08 | user/senha: op08_04 opera@165\n\t\t    >Operador 09 | user/senha: op09_04 opera@165\n\t\t    >Operador 10 | user/senha: op10_04 opera@165\n\n\t\t  <Espinha 05\n\t\t    >Operador 01 | user/senha: op01_05 opera@165\n\t\t    >Operador 02 | user/senha: op02_05 opera@165\n\t\t    >Operador 03 | user/senha: op03_05 opera@165\n\t\t    >Operador 04 | user/senha: op04_05 opera@165\n\t\t    >Operador 05 | user/senha: op05_05 opera@165\n\t\t    >Operador 06 | user/senha: op06_05 opera@165\n\t\t    >Operador 07 | user/senha: op07_05 opera@165\n\t\t    >Operador 08 | user/senha: op08_05 opera@165\n\t\t    >Operador 09 | user/senha: op09_05 opera@165\n\t\t    >Operador 10 | user/senha: op10_05 opera@165\n\n\t\t  <Espinha 06\n\t\t    >Operador 01 | user/senha: op01_06 opera@165\n\t\t    >Operador 02 | user/senha: op02_06 opera@165\n\t\t    >Operador 03 | user/senha: op03_06 opera@165\n\t\t    >Operador 04 | user/senha: op04_06 opera@165\n\t\t    >Operador 05 | user/senha: op05_06 opera@165\n\t\t    >Operador 06 | user/senha: op06_06 opera@165\n\t\t    >Operador 07 | user/senha: op07_06 opera@165\n\t\t    >Operador 08 | user/senha: op08_06 opera@165\n\t\t    >Operador 09 | user/senha: op09_06 opera@165\n\t\t    >Operador 10 | user/senha: op10_06 opera@165\n\n\t\t  <Espinha 07\n\t\t    >Operador 01 | user/senha: op01_07 opera@165\n\t\t    >Operador 02 | user/senha: op02_07 opera@165\n\t\t    >Operador 03 | user/senha: op03_07 opera@165\n\t\t    >Operador 04 | user/senha: op04_07 opera@165\n\t\t    >Operador 05 | user/senha: op05_07 opera@165\n\t\t    >Operador 06 | user/senha: op06_07 opera@165\n\t\t    >Operador 07 | user/senha: op07_07 opera@165\n\t\t    >Operador 08 | user/senha: op08_07 opera@165\n\t\t    >Operador 09 | user/senha: op09_07 opera@165\n\t\t    >Operador 10 | user/senha: op10_07 opera@165\n\n\t\t  <Espinha 08\n\t\t    >Operador 01 | user/senha: op01_08 opera@165\n\t\t    >Operador 02 | user/senha: op02_08 opera@165\n\t\t    >Operador 03 | user/senha: op03_08 opera@165\n\t\t    >Operador 04 | user/senha: op04_08 opera@165\n\t\t    >Operador 05 | user/senha: op05_08 opera@165\n\t\t    >Operador 06 | user/senha: op06_08 opera@165\n\t\t    >Operador 07 | user/senha: op07_08 opera@165\n\t\t    >Operador 08 | user/senha: op08_08 opera@165\n\t\t    >Operador 09 | user/senha: op09_08 opera@165\n\t\t    >Operador 10 | user/senha: op10_08 opera@165\n\n\t<PLANEJAMENTO\n\t\t<teste"
  },
  "inventory_logs": [
    {
      "id": "item-1790683143071-44wnj",
      "itemId": "item-1790683134746-gfihl",
      "itemName": "Mouse",
      "previousQty": 3,
      "newQty": 4,
      "delta": 1,
      "action": "entrada",
      "user": "VieiraTech TI",
      "reason": "Entrada rápida no estoque (+1)",
      "timestamp": "2026-09-29T11:59:03.069Z"
    },
    {
      "id": "item-1790683142514-y59ja",
      "itemId": "item-1790683134746-gfihl",
      "itemName": "Mouse",
      "previousQty": 2,
      "newQty": 3,
      "delta": 1,
      "action": "entrada",
      "user": "VieiraTech TI",
      "reason": "Entrada rápida no estoque (+1)",
      "timestamp": "2026-09-29T11:59:02.512Z"
    },
    {
      "id": "item-1790683141687-pryhg",
      "itemId": "item-1790683134746-gfihl",
      "itemName": "Mouse",
      "previousQty": 3,
      "newQty": 2,
      "delta": -1,
      "action": "saida",
      "user": "VieiraTech TI",
      "reason": "Baixa rápida no estoque (-1)",
      "timestamp": "2026-09-29T11:59:01.686Z"
    },
    {
      "id": "item-1790683141673-ep5zx",
      "itemId": "item-1790683134746-gfihl",
      "itemName": "Mouse",
      "previousQty": 4,
      "newQty": 3,
      "delta": -1,
      "action": "saida",
      "user": "VieiraTech TI",
      "reason": "Baixa rápida no estoque (-1)",
      "timestamp": "2026-09-29T11:59:01.671Z"
    },
    {
      "id": "item-1790683141492-ynrwn",
      "itemId": "item-1790683134746-gfihl",
      "itemName": "Mouse",
      "previousQty": 5,
      "newQty": 4,
      "delta": -1,
      "action": "saida",
      "user": "VieiraTech TI",
      "reason": "Baixa rápida no estoque (-1)",
      "timestamp": "2026-09-29T11:59:01.490Z"
    },
    {
      "id": "item-1790683140720-ormws",
      "itemId": "item-1790683134746-gfihl",
      "itemName": "Mouse",
      "previousQty": 4,
      "newQty": 5,
      "delta": 1,
      "action": "entrada",
      "user": "VieiraTech TI",
      "reason": "Entrada rápida no estoque (+1)",
      "timestamp": "2026-09-29T11:59:00.719Z"
    },
    {
      "id": "item-1790683138506-yvw8i",
      "itemId": "item-1790683134717-50a9z",
      "itemName": "Mouse",
      "previousQty": 4,
      "newQty": 0,
      "delta": -4,
      "action": "exclusao",
      "user": "VieiraTech TI",
      "reason": "Item removido do inventário",
      "timestamp": "2026-09-29T11:58:58.505Z"
    },
    {
      "id": "item-1790682629555-qmfr7",
      "itemId": "item-1790682629540-13nnw",
      "itemName": "Headset Intelbras CHS 55 USB",
      "previousQty": 5,
      "newQty": 0,
      "delta": -5,
      "action": "exclusao",
      "user": "Administrador Master",
      "reason": "Item removido do inventário",
      "timestamp": "2026-09-29T11:50:29.554Z"
    }
  ]
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
