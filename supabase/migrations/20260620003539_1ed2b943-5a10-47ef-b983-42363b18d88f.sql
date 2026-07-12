
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  home_country TEXT NOT NULL,
  home_city TEXT,
  current_country TEXT NOT NULL,
  current_city TEXT,
  university TEXT,
  instagram TEXT,
  linkedin TEXT,
  whatsapp TEXT,
  twitter TEXT,
  website TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT SELECT ON public.communities TO anon;
GRANT ALL ON public.communities TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Communities are viewable by everyone"
  ON public.communities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated users can create communities"
  ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update their communities"
  ON public.communities FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete their communities"
  ON public.communities FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TABLE public.community_members (
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable by authenticated users"
  ON public.community_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.communities (id, code, name, description, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'global',
  'Global Students',
  'The default community for every international student.',
  NULL
);

ALTER TABLE public.profiles ADD COLUMN arrival_date DATE;
ALTER TABLE public.profiles ADD COLUMN is_buddy BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN major TEXT;
ALTER TABLE public.profiles ADD COLUMN study_interests TEXT;

CREATE TABLE public.marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT,
  contact_info TEXT NOT NULL,
  current_city TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace TO authenticated;
ALTER TABLE public.marketplace ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketplace items are viewable by everyone" ON public.marketplace FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create marketplace items" ON public.marketplace FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their marketplace items" ON public.marketplace FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their marketplace items" ON public.marketplace FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  home_country TEXT NOT NULL,
  current_country TEXT NOT NULL,
  current_city TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  link TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suggestions TO authenticated;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suggestions are viewable by authenticated users" ON public.suggestions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create suggestions" ON public.suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update suggestions" ON public.suggestions FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE TABLE public.votes (
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (suggestion_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.votes TO authenticated;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by authenticated users" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their vote" ON public.votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

