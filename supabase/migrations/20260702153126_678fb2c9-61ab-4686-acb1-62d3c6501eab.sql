
CREATE TABLE public.study_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  pdf_name TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_rooms TO authenticated;
GRANT ALL ON public.study_rooms TO service_role;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select" ON public.study_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "rooms_insert" ON public.study_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "rooms_delete" ON public.study_rooms FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE INDEX idx_study_rooms_code ON public.study_rooms(code);

CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('chat','question','answer')),
  content TEXT NOT NULL,
  meta JSONB,
  reply_to UUID REFERENCES public.room_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_select" ON public.room_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "msg_insert" ON public.room_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "msg_delete" ON public.room_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_room_messages_room ON public.room_messages(room_id, created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
