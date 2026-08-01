# AGENTS.md — Bistrô Recantinho da Serra

## Dev

```
npm run dev             # http-server . -p 3000 -c-1
npm run supabase:start  # sobe o Supabase local (Docker) + aplica migrations + seed
npm run supabase:stop   # para o Supabase local
npm run dev:all         # supabase:start + dev
npm run build:css       # Tailwind v4 → css/tailwind/output.css (minified)
npm run watch:css       # Tailwind v4 watch mode (auto-rebuild on CSS changes)
```

**Ordem correta no dia**: `npm run supabase:start` (uma vez) → `npm run dev`.
O `http-server` da porta 3000 precisa estar rodando junto com o Supabase.

Never open `file://` — `fetch()`, Service Worker, and the Supabase SDK require HTTP.

## Pages

| Path | Role |
|------|------|
| `index.html` | Public menu (Alpine.js app, reads Supabase `sections` table) |
| `login.html` | Admin/operator login |
| `admin.html` | Dashboard: menu CRUD + user management (admin only) |

Entrypoint: `index.html` → `x-data="menuApp()" x-init="init()"` → Alpine component in `js/app.js`.

## Backend: Supabase (principal) + Firebase (legado)

O projeto usa **Supabase** como BaaS principal. A integração Firebase foi **preservada intacta** em `js/firebase.js`, `js/auth.js`, `js/menu-service.js`, `js/storage-service.js` para rollback futuro.

Os serviços expõem a **mesma API pública** (`authService`, `menuService`, `storageService`) tanto na versão Firebase quanto na Supabase. Alternar o backend é só trocar os `<script>` nos HTMLs:

- **Supabase (ativo)**: `js/supabase/supabase-client.js` + `js/supabase/auth.js` (+ `menu-service.js`/`storage-service.js`) + SDK `@supabase/supabase-js@2` via CDN.
- **Firebase (rollback)**: `<script>` da gstatic + `js/firebase.js` + `js/auth.js` etc.

### Supabase local (Docker)

- CLI: `supabase` (v2.111.0+). Stack gerenciado por `supabase start` / `supabase stop`.
- Não há `docker-compose.yml`/`Dockerfile` no repo — o CLI `supabase start` gera e gerencia o compose internamente a partir das imagens oficiais (Docker é pré-requisito).
- **Studio**: http://127.0.0.1:54323 — inspecionar tabelas, profiles, buckets.
- **API REST**: http://127.0.0.1:54321/rest/v1
- **Edge Functions**: http://127.0.0.1:54321/functions/v1 (`create-user`, `delete-user`)
- **Mailpit**: http://127.0.0.1:54324 (emails de auth em dev)
- Config em `supabase/config.toml`. Migrations em `supabase/migrations/`. Seed em `supabase/seed.sql` (rodado no `db reset`).
- Chave anon para dev local: `supabase-client.js`. `supabase start` imprime as chaves atuais.

### Serviços Supabase em uso

- **Auth**: Email/password via `js/supabase/auth.js` (`authService`). `enable_signup = false` — usuários são criados só por admin via Edge Function `create-user`.
- **Database**: tabela `sections` (id, title, type, "order", items JSONB) e `profiles` (id UUID FK → `auth.users`, email, display_name, role, active).
- **Realtime**: `menuService.onMenuChange()` usa canal `menu-realtime` no `postgres_changes` da tabela `sections` (não usado ativamente hoje).
- **Storage**: bucket público `menu-items` via `js/supabase/storage-service.js` (`storageService`) — path: `{sectionId}/{timestamp}.{ext}`.

### Edge Functions

- `supabase/functions/create-user/index.ts` — cria auth user + perfil (trigger `handle_new_user` cria o profile com role `operator`; a função atualiza role/display_name).
  - **Bootstrap**: se `count(profiles WHERE role='admin' AND active=true) === 0`, aceita chamada **anônima** e força `role='admin'` — cria o **primeiro administrador**. Janela única: fecha assim que o 1º admin existe.
  - **Fluxo normal**: após existir admin, exige chamador **admin autenticado** (JWT) e cria usuário com o role do body.
- `supabase/functions/delete-user/index.ts` — apaga o auth user (perfil some via `ON DELETE CASCADE`). Requer chamador **admin**.
- Para desenvolver: `supabase functions serve` (ou reiniciar o stack). Para deploy futuro: `supabase functions deploy <name>`.

### Primeiro acesso (bootstrap do admin)

1. Com **0 usuários** no banco, acesse `/setup.html` (link discreto em `login.html` → "Primeiro acesso? Configurar administrador").
2. O formulário chama `create-user` **sem token** → a função detecta `count(admins) = 0` e cria o usuário com `role='admin'`.
3. Depois do 1º admin, `/setup.html` mostra "já configurado" e a função rejeita chamadas anônimas (401).
4. A partir daí, apenas um admin autenticado cria novos usuários (painel `admin.html` → Usuários).

**Ocultação do link de setup**: o `login.html` e o `setup.html` verificam via RPC `public.first_admin_pending()` (migration `00005`) se existe admin ativo. Quando já existe, o link "Primeiro acesso?" é **ocultado** no login e o `setup.html` mostra "Administrador já configurado". A RPC é `SECURITY DEFINER` porque `profiles` não é legível por anon (RLS), mas a RPC pode ser chamada sem autenticação.

**Visibilidade do link de setup no login**: o `login.html` oculta o link "Primeiro acesso?" quando já existe admin, consultando a RPC `public.first_admin_pending()` (migration `00005`). A RPC é `SECURITY DEFINER` porque `profiles` não é legível por anon (RLS); o `setup.html` usa a mesma RPC para decidir se mostra o formulário.

**Modelo de segurança**: exposição limitada à janela `deploy → 1º admin`. Se o dono configurar imediatamente após o deploy, a janela é de segundos. Para deploy com intervalo maior, considerar adicionar um `SETUP_KEY` (env var) ao branch de bootstrap.

### Primeiro admin / dados de teste (dev local)

- Admin: `admin@bistro.com` / `admin123` (criado via `setup.html` ou GoTrue admin API + `role='admin'`).
- Operador: `operador@bistro.com` / `operador123` (criado pelo admin via Edge Function).
- `supabase/bootstrap-dev-users.sh` recria ambos após `supabase db reset` (bootstrap com 0 admins).
- **Não commitar essas credenciais em produção** — o fluxo de seed de usuários ainda é manual.

## Data model

Seções ficam na tabela Supabase `sections`, NÃO em `data/data.json` (artefato histórico).

```
sections/{id}  (Postgres row)
  id: string, title: string, type: "food"|"drinks", order: number
  items: jsonb [{ name, description (null|string), price ("R$ 12,34"|"[Preço Vazio]"), image (null|string), available: bool }]
```

Items no longer use `<span class="item-description">` in `name` — `description` is a separate field.

Currency format: `R$ 12,34` (comma decimal). Sentinel `[Preço Vazio]` hides price/add-to-cart.

`localStorage` keys: `favorites` (item names array), `cart` ({ name, price, category, quantity }[]), `user` ({ name, address, phone }).

## Admin panel quirks

- `isAdmin` in the Alpine component is a **reactive property** set explicitly in `init()`, not a getter reading `authService.state` (Alpine doesn't track external objects).
- Auth state listener: `authService.init()` → poll `authService.state.loading` until false, THEN read `userProfile`.
- User creation calls the Supabase Edge Function `create-user` (admin only) — does NOT affect current session.
- Soft-delete for users: `profiles.active = false` (login blocked in `authService.init()`).
- Hard-delete for users: Edge Function `delete-user` removes the auth user (profile via CASCADE); `authService.init()` signs out users with no profile.

## PWA

- `sw.js`: network-first, `CACHE_NAME` must be **incremented** on every deploy.
- Supabase/Firebase data is fetched over HTTP — no JSON in SW cache.
- Manifest scope: `/bistrorecantinhodaserra/` (GitHub Pages subpath).

## Brand tokens (Tailwind)

| Class | Hex |
|-------|-----|
| `brand-primary` | `#8B3A3A` |
| `brand-dark` | `#3D2417` |
| `brand-wood` | `#8B6239` |
| `brand-beige` | `#F5F0E8` |
| `brand-cream` | `#E8DCC8` |
| `brand-maroon` | `#6B2C2C` |

## WhatsApp number

Update `numeroWhatsApp` in `js/app.js` (`558381157571`). International format without `+`.

## Key files

| File | Purpose |
|------|---------|
| `js/supabase/supabase-client.js` | Supabase client init (URL + anon key) |
| `js/supabase/auth.js` | `authService` Supabase: login, logout, create/deactivate/delete/list users (via Edge Functions) |
| `js/supabase/menu-service.js` | `menuService` Supabase: `fetchSections`, `onMenuChange` (Realtime), `saveSection`, `deleteSection`, `updateSectionItems` |
| `js/supabase/storage-service.js` | `storageService` Supabase: `uploadItemImage`, `deleteImage` (bucket `menu-items`) |
| `js/app.js` | Public menu Alpine component |
| `login.html` | Login form, Alpine `loginApp()` |
| `admin.html` | Admin dashboard, Alpine `adminApp()` |
| `sw.js` | Service Worker, bump `CACHE_NAME` on deploy |
| `supabase/config.toml` | Config do Supabase local (auth, storage, realtime) |
| `supabase/migrations/*.sql` | Schema + RLS (aplicadas no `supabase start`/`db reset`) |
| `supabase/seed.sql` | Dados iniciais do cardápio (24 seções) |
| `supabase/functions/create-user/`, `delete-user/` | Edge Functions de gestão de usuários |
| `js/firebase.js`, `js/auth.js`, `js/menu-service.js`, `js/storage-service.js` | **Legado Firebase** — manter intactos para rollback |

## Gotchas

- **Do NOT** use `authService.isAdmin` as an Alpine getter — Alpine can't react to external object changes. Set `this.isAdmin` explicitly in `init()`.
- **Do NOT** return early from `onAuthStateChange` without setting `loading = false` — hangs the admin's auth poll loop.
- **Do NOT** load `js/auth.js` (Firebase) junto com `js/supabase/auth.js` na mesma página — ambos definem `const authService` (colisão de escopo global).
- `data/data.json` is a historical artifact. Changes to the menu must go through Supabase.
- RLS exige GRANTs explícitos para `service_role` nas tabelas que Edge Functions acessam (ver migration `00002_rls.sql`).
- Após criar nova migration, rode `supabase db reset` para aplicá-la (ou `supabase start` já aplica migrations pendentes).
- Supabase local não tem `enablePersistence()` como o Firestore — sem cache offline nativo do Postgres.
- Tailwind is **precompiled** to `css/tailwind/output.css` — edit `input.css` then run `./tailwindcss-build.sh` to regenerate.
- Alpine.js is loaded from local copy + CDN fallback (both `defer`). The CDN version wins if both load.
