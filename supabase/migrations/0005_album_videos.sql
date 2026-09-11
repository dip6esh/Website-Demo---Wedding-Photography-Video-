-- ================================================================
-- Love Story Capture — album_videos table
-- Each album can have multiple YouTube videos.
-- One video per album can be marked is_featured = true
-- for display on the home page (enforced at app level).
-- ================================================================

CREATE TABLE IF NOT EXISTS public.album_videos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id    uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  youtube_url text NOT NULL DEFAULT '',
  title       text NOT NULL DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS album_videos_album_id_idx ON public.album_videos (album_id);
CREATE INDEX IF NOT EXISTS album_videos_featured_idx ON public.album_videos (is_featured) WHERE is_featured = true;
