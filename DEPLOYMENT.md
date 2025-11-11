# Deployment - Bistrô Recantinho da Serra

## URL de Produção
**Base URL**: `https://cardapiorapido.github.io/bistrorecantinhodaserra/`

## Arquivos Configurados para GitHub Pages

### 1. **manifest.json**
- ✅ `start_url`: `/bistrorecantinhodaserra/index.html`
- ✅ `scope`: `/bistrorecantinhodaserra/`
- ✅ `shortcuts[0].url`: `/bistrorecantinhodaserra/index.html`

### 2. **sw.js** (Service Worker)
- ✅ Constante `BASE_PATH = '/bistrorecantinhodaserra'`
- ✅ Todos os recursos em `urlsToCache` usam `${BASE_PATH}/...`
- ✅ Fallback de navegação offline usa `${BASE_PATH}/`

### 3. **index.html**
- ✅ Registro do Service Worker: `/bistrorecantinhodaserra/sw.js`
- ✅ Recursos usam caminhos **relativos** (correto para GitHub Pages):
  - `manifest.json`
  - `favicon.svg`
  - `assets/logo.PNG`
  - `css/styles.css`
  - `js/app.js`

### 4. **js/app.js**
- ✅ Fetch usa caminho **relativo**: `data/data.json`

## Como Fazer Deploy

### GitHub Pages
1. Faça commit de todas as alterações
2. Push para o repositório: `cardapiorapido/bistrorecantinhodaserra`
3. Certifique-se de que GitHub Pages está configurado para servir da branch `main` (raiz do repositório)
4. Acesse: `https://cardapiorapido.github.io/bistrorecantinhodaserra/`

### Testar Localmente
Para testar com o mesmo comportamento do GitHub Pages:

```bash
# Usar um servidor HTTP (NÃO abrir o arquivo diretamente)
npx serve .
# ou
npx http-server .
# ou VS Code Live Server
```

**Importante**: Abra em `http://localhost:<porta>/index.html` (sem o prefixo `/bistrorecantinhodaserra/` no local)

## PWA - Instalação
Após o deploy, o app será instalável como PWA em:
- Mobile: Prompt automático de instalação
- Desktop/Chrome: Ícone de instalação na barra de endereço

## Service Worker
O Service Worker cacheia automaticamente:
- Páginas HTML
- CSS e JavaScript
- Dados do cardápio (JSON)
- Imagens (logo)
- CDNs externos (Tailwind, Alpine.js, Google Fonts)

Para forçar atualização do cache, edite a versão em `sw.js`:
```javascript
const CACHE_NAME = 'bistro-recantinho-v2'; // incrementar versão
```

## Verificação
Após deploy, verifique:
1. ✅ App carrega em `https://cardapiorapido.github.io/bistrorecantinhodaserra/`
2. ✅ Service Worker registrado (DevTools > Application > Service Workers)
3. ✅ Manifest válido (DevTools > Application > Manifest)
4. ✅ PWA instalável (ícone de instalação na barra do navegador)
5. ✅ Funciona offline após primeira visita
