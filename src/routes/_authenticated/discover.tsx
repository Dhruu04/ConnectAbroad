import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Globe, X, Search, Users, Compass, ArrowUpRight, Home, MapPin, Sparkles, GraduationCap, ArrowUp, ChefHat, Languages, Clock } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { codeFor } from "@/lib/countries";

export const Route = createFileRoute("/_authenticated/discover")({
  component: Discover,
});

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  home_country: string;
  home_city: string | null;
  current_country: string;
  current_city: string | null;
  university: string | null;
  instagram: string | null;
  linkedin: string | null;
  whatsapp: string | null;
  twitter: string | null;
  website: string | null;
  is_buddy: boolean;
  major: string | null;
  arrival_date: string | null;
  favorite_dish: string | null;
  languages_spoken: string | null;
  languages_learning: string | null;
};

const getDurationText = (arrivalDateStr: string | null | undefined) => {
  if (!arrivalDateStr) return "Just arrived";
  const arrival = new Date(arrivalDateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - arrival.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return `${diffDays} days`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths > 0 ? `${years} yr ${remainingMonths} mos` : `${years} yr`;
};

type GroupByOption = "home_country" | "current_city" | "home_city" | "current_country";

function Discover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filters
  const [groupBy, setGroupBy] = useState<GroupByOption>("home_country");
  const [homeCountry, setHomeCountry] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [matchMe, setMatchMe] = useState(false);
  const [buddiesOnly, setBuddiesOnly] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("onboarded", true)
        .order("created_at", { ascending: false });
      setProfiles((data ?? []) as Profile[]);
      const mine = (data as Profile[] ?? []).find((p) => p.id === user.id);
      setMe(mine ?? null);
      if (!mine) navigate({ to: "/onboarding" });
      setLoading(false);
    })();
  }, [user, navigate]);

  const homeCountries = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.home_country))).sort(),
    [profiles],
  );
  const currentCities = useMemo(
    () =>
      Array.from(new Set(profiles.map((p) => p.current_city).filter(Boolean) as string[])).sort(),
    [profiles],
  );

  const filtered = useMemo(() => {
    let list = profiles.filter((p) => p.id !== user?.id);
    
    // Apply filters
    if (homeCountry) list = list.filter((p) => p.home_country === homeCountry);
    if (currentCity) list = list.filter((p) => p.current_city === currentCity);
    if (buddiesOnly) list = list.filter((p) => p.is_buddy);
    if (matchMe && me) {
      list = list.filter(
        (p) =>
          p.home_country === me.home_country &&
          (p.current_city ?? "") === (me.current_city ?? ""),
      );
    }

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.bio ?? "").toLowerCase().includes(query) ||
          (p.university ?? "").toLowerCase().includes(query) ||
          p.home_country.toLowerCase().includes(query) ||
          (p.home_city ?? "").toLowerCase().includes(query) ||
          p.current_country.toLowerCase().includes(query) ||
          (p.current_city ?? "").toLowerCase().includes(query)
      );
    }
    return list;
  }, [profiles, homeCountry, currentCity, matchMe, me, user, searchQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, Profile[]>();
    for (const p of filtered) {
      let key = "";
      if (groupBy === "home_country") key = p.home_country;
      else if (groupBy === "current_city") key = p.current_city ?? p.current_country;
      else if (groupBy === "home_city") key = p.home_city ?? p.home_country;
      else if (groupBy === "current_country") key = p.current_country;

      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered, groupBy]);

  const clusterCounts = useMemo(() => {
    if (!me) return { sameHome: 0, sameCity: 0 };
    const sameHome = profiles.filter(p => p.id !== me.id && p.home_country === me.home_country).length;
    const sameCity = profiles.filter(p => p.id !== me.id && p.current_city === me.current_city).length;
    return { sameHome, sameCity };
  }, [profiles, me]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />

      <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-4 animate-scale-in">

      {/* Hero Welcome Pin Section */}
      <section className="pt-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
          ConnectAbroad Dashboard
        </span>
        <h1 className="font-display mt-1 text-3xl uppercase leading-none">
          Find your circle.
        </h1>
      </section>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-6">
        {/* Left Side: Sticky filters & stats (Width 4/12 on Desktop) */}
        <div className="md:col-span-4 space-y-6 md:sticky md:top-24 md:self-start">
          {/* Welcome User Pin Card */}
          {me && (
            <div className="rounded-2xl bg-accent-soft/30 p-4 border border-accent/10">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center bg-accent text-accent-foreground text-xs font-black tracking-wider rounded-xl border border-accent/20">
                  {codeFor(me.home_country)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Your Location Pin</p>
                  <p className="text-sm font-semibold truncate text-foreground mt-0.5">
                    {me.home_city ? `${me.home_city}, ` : ""}{me.home_country} → {me.current_city ?? me.current_country}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground pt-3 border-t border-border">
                <span className="flex items-center gap-1.5">
                  <Home className="size-3.5 text-accent" /> <strong>{clusterCounts.sameHome}</strong> from back home
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-accent" /> <strong>{clusterCounts.sameCity}</strong> in your city
                </span>
              </div>
            </div>
          )}

          {/* Search, Filter & Tabs Group Box */}
          <div className="rounded-2xl bg-surface border border-border p-5 space-y-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Filters & Search</p>
            
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, country..."
                className="w-full rounded-full border border-border bg-background pl-10 pr-9 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40 transition-shadow duration-300 focus:shadow-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips list */}
            <div className="flex flex-wrap gap-1.5">
              {me && (
                <Chip
                  active={matchMe}
                  onClick={() => {
                    setMatchMe(!matchMe);
                    setBuddiesOnly(false);
                    if (!matchMe) {
                      setHomeCountry(null);
                      setCurrentCity(null);
                    }
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="size-3" /> Just like me
                  </span>
                </Chip>
              )}
              <Chip
                active={buddiesOnly}
                onClick={() => {
                  setBuddiesOnly(!buddiesOnly);
                  setMatchMe(false);
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" /> Senior Buddies
                </span>
              </Chip>
              <SelectChip
                label="From"
                value={homeCountry}
                options={homeCountries}
                onChange={(v) => {
                  setHomeCountry(v);
                  setMatchMe(false);
                }}
                renderLabel={(v) => `From ${v} (${codeFor(v)})`}
              />
              <SelectChip
                label="In"
                value={currentCity}
                options={currentCities}
                onChange={(v) => {
                  setCurrentCity(v);
                  setMatchMe(false);
                }}
                renderLabel={(v) => `In ${v}`}
              />
            </div>

            {/* Clustering Tabs */}
            <div className="pt-3 border-t border-border">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Group Members By:</p>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-background border border-border">
                <TabButton active={groupBy === "home_country"} onClick={() => setGroupBy("home_country")}>
                  Home Country
                </TabButton>
                <TabButton active={groupBy === "current_city"} onClick={() => setGroupBy("current_city")}>
                  Current City
                </TabButton>
                <TabButton active={groupBy === "home_city"} onClick={() => setGroupBy("home_city")}>
                  Home City
                </TabButton>
                <TabButton active={groupBy === "current_country"} onClick={() => setGroupBy("current_country")}>
                  Current Country
                </TabButton>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Feed (Width 8/12 on Desktop, columns 2 on Desktop/Tablet) */}
        <div className="md:col-span-8 space-y-10">
          {loading && <p className="text-center text-sm text-muted-foreground py-10">Loading community profiles…</p>}
          {!loading && grouped.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center bg-surface">
              <p className="font-display text-2xl uppercase text-accent">No matches found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search query or share the invite QR code.
              </p>
              <Link
                to="/invite"
                className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
              >
                Share invite QR
              </Link>
            </div>
          )}

          {grouped.map(([group, people], idx) => (
            <div
              key={group}
              className="animate-reveal"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="font-display text-lg uppercase tracking-wide flex items-center gap-2 truncate">
                  {groupBy === "home_country" && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-accent/15 text-accent text-[11px] font-black tracking-wider rounded-md px-1.5 py-0.5 border border-accent/20">
                        {codeFor(group)}
                      </span>
                      <span className="truncate">From {group}</span>
                    </div>
                  )}
                  {groupBy === "current_city" && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-accent" />
                      <span className="truncate">In {group}</span>
                    </div>
                  )}
                  {groupBy === "home_city" && (
                    <div className="flex items-center gap-2">
                      <Home className="size-4 text-accent" />
                      <span className="truncate">From {group}</span>
                    </div>
                  )}
                  {groupBy === "current_country" && (
                    <div className="flex items-center gap-2">
                      <Globe className="size-4 text-accent" />
                      <span className="truncate">In {group}</span>
                    </div>
                  )}
                </h3>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
                  <Users className="size-3.5" /> {people.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {people.map((p) => (
                  <PersonCard key={p.id} p={p} onSelect={setSelectedProfile} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-40 p-3 rounded-full bg-foreground text-background shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-border/20"
          title="Scroll to top"
        >
          <ArrowUp className="size-4" />
        </button>
      )}

      </div>

      {/* DETAILED PEER PROFILE DIALOG OVERLAY */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedProfile(null)} />
          <div className="relative w-full max-w-md bg-surface border border-border p-6 rounded-3xl shadow-2xl animate-scale-in z-10">
            <button 
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer p-1 border-none bg-transparent"
            >
              <X className="size-5" />
            </button>

            <div className="space-y-4">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  Peer Contact Verification
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">Student Information</h3>
              </div>

              <div className="flex gap-4 items-start border-b border-border/40 pb-4">
                {selectedProfile.avatar_url ? (
                  <img
                    src={selectedProfile.avatar_url}
                    alt={selectedProfile.name}
                    className="size-16 rounded-2xl object-cover border border-border"
                  />
                ) : (
                  <div className="font-display flex size-16 items-center justify-center rounded-2xl bg-accent-soft text-xl uppercase text-accent border border-accent/20">
                    {selectedProfile.name.split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground text-base truncate">{selectedProfile.name}</h4>
                    <span className="inline-flex items-center justify-center bg-accent-soft text-accent text-[9px] font-black tracking-wider rounded-lg px-2 py-0.5 border border-accent/15">
                      {codeFor(selectedProfile.home_country)}
                    </span>
                    {selectedProfile.is_buddy && (
                      <span className="inline-flex items-center justify-center bg-green-500/10 text-green-500 text-[8px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5 border border-green-500/25">
                        Buddy
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-0.5">
                    From {selectedProfile.home_city ? `${selectedProfile.home_city}, ` : ""}{selectedProfile.home_country}
                  </p>
                  
                  <p className="text-xs font-semibold text-foreground mt-1 flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-accent" />
                    <span>Lived in {selectedProfile.current_city ?? selectedProfile.current_country} ({getDurationText(selectedProfile.arrival_date)})</span>
                  </p>
                </div>
              </div>

              {/* Bio */}
              {selectedProfile.bio && (
                <div className="p-3 bg-background/50 rounded-2xl border border-border/40 text-xs text-foreground/80 leading-relaxed">
                  {selectedProfile.bio}
                </div>
              )}

              {/* Academic detail */}
              {selectedProfile.university && (
                <div className="space-y-1 text-xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Education</p>
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <GraduationCap className="size-3.5 text-accent" />
                    <span>{selectedProfile.major ? `${selectedProfile.major} @ ` : ""}{selectedProfile.university}</span>
                  </p>
                </div>
              )}

              {/* Meals and Tandem Info */}
              <div className="grid grid-cols-2 gap-3.5">
                {selectedProfile.favorite_dish && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Hometown Dish</p>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1 text-accent">
                      <ChefHat className="size-3.5 text-accent" />
                      <span>{selectedProfile.favorite_dish}</span>
                    </p>
                  </div>
                )}
                {(selectedProfile.languages_spoken || selectedProfile.languages_learning) && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Languages Spoken</p>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Languages className="size-3.5 text-accent" />
                      <span className="truncate" title={selectedProfile.languages_spoken ?? ""}>{selectedProfile.languages_spoken ?? "Spoken languages"}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Direct Social Links */}
              <div className="pt-3 border-t border-border/40 space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Instant Connections (Copies Pre-filled Message)</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedProfile.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                        `Hi ${selectedProfile.name}! I saw your profile on ConnectAbroad. I am also from ${
                          selectedProfile.home_country
                        }${selectedProfile.major ? ` and studying ${selectedProfile.major}` : ""}. Let's connect!`
                      )}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold uppercase bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20"
                    >
                      <MessageCircle className="size-3.5" />
                      <span>WhatsApp</span>
                      <ArrowUpRight className="size-3 opacity-60" />
                    </a>
                  )}
                  {selectedProfile.instagram && (
                    <button
                      onClick={() => {
                        const message = `Hi ${selectedProfile.name}! I saw your profile on ConnectAbroad. I am also from ${
                          selectedProfile.home_country
                        }${selectedProfile.major ? ` and studying ${selectedProfile.major}` : ""}. Let's connect!`;
                        navigator.clipboard.writeText(message);
                        import("sonner").then(module => {
                          module.toast.success("Icebreaker message copied! Paste it in their DMs.");
                        });
                        window.open(`https://instagram.com/${selectedProfile.instagram!.replace(/^@/, "")}`, "_blank");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold uppercase bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/20 cursor-pointer"
                    >
                      <span className="font-bold text-[10px] lowercase">ig</span>
                      <span>Instagram</span>
                      <ArrowUpRight className="size-3 opacity-60" />
                    </button>
                  )}
                  {selectedProfile.linkedin && (
                    <a
                      href={selectedProfile.linkedin.startsWith("http") ? selectedProfile.linkedin : `https://linkedin.com/in/${selectedProfile.linkedin}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold uppercase bg-[#0077B5]/10 text-[#0077B5] border border-[#0077B5]/20"
                    >
                      <span className="font-bold text-[10px]">in</span>
                      <span>LinkedIn</span>
                      <ArrowUpRight className="size-3 opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.96] duration-150 ${
        active
          ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
          : "border border-border bg-background text-foreground hover:bg-accent-soft/30 hover:border-accent/40"
      }`}
    >
      {children}
    </button>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg py-2 px-1 text-[9px] font-bold uppercase tracking-tighter text-center transition-all active:scale-[0.96] duration-150 ${
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SelectChip({
  label,
  value,
  options,
  onChange,
  renderLabel,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
  renderLabel: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-sm shadow-accent/20 active:scale-[0.96] transition-all duration-150"
        >
          {renderLabel(value)}
          <X className="size-3" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="whitespace-nowrap rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-accent-soft/30 hover:border-accent/40 active:scale-[0.96] transition-all duration-150"
        >
          {label} ▾
        </button>
      )}
      {open && !value && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 max-h-72 w-56 overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-xl animate-scale-in">
            {options.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">No options available</div>
            )}
            {options.map((o) => (
              <button
                key={o}
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-accent-soft/60 transition-colors"
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type ProfileCardProps = {
  id: string;
  name: string;
  avatar_url: string | null;
  home_country: string;
  home_city: string | null;
  current_country: string;
  current_city: string | null;
  university: string | null;
  instagram: string | null;
  linkedin: string | null;
  whatsapp: string | null;
  twitter: string | null;
  website: string | null;
  bio: string | null;
  favorite_dish: string | null;
  languages_spoken: string | null;
  languages_learning: string | null;
  is_buddy: boolean;
  major: string | null;
  arrival_date: string | null;
};

function PersonCard({ p, onSelect }: { p: ProfileCardProps; onSelect: (p: ProfileCardProps) => void }) {
  const initials = p.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div 
      onClick={() => onSelect(p)}
      className="group flex flex-col justify-between rounded-3xl border border-border bg-surface p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-md hover:border-accent/30 hover:bg-accent-soft/5 cursor-pointer animate-scale-in"
    >
      <div className="flex gap-4">
        {p.avatar_url ? (
          <img
            src={p.avatar_url}
            alt={p.name}
            className="size-12 shrink-0 rounded-2xl object-cover border border-border transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="font-display flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-sm uppercase text-accent border border-accent/20 transition-transform duration-300 group-hover:scale-105">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate text-sm font-bold text-foreground transition-colors duration-300 group-hover:text-accent">{p.name}</h4>
            <div className="flex gap-1 shrink-0">
              {p.is_buddy && (
                <span className="inline-flex items-center justify-center bg-green-500/10 text-green-500 text-[8px] font-bold uppercase tracking-wider rounded-md px-1.5 py-0.5 border border-green-500/25">
                  Buddy
                </span>
              )}
              {p.home_country && (
                <span className="inline-flex items-center justify-center bg-accent-soft text-accent text-[9px] font-black tracking-wider rounded-md px-1.5 py-0.5 border border-accent/15" title={p.home_country}>
                  {codeFor(p.home_country)}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            {p.home_city ? `${p.home_city}, ` : ""}{p.home_country} → <span className="text-foreground font-semibold">{p.current_city ?? p.current_country}</span>
          </p>
          {p.university && (
            <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-accent truncate flex items-center gap-1">
              <GraduationCap className="size-3" />
              <span>{p.major ? `${p.major} @ ` : ""}{p.university}</span>
            </p>
          )}
          {p.arrival_date && (
            <p className="mt-0.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Clock className="size-3 text-accent" />
              <span>Resident for {getDurationText(p.arrival_date)}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
