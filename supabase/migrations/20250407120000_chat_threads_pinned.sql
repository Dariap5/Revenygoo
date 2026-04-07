-- Pin state for chat threads (server-side; replaces session-only pins for persisted threads)
ALTER TABLE public.chat_threads
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.chat_threads.pinned IS 'User preference: show thread at top of history when true';
