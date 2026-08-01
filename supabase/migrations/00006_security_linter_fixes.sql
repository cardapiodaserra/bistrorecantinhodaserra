-- ====== Correções de warnings do Security Advisor ======
-- Lint 0025: restringe a policy SELECT do bucket público apenas à operação
--            de delete. O Storage `remove()` consulta storage.objects (SELECT)
--            internamente antes de apagar, mas não devemos permitir listar.
--            storage.allow_only_operation('object.delete') bloqueia o listing.
-- Lint 0028/0029: functions SECURITY DEFINER com EXECUTE desnecessário.

-- 1. Bucket público menu-items: SELECT só para a operação object.delete.
--    (URL pública já garante leitura; listing fica bloqueado.)
DROP POLICY IF EXISTS "menu-items: authenticated select" ON storage.objects;
CREATE POLICY "menu-items: authenticated select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'menu-items' AND storage.allow_only_operation('object.delete'));

-- 2. handle_new_user é função de trigger — dispara automaticamente em
--    INSERT em auth.users, não precisa de EXECUTE para nenhum papel.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 3. is_admin é usada nas RLS policies de profiles. anon não lê profiles
--    (sem GRANT SELECT + RLS), então não precisa executá-la.
--    authenticated mantém EXECUTE porque as policies dependem da função.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4. first_admin_pending é consultada por login.html/setup.html DESLOGADOS
--    (anon). Usuários autenticados são redirecionados a admin.html.
--    IMPORTANTE: revogar também PUBLIC (grantee '=X') — authenticated é
--    membro de PUBLIC e herdaria EXECUTE mesmo sem grant explícito.
REVOKE ALL ON FUNCTION public.first_admin_pending() FROM PUBLIC, authenticated;
