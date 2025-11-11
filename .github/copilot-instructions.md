# Copilot instructions for this project

Project type: static PWA (HTML + Tailwind via CDN + Alpine.js) that renders a menu from JSON and supports cart + WhatsApp ordering with offline capability.

## Big picture
- Entry point: `index.html` mounts Alpine with `x-data="menuApp()"` and includes `js/app.js`, `css/styles.css`.
- UI is declarative with Alpine directives (`x-data`, `x-init`, `x-show`, `x-model`, `x-for`, `@click`) and Tailwind utility classes. Brand colors are injected via an inline `tailwind.config` script in `index.html`.
- Data source: `data/data.json` (array of sections). The app fetches it on `init()` and keeps derived state in memory and `localStorage`.
- Cart + user info live in `localStorage` under keys: `favorites`, `cart`, `user`.
- Order flow opens WhatsApp with a prefilled message built from the cart and user data.
- **PWA**: Installable app with offline support via Service Worker (`sw.js`) and manifest (`manifest.json`).

## Responsive architecture
- **Mobile-first**: Single column layout with sticky header, floating cart button, bottom sheet modals.
- **Desktop (≥1024px)**: 
  - Sticky sidebar (3 cols) with quick navigation + cart summary
  - Main content area (9 cols) with 2-column item grid
  - Rounded floating header (`lg:rounded-2xl`, `lg:top-4`, `lg:mx-4`)
  - Cart button hidden (uses sidebar instead)
  - Smooth scroll with `scroll-padding-top: 140px`

## Data model (data/data.json)
- Section: `{ id: string, title: string, type: 'food'|'drinks', items: Item[] }`.
- Item: `{ name: string, price: string }`. `name` may include an embedded HTML `<span class="item-description">…</span>` used for a secondary line in the UI. `price` can be the sentinel string `[Preço Vazio]` to hide price and disable add-to-cart.
- Filtering: header buttons set `activeFilter` to `all|food|drinks`; search matches `item.name` (case-insensitive substring); "Favoritos" uses the `favorites` array of item names.

## State + key functions (see `js/app.js`)
- Lifecycle: `init()` fetches `data/data.json`, restores `favorites`, `cart`, `user` from `localStorage`, shows a brief loading screen (≥800ms).
- Computed: `filteredSections` applies filter/search/favorites; `cartTotal` parses `item.price` in `"R$ 12,34"` format; `cartItemCount` sums quantities; `isUserIdentified` checks `user.name` and `user.address`.
- Cart: `addToCart(item, sectionTitle)`, `removeFromCart(name)`, `updateQuantity(name, +/-1)`, `getItemQuantity(name)`, `saveCart()`, `clearCart()`.
- Favorites: `toggleFavorite(name)`, `isFavorite(name)`.
- UX helpers: `scrollToSection(id)` expects DOM ids in the form `section-<id>` (see `index.html`).
- Ordering: `finalizarPedido()` -> `enviarPedido()` builds a message (`gerarMensagemPedido()`) and opens `https://wa.me/<numero>?text=...`. Update `numeroWhatsApp` in `js/app.js` with the real number (international format without `+`).

## Conventions and patterns
- **Brand tokens**: use Tailwind classes with custom colors: `brand-primary` (#8B3A3A), `brand-dark` (#3D2417), `brand-wood` (#8B6239), `brand-beige` (#F5F0E8), `brand-cream` (#E8DCC8), `brand-maroon` (#6B2C2C) - configured inline in `index.html`.
- **Animations**: Custom keyframes in `css/styles.css`: `cartPulse` (floating cart button), `bounceSubtle` (cart badge), `logoFloat` (loading screen), `fadeIn`.
- **Data first**: UI iterates over `filteredSections` via `x-for`. Add/rename JSON fields only if you also update the corresponding bindings/logic in `js/app.js` and templates in `index.html`.
- **Item descriptions**: belong inside the `name` field as a `<span class="item-description">…</span>`; the UI splits by `<span` to produce title vs. subtitle.
- **Missing prices**: set `price` to `[Preço Vazio]` to hide badges and action buttons for that item.

## PWA setup (Progressive Web App)
- **Manifest** (`manifest.json`): App metadata, icons (SVG + PNG), theme colors, shortcuts.
- **Service Worker** (`sw.js`): Caches HTML, CSS, JS, JSON, fonts, CDNs. Network-first strategy with cache fallback. Update `CACHE_NAME` when deploying changes.
- **Icons**: 
  - `favicon.svg` (32x32) - browser tab
  - `assets/icon.svg` (512x512) - PWA icon with gradient, textures, "R" monogram
  - `assets/logo.PNG` - fallback PNG
- **Install prompt**: Auto-displays on mobile via `beforeinstallprompt` event, handled by Alpine component in `index.html`.

## Local development
- **MUST use HTTP server** (not `file://`) for `fetch()` and Service Worker to work. Use VS Code Live Server, `npx serve`, or `npx http-server` from workspace root.
- Open `index.html` in the browser. Use DevTools console for Alpine state inspection and debugging.
- **Testing PWA**: Chrome DevTools > Application > Manifest/Service Workers. Run Lighthouse audit for PWA score.

## Examples
- Add a new section in `data/data.json`:
  ```json
  { "id": "sucos-especiais", "title": "Sucos Especiais", "type": "drinks", "items": [ { "name": "Laranja com Gengibre<span class=\"item-description\">(natural)</span>", "price": "R$ 12,00" } ] }
  ```
- Disable purchase for an item with unknown price: `{ "name": "Espumante Reserva", "price": "[Preço Vazio]" }`.
- Update WhatsApp target: edit `const numeroWhatsApp = '55XXXXXXXXXXX'` in `js/app.js`.
- Update PWA cache: increment version in `sw.js`: `const CACHE_NAME = 'bistro-recantinho-v2';`

## Gotchas
- Currency parsing assumes `"R$ xx,yy"` with comma decimals; keep this format in JSON.
- IDs used for in-page navigation must match `id` in JSON and the `section-<id>` pattern in the DOM.
- LocalStorage payloads are plain JSON arrays/objects; changing shapes requires migration or defensive parsing.
- Service Worker requires HTTPS in production (localhost works without).
- Tailwind breakpoint `lg` = 1024px; all desktop-specific classes use `lg:` prefix.
- Floating header on desktop uses `sticky top-4` with margins; adjust `scroll-padding-top` in CSS if changing header height.
