-- Create storage buckets (run in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('illustrations', 'illustrations', true);

-- Allow public read access
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Service role upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Service role update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Public read illustrations" ON storage.objects FOR SELECT USING (bucket_id = 'illustrations');
CREATE POLICY "Service role upload illustrations" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'illustrations');
CREATE POLICY "Service role update illustrations" ON storage.objects FOR UPDATE USING (bucket_id = 'illustrations');
