-- Replies should publish immediately (no approval queue).
-- Posts remain approval-gated.

ALTER TABLE public.connection_replies ALTER COLUMN moderation_status SET DEFAULT 'approved';

DROP POLICY IF EXISTS "Authenticated can insert connection_replies" ON public.connection_replies;
CREATE POLICY "Authenticated can insert connection_replies"
  ON public.connection_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND moderation_status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM public.connection_posts p
      WHERE p.id = post_id
        AND p.moderation_status = 'approved'
    )
    AND EXISTS (
      SELECT 1
      FROM public.connection_user_moderation m
      WHERE m.user_id = auth.uid()
        AND m.is_removed = true
    ) IS NOT TRUE
  );

DROP POLICY IF EXISTS "Users can update own pending connection_replies" ON public.connection_replies;
CREATE POLICY "Users can update own approved connection_replies"
  ON public.connection_replies FOR UPDATE
  USING (auth.uid() = user_id AND moderation_status = 'approved')
  WITH CHECK (auth.uid() = user_id AND moderation_status = 'approved');

DROP POLICY IF EXISTS "Users can delete own pending connection_replies" ON public.connection_replies;
CREATE POLICY "Users can delete own approved connection_replies"
  ON public.connection_replies FOR DELETE
  USING (auth.uid() = user_id AND moderation_status = 'approved');
