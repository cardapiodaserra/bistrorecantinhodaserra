# 🍽️ Bistrô Recantinho da Serra — Cardápio Digital

Cardápio digital com PWA, pedidos via WhatsApp e administração via Firebase.

## Funcionalidades

- **Cardápio público** — Navegação por categorias, busca, filtros (comida/bebida), favoritos
- **Carrinho + Pedido WhatsApp** — Adicione itens e envie o pedido por WhatsApp com um clique
- **Painel Admin** — Gerencie o cardápio em tempo real (adicionar, editar, excluir itens/seções)
- **Controle de usuários** — Administradores (controle total) e Operadores (apenas edição do cardápio)
- **PWA** — Instalável como aplicativo, funciona offline (Firestore cache)
- **Backend Firebase** — Autenticação e banco de dados gerenciados

## Tecnologias

| Tecnologia | Uso |
|-----------|-----|
| [Alpine.js](https://alpinejs.dev) | Reatividade no frontend |
| [Tailwind CSS](https://tailwindcss.com) | Estilização |
| [Firebase Auth](https://firebase.google.com/docs/auth) | Autenticação admin/operador |
| [Firestore](https://firebase.google.com/docs/firestore) | Banco de dados do cardápio |
| [http-server](https://www.npmjs.com/package/http-server) | Servidor de desenvolvimento local |
| [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) | PWA offline |

## Começando

### Pré-requisitos

- Node.js 18+
- Conta Google (para Firebase)

### Setup local

```bash
# 1. Clonar o repositório
git clone https://github.com/cardapiorapido/bistrorecantinhodaserra.git
cd bistrorecantinhodaserra

# 2. Instalar dependências
npm install

# 3. Iniciar servidor local
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Integração Firebase

O projeto precisa de um projeto Firebase configurado. Siga o guia completo:

➡️ **[README-FIREBASE.md](README-FIREBASE.md)**

Resumo:
1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Habilite **Authentication** (Email/Senha) e **Firestore Database**
3. Copie as credenciais para `js/firebase.js`
4. Execute `migrate-to-firestore.html` para importar os dados
5. Crie o primeiro admin manualmente no Console Firebase

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor local na porta 3000 |

## Estrutura do projeto

```
bistrorecantinhodaserra/
├── index.html              # Página pública do cardápio
├── login.html              # Login para admin/operador
├── admin.html              # Painel administrativo
├── js/
│   ├── firebase.js         # Config do Firebase (preencher com suas credenciais)
│   ├── auth.js             # Serviço de autenticação
│   ├── menu-service.js     # CRUD do cardápio no Firestore
│   ├── app.js              # Lógica da página pública (Alpine.js)
│   └── alpinejs/           # Alpine.js (local + fallback CDN)
├── css/
│   ├── styles.css          # Estilos customizados
│   └── tailwind/           # Tailwind CSS compilado
├── assets/
│   ├── logo.PNG            # Logo do restaurante
│   └── img/                # Fotos dos pratos
├── data/
│   └── data.json           # Backup dos dados (migrar para Firestore e remover)
├── sw.js                   # Service Worker (PWA)
├── manifest.json           # Manifest PWA
└── package.json            # Dependências
```

## Deploy

O projeto está configurado para **GitHub Pages** em:
```
https://cardapiorapido.github.io/bistrorecantinhodaserra/
```

Para fazer deploy, apenas commite e pushing para a branch `main`. O Service Worker e o manifest.json já estão configurados com o caminho `/bistrorecantinhodaserra/`.

## Licença

Projeto privado — Bistrô Recantinho da Serra © 2025
