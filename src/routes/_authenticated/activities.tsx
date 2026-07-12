import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  Calendar, 
  ChefHat, 
  Languages, 
  Plus, 
  Users, 
  Clock, 
  MapPin, 
  Coffee, 
  Check, 
  Copy, 
  ChevronRight, 
  MessageCircle,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Search
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { codeFor } from "@/lib/countries";

export const Route = createFileRoute("/_authenticated/activities")({
  component: ActivitiesPage,
});

type Profile = {
  id: string;
  name: string;
  home_country: string;
  home_city: string;
  current_country: string;
  current_city: string;
  university: string;
  bio: string;
  avatar_url: string;
  instagram: string;
  linkedin: string;
  whatsapp: string;
  favorite_dish: string;
  languages_spoken: string;
  languages_learning: string;
  onboarded: boolean;
  major?: string;
  study_interests?: string;
};

type Hangout = {
  id: string;
  title: string;
  details: string;
  date_time: string;
  current_city: string;
  created_by_name: string;
  target_group: string;
  attendee_count: number;
  rsvps: string[];
  created_at: string;
};

function ActivitiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"hangouts" | "cookoff" | "tandem" | "study">("hangouts");

  // Hangouts Tab State
  const [hangouts, setHangouts] = useState<Hangout[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newDateTime, setNewDateTime] = useState("");
  const [newTargetGroup, setNewTargetGroup] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Cook-off & Tandem States
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Fetch current user details & other students
  useEffect(() => {
    if (!user) return;
    (async () => {
      // 1. Fetch current profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileData || !profileData.onboarded) {
        navigate({ to: "/onboarding" });
        return;
      }
      setMe(profileData as Profile);

      // 2. Fetch all onboarded profiles
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("*");
      
      const onboarded = (allProfiles ?? []).filter((p: any) => p.onboarded);
      setProfiles(onboarded as Profile[]);

      // 3. Fetch Hangouts
      const { data: hangoutsData } = await supabase
        .from("hangouts")
        .select("*");
      setHangouts(hangoutsData as Hangout[]);

      setLoading(false);
    })();
  }, [user, navigate]);

  // Load hangouts periodically (polling simulation)
  const refreshHangouts = async () => {
    const { data } = await supabase.from("hangouts").select("*");
    if (data) {
      setHangouts(data as Hangout[]);
    }
  };

  const handleCreateHangout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me || !newTitle.trim() || !newDetails.trim() || !newDateTime.trim()) return;

    const payload = {
      title: newTitle.trim(),
      details: newDetails.trim(),
      date_time: newDateTime.trim(),
      current_city: me.current_city,
      created_by_name: me.name,
      target_group: newTargetGroup.trim() || "Everyone in Berlin",
      attendee_count: 1,
      rsvps: [me.id],
    };

    const { error } = await supabase.from("hangouts").upsert(payload);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Hangout created successfully!");
      setNewTitle("");
      setNewDetails("");
      setNewDateTime("");
      setNewTargetGroup("");
      setShowCreateForm(false);
      refreshHangouts();
    }
  };

  const handleRsvpToggle = async (hangout: Hangout) => {
    if (!me) return;
    const hasJoined = hangout.rsvps.includes(me.id);
    let updatedRsvps = [...hangout.rsvps];
    let updatedCount = hangout.attendee_count;

    if (hasJoined) {
      updatedRsvps = updatedRsvps.filter(id => id !== me.id);
      updatedCount = Math.max(0, updatedCount - 1);
    } else {
      updatedRsvps.push(me.id);
      updatedCount += 1;
    }

    const updatedEvent = {
      ...hangout,
      rsvps: updatedRsvps,
      attendee_count: updatedCount,
    };

    const { error } = await supabase.from("hangouts").upsert(updatedEvent);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(hasJoined ? "RSVP cancelled" : "You are in!");
      refreshHangouts();
    }
  };

  const handleCopyContact = (username: string, platform: string) => {
    navigator.clipboard.writeText(username);
    toast.success(`Copied ${platform} username to clipboard!`);
  };

  const handleExportIcs = (hangout: Hangout) => {
    const cleanTitle = hangout.title.replace(/[^\w\s-]/g, "");
    const cleanDetails = hangout.details.replace(/[^\w\s-]/g, "");
    
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ConnectAbroad//Student Events//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${cleanTitle}`,
      `DESCRIPTION:${cleanDetails} (Organized by ${hangout.created_by_name})`,
      `LOCATION:${hangout.current_city}`,
      "DTSTART:20260715T180000Z",
      "DTEND:20260715T210000Z",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${cleanTitle.toLowerCase().replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Event exported! Open the downloaded .ics file to add it to your calendar.");
  };

  if (loading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground bg-background animate-pulse">
        Loading activities...
      </div>
    );
  }

  // Filter hangouts by city
  const localHangouts = hangouts
    .filter(h => h.current_city.toLowerCase() === me.current_city.toLowerCase())
    .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());

  // Filter students in the same city for Cook-Off
  const cookoffMatches = profiles.filter(
    p => p.id !== me.id && 
         p.current_city.toLowerCase() === me.current_city.toLowerCase() &&
         p.favorite_dish
  );

  // Tandem Matchmaking Logic
  const parseLanguages = (str: string) => {
    if (!str) return [];
    return str.split(",").map(lang => lang.trim().toLowerCase()).filter(Boolean);
  };

  const mySpoken = parseLanguages(me.languages_spoken);
  const myLearning = parseLanguages(me.languages_learning);

  const tandemMatches = profiles
    .filter(p => p.id !== me.id && p.current_city.toLowerCase() === me.current_city.toLowerCase())
    .map(other => {
      const otherSpoken = parseLanguages(other.languages_spoken);
      const otherLearning = parseLanguages(other.languages_learning);

      // Perfect match: they speak what I learn AND learn what I speak
      const matchesSpoken = myLearning.some(lang => otherSpoken.includes(lang));
      const matchesLearning = mySpoken.some(lang => otherLearning.includes(lang));
      const isPerfect = matchesSpoken && matchesLearning;
      
      // Partial match: they speak what I learn OR learn what I speak
      const isPartial = matchesSpoken || matchesLearning;

      return {
        profile: other,
        isPerfect,
        isPartial,
        commonSpoken: otherSpoken.filter(lang => myLearning.includes(lang)),
        commonLearning: otherLearning.filter(lang => mySpoken.includes(lang)),
      };
    })
    .filter(match => match.isPartial)
    .sort((a, b) => (a.isPerfect === b.isPerfect ? 0 : a.isPerfect ? -1 : 1));

  // Study Group Matchmaking Logic
  const studyMatches = profiles
    .filter(p => p.id !== me.id && p.current_city && me.current_city && p.current_city.toLowerCase() === me.current_city.toLowerCase())
    .map(other => {
      const isSameUni = other.university && me.university && other.university.toLowerCase() === me.university.toLowerCase();
      const isSameMajor = other.major && me.major && other.major.toLowerCase() === me.major.toLowerCase();
      
      const parseInterests = (str: string | undefined) => {
        if (!str) return [];
        return str.split(/[\s,]+/).map(w => w.trim().toLowerCase()).filter(w => w.length > 2);
      };
      
      const myInts = parseInterests(me.study_interests);
      const otherInts = parseInterests(other.study_interests);
      const overlappingInts = myInts.filter(w => otherInts.includes(w));
      
      const isMatch = isSameUni || isSameMajor || overlappingInts.length > 0;
      
      let matchType = "";
      let matchScore = 0;
      if (isSameUni && isSameMajor) {
        matchType = "Classmate Match";
        matchScore = 3;
      } else if (isSameMajor) {
        matchType = "Major Match";
        matchScore = 2;
      } else if (isSameUni) {
        matchType = "University Match";
        matchScore = 1.5;
      } else if (overlappingInts.length > 0) {
        matchType = "Interest Swap";
        matchScore = 1;
      }
      
      return {
        profile: other,
        isMatch,
        matchType,
        matchScore,
        overlappingInts,
      };
    })
    .filter(match => match.isMatch)
    .sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />

      <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-8 animate-scale-in">
        {/* Header Summary */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent/15">
              <Sparkles className="size-4" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
              Connect & Socialize
            </span>
          </div>
          <h1 className="font-display mt-2 text-3xl uppercase">Social Activities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Participate in events, share homemade meals, and swap languages in {me.current_city}.
          </p>
        </div>

        {/* Tab Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1 rounded-2xl bg-surface border border-border mb-8">
          <button
            onClick={() => setActiveTab("hangouts")}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === "hangouts"
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="size-4" />
            <span>Hangouts</span>
          </button>
          
          <button
            onClick={() => setActiveTab("cookoff")}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === "cookoff"
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ChefHat className="size-4" />
            <span>Cook-Off</span>
          </button>

          <button
            onClick={() => setActiveTab("tandem")}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === "tandem"
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Languages className="size-4" />
            <span>Tandem</span>
          </button>

          <button
            onClick={() => setActiveTab("study")}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === "study"
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="size-4" />
            <span>Study Match</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* TAB 1: HOMESICK HANGOUTS */}
          {activeTab === "hangouts" && (
            <>
              {/* Left Column: Create Form (4 Cols) */}
              <div className="md:col-span-4 bg-surface border border-border rounded-3xl p-5 space-y-4 md:sticky md:top-24">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Host a Hangout</h3>
                  <button 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="md:hidden text-xs text-accent font-bold uppercase"
                  >
                    {showCreateForm ? "Close Form" : "Create Event"}
                  </button>
                </div>

                <div className={`${showCreateForm ? "block" : "hidden"} md:block space-y-4`}>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Miss something from back home or just want to organize a local study group, board game evening, or football match? List it here!
                  </p>
                  
                  <form onSubmit={handleCreateHangout} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 ml-1">Event Title</label>
                      <input 
                        required
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Board Game Cafe Meet"
                        className="input-field"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 ml-1">Details & Location</label>
                      <textarea
                        required
                        value={newDetails}
                        onChange={(e) => setNewDetails(e.target.value)}
                        placeholder="What, where, and why? e.g. Meet in front of library, playing Monopoly and Chess."
                        rows={3}
                        className="input-field resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 ml-1">Date & Time</label>
                      <input 
                        required
                        type="text"
                        value={newDateTime}
                        onChange={(e) => setNewDateTime(e.target.value)}
                        placeholder="e.g. Saturday at 6:00 PM"
                        className="input-field"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 ml-1">Target Group</label>
                      <input 
                        type="text"
                        value={newTargetGroup}
                        onChange={(e) => setNewTargetGroup(e.target.value)}
                        placeholder="e.g. Everyone in Berlin, Cricket Fans"
                        className="input-field"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-foreground text-background py-3.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="size-4" /> Create Hangout
                    </button>
                  </form>
                </div>
                
                <div className="hidden md:block p-3 rounded-2xl border border-dashed border-border bg-background/50 text-center">
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Events will only display for other students in <span className="font-semibold text-foreground">{me.current_city}</span>.
                  </p>
                </div>
              </div>

              {/* Right Column: Events Feed (8 Cols) */}
              <div className="md:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Hangouts in {me.current_city} ({localHangouts.length})
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-soft text-accent px-2 py-0.5 rounded-md border border-accent/10">
                    Local Only
                  </span>
                </div>

                {localHangouts.length === 0 ? (
                  <div className="rounded-3xl border border-border bg-surface p-12 text-center flex flex-col items-center">
                    <Calendar className="size-10 text-accent/30 mb-3" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">No active hangouts</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[34ch] leading-relaxed">
                      Be the spark! Host a study session, weekend hike, or hometown culinary hangout to meet others.
                    </p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="md:hidden mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold uppercase tracking-wider"
                    >
                      <Plus className="size-3.5" /> Create Hangout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {localHangouts.map((h) => {
                      const joined = h.rsvps.includes(me.id);
                      return (
                        <div 
                          key={h.id} 
                          className="rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-4 hover:scale-[1.005] transition-transform"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="text-base font-bold text-foreground leading-snug">{h.title}</h3>
                              <p className="text-[9px] font-semibold uppercase tracking-wider text-accent mt-0.5">
                                Organized by {h.created_by_name}
                              </p>
                            </div>
                            <span className="shrink-0 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-background px-2.5 py-1.5 rounded-xl border border-border">
                              <Users className="size-3 text-accent" />
                              <span>{h.attendee_count} attending</span>
                            </span>
                          </div>

                          <p className="text-xs text-foreground/80 bg-background/50 border border-border/40 rounded-2xl p-3.5 leading-relaxed whitespace-pre-wrap">
                            {h.details}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground font-semibold">
                            <span className="flex items-center gap-1.5">
                              <Clock className="size-3.5 text-accent/80" />
                              <span>{h.date_time}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="size-3.5 text-accent/80" />
                              <span>{h.current_city}</span>
                            </span>
                            {h.target_group && (
                              <span className="flex items-center gap-1.5 bg-accent-soft/20 text-accent px-2 py-0.5 rounded-md border border-accent/10 text-[9px]">
                                Target: {h.target_group}
                              </span>
                            )}
                          </div>

                          <div className="pt-2 border-t border-border/40 flex justify-end gap-2">
                            {joined && (
                              <button
                                onClick={() => handleExportIcs(h)}
                                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-surface border border-border text-foreground hover:bg-accent-soft/30 transition-all cursor-pointer"
                                title="Export Event to Calendar"
                              >
                                <Calendar className="size-3.5" />
                                <span className="hidden sm:inline">Add to Calendar</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleRsvpToggle(h)}
                              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                joined
                                  ? "bg-foreground text-background shadow-md shadow-foreground/10"
                                  : "bg-surface border border-border text-foreground hover:bg-accent-soft/30"
                              }`}
                            >
                              <Check className={`size-3.5 ${joined ? "opacity-100" : "opacity-40"}`} />
                              <span>{joined ? "Attending" : "Count me in!"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: HOMETOWN COOK-OFF */}
          {activeTab === "cookoff" && (
            <>
              {/* Left Column: Concept Info (4 Cols) */}
              <div className="md:col-span-4 bg-surface border border-border rounded-3xl p-5 space-y-4 md:sticky md:top-24">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border">
                  Hometown Cook-Off
                </h3>
                <div className="space-y-3.5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Food is the ultimate icebreaker! Cook-Off pairs you with other international students in your city to swap home-cooked traditional dishes.
                  </p>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent text-xs font-bold border border-accent/15">1</div>
                      <p className="text-[11px] text-muted-foreground leading-snug">Browse other students who listed their traditional specialty.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent text-xs font-bold border border-accent/15">2</div>
                      <p className="text-[11px] text-muted-foreground leading-snug">Copy their social tags (Instagram/WhatsApp/LinkedIn).</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent text-xs font-bold border border-accent/15">3</div>
                      <p className="text-[11px] text-muted-foreground leading-snug">Connect directly and agree on a dinner swap or joint culinary session.</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-dashed border-border bg-background/50 text-center">
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Your dish is currently listed as: <span className="font-semibold text-foreground">{me.favorite_dish || "None"}</span>. You can change this in your profile editing.
                  </p>
                </div>
              </div>

              {/* Right Column: Matching Cook-Off Dishes (8 Cols) */}
              <div className="md:col-span-8 space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Traditional Dishes in {me.current_city} ({cookoffMatches.length})
                </h2>

                {cookoffMatches.length === 0 ? (
                  <div className="rounded-3xl border border-border bg-surface p-12 text-center flex flex-col items-center">
                    <ChefHat className="size-10 text-accent/30 mb-3" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">No culinary specialties listed yet</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[34ch] leading-relaxed">
                      Nobody has listed a culinary specialty in {me.current_city} yet. Be the first to edit your profile and set your favorite hometown dish!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cookoffMatches.map((other) => {
                      const initials = other.name
                        .split(" ")
                        .map(s => s[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <div 
                          key={other.id} 
                          className="rounded-3xl border border-border bg-surface p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300"
                        >
                          <div>
                            <div className="flex gap-3.5">
                              {other.avatar_url ? (
                                <img
                                  src={other.avatar_url}
                                  alt={other.name}
                                  className="size-10 shrink-0 rounded-xl object-cover border border-border"
                                />
                              ) : (
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent text-xs font-bold border border-accent/15">
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="truncate text-xs font-bold text-foreground">{other.name}</h4>
                                  <span className="inline-flex bg-accent-soft text-accent text-[8px] px-1 rounded font-bold uppercase">
                                    {codeFor(other.home_country)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium truncate">
                                  from {other.home_city || other.home_country}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 p-3 bg-accent-soft/30 border border-accent/10 rounded-2xl">
                              <p className="text-[8px] font-bold uppercase tracking-wider text-accent">Signature Dish</p>
                              <p className="text-sm font-black text-foreground mt-0.5 flex items-center gap-1.5">
                                <ChefHat className="size-3.5 text-accent" />
                                <span>{other.favorite_dish}</span>
                              </p>
                            </div>

                            {other.bio && (
                              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                                {other.bio}
                              </p>
                            )}
                          </div>

                          {/* Contact Channels */}
                          <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Get in touch to swap:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {other.whatsapp && (
                                <button
                                  onClick={() => handleCopyContact(other.whatsapp, "WhatsApp")}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20"
                                >
                                  <MessageCircle className="size-3" />
                                  <span>WhatsApp</span>
                                </button>
                              )}
                              {other.instagram && (
                                <button
                                  onClick={() => handleCopyContact(other.instagram, "Instagram")}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/20"
                                >
                                  <span className="font-bold text-[9px] lowercase">ig</span>
                                  <span>Instagram</span>
                                </button>
                              )}
                              {other.linkedin && (
                                <button
                                  onClick={() => handleCopyContact(other.linkedin, "LinkedIn")}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase bg-[#0077B5]/10 text-[#0077B5] border border-[#0077B5]/20"
                                >
                                  <span className="font-bold text-[9px] lowercase">in</span>
                                  <span>LinkedIn</span>
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 3: LANGUAGE TANDEM */}
          {activeTab === "tandem" && (
            <>
              {/* Left Column: Concept Info (4 Cols) */}
              <div className="md:col-span-4 bg-surface border border-border rounded-3xl p-5 space-y-4 md:sticky md:top-24">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border">
                  Language Tandem
                </h3>
                <div className="space-y-3.5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Practice your target language and share your native language! ConnectAbroad analyzes your profile coordinates and matches you with students who speak what you want to learn.
                  </p>
                  
                  <div className="bg-background/40 border border-border/60 rounded-2xl p-3.5 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-accent">Your Language Profile</p>
                    <div className="space-y-1 text-xs text-foreground/90 font-medium">
                      <p>Speaks: <span className="text-foreground font-bold">{me.languages_spoken || "None listed"}</span></p>
                      <p>Learning: <span className="text-foreground font-bold">{me.languages_learning || "None listed"}</span></p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-dashed border-border bg-background/50 text-center">
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Update your spoken/practice languages in your profile configuration to match with more speakers.
                  </p>
                </div>
              </div>

              {/* Right Column: Matched Students (8 Cols) */}
              <div className="md:col-span-8 space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Language Tandems in {me.current_city} ({tandemMatches.length})
                </h2>

                {tandemMatches.length === 0 ? (
                  <div className="rounded-3xl border border-border bg-surface p-12 text-center flex flex-col items-center">
                    <Coffee className="size-10 text-accent/30 mb-3" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">No matches found</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[34ch] leading-relaxed">
                      We couldn't find any direct language overlaps in {me.current_city} right now. Make sure you have entered your native languages and practice languages in your profile.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tandemMatches.map(({ profile: other, isPerfect, commonSpoken, commonLearning }) => {
                      const initials = other.name
                        .split(" ")
                        .map(s => s[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <div 
                          key={other.id} 
                          className="rounded-3xl border border-border bg-surface p-5 flex flex-col justify-between hover:scale-[1.005] transition-transform duration-300"
                        >
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div className="flex gap-3.5 items-center">
                              {other.avatar_url ? (
                                <img
                                  src={other.avatar_url}
                                  alt={other.name}
                                  className="size-11 shrink-0 rounded-xl object-cover border border-border"
                                />
                              ) : (
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent text-xs font-bold border border-accent/15">
                                  {initials}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold text-foreground">{other.name}</h4>
                                  <span className="inline-flex bg-accent-soft text-accent text-[8px] px-1 rounded font-bold uppercase">
                                    {codeFor(other.home_country)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-semibold">
                                  {other.university || "International Student"}
                                </p>
                              </div>
                            </div>
                            
                            {/* Match Type Badge */}
                            <div>
                              {isPerfect ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-accent text-accent-foreground px-2.5 py-1 rounded-xl shadow-sm">
                                  <Sparkles className="size-3 animate-pulse" />
                                  <span>Perfect Match</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-background text-muted-foreground px-2.5 py-1 rounded-xl border border-border">
                                  <span>Native Speaker Match</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Match Stats Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-3 bg-background/50 border border-border/40 rounded-2xl">
                            <div>
                              <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">They Speak Natively</p>
                              <p className="text-xs font-bold text-foreground mt-0.5 truncate">{other.languages_spoken}</p>
                              {commonSpoken.length > 0 && (
                                <p className="text-[8px] text-accent font-bold mt-0.5">Overlap: Speaks {commonSpoken.join(", ")} (you want to learn)</p>
                              )}
                            </div>
                            <div>
                              <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">They Want to Practice</p>
                              <p className="text-xs font-bold text-foreground mt-0.5 truncate">{other.languages_learning}</p>
                              {commonLearning.length > 0 && (
                                <p className="text-[8px] text-accent font-bold mt-0.5">Overlap: Practicing {commonLearning.join(", ")} (you speak)</p>
                              )}
                            </div>
                          </div>

                          {/* Get in Touch buttons */}
                          <div className="mt-4 pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="text-[9px] text-muted-foreground font-semibold uppercase leading-snug">
                              Meet up for coffee and practice languages!
                            </span>
                            <div className="flex gap-2">
                              {other.whatsapp && (
                                <button
                                  onClick={() => handleCopyContact(other.whatsapp, "WhatsApp")}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 cursor-pointer"
                                >
                                  <MessageCircle className="size-3" />
                                  <span>WhatsApp</span>
                                </button>
                              )}
                              {other.instagram && (
                                <button
                                  onClick={() => handleCopyContact(other.instagram, "Instagram")}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/20 cursor-pointer"
                                >
                                  <span className="font-bold text-[9px] lowercase">ig</span>
                                  <span>Instagram</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 4: STUDY MATCHMAKER */}
          {activeTab === "study" && (
            <>
              {/* Left Column: Info card (4 Cols) */}
              <div className="md:col-span-4 bg-surface border border-border rounded-3xl p-5 space-y-4 md:sticky md:top-24">
                <div className="pb-2 border-b border-border">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Study Buddy Matching</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Academic adaptation is easier together. We match you with peers in {me.current_city} based on university, major/course, and shared study topics.
                </p>
                <div className="p-3.5 bg-background/60 rounded-2xl border border-border/40 text-[10px] space-y-2.5 text-muted-foreground">
                  <p><strong>Your Profile details:</strong></p>
                  <p className="flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-accent" />
                    <span>University: <span className="text-foreground font-semibold">{me.university || "Not Set"}</span></span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-accent" />
                    <span>Major/Course: <span className="text-foreground font-semibold">{me.major || "Not Set"}</span></span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Search className="size-3.5 text-accent" />
                    <span>Topics: <span className="text-foreground font-semibold">{me.study_interests || "Not Set"}</span></span>
                  </p>
                </div>
              </div>

              {/* Right Column: Study matches (8 Cols) */}
              <div className="md:col-span-8 space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Academic matches in {me.current_city} ({studyMatches.length})
                </h2>

                {studyMatches.length === 0 ? (
                  <div className="rounded-3xl border border-border bg-surface p-12 text-center flex flex-col items-center">
                    <GraduationCap className="size-10 text-accent/30 mb-3" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">No study partners found</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[34ch] leading-relaxed">
                      We couldn't find any class or major overlaps in {me.current_city} right now. Make sure you have entered your university, major/course, and study interests in your profile.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studyMatches.map(({ profile: other, matchType, overlappingInts }) => {
                      const initials = other.name
                        .split(" ")
                        .map(s => s[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <div 
                          key={other.id} 
                          className="rounded-3xl border border-border bg-surface p-5 flex flex-col justify-between hover:scale-[1.005] transition-transform duration-300 animate-scale-in"
                        >
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div className="flex gap-3.5 items-center">
                              {other.avatar_url ? (
                                <img
                                  src={other.avatar_url}
                                  alt={other.name}
                                  className="size-11 shrink-0 rounded-xl object-cover border border-border"
                                />
                              ) : (
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent text-xs font-bold border border-accent/15">
                                  {initials}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold text-foreground">{other.name}</h4>
                                  <span className="inline-flex bg-accent-soft text-accent text-[8px] px-1 rounded font-bold uppercase">
                                    {codeFor(other.home_country)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-semibold">
                                  {other.university || "International Student"}
                                </p>
                              </div>
                            </div>
                            
                            {/* Match Type Badge */}
                            <div>
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-accent text-accent-foreground px-2.5 py-1 rounded-xl shadow-sm">
                                <span>{matchType}</span>
                              </span>
                            </div>
                          </div>

                          {/* Major/Course details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-3 bg-background/50 border border-border/40 rounded-2xl">
                            <div>
                              <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Major / Course</p>
                              <p className="text-xs font-bold text-foreground mt-0.5">{other.major || "Not specified"}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Study Interests</p>
                              <p className="text-xs font-bold text-foreground mt-0.5 truncate">{other.study_interests || "Not specified"}</p>
                              {overlappingInts.length > 0 && (
                                <p className="text-[8px] text-accent font-bold mt-0.5">Overlap: {overlappingInts.join(", ")}</p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-4 pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="text-[9px] text-muted-foreground font-semibold uppercase leading-snug">
                              Connect to set up a study session or exam group!
                            </span>
                            <div className="flex gap-2">
                              {other.whatsapp && (
                                <button
                                  onClick={() => handleCopyContact(other.whatsapp, "WhatsApp")}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 cursor-pointer"
                                >
                                  <MessageCircle className="size-3" />
                                  <span>WhatsApp</span>
                                </button>
                              )}
                              {other.instagram && (
                                <button
                                  onClick={() => handleCopyContact(other.instagram, "Instagram")}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/20 cursor-pointer"
                                >
                                  <span className="font-bold text-[9px] lowercase">ig</span>
                                  <span>Instagram</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
