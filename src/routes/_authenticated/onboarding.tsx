import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { saveUserProfile } from "@/integrations/firebase/firestore";
import { COUNTRIES } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { Compass, Home, MapPin, Globe, Upload, Building2, ShieldCheck, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

type Step = 0 | 1 | 2 | 3;

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
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

  // Check if already onboarded
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.onboarded) {
        navigate({ to: "/discover" });
        return;
      }
      if (data) {
        setForm((f) => ({
          ...f,
          name: data.name ?? f.name,
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
          favorite_dish: data.favorite_dish ?? "",
          languages_spoken: data.languages_spoken ?? "",
          languages_learning: data.languages_learning ?? "",
          arrival_date: data.arrival_date ?? "",
          is_buddy: data.is_buddy ?? false,
          major: data.major ?? "",
          study_interests: data.study_interests ?? "",
        }));
      } else if (user.user_metadata?.full_name) {
        const fullName = user.user_metadata.full_name;
        setForm((f) => ({ ...f, name: fullName }));
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  function next() {
    if (step === 0 && !form.name.trim()) return toast.error("Tell us your name");
    if (step === 1 && !form.current_country) return toast.error("Where are you now?");
    if (step === 2 && !form.is_native && !form.home_country) return toast.error("Pick your home country");
    setStep((s) => Math.min(3, s + 1) as Step);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1) as Step);
  }

  async function submit() {
    if (!user) return;
    setSaving(true);
    const payload = {
      id: user.id,
      ...form,
      name: form.name.trim(),
      onboarded: true,
    };
    await supabase.from("profiles").upsert(payload);
    await saveUserProfile(payload);
    localStorage.setItem("connect_abroad_profile", JSON.stringify(payload));
    setSaving(false);
    toast.success("Welcome to ConnectAbroad! Profile synced online.");
    navigate({ to: "/discover" });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground animate-pulse">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-8 md:py-16 animate-scale-in">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
          
          {/* Left Column: Welcome Info Panel (5 cols) */}
          <div className="md:col-span-5 space-y-6 hidden md:block md:sticky md:top-24">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent/15">
                  <Globe className="size-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  Welcome to ConnectAbroad
                </span>
              </div>
              <h2 className="font-display text-4xl uppercase leading-none">
                Drop your pin <br />
                on the map.
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                ConnectAbroad is a quiet, friendly space for international students to support one another, share socials, and beat loneliness.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/60">
              <div className="flex items-start gap-3 text-xs">
                <Home className="size-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground">Find Hometown Peers</h4>
                  <p className="text-muted-foreground mt-0.5">Filter the dashboard by your home country, state, or city to find people from back home.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs pt-2">
                <MapPin className="size-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground">Navigate your Destination</h4>
                  <p className="text-muted-foreground mt-0.5">Find out who else has landed in your current city, university, or neighborhood.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs pt-2">
                <Compass className="size-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground">Direct Social Connection</h4>
                  <p className="text-muted-foreground mt-0.5">Connect instantly on Instagram, LinkedIn, or WhatsApp in just a single tap.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Multi-step Form Card (7 cols) */}
          <div className="md:col-span-7 bg-surface rounded-3xl border border-border p-6 md:p-10 shadow-sm space-y-6">
            <div className="flex items-end justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  Step 0{step + 1} / 04
                </span>
                <h3 className="mt-1 text-xl font-bold text-foreground">
                  {["Your name", "Where are you now?", "Where is home?", "Connect socials"][step]}
                </h3>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i <= step ? "bg-accent" : "bg-accent-soft"}`}
                  />
                ))}
              </div>
            </div>

            <div className="animate-fade-in py-2" key={step}>
              {step === 0 && (
                <div className="space-y-6">
                  <Field label="Your full name">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Luisa Santos"
                      autoFocus
                      className="input-field transition-all duration-300 focus:shadow-md"
                    />
                  </Field>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Select Your Connection & Relocation Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            relocation_type: "international",
                            is_native: false,
                          }))
                        }
                        className={`flex flex-col items-center justify-between text-center p-4 rounded-2xl border transition-all cursor-pointer ${
                          form.relocation_type === "international"
                            ? "border-accent bg-accent-soft/30 text-foreground ring-2 ring-accent/30 shadow-sm"
                            : "border-border bg-background/50 text-muted-foreground hover:bg-surface"
                        }`}
                      >
                        <Globe className="size-6 text-accent mb-2" />
                        <span className="text-xs font-bold text-foreground">International</span>
                        <span className="text-[10px] text-muted-foreground mt-1">Country to country move</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            relocation_type: "national",
                            is_native: false,
                          }))
                        }
                        className={`flex flex-col items-center justify-between text-center p-4 rounded-2xl border transition-all cursor-pointer ${
                          form.relocation_type === "national"
                            ? "border-accent bg-accent-soft/30 text-foreground ring-2 ring-accent/30 shadow-sm"
                            : "border-border bg-background/50 text-muted-foreground hover:bg-surface"
                        }`}
                      >
                        <Building2 className="size-6 text-accent mb-2" />
                        <span className="text-xs font-bold text-foreground">Domestic / National</span>
                        <span className="text-[10px] text-muted-foreground mt-1">Interstate / intercity move</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            relocation_type: "native",
                            is_native: true,
                          }))
                        }
                        className={`flex flex-col items-center justify-between text-center p-4 rounded-2xl border transition-all cursor-pointer ${
                          form.relocation_type === "native"
                            ? "border-accent bg-accent-soft/30 text-foreground ring-2 ring-accent/30 shadow-sm"
                            : "border-border bg-background/50 text-muted-foreground hover:bg-surface"
                        }`}
                      >
                        <Home className="size-6 text-accent mb-2" />
                        <span className="text-xs font-bold text-foreground">Native Local Host</span>
                        <span className="text-[10px] text-muted-foreground mt-1">Born / lived here whole life</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <Field label="Current country / Location">
                    <CountrySelect
                      value={form.current_country}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          current_country: v,
                          home_country: f.is_native ? v : f.home_country,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Current city / state">
                    <input
                      value={form.current_city}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          current_city: e.target.value,
                          home_city: f.is_native ? e.target.value : f.home_city,
                        }))
                      }
                      placeholder="e.g. Berlin, Munich, London, New York"
                      className="input-field transition-all duration-300 focus:shadow-md"
                    />
                  </Field>
                  <Field label="Specific Area / Neighborhood (optional)">
                    <input
                      value={form.current_area || ""}
                      onChange={(e) => setForm({ ...form, current_area: e.target.value })}
                      placeholder="e.g. Kreuzberg, Maxvorstadt, South Kensington"
                      className="input-field transition-all duration-300 focus:shadow-md"
                    />
                  </Field>
                  <Field label="University / Workplace (optional)">
                    <input
                      value={form.university}
                      onChange={(e) => setForm({ ...form, university: e.target.value })}
                      placeholder="e.g. TU Berlin or Local Company"
                      className="input-field transition-all duration-300 focus:shadow-md"
                    />
                  </Field>
                  <Field label="Major / Profession">
                    <input
                      value={form.major}
                      onChange={(e) => setForm({ ...form, major: e.target.value })}
                      placeholder="e.g. Computer Science / Local Guide"
                      className="input-field transition-all duration-300 focus:shadow-md"
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {form.is_native ? (
                    <div className="rounded-2xl border border-accent/25 bg-accent-soft/20 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-accent font-bold text-sm uppercase tracking-wide">
                        <Home className="size-5" />
                        <span>Native Resident Mode Active</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Since you selected <strong>Native Local Host</strong>, your home city and country are automatically matched to <strong>{form.current_city || "your city"}, {form.current_country || "your country"}</strong>. You don't need to select extra origin fields!
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[11px] font-bold">
                        <ShieldCheck className="size-3.5" />
                        <span>Verified Native Local Badge Included</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Field label="Home country">
                        <CountrySelect
                          value={form.home_country}
                          onChange={(v) => setForm({ ...form, home_country: v })}
                        />
                      </Field>
                      <Field label="Home city / state">
                        <input
                          value={form.home_city}
                          onChange={(e) => setForm({ ...form, home_city: e.target.value })}
                          placeholder="e.g. São Paulo, Mumbai, Milan"
                          className="input-field transition-all duration-300 focus:shadow-md"
                        />
                      </Field>
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <Field label="Short bio (optional)">
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Studying architecture. Miss my mom's feijoada."
                      rows={3}
                      className="input-field resize-none transition-all duration-300 focus:shadow-md"
                    />
                  </Field>
                  <Field label="Profile photo (optional)">
                    <div className="flex items-center gap-4">
                      {form.avatar_url && (
                        <img 
                          src={form.avatar_url} 
                          alt="Preview" 
                          className="size-14 rounded-2xl object-cover border border-border animate-fade-in"
                        />
                      )}
                      <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-xs font-bold uppercase tracking-wider hover:bg-accent-soft/30 hover:text-foreground cursor-pointer transition-all duration-300">
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
                  </Field>
                  <Field label="Favorite Hometown Dish (for Cook-Off Swaps)">
                    <input
                      value={form.favorite_dish}
                      onChange={(e) => setForm({ ...form, favorite_dish: e.target.value })}
                      placeholder="e.g. Biryani, Feijoada, Tacos"
                      className="input-field transition-all duration-300 focus:shadow-md"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Languages you speak natively">
                      <input
                        value={form.languages_spoken}
                        onChange={(e) => setForm({ ...form, languages_spoken: e.target.value })}
                        placeholder="e.g. Spanish, English"
                        className="input-field text-sm transition-all duration-300 focus:shadow-md"
                      />
                    </Field>
                    <Field label="Languages you want to practice">
                      <input
                        value={form.languages_learning}
                        onChange={(e) => setForm({ ...form, languages_learning: e.target.value })}
                        placeholder="e.g. German, French"
                        className="input-field text-sm transition-all duration-300 focus:shadow-md"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Instagram">
                      <input
                        value={form.instagram}
                        onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                        placeholder="@handle"
                        className="input-field text-sm transition-all duration-300 focus:shadow-md"
                      />
                    </Field>
                    <Field label="LinkedIn">
                      <input
                        value={form.linkedin}
                        onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                        placeholder="username"
                        className="input-field text-sm transition-all duration-300 focus:shadow-md"
                      />
                    </Field>
                    <Field label="WhatsApp">
                      <input
                        value={form.whatsapp}
                        onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                        placeholder="+49…"
                        className="input-field text-sm transition-all duration-300 focus:shadow-md"
                      />
                    </Field>
                    <Field label="X / Twitter">
                      <input
                        value={form.twitter}
                        onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                        placeholder="@handle"
                        className="input-field text-sm transition-all duration-300 focus:shadow-md"
                      />
                    </Field>
                  </div>
                  <Field label="Study Interests (for Study Matching)">
                    <input
                      value={form.study_interests}
                      onChange={(e) => setForm({ ...form, study_interests: e.target.value })}
                      placeholder="e.g. Algorithms, Machine Learning, Exam prep"
                      className="input-field transition-all duration-300 focus:shadow-md"
                    />
                  </Field>
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
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3 pt-3 border-t border-border/30">
              {step > 0 && (
                <button
                  onClick={back}
                  className="rounded-full border border-border bg-surface px-6 py-3.5 text-sm font-semibold hover:bg-accent-soft/30 hover:border-accent/40 active:scale-[0.97] transition-all duration-300"
                >
                  Back
                </button>
              )}
              <button
                onClick={step === 3 ? submit : next}
                disabled={saving}
                className="flex-1 rounded-full bg-foreground py-3.5 font-semibold text-background transition-all duration-300 hover:opacity-90 hover:scale-[1.01] active:scale-95 disabled:opacity-50 hover:shadow-lg shadow-black/10"
              >
                {step === 3 ? (saving ? "Saving…" : "Drop my pin") : "Continue"}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block ml-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
        {label}
      </label>
      {children}
    </div>
  );
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field transition-all duration-300 focus:shadow-md"
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
