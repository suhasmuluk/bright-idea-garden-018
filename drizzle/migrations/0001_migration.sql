CREATE POLICY "staff read photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'idol-photos');
CREATE POLICY "staff upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'idol-photos');
CREATE POLICY "staff update photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'idol-photos');
CREATE POLICY "staff delete photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'idol-photos');