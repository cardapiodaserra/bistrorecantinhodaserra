-- RPC pública: verifica se ainda NÃO existe nenhum admin ativo.
-- Usada pelo login.html para decidir se exibe o link de primeiro acesso (setup).
-- SECURITY DEFINER ignora RLS (profiles não é legível por anon).
CREATE OR REPLACE FUNCTION public.first_admin_pending()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.role = 'admin' AND p.active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.first_admin_pending() TO anon;
GRANT EXECUTE ON FUNCTION public.first_admin_pending() TO authenticated;
