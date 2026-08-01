# Deployment — Bistrô Recantinho da Serra

## URL de Produção

**Base URL**: `https://cardapiorapido.github.io/bistrorecantinhodaserra/`

## Arquitetura

O frontend é **estático** (HTML/CSS/JS servido via GitHub Pages) e consome o
**Supabase Cloud** como backend:

| Serviço | Uso |
|---------|-----|
| Supabase Auth | Login/sessão de admin e operador |
| Supabase Postgres | Tabelas `sections` (cardápio) e `profiles` (usuários) |
| Supabase Storage | Imagens dos itens (bucket `menu-items`) |
| Supabase Edge Functions | Criação/exclusão de usuários (`create-user`, `delete-user`) |

O Firebase é **legado** (mantido para rollback) — veja
[README-FIREBASE.md](README-FIREBASE.md).

## Pré-requisitos

- **Supabase CLI** instalada ([guia oficial](https://supabase.com/docs/guides/local-development/cli/getting-started)):
  ```bash
  npm install -g supabase
  # ou
  npx supabase --version
  ```
- Um **projeto Supabase** criado em [supabase.com/dashboard](https://supabase.com/dashboard)
- **Project ref** do projeto (visível em Dashboard → Settings → General, formato `abcdefghijklmnopqrst`)
- **Node.js 18+** (apenas para `npm run dev` local; o deploy em si não precisa)
- Repositório GitHub configurado com GitHub Pages

## Checklist de Deploy (passo a passo)

> Ordem importa — execute nesta sequência.

### 1. Login na CLI do Supabase

Gere um access token e faça login:

```bash
# 1. Acesse https://supabase.com/dashboard/account/tokens
# 2. Clique "Generate New Token"
# 3. Copie o token gerado (formato sbp_...)

# Login interativo (abre o navegador):
supabase login

# Ou login com token (útil em CI/servidor):
supabase login --token sbp_seu_token_aqui
```

### 2. Vincular projeto local ao projeto Cloud

```bash
supabase link --project-ref <seu-project-ref>
```

O comando pede a senha do banco remoto (definida na criação do projeto).
Após vinculado, o CLI armazena o ref em `supabase/.temp/`.

### 3. Configurar supabase/config.toml para produção

Antes de subir, ajuste as configurações de auth no `supabase/config.toml`:

```toml
[auth]
# ⚠️ ATUALIZAR para a URL de produção
site_url = "https://cardapiorapido.github.io"

# ⚠️ ATUALIZAR — lista de URLs permitidas para redirect pós-auth
additional_redirect_urls = ["https://cardapiorapido.github.io"]

# Mantenha: sem signup público (usuários criados via admin)
enable_signup = false
enable_anonymous_sign_ins = false
enable_refresh_token_rotation = true

[auth.email]
# Confirmação de email desabilitada (usuários criados pelo admin já confirmados)
enable_confirmations = false
```

> **Por que atualizar isso?** O `site_url` é usado pelo Auth para construir links em
> emails de recuperação de senha e como allow-list de redirects. Se mantiver
> `http://127.0.0.1:3000`, emails terão links quebrados e redirects falharão.

### 4. Push da configuração de auth

```bash
supabase config push
```

Este comando sincroniza `site_url`, `additional_redirect_urls`, `enable_signup`,
`jwt_expiry`, `enable_confirmations` e demais settings do `[auth]` do
`config.toml` local para o projeto Cloud. **Rode isso sempre que alterar
configurações de auth.**

### 5. Push das migrations (banco de dados)

```bash
# Dry-run primeiro — vê o que será aplicado sem alterar nada:
supabase db push --dry-run

# Se o diff estiver correto, aplica de verdade:
supabase db push
```

O que acontece:
- O CLI compara as migrations locais (`supabase/migrations/*.sql`) com a tabela
  de histórico remota (`supabase_migrations.schema_migrations`)
- Migrations **pendentes** (não registradas no histórico) são aplicadas em ordem
- Migrations já aplicadas são ignoradas

Flags úteis:

| Flag | Efeito |
|------|--------|
| `--dry-run` | Mostra o que seria aplicado, sem alterar nada |
| `--include-seed` | Roda o `seed.sql` junto (popula o banco com dados iniciais) |
| `--include-all` | Aplica TODAS as migrations locais, ignorando o histórico remoto |
| `--linked` | Força push para o projeto vinculado (default) |

> **Recomendação**: Não use `--include-seed` em produção se o banco já tem dados
> (o seed é `INSERT` e pode dar conflito). Use apenas no primeiro deploy ou após
> `db reset`.

Se precisar popular via seed sem sobrescrever migrations existentes:

```bash
# Opção A: Via CLI (se já linkado):
supabase db push --include-seed

# Opção B: Via SQL manual (Studio → SQL Editor):
# Copie e cole o conteúdo de supabase/seed.sql
```

### 6. Deploy das Edge Functions

```bash
supabase functions deploy create-user
supabase functions deploy delete-user
```

Flags úteis:

| Flag | Efeito |
|------|--------|
| `--no-verify-jwt` | Desabilita verificação JWT na borda (NÃO usar — as funções validam JWT internamente) |
| `--project-ref <ref>` | Especifica projeto sem precisar de `supabase link` |
| `--prune` | Remove funções do projeto Cloud que não existem localmente |

Após o deploy, as funções ficam disponíveis em:
- `https://<project-ref>.supabase.co/functions/v1/create-user`
- `https://<project-ref>.supabase.co/functions/v1/delete-user`

> ⚠️ As funções NÃO precisam de `--no-verify-jwt` — diferente do default Supabase,
> elas fazem validação JWT e autorização manualmente (admin check), e aceitam
> chamadas anônimas no modo bootstrap (primeiro admin).

### 7. Configurar o cliente frontend

Edite `js/supabase/supabase-client.js` com as credenciais do projeto Cloud:

```js
// js/supabase/supabase-client.js
const SUPABASE_URL = 'https://<project-ref>.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_...';  // anon/publishable key do Cloud
```

Onde encontrar a anon key:
- Dashboard → Settings → Data API → `anon public` key
- Ou via CLI: `supabase status` (mostra as keys do projeto vinculado)

> ⚠️ **NUNCA** exponha a `service_role` key no frontend — ela é restrita ao
> backend (Edge Functions) e bypassa RLS.

### 8. Verificar bucket Storage

O bucket `menu-items` é criado pela migration `00003_bucket.sql` durante o
`db push`. Verifique se existe:

1. Dashboard → Storage → bucket `menu-items`
2. Deve estar como **público** (ícone de globo 🌐)
3. As policies de acesso (SELECT, INSERT, DELETE para authenticated) são
   criadas pela migration `00004_storage_policies.sql`

Se por algum motivo o bucket não foi criado, configure manualmente:
- Dashboard → Storage → New Bucket → nome `menu-items` → marcar "Public bucket"
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

### 9. Deploy do frontend (GitHub Pages)

1. Certifique-se de que `js/supabase/supabase-client.js` está com a URL e
   anon key do Cloud (passo 7)
2. Atualize a versão do Service Worker em `sw.js`:
   ```js
   const CACHE_NAME = 'bistro-recantinho-v7'; // incremente a versão
   ```
3. Commit e push para o repositório:
   ```bash
   git add .
   git commit -m "deploy: Supabase Cloud + config push"
   git push origin main
   ```
4. GitHub Pages publica automaticamente (branch `main`, raiz do repo)
5. Acesse: `https://cardapiorapido.github.io/bistrorecantinhodaserra/`

### 10. Criar o primeiro administrador

Com o banco **sem nenhum admin**, acesse:
```
https://cardapiorapido.github.io/bistrorecantinhodaserra/setup.html
```

Preencha email e senha — a Edge Function `create-user` detecta `count(admins) = 0`
e cria o usuário com `role='admin'`.

Após o primeiro admin, a janela de bootstrap **fecha permanentemente** — o
`setup.html` passa a mostrar "Administrador já configurado" e o link some do
`login.html`. Novos usuários só podem ser criados por um admin autenticado
via painel (`admin.html` → Usuários).

> **Segurança**: a exposição fica limitada à janela `deploy → 1º admin`.
> Se houver intervalo grande entre deploy e configuração, considere adicionar
> um `SETUP_KEY` (env var da Edge Function) ao branch de bootstrap do
> `create-user`.

## Variáveis de Ambiente das Edge Functions

As Edge Functions `create-user` e `delete-user` usam estas variáveis,
**todas auto-injetadas** pelo Supabase Cloud — você não precisa configurá-las:

| Variável | Origem | Uso nas funções |
|----------|--------|-----------------|
| `SUPABASE_URL` | Auto-injetada | URL da API do projeto (`https://<ref>.supabase.co`) |
| `SUPABASE_ANON_KEY` | Auto-injetada (legacy) | Criar cliente para verificar JWT do chamador |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injetada (legacy) | Criar cliente admin (bypassa RLS) para criar/deletar auth users |

Estas são as variáveis **legadas** (`_ANON_KEY`, `_SERVICE_ROLE_KEY`). O
Supabase também injeta as versões novas (`SUPABASE_PUBLISHABLE_KEYS` e
`SUPABASE_SECRET_KEYS` em JSON), mas as funções deste projeto usam a API
legada (`supabase-js@2`), então as variáveis antigas continuam funcionando.

Para verificar que estão presentes:

```bash
supabase secrets list
```

Se precisar adicionar secrets customizadas no futuro:

```bash
# A partir de um arquivo .env:
supabase secrets set --env-file supabase/.env.production

# Ou individualmente:
supabase secrets set MY_SECRET=valor
```

## Configuração GitHub Pages

### manifest.json

- `start_url`: `/bistrorecantinhodaserra/index.html`
- `scope`: `/bistrorecantinhodaserra/`
- `shortcuts[0].url`: `/bistrorecantinhodaserra/index.html`

### sw.js (Service Worker)

- `BASE_PATH = '/bistrorecantinhodaserra'`
- Todos os recursos em `urlsToCache` usam `${BASE_PATH}/...`
- Fallback offline: `${BASE_PATH}/`
- Dados do cardápio **não** vão para o cache (buscados via HTTP no Supabase)

### index.html

- Service Worker: `/bistrorecantinhodaserra/sw.js`
- Recursos usam caminhos **relativos**
- SDK `@supabase/supabase-js@2` via CDN + `js/supabase/*.js`

### Páginas

| Página | Caminho | Descrição |
|--------|---------|-----------|
| Cardápio | `/bistrorecantinhodaserra/index.html` | Página pública |
| Login | `/bistrorecantinhodaserra/login.html` | Login de admin/operador |
| Setup | `/bistrorecantinhodaserra/setup.html` | Primeiro acesso (cria 1º admin) |
| Admin | `/bistrorecantinhodaserra/admin.html` | Painel de gestão |

## PWA

Após o deploy, o app será instalável como PWA em:
- **Android Chrome**: prompt automático de instalação
- **iOS Safari**: "Adicionar à Tela de Início" no menu Compartilhar
- **Desktop Chrome/Edge**: ícone de instalação na barra de endereço

Consulte [PWA-README.md](PWA-README.md) para detalhes completos sobre
instalação, teste e troubleshooting.

## Service Worker

Estratégia **network-first** (tenta rede primeiro, cache como fallback).
Cacheia automaticamente:
- Páginas HTML
- CSS e JavaScript locais
- Logo e assets
- CDNs (Tailwind, Alpine.js, Google Fonts, SDK Supabase)

Dados do cardápio são buscados via HTTP no Supabase — **não vão para o cache**.

Para forçar atualização do cache após cada deploy, incremente a versão:

```js
// sw.js
const CACHE_NAME = 'bistro-recantinho-v7'; // incrementar a cada deploy
```

## Verificação Pós-Deploy

Execute esta checklist após cada deploy:

1. [ ] App carrega em `https://cardapiorapido.github.io/bistrorecantinhodaserra/`
2. [ ] Cardápio exibe dados vindos do Supabase `sections` (não vazio)
3. [ ] Login acessível em `/login.html`
4. [ ] Link "Primeiro acesso?" visível no login (se banco sem admin) ou oculto (se já tem admin)
5. [ ] Setup em `/setup.html` funciona (cria primeiro admin se banco vazio)
6. [ ] Painel admin em `/admin.html` acessível (redireciona para login se não autenticado)
7. [ ] Auth funciona: login/logout, sessão persiste após refresh
8. [ ] Upload de imagem funciona (admin → editar item → upload)
9. [ ] Edge Functions respondem (criar/remover usuários via painel admin)
10. [ ] Service Worker registrado (DevTools → Application → Service Workers)
11. [ ] Manifest válido (DevTools → Application → Manifest)
12. [ ] PWA instalável (ícone na barra do navegador ou prompt no mobile)

## Teste Local

Para testar localmente (antes do deploy Cloud):

```bash
npm run supabase:start   # Sobe Supabase local (Docker)
npm run dev              # Servidor na porta 3000
# Acesse: http://localhost:3000
```

> **Nunca abra via `file://`** — o SDK Supabase, Service Worker e `fetch()`
> exigem HTTP.

## Troubleshooting

### "Supabase URL not found / anon key missing"

- Verifique `js/supabase/supabase-client.js` — deve ter a URL Cloud e anon key
- O SDK Supabase é carregado via CDN **antes** do `supabase-client.js` —
  verifique a ordem dos `<script>` no HTML

### "Edge Function returned 401"

- As funções exigem JWT de admin no fluxo normal
- Se é o primeiro acesso (bootstrap), a função aceita chamada anônima apenas
  se `count(admins) = 0` — verifique se o banco realmente não tem admin
- Token expirado? Faça logout e login novamente

### "db push: relation already exists"

- Significa que as migrations já foram aplicadas (ou parte delas)
- Use `--include-all` para forçar re-aplicação (cuidado)
- Ou use `supabase migration repair <versão> --status applied` para marcar
  migrations como aplicadas sem re-executar

### "Bucket menu-items not found"

- A migration `00003_bucket.sql` deve criar o bucket automaticamente
- Se falhou, crie manualmente via Dashboard → Storage
- Verifique se as policies (migration `00004`) foram aplicadas

### "Service Worker não registra"

- Confirme que está acessando via **HTTPS** (GitHub Pages já é HTTPS)
- O caminho do SW no `navigator.serviceWorker.register()` deve ser
  `/bistrorecantinhodaserra/sw.js`
- Incremente `CACHE_NAME` em `sw.js` para forçar atualização

### "Config push não aplicou site_url"

- Verifique se o projeto está linkado (`supabase link --project-ref <ref>`)
- O `config push` só propaga a seção `[auth]` do `config.toml`
- Para verificar o estado atual: Dashboard → Authentication → Settings → Site URL

## Atualizações Futuras (re-deploy)

Quando fizer alterações no backend:

```bash
# Novas migrations:
supabase db push --dry-run
supabase db push

# Edge Functions atualizadas:
supabase functions deploy create-user
supabase functions deploy delete-user

# Config de auth alterada:
supabase config push

# Scripts de frontend alterados:
# Faça commit + push para o GitHub (GitHub Pages publica automaticamente)
# Lembre de incrementar CACHE_NAME em sw.js
```

## Rollback para Firebase

Se precisar voltar ao backend Firebase, consulte **[README-FIREBASE.md](README-FIREBASE.md)**.
A troca é feita alterando os `<script>` nos HTMLs:
- Remova/desative os scripts `js/supabase/*.js`
- Ative os scripts `js/firebase.js` + `js/auth.js` + `js/menu-service.js` + `js/storage-service.js`
- A API pública (`authService`, `menuService`, `storageService`) é idêntica
