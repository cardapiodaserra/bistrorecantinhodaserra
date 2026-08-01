#!/usr/bin/env bash
# Bootstrap de usuários de DEV para o Supabase local.
# Roda APÓS `supabase db reset` (o reset apaga auth.users, mas não recria usuários).
#
# Uso: bash supabase/bootstrap-dev-users.sh
set -euo pipefail

API_URL="http://127.0.0.1:54321"
SECRET_KEY=$(supabase status -o env 2>/dev/null | grep '^SERVICE_ROLE_KEY=' | cut -d= -f2- | tr -d '"' || true)

if [[ -z "$SECRET_KEY" ]]; then
  echo "ERRO: não foi possível obter a service_role key. O stack está rodando? (supabase start)" >&2
  exit 1
fi

create_user() {
  local email="$1" password="$2" name="$3"
  curl -s -X POST "$API_URL/auth/v1/admin/users" \
    -H "apikey: $SECRET_KEY" \
    -H "Authorization: Bearer $SECRET_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"email_confirm\":true,\"user_metadata\":{\"display_name\":\"$name\"}}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id') or 'EXISTS')" || echo "EXISTS"
}

echo "== Criando admin =="
create_user "admin@bistro.com" "admin123" "Administrador"
echo "== Promovendo admin =="
docker exec supabase_db_bistrorecantinhodaserra psql -U postgres -d postgres \
  -c "update public.profiles set role='admin' where email='admin@bistro.com';" >/dev/null 2>&1

echo "== Criando operador (via Edge Function) =="
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SECRET_KEY" -H "Content-Type: application/json" \
  -d '{"email":"admin@bistro.com","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl -s -X POST "$API_URL/functions/v1/create-user" \
  -H "apikey: $SECRET_KEY" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"operador@bistro.com","password":"operador123","displayName":"Operador Teste","role":"operator"}' >/dev/null || echo "operador já existe"

echo "== Usuários criados =="
docker exec supabase_db_bistrorecantinhodaserra psql -U postgres -d postgres -c "select email, role, active from public.profiles;"
echo
echo "Login admin: admin@bistro.com / admin123"
echo "Login operador: operador@bistro.com / operador123"
