-- Shared community categories:
-- - Any authenticated user can add categories.
-- - Users can view/delete only their own categories.
-- - The "all" category is visible to everyone and cannot be deleted.

CREATE TABLE IF NOT EXISTS public.connection_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connection_categories_name_length CHECK (char_length(trim(name)) BETWEEN 2 AND 60)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_connection_categories_name_unique
  ON public.connection_categories (lower(trim(name)));

INSERT INTO public.connection_categories (name)
VALUES ('all')
ON CONFLICT ((lower(trim(name)))) DO NOTHING;

ALTER TABLE public.connection_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view connection_categories" ON public.connection_categories;
CREATE POLICY "Authenticated users can view connection_categories"
  ON public.connection_categories FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      created_by = auth.uid()
      OR lower(trim(name)) = 'all'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert connection_categories" ON public.connection_categories;
CREATE POLICY "Authenticated users can insert connection_categories"
  ON public.connection_categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own connection_categories" ON public.connection_categories;
CREATE POLICY "Users can delete own connection_categories"
  ON public.connection_categories FOR DELETE
  USING (
    lower(trim(name)) <> 'all'
    AND created_by = auth.uid()
  );
