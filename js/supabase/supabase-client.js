// Cliente Supabase — Bistrô Recantinho da Serra
// Substitui js/firebase.js quando o backend Supabase está em uso.
//
// Dev local: http://127.0.0.1:54321 (supabase start)
// Cloud: URL e anon key do projeto Supabase hospedado.

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// O SDK CDN já declara o global `supabase` no escopo global (fábrica com createClient).
// Em vez de redeclarar (causaria SyntaxError), REUTILIZAMOS o mesmo global atribuindo
// a instância do cliente a ele. Os services (menu/auth/storage) usam `supabase.from()`
// etc., que agora aponta para a instância do cliente.
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
