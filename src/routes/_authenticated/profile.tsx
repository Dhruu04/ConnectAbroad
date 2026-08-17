import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Save, User, Globe, ArrowUpRight, Sparkles, Home, MapPin, ChefHat, Languages, GraduationCap, Upload, Trash2, AlertTriangle, Building2, ShieldCheck, MessageCircle } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { COUNTRIES, codeFor } from "@/lib/countries";
import { saveUserProfile } from "@/integrations/firebase/firestore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success("Account permanently deleted.");
      navigate({ to: "/" });
    } catch (err: any) {
      console.error("Delete account error:", err);
      toast.error(err.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    home_country: "",
    home_city: "",
    current_country: "",
    current_city: "",
    current_area: "",
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
    is_buddy: true,
    is_native: false,
    relocation_type: "international" as "international" | "national" | "native",
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
        const isNative = data.is_native ?? (data.home_city && data.current_city && data.home_city === data.current_city ? true : false);
        const relocationType = data.relocation_type || (isNative ? "native" : (data.home_country && data.current_country && data.home_country === data.current_country ? "national" : "international"));

        setForm({
          name: data.name ?? "",
          home_country: data.home_country ?? "",
          home_city: data.home_city ?? "",
          current_country: data.current_country ?? "",
          current_city: data.current_city ?? "",
          current_area: data.current_area ?? "",
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
          is_buddy: data.is_buddy ?? true,
          is_native: isNative,
          relocation_type: relocationType,
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
    const payload = { id: user.id, ...form, onboarded: true };

    await supabase.from("profiles").upsert(payload);
    await saveUserProfile(payload);
    localStorage.setItem("connect_abroad_profile", JSON.stringify(payload));

    setSaving(false);
    toast.success("Profile updated and synced live online!");
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
              {t("profile.eyebrow")}
            </span>
          </div>
          <h1 className="font-display mt-2 text-3xl md:text-4xl uppercase">{t("profile.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("profile.subtitle")}
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Real-time Card Preview (Sticky on desktop) */}
          <div className="md:col-span-5 space-y-6 md:sticky md:top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("profile.preview_label")}</p>
            <ProfilePreviewCard p={form} />
            <div className="rounded-2xl border border-dashed border-border p-4 bg-surface text-center">
              <p className="text-xs text-muted-foreground">
                {t("profile.preview_hint")}
              </p>
            </div>
          </div>

          {/* Right Column: Editable Form Fields */}
          <div className="md:col-span-7 rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">{t("profile.edit_details")}</p>
            
            <div className="space-y-4">
              <Row label={t("profile.label_name")}>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("profile.placeholder_name")}
                  className="input transition-all duration-300 focus:shadow-md"
                />
              </Row>
              <Row label={t("profile.label_photo")}>
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
                    <span>{t("profile.upload_photo")}</span>
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
                      {t("profile.remove")}
                    </button>
                  )}
                </div>
              </Row>
              <Row label={t("profile.label_bio")}>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder={t("profile.placeholder_bio")}
                  rows={2}
                  className="input resize-none transition-all duration-300 focus:shadow-md"
                />
              </Row>

              <SectionTitle>{t("profile.section_from")}</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Row label={t("profile.label_home_country")}>
                  <CountrySelect
                    value={form.home_country}
                    onChange={(v) => setForm({ ...form, home_country: v })}
                    placeholder={t("profile.pick_country")}
                  />
                </Row>
                <Row label={t("profile.label_home_city")}>
                  <input
                    value={form.home_city}
                    onChange={(e) => setForm({ ...form, home_city: e.target.value })}
                    placeholder={t("profile.placeholder_home_city")}
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
              </div>

              <SectionTitle>{t("profile.section_now")}</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Row label={t("profile.label_current_country")}>
                  <CountrySelect
                    value={form.current_country}
                    onChange={(v) => setForm({ ...form, current_country: v })}
                    placeholder={t("profile.pick_country")}
                  />
                </Row>
                <Row label={t("profile.label_current_city")}>
                  <input
                    value={form.current_city}
                    onChange={(e) => setForm({ ...form, current_city: e.target.value })}
                    placeholder={t("profile.placeholder_current_city")}
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
              </div>
              <Row label="Specific Area / Neighborhood (Optional)">
                <input
                  value={form.current_area}
                  onChange={(e) => setForm({ ...form, current_area: e.target.value })}
                  placeholder="e.g. Kreuzberg, Maxvorstadt, South Kensington, Manhattan"
                  className="input transition-all duration-300 focus:shadow-md"
                />
              </Row>
              <Row label={t("profile.label_university")}>
                <input
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                  placeholder={t("profile.placeholder_university")}
                  className="input transition-all duration-300 focus:shadow-md"
                />
              </Row>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Row label={t("profile.label_major")}>
                  <input
                    value={form.major}
                    onChange={(e) => setForm({ ...form, major: e.target.value })}
                    placeholder={t("profile.placeholder_major")}
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
                <Row label={t("profile.label_arrival")}>
                  <input
                    type="date"
                    value={form.arrival_date}
                    onChange={(e) => setForm({ ...form, arrival_date: e.target.value })}
                    className="input transition-all duration-300 focus:shadow-md cursor-pointer"
                  />
                </Row>
              </div>

              <SectionTitle>{t("profile.section_socialize")}</SectionTitle>
              <Row label={t("profile.label_dish")}>
                <input
                  value={form.favorite_dish}
                  onChange={(e) => setForm({ ...form, favorite_dish: e.target.value })}
                  placeholder={t("profile.placeholder_dish")}
                  className="input transition-all duration-300 focus:shadow-md"
                />
              </Row>
              <Row label={t("profile.label_study_interests")}>
                <input
                  value={form.study_interests}
                  onChange={(e) => setForm({ ...form, study_interests: e.target.value })}
                  placeholder={t("profile.placeholder_study_interests")}
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
                  {t("profile.buddy_label")}
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Row label={t("profile.label_lang_speak")}>
                  <input
                    value={form.languages_spoken}
                    onChange={(e) => setForm({ ...form, languages_spoken: e.target.value })}
                    placeholder={t("profile.placeholder_lang_speak")}
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
                <Row label={t("profile.label_lang_learn")}>
                  <input
                    value={form.languages_learning}
                    onChange={(e) => setForm({ ...form, languages_learning: e.target.value })}
                    placeholder={t("profile.placeholder_lang_learn")}
                    className="input transition-all duration-300 focus:shadow-md"
                  />
                </Row>
              </div>

              <SectionTitle>{t("profile.section_connect")}</SectionTitle>
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
                <LogOut className="size-4" /> {t("profile.btn_signout")}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="order-1 sm:order-2 flex-[2] flex items-center justify-center gap-2 rounded-full bg-foreground py-3.5 font-semibold text-background transition-all duration-300 hover:opacity-90 hover:scale-[1.01] active:scale-95 disabled:opacity-50 hover:shadow-lg shadow-black/10"
              >
                <Save className="size-4" /> {saving ? t("profile.btn_saving") : t("profile.btn_save")}
              </button>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="mt-8 p-6 rounded-3xl border border-red-500/30 bg-red-500/5 space-y-4">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="size-5" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Danger Zone: Delete Account</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Permanently delete your account and remove your student profile from Firebase Cloud. This action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="size-4" />
                  <span>Delete My Account</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-surface border border-red-500/40 space-y-3 animate-scale-in">
                  <p className="text-xs font-bold text-foreground">
                    Are you 100% sure you want to permanently delete your account?
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-all cursor-pointer"
                    >
                      {deleting ? "Deleting..." : "Yes, Delete Permanently"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold uppercase tracking-wider hover:bg-surface transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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

function CountrySelect({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input transition-all duration-300 focus:shadow-md"
    >
      <option value="">{placeholder ?? "Pick a country…"}</option>
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
