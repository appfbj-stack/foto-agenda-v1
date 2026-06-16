# FotoAgenda Pro

Agenda e gestão para fotógrafos profissionais — agendamento de sessões, controle de clientes, finanças e assistente IA (Hermes).

Parte do ecossistema **Kairos Pro** — requer Kairos Admin para gerenciamento de licenças.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Backend | FastAPI + SQLAlchemy |
| Banco | PostgreSQL 16 |
| Auth | JWT (python-jose) |
| Deploy | Docker Compose + Traefik (Dokploy) |

---

## Funcionalidades

- **Agenda** — cadastro de sessões com data, horário, local, maquiador, cabeleireiro
- **Clientes** — CRUD completo com busca
- **Financeiro** — preço, sinal, status de pagamento por sessão
- **Hermes IA** — assistente integrado com planos de uso (teste / básico / pro / ilimitado)
- **Multi-tenant** — cada estúdio é um tenant isolado
- **Super Admin** — painel em `/painel` para gerenciar tenants e módulos
- **Kairos Admin** — verificação de licença a cada login

---

## Configuração local

```bash
# 1. Clone
git clone https://github.com/appfbj-stack/foto-agenda-v1.git
cd foto-agenda-v1

# 2. Crie o .env a partir do exemplo
cp .env.example .env
# Edite .env com suas credenciais

# 3. Suba o banco e o backend
docker compose up -d

# 4. Frontend (desenvolvimento)
npm install
npm run dev
```

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL PostgreSQL |
| `SECRET_KEY` | Chave secreta JWT |
| `HERMES_API_URL` | URL do serviço Hermes IA |
| `HERMES_EMAIL` | Credencial Hermes |
| `HERMES_PASSWORD` | Credencial Hermes |
| `KAIROS_ADMIN_URL` | URL do Kairos Admin (ex: `https://admin.fbautomacao.space`) |
| `KAIROS_CLIENT_ID` | UUID do app registrado no Kairos Admin |
| `APP_SLUG` | `foto-agenda-pro` (fixo) |
| `ADMIN_EMAIL` | E-mail do super admin (seed automático no boot) |
| `ADMIN_PASSWORD` | Senha do super admin |

---

## Integração Kairos Admin

Este app implementa o contrato padrão Kairos Pro:

**Endpoint público** (chamado pelo Kairos Admin para health check):
```
GET /api/license/verify?client_id={UUID}&app_slug=foto-agenda-pro
→ { "app": "FotoAgenda Pro", "slug": "foto-agenda-pro", "client_id": "...", "online": true }
```

**Verificação no login** — a cada login de usuário não-super-admin, o sistema consulta o Kairos Admin para validar se a licença está ativa. Se o Kairos Admin estiver indisponível, a autenticação prossegue normalmente (fail-open).

---

## Deploy no Dokploy

1. Crie um serviço **Docker Compose** no Dokploy apontando para este repositório
2. Configure as variáveis de ambiente na interface do Dokploy
3. Certifique-se de que a rede `kairos_network` existe: `docker network create kairos_network`
4. Registre o app no Kairos Admin e copie o `KAIROS_CLIENT_ID`

---

## Estrutura do projeto

```
foto-agenda-v1/
├── backend/
│   ├── app/
│   │   ├── core/          # database, security, config
│   │   ├── models.py      # SQLAlchemy models
│   │   ├── deps.py        # FastAPI dependencies
│   │   ├── routes/        # auth, admin, shoots, hermes, panel, license_check
│   │   └── services/      # license.py (Kairos Admin integration)
│   ├── Dockerfile
│   └── requirements.txt
├── services/              # Frontend API client
├── components/            # React components
├── App.tsx
├── docker-compose.yml
└── .env.example
```
