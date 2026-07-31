# AGENTS.md — Bistrô Recantinho da Serra

## Dev

```
npm run dev          # http-server . -p 3000 -c-1
npm run build:css    # Tailwind v4 → css/tailwind/output.css (minified)
npm run watch:css    # Tailwind v4 watch mode (auto-rebuild on CSS changes)
```

Never open `file://` — `fetch()`, Service Worker, and Firebase SDK require HTTP.

## Pages

| Path | Role |
|------|------|
| `index.html` | Public menu (Alpine.js app, reads Firestore) |
| `login.html` | Admin/operator login |
| `admin.html` | Dashboard: menu CRUD + user management (admin only) |

Entrypoint: `index.html` → `x-data="menuApp()" x-init="init()"` → Alpine component in `js/app.js`.

## Firebase integration

Config lives in `js/firebase.js` — project `bistrorecantinhodaserra-730b4`.

Services in use:
- **Auth**: Email/password via `js/auth.js` (`authService` object)
- **Firestore**: Collection `menu` (sections with `items[]`), collection `users` (profiles with `role: "admin"|"operator"`)
- **Storage**: Item images via `js/storage-service.js` (`storageService` object) — path: `menu-items/{sectionId}/{timestamp}.ext`

## Data model

Cards are in Firestore collection `menu`, NOT `data/data.json` (migration done).

```
menu/{sectionId}
  id: string, title: string, type: "food"|"drinks", order: number
  items: [{ name, description (null|string), price ("R$ 12,34"|"[Preço Vazio]"), image (null|string), available: bool }]
```

Items no longer use `<span class="item-description">` in `name` — `description` is a separate field.

Currency format: `R$ 12,34` (comma decimal). Sentinel `[Preço Vazio]` hides price/add-to-cart.

`localStorage` keys: `favorites` (item names array), `cart` ({ name, price, category, quantity }[]), `user` ({ name, address, phone }).

## Admin panel quirks

- `isAdmin` in the Alpine component is a **reactive property** set explicitly in `init()`, not a getter reading `authService.state` (Alpine doesn't track external objects).
- Auth state listener: `authService.init()` → poll `authService.state.loading` until false, THEN read `userProfile`.
- User creation uses Firebase Auth REST API (`identitytoolkit.googleapis.com/v1/accounts:signUp`) — does NOT affect current session.
- Soft-delete for users: set `active: false` in Firestore (not Auth deletion).

## PWA

- `sw.js`: network-first, `CACHE_NAME` must be **incremented** on every deploy.
- Firestore offline persistence replaces cached `data.json` — no JSON in SW cache.
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
| `js/firebase.js` | Firebase init with `enablePersistence()` |
| `js/auth.js` | `authService`: login, logout, create/deactivate/list users |
| `js/menu-service.js` | `menuService`: `fetchSections`, `saveSection`, `deleteSection` |
| `js/storage-service.js` | `storageService`: `uploadItemImage`, `deleteImage` |
| `js/app.js` | Public menu Alpine component |
| `login.html` | Login form, Alpine `loginApp()` |
| `admin.html` | Admin dashboard, Alpine `adminApp()` |
| `sw.js` | Service Worker, bump `CACHE_NAME` on deploy |

## Gotchas

- **Do NOT** use `authService.isAdmin` as an Alpine getter — Alpine can't react to external object changes. Set `this.isAdmin` explicitly in `init()`.
- **Do NOT** return early from `onAuthStateChanged` without setting `loading = false` — hangs the admin's auth poll loop.
- `data/data.json` is a historical artifact. Changes to the menu must go through Firestore.
- Tailwind is **precompiled** to `css/tailwind/output.css` — edit `input.css` then run `./tailwindcss-build.sh` to regenerate.
- Alpine.js is loaded from local copy + CDN fallback (both `defer`). The CDN version wins if both load.
