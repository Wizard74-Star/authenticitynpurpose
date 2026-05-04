-- Optional nickname shown on the community board (not legal / account name).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS community_display_name text;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_community_display_name_length;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_community_display_name_length CHECK (
  community_display_name IS NULL
  OR (char_length(trim(community_display_name)) BETWEEN 2 AND 40)
);
