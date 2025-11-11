# PWA - Instruções de Instalação

## Funcionalidades Implementadas

✅ **Progressive Web App (PWA)** totalmente funcional
✅ **Service Worker** para cache e funcionalidade offline
✅ **Manifest.json** para metadados da aplicação
✅ **Banner de instalação** automático
✅ **Ícones** configurados para Android e iOS

## Como Funciona

### Para Usuários (Mobile)

1. **Android (Chrome/Edge)**:
   - Abra o site no navegador
   - Um banner aparecerá automaticamente na parte inferior
   - Clique em "Instalar" para adicionar à tela inicial
   - Ou use o menu do navegador > "Adicionar à tela inicial"

2. **iOS (Safari)**:
   - Abra o site no Safari
   - Toque no ícone de compartilhamento
   - Selecione "Adicionar à Tela de Início"
   - Confirme o nome e toque em "Adicionar"

### Para Usuários (Desktop)

1. **Chrome/Edge**:
   - Abra o site
   - Clique no ícone de instalação na barra de endereço (➕)
   - Ou vá em Menu > "Instalar Bistrô Recantinho da Serra..."
   - Confirme a instalação

## Ícones PWA

⚠️ **IMPORTANTE**: Para produção, você deve criar ícones otimizados:

### Tamanhos Necessários:
- **192x192px** - Ícone padrão Android
- **512x512px** - Ícone splash screen
- **180x180px** - Apple Touch Icon (iOS)
- **Formato**: PNG com fundo transparente ou sólido

### Ferramentas Recomendadas:
- [PWA Asset Generator](https://www.pwabuilder.com/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### Passos:
1. Crie um ícone quadrado de 512x512px
2. Use uma ferramenta acima para gerar todos os tamanhos
3. Substitua `assets/logo.PNG` pelos novos ícones
4. Ou atualize o `manifest.json` com os caminhos corretos

## Arquivos PWA Criados

```
├── manifest.json          # Configuração do PWA
├── sw.js                 # Service Worker (cache)
└── index.html            # Atualizado com meta tags PWA
```

## Testando a Instalação

1. **Servidor Local**: 
   ```bash
   npx serve
   # ou
   npx http-server
   ```

2. **Teste no Chrome DevTools**:
   - F12 > Application > Manifest
   - Verifique se não há erros
   - Application > Service Workers
   - Confirme que está ativo

3. **Lighthouse**:
   - F12 > Lighthouse > Progressive Web App
   - Execute a auditoria
   - Score deve ser >90

## Recursos Offline

O Service Worker armazena em cache:
- Página principal (index.html)
- Estilos (styles.css)
- Scripts (app.js)
- Dados do cardápio (data.json)
- Logo
- CDNs (Tailwind, Alpine.js, Fonts)

## Atualizações Futuras

Para atualizar o cache após mudanças:
1. Abra `sw.js`
2. Altere `CACHE_NAME` (ex: `'bistro-recantinho-v2'`)
3. Deploy da atualização
4. Service Worker limpará cache antigo automaticamente

## Suporte de Navegadores

- ✅ Chrome/Edge (Android/Desktop)
- ✅ Safari (iOS/Mac) - parcial
- ✅ Firefox (Android/Desktop)
- ✅ Samsung Internet
- ⚠️ iOS Safari - sem service worker completo

## Troubleshooting

**Banner não aparece?**
- Verifique se está em HTTPS (ou localhost)
- Limpe o cache do navegador
- Service Worker deve estar registrado

**Ícone não aparece?**
- Verifique o caminho em `manifest.json`
- Confirme que o arquivo existe
- Teste diferentes tamanhos

**Cache não atualiza?**
- Altere o `CACHE_NAME` em `sw.js`
- Desregistre o Service Worker: DevTools > Application > Service Workers > Unregister
