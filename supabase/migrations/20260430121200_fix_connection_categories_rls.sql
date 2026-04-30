-- Fix category delete/visibility behavior after initial rollout.
-- This migration is safe to run even if older policies already exist.

-- Ensure the default shared category exists.
INSERT INTO public.connection_categories (name)
VALUES ('all')
ON CONFLICT ((lower(trim(name)))) DO NOTHING;

ALTER TABLE public.connection_categories ENABLE ROW LEVEL SECURITY;

-- Recreate policies with the final intended behavior:
-- - Users can see their own categories + "all"
-- - Users can insert only rows owned by themselves
-- - Users can delete only their own categories, never "all"
DROP POLICY IF EXISTS "Authenticated users can view connection_categories" ON public.connection_categories;
DROP POLICY IF EXISTS "Authenticated users can insert connection_categories" ON public.connection_categories;
DROP POLICY IF EXISTS "Admins can delete connection_categories" ON public.connection_categories;
DROP POLICY IF EXISTS "Users can delete own connection_categories" ON public.connection_categories;

CREATE POLICY "Authenticated users can view connection_categories"
  ON public.connection_categories FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      created_by = auth.uid()
      OR lower(trim(name)) = 'all'
    )
  );

CREATE POLICY "Authenticated users can insert connection_categories"
  ON public.connection_categories FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can delete own connection_categories"
  ON public.connection_categories FOR DELETE
  USING (
    created_by = auth.uid()
    AND lower(trim(name)) <> 'all'
  );
