-- ====== Row Level Security (RLS) ======
-- Substitui as regras do Firestore.

-- ====== sections ======
-- Leitura pública (cardápio é público).
-- Escrita apenas para usuários autenticados (operadores e admins).
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sections_public_read" ON public.sections;
CREATE POLICY "sections_public_read"
  ON public.sections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "sections_authenticated_write" ON public.sections;
CREATE POLICY "sections_authenticated_write"
  ON public.sections FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ====== profiles ======
-- Usuários autenticados podem ler o próprio perfil.
-- Apenas admins podem gerenciar todos os perfis.
-- A checagem de admin usa SECURITY DEFINER (plpgsql para evitar inlining/recursão).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' AND p.active = true
  );
END;
$$;

DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
CREATE POLICY "profiles_read_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====== GRANTs ======
-- Anon: leitura das seções (cardápio público).
-- Authenticated: CRUD completo nas seções.
-- Profiles: leitura própria (todos), UPDATE/DELETE restrito a admins pela policy
--           `profiles_admin_all` (is_admin). Criação via trigger handle_new_user
--           + Edge Function create-user (service_role).
GRANT SELECT ON public.sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
