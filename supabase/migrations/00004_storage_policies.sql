-- Storage policies para o bucket público menu-items
-- Upload/List/Delete apenas para usuários autenticados (operadores/admins).
-- Download público (bucket public) — o remove() do client exige SELECT + DELETE.

-- Select (necessário para list/remove no client SDK)
DROP POLICY IF EXISTS "menu-items: authenticated select" ON storage.objects;
CREATE POLICY "menu-items: authenticated select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'menu-items');

-- Upload
DROP POLICY IF EXISTS "menu-items: authenticated upload" ON storage.objects;
CREATE POLICY "menu-items: authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-items');

-- Delete
DROP POLICY IF EXISTS "menu-items: authenticated delete" ON storage.objects;
CREATE POLICY "menu-items: authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-items');
