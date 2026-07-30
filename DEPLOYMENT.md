# Deployment — Bistrô Recantinho da Serra

## URL de Produção

**Base URL**: `https://cardapiorapido.github.io/bistrorecantinhodaserra/`

## Pré-requisitos Firebase

Antes do deploy, o Firebase deve estar configurado e os dados migrados:

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Habilite **Authentication** → Email/Senha
3. Crie o **Firestore Database** (modo produção)
4. Copie as credenciais para `js/firebase.js`
5. Execute `migrate-to-firestore.html` para importar os dados do cardápio
6. Crie o primeiro admin manualmente no console Firebase
7. Publique as regras de segurança do Firestore

> Guia completo: **[README-FIREBASE.md](README-FIREBASE.md)**

## Arquivos Configurados para GitHub Pages

### 1. **manifest.json**
- `start_url`: `/bistrorecantinhodaserra/index.html`
- `scope`: `/bistrorecantinhodaserra/`
- `shortcuts[0].url`: `/bistrorecantinhodaserra/index.html`

### 2. **sw.js** (Service Worker)
- `BASE_PATH = '/bistrorecantinhodaserra'`
- Todos os recursos em `urlsToCache` usam `${BASE_PATH}/...`
- Fallback de navegação offline usa `${BASE_PATH}/`
- Cache inclui: `firebase.js`, `menu-service.js`, Firebase SDK CDN
- `data/data.json` removido do cache (substituído por Firestore offline persistence)

### 3. **index.html**
- Registro do Service Worker: `/bistrorecantinhodaserra/sw.js`
- Recursos usam caminhos **relativos** (correto para GitHub Pages):
  - `manifest.json`
  - `favicon.svg`
  - `assets/logo.PNG`
  - `css/styles.css`
  - `js/app.js`
  - `js/firebase.js`
  - `js/menu-service.js`

### 4. **Firebase SDK**
- Carregado via CDN (`https://www.gstatic.com/firebasejs/...`)
- Configurado em `js/firebase.js` (preencher com dados do seu projeto)
- Firestore habilitado com `enablePersistence()` para cache offline

### 5. **Novas páginas**

| Página | Caminho | Descrição |
|--------|---------|-----------|
| Login | `/bistrorecantinhodaserra/login.html` | Login de admin/operador |
| Admin | `/bistrorecantinhodaserra/admin.html` | Painel de gestão do cardápio |

## Como Fazer Deploy

### GitHub Pages

1. Configure o Firebase (veja [README-FIREBASE.md](README-FIREBASE.md))
2. Faça commit de todas as alterações
3. Push para o repositório: `cardapiorapido/bistrorecantinhodaserra`
4. Certifique-se de que GitHub Pages está configurado para servir da branch `main` (raiz do repositório)
5. Acesse: `https://cardapiorapido.github.io/bistrorecantinhodaserra/`

### Testar Localmente

```bash
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
- Firebase SDK
- Imagens (logo)
- CDNs externos (Tailwind, Alpine.js, Google Fonts)

Os dados do cardápio são servidos offline via Firestore offline persistence (não via cache do SW).

Para forçar atualização do cache, edite a versão em `sw.js`:
```javascript
const CACHE_NAME = 'bistro-recantinho-v3'; // incrementar versão
```

## Verificação

Após deploy, verifique:

1. App carrega em `https://cardapiorapido.github.io/bistrorecantinhodaserra/`
2. Cardápio exibe dados (vindos do Firestore)
3. Service Worker registrado (DevTools > Application > Service Workers)
4. Manifest válido (DevTools > Application > Manifest)
5. PWA instalável (ícone de instalação na barra do navegador)
6. Funciona offline após primeira visita (Firestore persistence)
7. Login acessível em `/login.html`
8. Painel admin acessível em `/admin.html` (redireciona para login se não autenticado)
