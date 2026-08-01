# 🍽️ Bistrô Recantinho da Serra — Cardápio Digital

Cardápio digital com PWA, pedidos via WhatsApp e administração via Supabase.

## Funcionalidades

- **Cardápio público** — Navegação por categorias, busca, filtros (comida/bebida), favoritos
- **Carrinho + Pedido WhatsApp** — Adicione itens e envie o pedido por WhatsApp com um clique
- **Painel Admin** — Gerencie o cardápio em tempo real (adicionar, editar, excluir itens/seções)
- **Controle de usuários** — Administradores (controle total) e Operadores (apenas edição do cardápio)
- **Primeiro acesso** — Sem nenhum usuário, o sistema permite criar o primeiro administrador (janela única)
- **PWA** — Instalável como aplicativo, com cache via Service Worker
- **Backend Supabase** — Autenticação, banco Postgres e Storage gerenciados

## Tecnologias

| Tecnologia | Uso |
|-----------|-----|
| [Alpine.js](https://alpinejs.dev) | Reatividade no frontend |
| [Tailwind CSS](https://tailwindcss.com) | Estilização |
| [Supabase Auth](https://supabase.com/docs/guides/auth) | Autenticação admin/operador |
| [Supabase Postgres](https://supabase.com/docs/guides/database) | Banco de dados do cardápio |
| [Supabase Storage](https://supabase.com/docs/guides/storage) | Imagens dos itens |
| [Supabase Edge Functions](https://supabase.com/docs/guides/functions) | Criação/exclusão de usuários (admin) |
| [http-server](https://www.npmjs.com/package/http-server) | Servidor de desenvolvimento local |
| [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) | PWA offline (cache estático) |

## Começando

### Pré-requisitos

- Node.js 18+
- Docker + Docker Compose (para o Supabase local)
- Supabase CLI (`npm i -g supabase` ou via `npx`)

### Setup local

```bash
# 1. Clonar o repositório
git clone https://github.com/cardapiorapido/bistrorecantinhodaserra.git
cd bistrorecantinhodaserra

# 2. Instalar dependências
npm install

# 3. Subir o Supabase local (Docker) — aplica migrations + seed
npm run supabase:start

# 4. Iniciar servidor local
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

> ⚠️ **Nunca abra via `file://`** — o SDK Supabase, o Service Worker e o `fetch()` exigem HTTP.

### Primeiro acesso (criar o primeiro admin)

Com o banco **sem nenhum usuário**, acesse `http://localhost:3000/setup.html`
(link discreto "Primeiro acesso? Configurar administrador" no `login.html`).

O primeiro usuário criado vira **administrador** automaticamente. A partir daí,
apenas admins autenticados criam novos usuários (painel admin → Usuários).

### Ambiente local (Supabase via Docker)

- **Studio**: http://127.0.0.1:54323 — inspecionar tabelas, profiles, buckets
- **API REST**: http://127.0.0.1:54321/rest/v1
- **Edge Functions**: http://127.0.0.1:54321/functions/v1 (`create-user`, `delete-user`)
- **Mailpit**: http://127.0.0.1:54324 (emails de auth em dev)

Ordem correta no dia: `npm run supabase:start` (uma vez) → `npm run dev`.

Usuários de teste em dev (criados via `bash supabase/bootstrap-dev-users.sh`):
- Admin: `admin@bistro.com` / `admin123`
- Operador: `operador@bistro.com` / `operador123`

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor local na porta 3000 |
| `npm run supabase:start` | Sobe o Supabase local (Docker) + migrations + seed |
| `npm run supabase:stop` | Para o Supabase local |
| `npm run supabase:reset` | `supabase db reset` (re-aplica migrations + seed) |
| `npm run dev:all` | `supabase:start` + `dev` |

## Estrutura do projeto

```
bistrorecantinhodaserra/
├── index.html              # Página pública do cardápio
├── login.html              # Login para admin/operador
├── setup.html              # Primeiro acesso (cria o 1º admin, janela única)
├── admin.html              # Painel administrativo
├── js/
│   ├── app.js              # Lógica da página pública (Alpine.js)
│   ├── alpinejs/           # Alpine.js (local + fallback CDN)
│   ├── supabase/           # Serviços Supabase (backend ativo)
│   │   ├── supabase-client.js  # Init do cliente (URL + anon key)
│   │   ├── auth.js             # authService (login, usuários via Edge Functions)
│   │   ├── menu-service.js     # menuService (CRUD sections)
│   │   └── storage-service.js  # storageService (bucket menu-items)
│   ├── firebase.js         # 🔴 Legado Firebase — manter intacto (rollback)
│   ├── auth.js             # 🔴 Legado Firebase
│   ├── menu-service.js     # 🔴 Legado Firebase
│   └── storage-service.js  # 🔴 Legado Firebase
├── supabase/
│   ├── config.toml         # Config do Supabase local
│   ├── migrations/         # Schema + RLS (00001..00005)
│   ├── seed.sql            # Dados iniciais do cardápio (24 seções)
│   ├── functions/          # Edge Functions (create-user, delete-user)
│   └── bootstrap-dev-users.sh  # Recria admin/operador de dev
├── css/
│   ├── styles.css          # Estilos customizados
│   └── tailwind/           # Tailwind CSS compilado
├── assets/
│   ├── logo.PNG            # Logo do restaurante
│   └── img/                # Fotos dos pratos
├── data/
│   └── data.json           # Artefato histórico (origem do seed)
├── sw.js                   # Service Worker (PWA)
├── manifest.json           # Manifest PWA
└── package.json            # Dependências
```

## Backend

### Supabase (ativo)

- **Auth**: Email/password. `enable_signup = false` — usuários criados apenas por admin
  (via Edge Function `create-user`) ou pelo `setup.html` no primeiro acesso.
- **Database**: tabela `sections` (id, title, type, order, items JSONB) e `profiles`
  (id FK → auth.users, email, display_name, role, active).
- **Storage**: bucket público `menu-items` — path `{sectionId}/{timestamp}.{ext}`.
- **RLS**: cardápio de leitura pública; escrita autenticada; perfis gerenciados por admin.

### Firebase (legado, para rollback)

A integração Firebase foi **preservada intacta** em `js/firebase.js`, `js/auth.js`,
`js/menu-service.js`, `js/storage-service.js`. Os serviços expõem a **mesma API pública**
(`authService`, `menuService`, `storageService`). Para voltar ao Firebase, troque os
`<script>` nos HTMLs (guia: **[README-FIREBASE.md](README-FIREBASE.md)**).

## Deploy

O projeto está configurado para **GitHub Pages** em:
```
https://cardapiorapido.github.io/bistrorecantinhodaserra/
```

Veja **[DEPLOYMENT.md](DEPLOYMENT.md)** para o guia completo de deploy com Supabase Cloud,
incluindo migrations, Edge Functions, config push, storage e verificação pós-deploy.

## Licença

Projeto privado — Bistrô Recantinho da Serra © 2025
