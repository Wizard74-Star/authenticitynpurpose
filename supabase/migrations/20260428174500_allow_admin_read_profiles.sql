-- Allow admins to read profiles so moderation UI can show usernames
-- instead of only raw user IDs.

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  );
