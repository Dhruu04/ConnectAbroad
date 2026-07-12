import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Save, User, Compass, MessageCircle, Globe, ArrowUpRight, Sparkles, Home, MapPin, ChefHat, Languages, GraduationCap, Upload } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { COUNTRIES, codeFor } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    home_country: "",
    home_city: "",
    current_country: "",
    current_city: "",
    university: "",
    bio: "",
    avatar_url: "",
    instagram: "",
    linkedin: "",
    whatsapp: "",
    twitter: "",
    website: "",
    favorite_dish: "",
    languages_spoken: "",
    languages_learning: "",
    arrival_date: "",
    is_buddy: false,
    major: "",
    study_interests: "",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Image must be under 1.5MB to save offline");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, avatar_url: reader.result as string }));
      toast.success("Photo uploaded successfully!");
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setForm({
          name: data.name ?? "",
          home_country: data.home_country ?? "",
          home_city: data.home_city ?? "",
          current_country: data.current_country ?? "",
          current_city: data.current_city ?? "",
          university: data.university ?? "",
          bio: data.bio ?? "",
          avatar_url: data.avatar_url ?? "",
          instagram: data.instagram ?? "",
          linkedin: data.linkedin ?? "",
          whatsapp: data.whatsapp ?? "",
          twitter: data.twitter ?? "",
          website: data.website ?? "",
          favorite_dish: data.favorite_dish ?? "",
          languages_spoken: data.languages_spoken ?? "",
          languages_learning: data.languages_learning ?? "",
          arrival_date: data.arrival_date ?? "",
          is_buddy: data.is_buddy ?? false,
          major: data.major ?? "",
          study_interests: data.study_interests ?? "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...form, onboarded: true });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground animate-pulse">
        Loading…
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />
      
      <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-8 animate-scale-in">
        {/* Header summary */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent/15">
              <User className="size-4" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
              Your profile pin
            </span>
          </div>
          <h1 className="font-display mt-2 text-3xl md:text-4xl uppercase">Edit Profile details</h1>
          <p className="text-sm text-muted-foreground">
            Customize how other international students see you on the dashboard.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Real-time Card Preview (Sticky on desktop) */}
          <div className="md:col-span-5 space-y-6 md:sticky md:top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Real-time Card Preview</p>
            <ProfilePreviewCard p={form} />
            <div className="rounded-2xl border border-dashed border-border p-4 bg-surface text-center">
              <p className="text-xs text-muted-foreground">
                This is how you will appear to other students. All changes update instantly in the preview.
              </p>
            </div>
          </div>

          {/* Right Column: Editable Form Fields */}
          <div className="md:col-span-7 rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">Edit details</p>
            
            <div className="space-y-4">
              <Row label="Name">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="input transition-all duration-300 focus:shadow-md"
                />
              </Row>
              <Row label="Profile photo">
                <div className="flex items-center gap-4 mt-1">
                  {form.avatar_url && (
                    <img 
                      src={form.avatar_url} 
                      alt="Preview" 
                      className="size-14 rounded-2xl object-cover border border-border animate-fade-in"
                    />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold uppercase tracking-wider hover:bg-accent-soft/30 hover:text-foreground cursor-pointer transition-all duration-300">
                    <Upload className="size-4 text-accent" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {form.avatar_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, avatar_url: "" })}
                      className="text-xs font-bold uppercase text-red-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </Row>
              <Row label="Bio">
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us a little bit about yourself, interests, etc..."
                  rows={2}
                  className="input resize-none transition-all duration-300 focus:shadow-md"
                />
              </Row>

              <SectionTitle>From (Hometown)</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Row label="Home country">
                  <CountrySelect
                    value={form.home_country}
                    onChange={(v) => setForm({ ...form, home_country: v })}
                  />
                </Row>
                <Row label="Home city / state">
                  <input
                    value={form.home_city}
                    onChange={(e) => setForm({ ...form, home_city: e.target.value })}
                    placeholder="e.g. Mumbai, São Paulo"
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
              </div>

              <SectionTitle>Now (Current Location)</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Row label="Current country">
                  <CountrySelect
                    value={form.current_country}
                    onChange={(v) => setForm({ ...form, current_country: v })}
                  />
                </Row>
                <Row label="Current city">
                  <input
                    value={form.current_city}
                    onChange={(e) => setForm({ ...form, current_city: e.target.value })}
                    placeholder="e.g. Berlin, Boston"
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
              </div>
              <Row label="University">
                <input
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                  placeholder="e.g. TU Berlin, Harvard University"
                  className="input transition-all duration-300 focus:shadow-md"
                />
              </Row>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Row label="Major / Course of Study">
                  <input
                    value={form.major}
                    onChange={(e) => setForm({ ...form, major: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
                <Row label="When did you arrive?">
                  <input
                    type="date"
                    value={form.arrival_date}
                    onChange={(e) => setForm({ ...form, arrival_date: e.target.value })}
                    className="input transition-all duration-300 focus:shadow-md cursor-pointer"
                  />
                </Row>
              </div>

              <SectionTitle>Socialize & Language Tandem</SectionTitle>
              <Row label="Favorite Hometown Dish (for Cook-Off Swaps)">
                <input
                  value={form.favorite_dish}
                  onChange={(e) => setForm({ ...form, favorite_dish: e.target.value })}
                  placeholder="e.g. Biryani, Feijoada, Tacos"
                  className="input transition-all duration-300 focus:shadow-md"
                />
              </Row>
              <Row label="Study Interests (for Study Group Matching)">
                <input
                  value={form.study_interests}
                  onChange={(e) => setForm({ ...form, study_interests: e.target.value })}
                  placeholder="e.g. Algorithms, Machine Learning, Exam prep"
                  className="input transition-all duration-300 focus:shadow-md"
                />
              </Row>
              <div className="flex items-center gap-3.5 mt-2 p-4 rounded-2xl bg-accent-soft/30 border border-accent/15">
                <input
                  type="checkbox"
                  id="is_buddy"
                  checked={form.is_buddy}
                  onChange={(e) => setForm({ ...form, is_buddy: e.target.checked })}
                  className="size-4.5 rounded border-border text-accent focus:ring-accent cursor-pointer"
                />
                <label htmlFor="is_buddy" className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">
                  Volunteer as a Senior Buddy / Mentor
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Row label="Languages you speak natively">
                  <input
                    value={form.languages_spoken}
                    onChange={(e) => setForm({ ...form, languages_spoken: e.target.value })}
                    placeholder="e.g. Spanish, Portuguese, English"
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
                <Row label="Languages you want to practice">
                  <input
                    value={form.languages_learning}
                    onChange={(e) => setForm({ ...form, languages_learning: e.target.value })}
                    placeholder="e.g. German, French"
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
              </div>

              <SectionTitle>Connect (Social Media Handles)</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Row label="Instagram">
                  <input
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    placeholder="@handle"
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
                <Row label="LinkedIn">
                  <input
                    value={form.linkedin}
                    onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                    placeholder="username"
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
                <Row label="WhatsApp">
                  <input
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="+49123..."
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
                <Row label="X / Twitter">
                  <input
                    value={form.twitter}
                    onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                    placeholder="@handle"
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
              </div>
              <Row label="Website">
                <input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="example.com"
                  className="input transition-all duration-300 focus:shadow-md"
                />
              </Row>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={signOut}
                className="order-2 sm:order-1 flex-1 flex items-center justify-center gap-2 rounded-full border border-border bg-surface py-3.5 text-sm font-semibold text-muted-foreground hover:bg-accent-soft/30 hover:text-foreground active:scale-[0.98] transition-all duration-300"
              >
                <LogOut className="size-4" /> Sign out
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="order-1 sm:order-2 flex-[2] flex items-center justify-center gap-2 rounded-full bg-foreground py-3.5 font-semibold text-background transition-all duration-300 hover:opacity-90 hover:scale-[1.01] active:scale-95 disabled:opacity-50 hover:shadow-lg shadow-black/10"
              >
                <Save className="size-4" /> {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          outline: none;
        }
        .input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-accent) 15%, transparent);
        }
      `}</style>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block ml-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
        {label}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-4">
      <h3 className="font-display text-sm uppercase tracking-widest text-accent border-b border-border/30 pb-1">{children}</h3>
    </div>
  );
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input transition-all duration-300 focus:shadow-md"
    >
      <option value="">Pick a country…</option>
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

function ProfilePreviewCard({ p }: { p: any }) {
  const name = p.name.trim() || "Your Name";
  const initials = name
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const links: { label: string; icon: React.ReactNode; colorClass: string }[] = [];
  
  if (p.instagram) {
    links.push({
      label: "Instagram",
      icon: <span className="font-bold text-[9px]">IG</span>,
      colorClass: "bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/25",
    });
  }
  if (p.linkedin) {
    links.push({
      label: "LinkedIn",
      icon: <span className="font-bold text-[9px]">in</span>,
      colorClass: "bg-[#0077B5]/10 text-[#0077B5] border border-[#0077B5]/25",
    });
  }
  if (p.whatsapp) {
    links.push({
      label: "WhatsApp",
      icon: <MessageCircle className="size-3" />,
      colorClass: "bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/25",
    });
  }
  if (p.twitter) {
    links.push({
      label: "X",
      icon: <span className="font-bold text-[9px]">X</span>,
      colorClass: "bg-[#000000]/10 text-[#000000] border border-[#000000]/25",
    });
  }
  if (p.website) {
    links.push({
      label: "Website",
      icon: <Globe className="size-3" />,
      colorClass: "bg-accent-soft text-accent border border-accent/20",
    });
  }

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-surface p-5 shadow-sm min-h-48 transition-transform hover:scale-[1.01]">
      <div>
        <div className="flex gap-4">
          {p.avatar_url ? (
            <img
              src={p.avatar_url}
              alt={name}
              className="size-14 shrink-0 rounded-2xl object-cover border border-border animate-fade-in"
              onError={(e) => {
                (e.target as any).style.display = 'none';
              }}
            />
          ) : (
            <div className="font-display flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-base uppercase text-accent border border-accent/20">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="truncate text-base font-bold text-foreground">{name}</h4>
              <div className="flex gap-1 shrink-0">
                {p.is_buddy && (
                  <span className="inline-flex items-center justify-center bg-green-500/10 text-green-500 text-[9px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5 border border-green-500/25">
                    Buddy
                  </span>
                )}
                {p.home_country && (
                  <span className="inline-flex items-center justify-center bg-accent-soft text-accent text-[10px] font-black tracking-wider rounded-lg px-2 py-0.5 border border-accent/15">
                    {codeFor(p.home_country)}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {p.home_city ? `${p.home_city}, ` : ""}{p.home_country || "Home country"} → <span className="text-foreground font-semibold">{p.current_city ?? p.current_country ?? "Current location"}</span>
            </p>
            {p.university && (
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-accent truncate flex items-center gap-1">
                <GraduationCap className="size-3" />
                <span>{p.major ? `${p.major} @ ` : ""}{p.university}</span>
              </p>
            )}
          </div>
        </div>
        
        {p.bio && <p className="mt-3 text-xs leading-relaxed text-foreground/80 bg-background/50 rounded-xl p-2.5 border border-border/40">{p.bio}</p>}

        {p.favorite_dish && (
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-accent bg-accent-soft/30 rounded-lg px-2.5 py-1.5 border border-accent/10">
            <ChefHat className="size-3.5" />
            <span>Meal Swap: {p.favorite_dish}</span>
          </div>
        )}

        {(p.languages_spoken || p.languages_learning) && (
          <div className="mt-2 flex items-center gap-1.5 text-[9px] font-semibold text-muted-foreground bg-background/65 rounded-lg px-2.5 py-1.5 border border-border/40">
            <Languages className="size-3.5 text-accent/80" />
            <div className="truncate">
              {p.languages_spoken && `Speaks: ${p.languages_spoken}`}
              {p.languages_spoken && p.languages_learning && " | "}
              {p.languages_learning && `Learning: ${p.languages_learning}`}
            </div>
          </div>
        )}
      </div>
      
      {links.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/40">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Connect Direct:</p>
          <div className="flex flex-wrap gap-1.5">
            {links.map((l) => (
              <div
                key={l.label}
                className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${l.colorClass}`}
              >
                {l.icon}
                <span>{l.label}</span>
                <ArrowUpRight className="size-2.5 opacity-60" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
