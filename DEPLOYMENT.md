# Deployment — Bistrô Recantinho da Serra

## URL de Produção

**Base URL**: `https://cardapiorapido.github.io/bistrorecantinhodaserra/`

## Backend: Supabase Cloud

O frontend é estático (GitHub Pages) e consome o **Supabase** como backend (Auth,
Postgres, Storage, Edge Functions). O Firebase é legado (rollback) — veja
[README-FIREBASE.md](README-FIREBASE.md).

### Pré-requisitos Supabase (antes do deploy)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Aplique as **migrations** (`supabase/migrations/`) no projeto Cloud:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
3. Faça deploy das **Edge Functions**:
   ```bash
   supabase functions deploy create-user
   supabase functions deploy delete-user
   ```
4. Configure o `js/supabase/supabase-client.js` com a **URL** e a **anon key** do
   projeto Cloud (substitua os valores do dev local).
5. Aplique o **seed** (24 seções) se necessário, ou populue via painel admin:
   ```bash
   supabase db reset --linked   # cuidado: apaga dados existentes
   ```

### Criação do primeiro admin (produção)

Com o banco vazio, acesse `/setup.html` (link no `login.html`). O `create-user`
detecta `count(admins) = 0` e cria o primeiro usuário com `role='admin'`. Depois
disso, a janela fecha — novos usuários só por um admin autenticado.

> **Modelo de segurança**: a exposição fica limitada à janela `deploy → 1º admin`.
> Se houver intervalo grande entre deploy e configuração, considere adicionar um
> `SETUP_KEY` (env var da Edge Function) ao branch de bootstrap do `create-user`.

### Variáveis de ambiente das Edge Functions

As Edge Functions `create-user` e `delete-user` usam `SUPABASE_URL`,
`SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` — injetadas automaticamente pelo
hosting do Supabase (Dashboard → Edge Functions → Secrets). Não é preciso configurar
manualmente, mas confirme que existem no projeto Cloud.

## Arquivos Configurados para GitHub Pages

### 1. **manifest.json**
- `start_url`: `/bistrorecantinhodaserra/index.html`
- `scope`: `/bistrorecantinhodaserra/`
- `shortcuts[0].url`: `/bistrorecantinhodaserra/index.html`

### 2. **sw.js** (Service Worker)
- `BASE_PATH = '/bistrorecantinhodaserra'`
- Todos os recursos em `urlsToCache` usam `${BASE_PATH}/...`
- Fallback de navegação offline usa `${BASE_PATH}/`
- Dados do cardápio **não** vão para o cache do SW (são buscados via HTTP/Supabase)

### 3. **index.html**
- Registro do Service Worker: `/bistrorecantinhodaserra/sw.js`
- Recursos usam caminhos **relativos** (correto para GitHub Pages)
- Carrega o SDK `@supabase/supabase-js@2` via CDN + `js/supabase/*.js`

### 4. **Páginas**

| Página | Caminho | Descrição |
|--------|---------|-----------|
| Cardápio | `/bistrorecantinhodaserra/index.html` | Página pública |
| Login | `/bistrorecantinhodaserra/login.html` | Login de admin/operador |
| Setup | `/bistrorecantinhodaserra/setup.html` | Primeiro acesso (cria 1º admin) |
| Admin | `/bistrorecantinhodaserra/admin.html` | Painel de gestão do cardápio |

## Supabase Storage

Imagens dos itens ficam no bucket público `menu-items`. No projeto Cloud:

1. Crie o bucket `menu-items` (público) — a migration `00003_bucket.sql` já cria no
   `db push`; caso não, crie via Dashboard → Storage.
2. As policies de upload/delete (`00004_storage_policies.sql`) são aplicadas via
   migration.

## Como Fazer Deploy

### GitHub Pages (frontend)

1. Configure o Supabase Cloud (migrations + Edge Functions + anon key no
   `supabase-client.js`)
2. Faça commit de todas as alterações
3. Push para o repositório: `cardapiorapido/bistrorecantinhodaserra`
4. Certifique-se de que GitHub Pages está configurado para servir da branch `main` (raiz)
5. Acesse: `https://cardapiorapido.github.io/bistrorecantinhodaserra/`
6. Acesse `/setup.html` para criar o primeiro admin (banco vazio)

### Testar Localmente

```bash
npm run supabase:start
npm run dev
# Acesse: http://localhost:3000
```

**Importante**: Abra em `http://localhost:3000` (sem o prefixo `/bistrorecantinhodaserra/` no local)

## PWA — Instalação

Após o deploy, o app será instalável como PWA em:
- Mobile: Prompt automático de instalação
- Desktop/Chrome: Ícone de instalação na barra de endereço

## Service Worker

O Service Worker cacheia automaticamente (network-first):
- Páginas HTML
- CSS e JavaScript
- Imagens (logo)
- CDNs externos (Tailwind, Alpine.js, Google Fonts, SDK Supabase)

Os dados do cardápio são buscados via HTTP no Supabase (não ficam no cache do SW).

Para forçar atualização do cache, edite a versão em `sw.js`:
```javascript
const CACHE_NAME = 'bistro-recantinho-v4'; // incrementar versão
```

## Verificação

Após deploy, verifique:

1. App carrega em `https://cardapiorapido.github.io/bistrorecantinhodaserra/`
2. Cardápio exibe dados (vindos do Supabase `sections`)
3. Service Worker registrado (DevTools > Application > Service Workers)
4. Manifest válido (DevTools > Application > Manifest)
5. PWA instalável (ícone de instalação na barra do navegador)
6. Login acessível em `/login.html`
7. Primeiro acesso em `/setup.html` (apenas com banco sem admin)
8. Painel admin acessível em `/admin.html` (redireciona para login se não autenticado)
