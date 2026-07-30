# Integração Firebase — Bistrô Recantinho da Serra

Guia completo de configuração do Firebase para o cardápio digital.

---

## Índice

1. [Criar um Projeto Firebase](#1-criar-um-projeto-firebase)
2. [Obter as Credenciais de Configuração](#2-obter-as-credenciais-de-configuração)
3. [Habilitar Authentication (Email/Senha)](#3-habilitar-authentication-emailsenha)
4. [Criar o Banco Firestore](#4-criar-o-banco-firestore)
5. [Configurar as Regras de Segurança](#5-configurar-as-regras-de-segurança)
6. [Preencher as Variáveis no Projeto](#6-preencher-as-variáveis-no-projeto)
7. [Migrar os Dados do Cardápio para o Firestore](#7-migrar-os-dados-do-cardápio-para-o-firestore)
8. [Criar o Primeiro Usuário Administrador](#8-criar-o-primeiro-usuário-administrador)
9. [Verificar a Integração](#9-verificar-a-integração)
10. [Manutenção e Próximos Passos](#10-manutenção-e-próximos-passos)
11. [Referências Oficiais Firebase](#11-referências-oficiais-firebase)

---

## 1. Criar um Projeto Firebase

Acesse o [Console Firebase](https://console.firebase.google.com) com sua conta Google.

### Passo a passo

1. Clique em **Criar um projeto** (ou **Add project**)
2. Digite o nome do projeto: `bistro-recantinho-serra`
3. **Desative** o Google Analytics (não é necessário para este projeto)
4. Clique em **Criar projeto**

> **Documentação oficial**: [Firebase console: Add a project](https://firebase.google.com/docs/projects/learn-more#setting_up_a_firebase_project)

---

## 2. Obter as Credenciais de Configuração

Após criar o projeto, você precisa registrar um aplicativo web para obter as credenciais (conhecidas como **Firebase config object**).

### No Console Firebase:

1. Na tela inicial do projeto, clique no ícone **Web** (`</>`)
2. Digite um apelido para o app: `cardapio-web`
3. **Não marque** "Firebase Hosting" (vamos manter o GitHub Pages)
4. Clique em **Registrar app**

### O que você vai ver:

O Firebase exibirá um código JavaScript contendo o objeto `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB_...abc123",
  authDomain: "bistro-recantinho-serra.firebaseapp.com",
  projectId: "bistro-recantinho-serra",
  storageBucket: "bistro-recantinho-serra.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

> **Importante**: Você NÃO precisa de variáveis de ambiente (.env) neste projeto. O Firebase SDK para web inclui a API Key no código — isso é seguro porque as regras de segurança do Firestore (e não a chave) protegem os dados. Veja: [Firebase: Config object security](https://firebase.google.com/docs/projects/api-keys#api-keys-for-firebase-are-different)

### Salve estes valores:

Cada campo significa:

| Campo | Onde encontrar | Descrição |
|-------|---------------|-----------|
| `apiKey` | Gerado automaticamente pelo Firebase | Chave pública da API (
**não é secreta**, é segura para incluir no client) |
| `authDomain` | `{projectId}.firebaseapp.com` | Domínio de autenticação |
| `projectId` | ID do seu projeto Firebase | Identificador único do projeto |
| `storageBucket` | `{projectId}.appspot.com` | Bucket de armazenamento (não usado, mas obrigatório) |
| `messagingSenderId` | Gerado automaticamente | ID do remetente de notificações (não usado, mas obrigatório) |
| `appId` | Gerado automaticamente | ID único do seu app web |

---

## 3. Habilitar Authentication (Email/Senha)

No Console Firebase:

1. No menu lateral, clique em **Authentication** → **Sign-in method** (ou **Security → Authentication → Sign-in method**)
2. Localize o provedor **Email/Senha**
3. Clique no ícone de lápis (editar) ou no toggle para habilitar
4. Marque **Habilitar** e clique em **Salvar**

> **Documentação oficial**: [Firebase Authentication: Email/Password](https://firebase.google.com/docs/auth/web/password-auth#before-you-begin)

Configuração pronta. Seu projeto agora aceita login com email e senha.

### Tipos de usuário que vamos usar:

| Role | Descrição | Permissões |
|------|-----------|------------|
| `admin` | Administrador | Editar cardápio + gerenciar usuários |
| `operator` | Operador | Editar cardápio (não vê aba Usuários) |

> Os perfis de usuário (com role, displayName, etc.) são armazenados no Firestore na coleção `users`, não no Authentication. O Authentication serve apenas para validar email/senha.

---

## 4. Criar o Banco Firestore

No Console Firebase:

1. No menu lateral, clique em **Firestore Database** (ou **Databases & Storage → Firestore**)
2. Clique em **Criar banco de dados** (Create database)
3. Escolha **Modo de produção** (Production mode) — isso nega todo acesso por padrão
4. Selecione a região mais próxima:
   - **southamerica-east1** (São Paulo) → melhor latência para o Brasil
   - Caso não apareça, use **us-central1** (Iowa)
5. Clique em **Criar**

> **Documentação oficial**: [Create a Firestore database](https://firebase.google.com/docs/firestore/enterprise/create-databases)

Aguarde alguns segundos enquanto o Firebase provisiona o banco.

### Coleções que serão criadas automaticamente após a migração:

| Coleção | Descrição |
|---------|-----------|
| `menu` | Documentos representando seções do cardápio (Entradas, Prato Principal, etc.) |
| `users` | Perfis de usuários admin/operador (UID como nome do documento) |

### Índices necessários

O Firebase cria índices automaticamente para consultas simples. Você **não precisa** criar índices manualmente — quando a aplicação fizer a primeira consulta `orderBy('order')`, o Firebase exibirá um link para criar o índice automaticamente. Basta clicar em **Create index**.

---

## 5. Configurar as Regras de Segurança

As regras de segurança definem quem pode ler/escrever em cada coleção.

### No Console Firebase:

1. Vá para **Firestore Database** → aba **Rules** (ou Regras)
2. Substitua o conteúdo pelo código abaixo
3. Clique em **Publish**

> **Documentação oficial**: [Firestore Security Rules - Role-based access](https://firebase.google.com/docs/firestore/solutions/role-based-access)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: busca o perfil do usuário autenticado
    function userProfile() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    // Verifica se é admin
    function isAdmin() {
      return request.auth != null && userProfile().role == 'admin';
    }

    // Verifica se é operador
    function isOperator() {
      return request.auth != null && userProfile().role == 'operator';
    }

    // Verifica se é staff (admin ou operador)
    function isStaff() {
      return isAdmin() || isOperator();
    }

    // Cardápio (coleção "menu"):
    //   - leitura: qualquer pessoa (inclusive não logada)
    //   - escrita: apenas admin ou operador
    match /menu/{sectionId} {
      allow read: if true;
      allow create, update, delete: if isStaff();
    }

    // Usuários (coleção "users"):
    //   - leitura: qualquer staff (admin ou operador)
    //   - escrita: apenas admin
    //   - delete: NUNCA pelo client (usamos soft-delete: active: false)
    match /users/{userId} {
      allow read: if isStaff();
      allow create, update: if isAdmin();
      allow delete: if false;
    }
  }
}
```

### Como funcionam as regras:

1. **Público (clientes)**: pode ler o cardápio, mas não pode escrever
2. **Operador**: pode ler tudo e escrever no cardápio
3. **Admin**: pode ler tudo, escrever no cardápio E gerenciar usuários
4. **Ninguém pode excluir documentos da coleção `users`** pelo client — usa-se o campo `active: false` para "desativar" um usuário

---

## 6. Preencher as Variáveis no Projeto

Agora você vai colocar as credenciais no código.

### Arquivo: `js/firebase.js`

Abra o arquivo e substitua os placeholders pelos valores reais que você copiou na [Etapa 2](#2-obter-as-credenciais-de-configuração):

**Antes** (com placeholders):

```javascript
const firebaseConfig = {
  apiKey: "SUBSTITUIR_PELA_API_KEY",
  authDomain: "SUBSTITUIR_PELO_AUTH_DOMAIN",
  projectId: "SUBSTITUIR_PELO_PROJECT_ID",
  storageBucket: "SUBSTITUIR_PELO_STORAGE_BUCKET",
  messagingSenderId: "SUBSTITUIR_PELO_SENDER_ID",
  appId: "SUBSTITUIR_PELO_APP_ID"
};
```

**Depois** (com valores reais):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB_...abc123",
  authDomain: "bistro-recantinho-serra.firebaseapp.com",
  projectId: "bistro-recantinho-serra",
  storageBucket: "bistro-recantinho-serra.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

### NÃO é necessário configurar:

- **Variáveis de ambiente (.env)**: Não usamos — o Firebase SDK para web é configurado diretamente no código
- **Firebase CLI**: Não necessário para este projeto (caso use no futuro, instale com `npm install -g firebase-tools`)
- **Node.js no servidor**: Toda a integração é client-side

---

## 7. Migrar os Dados do Cardápio para o Firestore

Os dados atuais estão em `data/data.json`. Precisamos importá-los para o Firestore.

### Passo 1: Liberar regras temporariamente

Vá para **Firestore Database → Rules** e substitua temporariamente por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Clique em **Publish**.

> ⚠️ Isso libera acesso total. Faça apenas durante a migração e **restaure as regras** assim que terminar.

### Passo 2: Abrir a ferramenta de migração

Com o servidor local rodando (`npm run dev`), abra no navegador:

```
http://localhost:3000/migrate-to-firestore.html
```

### Passo 3: Executar a migração

1. Clique em **Iniciar Migração**
2. O script irá:
   - Ler `data/data.json`
   - Separar nomes com `<span>` em `name` + `description`
   - Criar cada seção como um documento na coleção `menu`
   - Manter a ordem original das seções

3. Ao final, você verá uma confirmação com o número de seções migradas

### Passo 4: Verificar no Console Firebase

Vá para **Firestore Database → Data** e confirme se as seções foram criadas corretamente.

### Passo 5: Restaurar as regras de segurança

Volte para **Rules** e cole novamente as regras da [Etapa 5](#5-configurar-as-regras-de-segurança). Clique em **Publish**.

### Passo 6: Limpeza

Após confirmar que está tudo funcionando:

- **Remova** o arquivo `migrate-to-firestore.html` (não precisará mais dele)
- **Remova ou renomeie** `data/data.json` (ex: `data/data.json.bak`)
- **Remova** `manage_availability.py` (foi substituído pelo painel admin)
- **Remova** `README_AVAILABILITY.md` (documentação obsoleta)

---

## 8. Criar o Primeiro Usuário Administrador

Para acessar o painel admin, você precisa de pelo menos um usuário com role `admin`.

### Método 1: Pelo Console Firebase (recomendado)

#### 8.1 Criar no Authentication

1. No Console Firebase, vá em **Authentication → Users**
2. Clique em **Add user** (Adicionar usuário)
3. Preencha:
   - **Email**: `admin@bistro.com` (use um email real)
   - **Password**: escolha uma senha forte
4. Clique em **Add user**
5. Copie o **User UID** gerado (um identificador como `abc123...`)

#### 8.2 Criar o perfil no Firestore

1. Vá para **Firestore Database → Data**
2. Na coleção `users`, clique em **Add document** (Adicionar documento)
3. No campo **Document ID**, cole o **User UID** que você copiou
4. Adicione os campos:

| Campo | Tipo | Valor |
|-------|------|-------|
| `email` | `string` | `admin@bistro.com` |
| `role` | `string` | `admin` |
| `displayName` | `string` | `Administrador` |
| `active` | `boolean` | `true` |
| `createdAt` | `timestamp` | clicar em "Add field" → selecionar tipo `timestamp` → clicar em "Set" (deixa vazio, o servidor preenche) |

5. Clique em **Save**

### Método 2: Pelo painel admin (após ter um admin)

Depois que já existir pelo menos um admin no sistema, os demais usuários podem ser criados pelo próprio painel admin (admin.html → aba Usuários → Novo Usuário).

---

## 9. Verificar a Integração

### 9.1 Testar a página pública

Acesse `http://localhost:3000/` — o cardápio deve carregar normalmente, agora lendo do Firestore.

- ✅ Itens aparecem com nomes limpos (sem `<span>`)
- ✅ Descrições aparecem separadamente
- ✅ Filtros funcionam
- ✅ Carrinho funciona
- ✅ Finalizar pedido → WhatsApp funciona

### 9.2 Testar o login

Acesse `http://localhost:3000/login.html`

- ✅ Formulário de login aparece
- ✅ Tentar logar com credenciais inválidas → mostra erro em português
- ✅ Logar com admin@bistro.com → redireciona para admin.html

### 9.3 Testar o painel admin

Acesse `http://localhost:3000/admin.html`

- ✅ Seções e itens do cardápio aparecem
- ✅ Pode editar nome, descrição, preço de um item
- ✅ Pode alternar disponibilidade (toggle verde/vermelho)
- ✅ Pode adicionar novo item
- ✅ Pode adicionar nova seção
- ✅ Aba Usuários visível apenas para admin
- ✅ Pode criar novo usuário
- ✅ Pode desativar/reativar usuário

### 9.4 Testar o offline

1. Abra a página pública com internet
2. Desconecte a internet (Wi-Fi desligado)
3. Recarregue a página
4. ✅ O cardápio ainda aparece (Firestore offline persistence via IndexedDB)

---

## 10. Manutenção e Próximos Passos

### Atualizar o Service Worker

Se você modificar arquivos do projeto, lembre-se de incrementar a versão do cache em `sw.js`:

```javascript
const CACHE_NAME = 'bistro-recantinho-v3';  // incrementar
```

### Alterar regras de segurança

Sempre que precisar ajustar as regras do Firestore:
- Acesse: Console Firebase → Firestore Database → Rules
- Edite e clique em **Publish**
- As alterações levam até 1 minuto para entrar em vigor

### Gerenciar usuários desativados

Usuários com `active: false` no Firestore não conseguem fazer login. Para reativar:
- Pelo painel admin em admin.html (aba Usuários → Reativar)

### Migrar para Firebase Hosting (opcional)

Se quiser migrar do GitHub Pages para Firebase Hosting no futuro:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

Isso daria deploy automático e melhor integração com os outros serviços Firebase.

---

## 11. Referências Oficiais Firebase

| Documentação | Link |
|-------------|------|
| Firebase Web Setup | https://firebase.google.com/docs/web/setup |
| Firebase Auth (Email/Senha) | https://firebase.google.com/docs/auth/web/password-auth |
| Firestore Security Rules | https://firebase.google.com/docs/firestore/security/overview |
| Firestore Role-based Access | https://firebase.google.com/docs/firestore/solutions/role-based-access |
| Firestore Offline Persistence | https://firebase.google.com/docs/firestore/manage-data/enable-offline |
| Firestore Security Rules Reference | https://firebase.google.com/docs/reference/rules |
| Firebase Auth REST API | https://firebase.google.com/docs/reference/rest/auth |
| Firebase Console | https://console.firebase.google.com |
| CDN Firebase SDK (última versão) | https://www.gstatic.com/firebasejs/releases.json |

### Troubleshooting

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| "Firebase: Error (auth/invalid-credential)" | Email ou senha incorretos | Verifique se o Authentication está habilitado e as credenciais estão corretas |
| "Missing or insufficient permissions" | Regras de segurança bloqueando | Verifique se as regras estão configuradas corretamente (Etapa 5) |
| "The query requires an index" | Falta índice no Firestore | Clique no link da mensagem de erro para criar automaticamente |
| Cardápio vazio (sem itens) | Migração não executada | Execute `migrate-to-firestore.html` (Etapa 7) |
| `db is not defined` | `firebase.js` não carregado | Verifique se `firebase.js` está na pasta `js/` e se os scripts estão na ordem correta |
| Usuário logado não consegue acessar admin | Perfil não existe no Firestore | Crie o documento do usuário na coleção `users` (Etapa 8) |
| "This account has been deactivated" | Usuário com `active: false` | Reative pelo painel admin ou diretamente no Firestore |

---

> **Arquivo gerado em**: Julho 2026
> **Versão do Firebase SDK**: 12.16.0 (compat mode)
> **Próxima atualização recomendada**: Verificar versão mais recente em https://www.gstatic.com/firebasejs/releases.json
