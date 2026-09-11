-- ================================================================
-- Love Story Capture — Add youtube_url to albums
-- Safe to re-run (idempotent via IF NOT EXISTS).
-- ================================================================

ALTER TABLE public.albums
  ADD COLUMN IF NOT EXISTS youtube_url text NOT NULL DEFAULT '';
