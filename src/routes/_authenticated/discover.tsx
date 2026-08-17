
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { 
  MessageCircle, 
  Globe, 
  X, 
  Search, 
  Users, 
  Compass, 
  ArrowUpRight, 
  Home, 
  MapPin, 
  Sparkles, 
  GraduationCap, 
  ChefHat, 
  Languages, 
  Map as MapIcon, 
  List,
  Trophy,
  Crown,
  Award,
  Heart,
  Star,
  ShieldCheck,
  Building2,
  UserPlus,
  RotateCcw,
  ChevronDown
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { MapView, type MapMarkerItem } from "@/components/MapView";
import { EmptyStateCTA } from "@/components/EmptyStateCTA";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { codeFor } from "@/lib/countries";
import { getCoordinatesForLocation } from "@/lib/city-coordinates";
import { subscribeProfiles, togglePeerSupportInFirebase } from "@/integrations/firebase/firestore";

export const Route = createFileRoute("/_authenticated/discover")({
  component: Discover,
});

export type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  home_country: string;
  home_city: string | null;
  current_country: string;
  current_city: string | null;
  current_area?: string | null;
  university: string | null;
  instagram: string | null;
  linkedin: string | null;
  whatsapp: string | null;
  twitter: string | null;
  website: string | null;
  is_buddy: boolean;
  is_native?: boolean;
  relocation_type?: "international" | "national" | "native";
  major: string | null;
  arrival_date: string | null;
  favorite_dish: string | null;
  languages_spoken: string | null;
  languages_learning: string | null;
  onboarded?: boolean;
  study_interests?: string | null;
  kudos_count?: number;
  honor_title?: string | null;
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

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
        active
          ? "bg-accent text-accent-foreground border-accent shadow-sm"
          : "bg-surface text-muted-foreground border-border hover:text-foreground hover:bg-accent-soft/20"
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
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
        active
          ? "bg-accent text-accent-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground bg-transparent"
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
  renderLabel?: (v: string) => string;
}) {
  return (
    <div className="relative inline-block">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border outline-none appearance-none pr-7 ${
          value
            ? "bg-accent text-accent-foreground border-accent shadow-sm"
            : "bg-surface text-muted-foreground border-border hover:text-foreground"
        }`}
      >
        <option value="">{label}: All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground opacity-60" />
    </div>
  );
}

function PersonCard({
  p,
  kudosCount,
  isLiked,
  onSupport,
  onSelect,
}: {
  p: Profile;
  kudosCount: number;
  isLiked: boolean;
  onSupport: (e: React.MouseEvent) => void;
  onSelect: (p: Profile) => void;
}) {
  return (
    <div
      onClick={() => onSelect(p)}
      className="group relative rounded-2xl border border-border bg-surface p-4 transition-all duration-300 hover:border-accent/40 hover:shadow-lg cursor-pointer flex flex-col justify-between space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt={p.name} className="size-11 rounded-xl object-cover border border-border" />
          ) : (
            <div className="size-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center font-black text-sm border border-accent/20">
              {codeFor(p.home_country)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">
                {p.name}
              </h4>
              {p.is_native && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold uppercase">
                  <Home className="size-3" /> Native
                </span>
              )}
              {p.is_buddy && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent-soft text-accent border border-accent/20 text-[10px] font-bold uppercase">
                  <ShieldCheck className="size-3" /> Senior Buddy
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              From <span className="font-semibold text-foreground">{p.home_country}</span>
              {p.home_city ? ` (${p.home_city})` : ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSupport}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
            isLiked
              ? "bg-red-500/10 text-red-500 border-red-500/30"
              : "bg-surface text-muted-foreground border-border hover:text-foreground"
          }`}
          title="Support Peer"
        >
          <Heart className={`size-3.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          <span>{kudosCount}</span>
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {p.bio || "International student looking to connect with peers and explore the city."}
      </p>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
        <span className="flex items-center gap-1 truncate">
          <MapPin className="size-3 text-accent shrink-0" />
          <span className="truncate">{p.current_area ? `${p.current_area}, ` : ""}{p.current_city ?? p.current_country}</span>
        </span>
        {p.university && (
          <span className="flex items-center gap-1 truncate shrink-0 ml-2">
            <GraduationCap className="size-3 text-accent shrink-0" />
            <span className="truncate max-w-[100px]">{p.university}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function Discover() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map" | "hall_of_fame">("list");

  // Peer Kudos / Support State
  const [likedPeerIds, setLikedPeerIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("connect_abroad_liked_peer_ids");
      if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
      }
    }
    return [];
  });

  const [kudosMap, setKudosMap] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("connect_abroad_kudos_map");
      if (saved) {
        try { return JSON.parse(saved); } catch { return {}; }
      }
    }
    return {};
  });

  const handleToggleSupport = (profileId: string, profileName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isLiked = likedPeerIds.includes(profileId);
    let updatedLiked: string[];
    let newCount: number;

    if (isLiked) {
      updatedLiked = likedPeerIds.filter((id) => id !== profileId);
      newCount = Math.max(0, (kudosMap[profileId] || 1) - 1);
      toast.info(`Appreciation removed for ${profileName}`);
    } else {
      updatedLiked = [...likedPeerIds, profileId];
      newCount = (kudosMap[profileId] || 0) + 1;
      toast.success(`You supported ${profileName}! +1 Peer Appreciation`);
    }

    setLikedPeerIds(updatedLiked);
    localStorage.setItem("connect_abroad_liked_peer_ids", JSON.stringify(updatedLiked));

    const updatedKudos = { ...kudosMap, [profileId]: newCount };
    setKudosMap(updatedKudos);
    localStorage.setItem("connect_abroad_kudos_map", JSON.stringify(updatedKudos));

    if (user) {
      togglePeerSupportInFirebase(profileId, user.id, isLiked).catch(() => {});
    }
  };

  const hallOfFameLeaderboard = useMemo(() => {
    return [...profiles].sort((a, b) => {
      const scoreA = kudosMap[a.id] ?? (a.kudos_count || 0);
      const scoreB = kudosMap[b.id] ?? (b.kudos_count || 0);
      return scoreB - scoreA;
    });
  }, [profiles, kudosMap]);

  // Filters
  const [groupBy, setGroupBy] = useState<GroupByOption>("home_country");
  const [homeCountry, setHomeCountry] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [matchMe, setMatchMe] = useState(false);
  const [buddiesOnly, setBuddiesOnly] = useState(false);
  const [relocationTab, setRelocationTab] = useState<"all" | "international" | "national" | "native" | "buddies">("all");

  useEffect(() => {
    if (!user) return;

    // Real-time Cloud Synchronization via Firebase Firestore
    const unsubscribe = subscribeProfiles((cloudProfiles) => {
      setProfiles(cloudProfiles);

      // Sync live kudos map from cloud
      const newKudosMap: Record<string, number> = {};
      cloudProfiles.forEach((p) => {
        newKudosMap[p.id] = p.kudos_count || 0;
      });
      setKudosMap((prev) => ({ ...prev, ...newKudosMap }));

      const mine = cloudProfiles.find((p) => p.id === user.id);
      setMe(mine ?? null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
    
    // Relocation Tab Filter
    if (relocationTab === "international") {
      list = list.filter((p) => p.relocation_type === "international" || (!p.is_native && p.home_country !== p.current_country));
    } else if (relocationTab === "national") {
      list = list.filter((p) => p.relocation_type === "national" || (!p.is_native && p.home_country === p.current_country));
    } else if (relocationTab === "native") {
      list = list.filter((p) => p.is_native || p.relocation_type === "native");
    } else if (relocationTab === "buddies") {
      list = list.filter((p) => p.is_buddy);
    }

    // Apply secondary filters
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
  }, [profiles, relocationTab, homeCountry, currentCity, buddiesOnly, matchMe, me, user, searchQuery]);

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

  const mapMarkers = useMemo<MapMarkerItem[]>(() => {
    const peerMarkers: MapMarkerItem[] = filtered.map((p, idx) => {
      const baseCoords = getCoordinatesForLocation(p.current_city, p.current_country);
      const latOffset = (((idx * 17) % 100) - 50) * 0.0008;
      const lngOffset = (((idx * 23) % 100) - 50) * 0.0012;
      const areaLabel = p.current_area ? `${p.current_area}, ${p.current_city || p.current_country}` : (p.current_city || p.current_country);
      return {
        id: p.id,
        name: p.name,
        lat: baseCoords.lat + latOffset,
        lng: baseCoords.lng + lngOffset,
        type: "peer",
        flag: codeFor(p.home_country),
        avatar: p.avatar_url || undefined,
        subtitle: `From ${p.home_country} • Area: ${areaLabel}`,
        description: `${p.current_area ? `Living Area: ${p.current_area}. ` : ""}${p.bio || p.university || "International Student"}`,
        address: areaLabel,
        googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(areaLabel)}`,
        actionText: p.whatsapp ? "WhatsApp DM" : "View Profile",
        actionUrl: p.whatsapp ? `https://wa.me/${p.whatsapp.replace(/[^0-9]/g, "")}` : undefined,
      };
    });
    const areaMap: Record<string, Profile[]> = {};
    filtered.forEach((p) => {
      const areaKey = p.current_area?.trim() || p.current_city?.trim();
      if (areaKey) {
        if (!areaMap[areaKey]) areaMap[areaKey] = [];
        areaMap[areaKey].push(p);
      }
    });

    const hubMarkers: MapMarkerItem[] = Object.entries(areaMap).map(([area, members], idx) => {
      const city = members[0]?.current_city || members[0]?.current_country || "City";
      return {
        id: `hub-${idx}`,
        name: `${area} Cluster`,
        lat: 52.5065 + idx * 0.02,
        lng: 13.3050 + idx * 0.02,
        type: "cluster" as const,
        flag: `${members.length}`,
        subtitle: `${members.length} ${members.length === 1 ? "Student" : "Students"}`,
        description: `Student cluster in ${area}, ${city}`,
        address: `${area}, ${city}`,
        googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${area}, ${city}`)}`,
        actionText: "Focus Area",
        actionUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${area}, ${city}`)}`,
      };
    });

    return [...peerMarkers, ...hubMarkers];
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />

      <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-4 animate-scale-in">

        {/* Hero Welcome Pin Section */}
        <section className="pt-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
            {t("discover.eyebrow")}
          </span>
          <h1 className="font-display mt-1 text-3xl uppercase leading-none">
            {t("discover.title")}
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
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t("discover.location_pin")}</p>
                    <p className="text-sm font-semibold truncate text-foreground mt-0.5">
                      {me.home_city ? `${me.home_city}, ` : ""}{me.home_country} → {me.current_city ?? me.current_country}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground pt-3 border-t border-border">
                  <span className="flex items-center gap-1.5">
                    <Home className="size-3.5 text-accent" /> <strong>{clusterCounts.sameHome}</strong> {t("discover.from_back_home")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-accent" /> <strong>{clusterCounts.sameCity}</strong> {t("discover.in_your_city")}
                  </span>
                </div>
              </div>
            )}

            {/* Search, Filter & Tabs Group Box */}
            <div className="rounded-2xl bg-surface border border-border p-5 space-y-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">{t("discover.filters_title")}</p>
              {/* Search Input */}
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("discover.search_placeholder")}
                  className="w-full rounded-full border border-border bg-background pl-10 pr-9 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40 transition-shadow duration-300 focus:shadow-md"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-muted-foreground hover:text-foreground border-none bg-transparent cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Relocation & Native Type Filter Pills */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Relocation & Resident Category</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRelocationTab("all")}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                      relocationTab === "all" ? "bg-accent text-accent-foreground shadow-sm" : "border border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Compass className="size-3" /> All
                  </button>
                  <button
                    type="button"
                    onClick={() => setRelocationTab("international")}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                      relocationTab === "international" ? "bg-accent text-accent-foreground shadow-sm" : "border border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Globe className="size-3" /> International
                  </button>
                  <button
                    type="button"
                    onClick={() => setRelocationTab("national")}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                      relocationTab === "national" ? "bg-accent text-accent-foreground shadow-sm" : "border border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Building2 className="size-3" /> Domestic
                  </button>
                  <button
                    type="button"
                    onClick={() => setRelocationTab("native")}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                      relocationTab === "native" ? "bg-accent text-accent-foreground shadow-sm" : "border border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Home className="size-3" /> Native Locals
                  </button>
                  <button
                    type="button"
                    onClick={() => setRelocationTab("buddies")}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                      relocationTab === "buddies" ? "bg-accent text-accent-foreground shadow-sm" : "border border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Users className="size-3" /> Buddies
                  </button>
                </div>
              </div>

              {/* Secondary Filter Chips list */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
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
                      <Sparkles className="size-3" /> {t("discover.just_like_me")}
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
                    <Users className="size-3" /> {t("discover.senior_buddies")}
                  </span>
                </Chip>
                <SelectChip
                  label={t("discover.from")}
                  value={homeCountry}
                  options={homeCountries}
                  onChange={(v) => {
                    setHomeCountry(v);
                    setMatchMe(false);
                  }}
                  renderLabel={(v) => `${t("discover.from")} ${v} (${codeFor(v)})`}
                />
                <SelectChip
                  label={t("discover.in")}
                  value={currentCity}
                  options={currentCities}
                  onChange={(v) => {
                    setCurrentCity(v);
                    setMatchMe(false);
                  }}
                  renderLabel={(v) => `${t("discover.in")} ${v}`}
                />
              </div>

              {/* Clustering Tabs */}
              <div className="pt-3 border-t border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">{t("discover.group_by")}</p>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-background border border-border">
                  <TabButton active={groupBy === "home_country"} onClick={() => setGroupBy("home_country")}>
                    {t("discover.home_country")}
                  </TabButton>
                  <TabButton active={groupBy === "current_city"} onClick={() => setGroupBy("current_city")}>
                    {t("discover.current_city")}
                  </TabButton>
                  <TabButton active={groupBy === "home_city"} onClick={() => setGroupBy("home_city")}>
                    {t("discover.home_city")}
                  </TabButton>
                  <TabButton active={groupBy === "current_country"} onClick={() => setGroupBy("current_country")}>
                    {t("discover.current_country")}
                  </TabButton>
                </div>
              </div>
            </div>
          </div>

        {/* Right Side: Feed (Width 8/12 on Desktop) */}
        <div className="md:col-span-8 space-y-6">
          {/* List / Map View Toggle Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-xs text-muted-foreground font-semibold">
              {t("discover.showing_students", { count: filtered.length })}
            </span>
            <div className="flex items-center gap-1 rounded-xl bg-surface p-1 border border-border">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                  viewMode === "list"
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                }`}
              >
                <List className="size-3.5" />
                <span>{t("view.list")}</span>
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                  viewMode === "map"
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                }`}
              >
                <MapIcon className="size-3.5" />
                <span>{t("view.map")}</span>
              </button>
              <button
                onClick={() => setViewMode("hall_of_fame")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                  viewMode === "hall_of_fame"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                }`}
              >
                <Trophy className="size-3.5 text-amber-300" />
                <span>Hall of Fame</span>
              </button>
            </div>
          </div>

          {/* Right Side Main Content Feed */}
          {viewMode === "hall_of_fame" ? (
            <div className="space-y-8 animate-scale-in">
              <div className="p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-surface to-accent-soft/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="size-5 text-amber-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-amber-600">
                    Community Pillars & Mentors
                  </span>
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground">Hall of Fame</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Honoring international students who actively support peers, share local hometown finds, and host study tandem circles. Tap "Support Peer" to recognize fellow students!
                </p>
              </div>

              {/* Top 3 Podium Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hallOfFameLeaderboard.slice(0, 3).map((p, rankIdx) => {
                  const kudos = kudosMap[p.id] ?? (p.kudos_count || 0);
                  const isLiked = likedPeerIds.includes(p.id);
                  const getRankBadge = () => {
                    if (rankIdx === 0) return { title: "Community Pillar", color: "border-amber-400/80 bg-amber-500/10 text-amber-500", icon: Crown };
                    if (rankIdx === 1) return { title: "Cultural Mentor", color: "border-slate-300 bg-slate-400/10 text-slate-400", icon: Award };
                    return { title: "Neighborhood Navigator", color: "border-amber-700/40 bg-amber-700/10 text-amber-700", icon: Star };
                  };
                  const rankInfo = getRankBadge();
                  const RankIcon = rankInfo.icon;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProfile(p)}
                      className={`relative flex flex-col justify-between p-6 rounded-3xl border ${rankInfo.color} bg-surface space-y-4 shadow-md transition-all hover:scale-[1.02] cursor-pointer`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-current">
                          <RankIcon className="size-3.5" />
                          <span>#{rankIdx + 1} {rankInfo.title}</span>
                        </span>
                      </div>

                      <div className="text-center space-y-2">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.name} className="size-16 rounded-2xl object-cover border-2 border-current mx-auto shadow-sm" />
                        ) : (
                          <div className="size-16 rounded-2xl bg-accent-soft text-accent text-xl font-bold flex items-center justify-center mx-auto border-2 border-current">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-base text-foreground">{p.name}</h4>
                          <p className="text-xs text-muted-foreground font-medium">
                            {p.home_country} → {p.current_area ? `${p.current_area}, ` : ""}{p.current_city || p.current_country}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/40 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Appreciation</span>
                          <span className="font-black text-foreground flex items-center gap-1">
                            <Heart className="size-3.5 fill-red-500 text-red-500" /> {kudos} Support Likes
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleToggleSupport(p.id, p.name, e)}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isLiked
                              ? "bg-red-500 text-white shadow-sm"
                              : "border border-border bg-background text-foreground hover:bg-red-500/10 hover:border-red-500/40"
                          }`}
                        >
                          <Heart className={`size-3.5 ${isLiked ? "fill-white text-white" : "text-red-500"}`} />
                          <span>{isLiked ? "Supported" : "Support Peer"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leaderboard Table Grid (#4 and below) */}
              <div className="rounded-3xl border border-border bg-surface p-5 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
                  Community Hall of Fame Ranking
                </h3>

                <div className="space-y-3">
                  {hallOfFameLeaderboard.slice(3).map((p, idx) => {
                    const rank = idx + 4;
                    const kudos = kudosMap[p.id] ?? (p.kudos_count || 0);
                    const isLiked = likedPeerIds.includes(p.id);

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProfile(p)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border bg-background hover:bg-accent-soft/10 transition-all gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-surface text-xs font-black text-muted-foreground border border-border">
                            #{rank}
                          </span>
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt={p.name} className="size-10 rounded-xl object-cover border border-border" />
                          ) : (
                            <div className="size-10 rounded-xl bg-accent-soft text-accent text-xs font-bold flex items-center justify-center">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{p.name}</h4>
                            <p className="text-[11px] text-muted-foreground">
                              From {p.home_country} • In {p.current_area ? `${p.current_area}, ` : ""}{p.current_city || p.current_country}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1">
                            <Heart className="size-3.5 fill-red-500 text-red-500" /> {kudos}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleToggleSupport(p.id, p.name, e)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                              isLiked
                                ? "bg-red-500 text-white shadow-sm"
                                : "border border-border bg-surface text-foreground hover:bg-red-500/10 hover:border-red-500/40"
                            }`}
                          >
                            <Heart className={`size-3.5 ${isLiked ? "fill-white text-white" : "text-red-500"}`} />
                            <span>{isLiked ? "Supported" : "Support"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : viewMode === "map" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  Interactive Peer Pins
                </span>
                <span className="text-xs text-muted-foreground">
                  Click markers to view contact cards & icebreakers
                </span>
              </div>
              <MapView
                markers={mapMarkers}
                className="h-[520px] w-full rounded-3xl overflow-hidden border border-border shadow-md"
              />
            </div>
          ) : (
            <div className="space-y-8">
              {loading && <p className="text-center text-sm text-muted-foreground py-10">Loading community profiles…</p>}
              {!loading && grouped.length === 0 && (
                <EmptyStateCTA
                  icon={Users}
                  title="No peers found matching criteria"
                  description="No peers match your search query or selected filters. Reset filters or share the invite code to invite friends and local guides!"
                  badge="Community Discovery"
                  primaryAction={{
                    label: "Reset Filters",
                    icon: RotateCcw,
                    onClick: () => {
                      setSearchQuery("");
                      setRelocationTab("all");
                      setHomeCountry(null);
                      setCurrentCity(null);
                      setMatchMe(false);
                      setBuddiesOnly(false);
                    },
                  }}
                  secondaryAction={{
                    label: "Invite Friends",
                    icon: UserPlus,
                    onClick: () => navigate({ to: "/invite" }),
                  }}
                />
              )}
              {grouped.map(([group, people]) => (
                <div key={group} className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      {groupBy === "home_country" && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{codeFor(group)}</span>
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
                      <PersonCard
                        key={p.id}
                        p={p}
                        kudosCount={kudosMap[p.id] ?? (p.kudos_count || 0)}
                        isLiked={likedPeerIds.includes(p.id)}
                        onSupport={(e) => handleToggleSupport(p.id, p.name, e)}
                        onSelect={setSelectedProfile}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
      {/* DETAILED PEER PROFILE DIALOG OVERLAY */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in" 
            onClick={() => setSelectedProfile(null)} 
          />
          <div className="relative w-full max-w-lg max-h-[88vh] sm:max-h-[85vh] overflow-y-auto bg-surface border border-border/80 p-5 sm:p-7 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-scale-in z-10 space-y-5 my-0 sm:my-auto scrollbar-thin">
            
            {/* Header & Sticky Close */}
            <div className="sticky top-0 z-20 flex items-center justify-between bg-surface/95 backdrop-blur-md pb-3 border-b border-border/50 -mt-1 pt-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  Verified Peer Contact
                </span>
                <h3 className="text-base font-bold text-foreground">Student Profile Details</h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="size-8 rounded-full bg-background/80 hover:bg-background border border-border text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center transition-colors"
                title="Close Profile"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Profile Identity Card */}
            <div className="flex gap-4 items-start pt-1">
              {selectedProfile.avatar_url ? (
                <img
                  src={selectedProfile.avatar_url}
                  alt={selectedProfile.name}
                  className="size-16 sm:size-20 rounded-2xl object-cover border border-border/60 shrink-0 shadow-sm"
                />
              ) : (
                <div className="font-display flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-accent-soft text-accent text-xl uppercase font-black border border-accent/20 shrink-0 shadow-sm">
                  {codeFor(selectedProfile.home_country)}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-foreground text-base sm:text-lg truncate">{selectedProfile.name}</h4>
                  <span className="inline-flex items-center justify-center bg-accent-soft text-accent text-[9px] font-black tracking-wider rounded-md px-2 py-0.5 border border-accent/15">
                    {codeFor(selectedProfile.home_country)}
                  </span>
                  {selectedProfile.is_native && (
                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase tracking-wider rounded-md px-2 py-0.5 border border-amber-500/20">
                      <Home className="size-3" /> Native Resident
                    </span>
                  )}
                  {selectedProfile.is_buddy && (
                    <span className="inline-flex items-center gap-1 bg-accent-soft text-accent text-[9px] font-bold uppercase tracking-wider rounded-md px-2 py-0.5 border border-accent/20">
                      <ShieldCheck className="size-3" /> Senior Buddy
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  From <span className="font-semibold text-foreground">{selectedProfile.home_country}</span>
                  {selectedProfile.home_city ? ` (${selectedProfile.home_city})` : ""}
                </p>
                
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5 pt-0.5">
                  <MapPin className="size-3.5 text-accent shrink-0" />
                  <span className="truncate">Living in {selectedProfile.current_city ?? selectedProfile.current_country} ({getDurationText(selectedProfile.arrival_date)})</span>
                </p>
              </div>
            </div>

            {/* Bio Box */}
            {selectedProfile.bio && (
              <div className="p-3.5 bg-accent-soft/15 rounded-2xl border border-accent/10 text-xs text-foreground/90 leading-relaxed font-normal">
                "{selectedProfile.bio}"
              </div>
            )}

            {/* Support Peer Kudos Action */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-border">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Community Support</p>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <Heart className="size-3.5 fill-red-500 text-red-500" />
                  <span>{kudosMap[selectedProfile.id] ?? (selectedProfile.kudos_count || 0)} Support Likes</span>
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => handleToggleSupport(selectedProfile.id, selectedProfile.name, e)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
                  likedPeerIds.includes(selectedProfile.id)
                    ? "bg-red-500 text-white border-red-500 shadow-sm"
                    : "bg-surface text-foreground border-border hover:bg-red-500/10 hover:border-red-500/30"
                }`}
              >
                <Heart className={`size-3.5 ${likedPeerIds.includes(selectedProfile.id) ? "fill-white text-white" : "text-red-500"}`} />
                <span>{likedPeerIds.includes(selectedProfile.id) ? "Supported" : "Support Peer"}</span>
              </button>
            </div>

            {/* Academic Detail */}
            {selectedProfile.university && (
              <div className="p-3.5 rounded-2xl bg-background border border-border space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">University & Field of Study</p>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-accent shrink-0" />
                  <span>{selectedProfile.major ? `${selectedProfile.major} @ ` : ""}{selectedProfile.university}</span>
                </p>
              </div>
            )}

            {/* Hometown Dish & Languages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedProfile.favorite_dish && (
                <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hometown Dish</p>
                  <p className="text-xs font-semibold text-accent flex items-center gap-1.5">
                    <ChefHat className="size-4 text-accent shrink-0" />
                    <span className="truncate">{selectedProfile.favorite_dish}</span>
                  </p>
                </div>
              )}
              {(selectedProfile.languages_spoken || selectedProfile.languages_learning) && (
                <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Languages</p>
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Languages className="size-4 text-accent shrink-0" />
                    <span className="truncate" title={selectedProfile.languages_spoken ?? ""}>{selectedProfile.languages_spoken ?? "Languages Spoken"}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Direct Social Links */}
            <div className="pt-3 border-t border-border/40 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Instant Connections</p>
              <div className="flex flex-wrap gap-2.5">
                {selectedProfile.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedProfile.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                      `Hi ${selectedProfile.name}! I saw your profile on ConnectAbroad. I am also from ${
                        selectedProfile.home_country
                      }${selectedProfile.major ? ` and studying ${selectedProfile.major}` : ""}. Let's connect!`
                    )}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors"
                  >
                    <MessageCircle className="size-4" />
                    <span>WhatsApp</span>
                    <ArrowUpRight className="size-3.5 opacity-60" />
                  </a>
                )}
                {selectedProfile.instagram && (
                  <button
                    type="button"
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
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/20 hover:bg-[#E1306C]/20 transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-[11px] lowercase">ig</span>
                    <span>Instagram</span>
                    <ArrowUpRight className="size-3.5 opacity-60" />
                  </button>
                )}
                {selectedProfile.linkedin && (
                  <a
                    href={selectedProfile.linkedin.startsWith("http") ? selectedProfile.linkedin : `https://linkedin.com/in/${selectedProfile.linkedin}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase bg-[#0077B5]/10 text-[#0077B5] border border-[#0077B5]/20 hover:bg-[#0077B5]/20 transition-colors"
                  >
                    <span className="font-bold text-[11px]">in</span>
                    <span>LinkedIn</span>
                    <ArrowUpRight className="size-3.5 opacity-60" />
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}



