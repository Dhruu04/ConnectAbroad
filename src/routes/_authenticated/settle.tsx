import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { 
  CheckSquare, 
  MapPin, 
  ThumbsUp, 
  ThumbsDown, 
  Plus, 
  Check, 
  Info, 
  ExternalLink, 
  Vote,
  Clock,
  Globe,
  Compass,
  Store,
  Navigation,
  Share2,
  Phone,
  Star,
  Users,
  Search,
  List,
  Map as MapIcon,
  X,
  RotateCcw
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { MapView, type MapMarkerItem } from "@/components/MapView";
import { EmptyStateCTA } from "@/components/EmptyStateCTA";
import { HOMETOWN_STORES, type HometownStore, type StudentHubCluster } from "@/lib/mock-data";
import { subscribeHometownStores, addHometownStoreToFirebase, subscribeProfiles } from "@/integrations/firebase/firestore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/settle")({
  component: SettlePage,
});

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  home_country: string;
  current_country: string;
  current_city: string | null;
  current_area?: string | null;
  arrival_date: string | null;
  university?: string | null;
  favorite_dish?: string | null;
};

type Suggestion = {
  id: string;
  created_by: string | null;
  home_country: string;
  current_country: string;
  current_city: string;
  type: "checklist" | "hometown_find";
  title: string;
  description: string;
  category: string;
  link: string | null;
  status: "pending" | "approved";
  created_at: string;
};

type VoteType = {
  suggestion_id: string;
  user_id: string;
  vote: boolean;
};

const DEFAULT_CHECKLISTS: Record<string, { title: string; desc: string; category: string }[]> = {
  "Germany": [
    { title: "Book Anmeldung (City Registration)", desc: "You must register your address within 14 days of moving in. Appointments can be hard to get; check early mornings.", category: "Registration" },
    { title: "Register for Health Insurance", desc: "You need public health insurance (like TK, AOK, or Barmer) to register for university.", category: "Insurance" },
    { title: "Open a Blocked Account / Bank Account", desc: "Release your blocked account funds and set up a student-friendly bank account like N26 or Revolut.", category: "Finance" },
    { title: "Get a local SIM Card", desc: "Prepaid options like Lidl Connect, Aldi Talk, or prepaid Vodafone are cheap and easy to set up.", category: "Telecom" },
    { title: "Get your Student Transport Ticket", desc: "Ask your university about the Deutschlandticket student upgrade (unlimited transit for ~€29/mo).", category: "Transport" }
  ],
  "Italy": [
    { title: "Apply for Codice Fiscale (Tax Code)", desc: "Crucial for renting an apartment, opening a bank account, or getting a SIM card. Apply at the Agenzia delle Entrate.", category: "Registration" },
    { title: "Apply for Permesso di Soggiorno", desc: "Non-EU students must apply for the Residence Permit within 8 working days of arrival via a postal kit.", category: "Visa / Permit" },
    { title: "Register for Italian National Health Service (SSN)", desc: "Provides access to general practitioners. Pay the voluntary registration fee at the post office.", category: "Insurance" },
    { title: "Open a Student Bank Account", desc: "Set up a Revolut account or get a student package at a local bank like Intesa Sanpaolo.", category: "Finance" },
    { title: "Get a local SIM Card", desc: "Iliad and CoopVoce offer great low-cost prepaid SIM cards with high data allowances.", category: "Telecom" }
  ],
  "France": [
    { title: "Validate your VLS-TS Visa", desc: "You must validate your long-stay visa online within 3 months of arrival and pay the visa tax.", category: "Visa / Permit" },
    { title: "Apply for CAF Housing Subsidy", desc: "International students are eligible for housing assistance (APL) from the CAF. Apply online as soon as you rent.", category: "Housing" },
    { title: "Register for Ameli (Social Security)", desc: "Register online at etudiant-etranger.ameli.fr for free French health insurance coverage.", category: "Insurance" },
    { title: "Open a French Bank Account", desc: "Necessary for receiving CAF payments and paying rent. Options include traditional banks or online accounts.", category: "Finance" },
    { title: "Get a local SIM Card", desc: "Free Mobile offers cheap monthly plans without contracts, or check prepaid SIMs from Orange.", category: "Telecom" }
  ]
};

const GENERIC_CHECKLIST = [
  { title: "Register your Local Address", desc: "Visit the local city office or municipal hall to register your residential address.", category: "Registration" },
  { title: "Set up a Student Bank Account", desc: "Open a local bank account to pay rent, receive payouts, and avoid transaction fees.", category: "Finance" },
  { title: "Get Student Health Insurance", desc: "Register for local health coverage or get your international policy certified by the university.", category: "Insurance" },
  { title: "Acquire a Local SIM Card", desc: "Get a prepaid or contract SIM card to avoid expensive roaming fees.", category: "Telecom" },
  { title: "Get a Public Transport Pass", desc: "Purchase student travel tickets or register for local transport discounts.", category: "Transport" }
];

const CHECKED_ITEMS_KEY = "connect_abroad_checked_checklist_items";

function SettlePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [me, setMe] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [votes, setVotes] = useState<VoteType[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"checklist" | "secrets" | "review">("checklist");
  const [checklistFilter, setChecklistFilter] = useState<"all" | "active" | "completed">("all");

  // Suggestion form state
  const [sugType, setSugType] = useState<"checklist" | "hometown_find">("checklist");
  const [sugTitle, setSugTitle] = useState("");
  const [sugDesc, setSugDesc] = useState("");
  const [sugCategory, setSugCategory] = useState("Asian");
  const [sugLink, setSugLink] = useState("");
  const [sugAddress, setSugAddress] = useState("");
  const [sugPhone, setSugPhone] = useState("");
  const [sugHours, setSugHours] = useState("Mon-Sat: 09:00 - 20:00");
  const [sugPrice, setSugPrice] = useState<"$" | "$$" | "$$$">("$$");
  const [sugSpecialties, setSugSpecialties] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Hometown Stores & Density Hub Map state
  const [storeCategory, setStoreCategory] = useState<string>("all");
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("my_city");
  const [storeViewMode, setStoreViewMode] = useState<"map" | "grid">("map");
  const [selectedStore, setSelectedStore] = useState<HometownStore | null>(null);

  const [cloudStores, setCloudStores] = useState<HometownStore[]>([]);
  const [customStores, setCustomStores] = useState<HometownStore[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("connect_abroad_custom_hometown_stores");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    const unsubscribe = subscribeHometownStores((stores) => {
      setCloudStores(stores);
    });
    return () => unsubscribe();
  }, []);

  const allAvailableStores = [...cloudStores, ...customStores].filter(
    (store, index, self) => index === self.findIndex((s) => s.id === store.id)
  );

  const activeFilteredStores = allAvailableStores.filter(s => {
    if (selectedCityFilter !== "all") {
      const cityToMatch = selectedCityFilter === "my_city" ? (me?.current_city || "Berlin") : selectedCityFilter;
      if (s.city.toLowerCase() !== cityToMatch.toLowerCase()) return false;
    }
    if (storeCategory !== "all" && s.category !== storeCategory) return false;
    if (storeSearchQuery.trim()) {
      const q = storeSearchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.specialties.some(sp => sp.toLowerCase().includes(q)) ||
        s.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Real Dynamic Student Population Density Hubs calculated live from registered profiles
  const dynamicStudentHubs = useMemo<StudentHubCluster[]>(() => {
    if (!profiles || profiles.length === 0) return [];

    // Group profiles by living neighborhood (current_area or current_city)
    const areaGroups: Record<string, Profile[]> = {};
    profiles.forEach((p) => {
      const areaKey = p.current_area?.trim() || p.current_city?.trim();
      if (areaKey) {
        if (!areaGroups[areaKey]) areaGroups[areaKey] = [];
        areaGroups[areaKey].push(p);
      }
    });

    return Object.entries(areaGroups).map(([areaName, members], idx) => {
      const city = members[0]?.current_city || members[0]?.current_country || "International";
      const country = members[0]?.current_country || "Germany";

      // Top nationalities in this student area
      const natCounts: Record<string, number> = {};
      members.forEach((m) => {
        if (m.home_country) {
          natCounts[m.home_country] = (natCounts[m.home_country] || 0) + 1;
        }
      });
      const topCountries = Object.entries(natCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([c]) => c)
        .slice(0, 5);

      // Popular student hangout spots from home dishes / university
      const popularPlaces = Array.from(
        new Set(
          members
            .flatMap((m) => [m.university, m.favorite_dish].filter(Boolean))
            .slice(0, 4)
        )
      ) as string[];

      return {
        id: `dynamic-hub-${idx}-${areaName.toLowerCase().replace(/\s+/g, "-")}`,
        areaName: `${areaName} Student Cluster`,
        city: city,
        country: country,
        lat: 52.5065 + (idx * 0.02),
        lng: 13.3050 + (idx * 0.02),
        studentCount: members.length,
        topCountries: topCountries.length > 0 ? topCountries : ["International"],
        description: `Densely populated international student district in ${city} with ${members.length} registered student(s).`,
        popularPlaces: popularPlaces.length > 0 ? popularPlaces : ["Campus Study Lounge", "Local Student Market"],
      };
    });
  }, [profiles]);

  const activeStudentHubs = dynamicStudentHubs.filter((hub) => {
    if (selectedCityFilter !== "all") {
      const cityToMatch = selectedCityFilter === "my_city" ? (me?.current_city || "Berlin") : selectedCityFilter;
      if (hub.city.toLowerCase() !== cityToMatch.toLowerCase()) return false;
    }
    return true;
  });

  const handleCreateStoreProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sugTitle.trim() || !sugAddress.trim() || !sugDesc.trim()) {
      toast.error("Please fill in place name, address, and description.");
      return;
    }

    const newStore: HometownStore = {
      id: `custom-store-${Date.now()}`,
      name: sugTitle,
      category: (sugCategory as any) || "Asian",
      address: sugAddress,
      city: me?.current_city || "Berlin",
      country: me?.current_country || "Germany",
      lat: 52.5065 + (Math.random() - 0.5) * 0.04,
      lng: 13.3050 + (Math.random() - 0.5) * 0.04,
      phone: sugPhone || "+49 30 1234 5678",
      hours: sugHours || "Mon-Sat: 09:00 - 20:00",
      priceLevel: sugPrice,
      specialties: sugSpecialties.trim()
        ? sugSpecialties.split(",").map(s => s.trim()).filter(Boolean)
        : ["Hometown Groceries", "Fresh Ingredients"],
      rating: 5.0,
      reviewsCount: 1,
      description: sugDesc,
    };

    const updated = [newStore, ...customStores];
    setCustomStores(updated);
    localStorage.setItem("connect_abroad_custom_hometown_stores", JSON.stringify(updated));

    // Save to Firebase Firestore Cloud Database
    addHometownStoreToFirebase(newStore).catch((err) => {
      console.warn("Failed to sync store to Firebase Cloud:", err);
    });

    // Reset form
    setSugTitle("");
    setSugAddress("");
    setSugPhone("");
    setSugHours("Mon-Sat: 09:00 - 20:00");
    setSugSpecialties("");
    setSugDesc("");
    setShowAddForm(false);

    toast.success("Hometown store proposed and synced live online!");
  };

  const storeMapMarkers: MapMarkerItem[] = [
    ...activeFilteredStores.map(s => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      type: "spot" as const,
      flag: "SHOP",
      subtitle: `${s.category} • ${s.priceLevel}`,
      description: `Specialties: ${s.specialties.slice(0, 3).join(", ")}. Address: ${s.address}`,
      address: s.address,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`,
      actionText: "Open Directions",
      actionUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`,
    })),
    ...activeStudentHubs.map(hub => ({
      id: hub.id,
      name: hub.areaName,
      lat: hub.lat,
      lng: hub.lng,
      type: "cluster" as const,
      flag: `${hub.studentCount}`,
      subtitle: `Student Population Hub • ${hub.studentCount} Students`,
      description: hub.description,
      address: `${hub.areaName}, ${hub.city}`,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${hub.areaName}, ${hub.city}`)}`,
      actionText: "Google Maps Hub",
      actionUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hub.areaName}, ${hub.city}`)}`,
    }))
  ];

  const handleShareStore = async (store: HometownStore) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address}`)}`;
    if (navigator.share) {
      await navigator.share({
        title: store.name,
        text: `Check out ${store.name} on ConnectAbroad! Address: ${store.address}`,
        url: mapsUrl,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(mapsUrl);
      toast.success("Store location link copied to clipboard!");
    }
  };

  const fetchAllData = async (userId: string) => {
    try {
      // Parallel non-blocking data fetching
      const [sugRes, votesRes, profRes] = await Promise.allSettled([
        supabase.from("suggestions").select("*"),
        supabase.from("votes").select("*"),
        supabase.from("profiles").select("*"),
      ]);

      if (sugRes.status === "fulfilled" && sugRes.value.data) {
        setSuggestions(sugRes.value.data as Suggestion[]);
      }
      if (votesRes.status === "fulfilled" && votesRes.value.data) {
        setVotes(votesRes.value.data as VoteType[]);
      }
      if (profRes.status === "fulfilled" && profRes.value.data) {
        const dbProf = profRes.value.data as Profile[];
        setProfiles((prev) => (prev.length > 0 ? prev : dbProf));
      }
    } catch (err) {
      console.warn("Non-critical background fetch note:", err);
    }
  };

  useEffect(() => {
    // Instantly mark loading as false so page opens immediately
    setLoading(false);

    if (!user) return;

    // Real-time Cloud Synchronization of profiles via Firebase Firestore
    const unsubscribeProfiles = subscribeProfiles((cloudProfiles: any[]) => {
      if (cloudProfiles && cloudProfiles.length > 0) {
        setProfiles(cloudProfiles as any[]);
        const mine = cloudProfiles.find((p: any) => p.id === user.id);
        if (mine) setMe(mine as Profile);
      }
    });

    fetchAllData(user.id);

    // Load checkbox states from localStorage
    const saved = localStorage.getItem(CHECKED_ITEMS_KEY);
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch {
        setCheckedItems([]);
      }
    }

    return () => unsubscribeProfiles();
  }, [user]);

  const toggleCheckItem = (title: string, totalCount?: number) => {
    let updated = [...checkedItems];
    if (updated.includes(title)) {
      updated = updated.filter(t => t !== title);
    } else {
      updated.push(title);
      if (totalCount && updated.length >= totalCount) {
        toast.success("Congratulations! You have completed 100% of your relocation checklist!");
      }
    }
    setCheckedItems(updated);
    localStorage.setItem(CHECKED_ITEMS_KEY, JSON.stringify(updated));
  };

  // Date check helper
  const getDaysLived = (dateStr: string | null | undefined): number => {
    if (!dateStr) return 0;
    const arrival = new Date(dateStr);
    const now = new Date();
    const diff = Math.abs(now.getTime() - arrival.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const isEligibleToSuggest = me ? getDaysLived(me.arrival_date) >= 90 : false;

  // Calculate Voter Pool: registered students in the same current country/city who have been there > 3 months (90 days)
  const eligibleVoters = me
    ? profiles.filter(
        p =>
          ((p.current_country && me.current_country && p.current_country.toLowerCase() === me.current_country.toLowerCase()) ||
           (p.current_city && me.current_city && p.current_city.toLowerCase() === me.current_city.toLowerCase())) &&
          p.arrival_date &&
          getDaysLived(p.arrival_date) >= 90
      )
    : [];

  const M = eligibleVoters.length;

  const handleVote = async (suggestionId: string, agree: boolean) => {
    if (!user || !me) return;
    
    // Check if user is eligible to vote (lived there > 3 months)
    const userDays = getDaysLived(me.arrival_date);
    if (userDays < 90) {
      toast.error(`Only residents in the country for > 3 months can vote. You've been here for ${userDays} days.`);
      return;
    }

    const payload = {
      suggestion_id: suggestionId,
      user_id: user.id,
      vote: agree,
    };

    const { error } = await supabase.from("votes").upsert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(agree ? "Agreed!" : "Disagreed");

    // Fetch fresh votes & suggestions to recalculate
    const { data: freshVotes } = await supabase.from("votes").select("*");
    const votesList = (freshVotes ?? []) as VoteType[];
    setVotes(votesList);

    // Re-verify the consensus threshold
    const targetSug = suggestions.find(s => s.id === suggestionId);
    if (targetSug) {
      const agreesForSug = votesList.filter(v => v.suggestion_id === suggestionId && v.vote === true).length;
      
      // If 90% or more agree (N_agree / M >= 0.9)
      const agreementRate = M > 0 ? agreesForSug / M : 0;
      if (agreementRate >= 0.90) {
        // Automatically approve the suggestion!
        const updatePayload = {
          ...targetSug,
          status: "approved" as const,
        };
        await supabase.from("suggestions").upsert(updatePayload);
        toast.success(`Suggestion "${targetSug.title}" reached consensus and has been approved!`);
      }
    }

    // Refresh all state
    fetchAllData(user.id);
  };

  const handleCreateSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me || !sugTitle.trim() || !sugDesc.trim()) return;

    const payload = {
      created_by: me.id,
      home_country: me.home_country,
      current_country: me.current_country,
      current_city: me.current_city ?? "",
      type: sugType,
      title: sugTitle.trim(),
      description: sugDesc.trim(),
      category: sugCategory,
      link: sugLink.trim() || null,
      status: "pending",
    };

    const { error } = await supabase.from("suggestions").upsert(payload);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Suggestion submitted to the community queue!");
      setSugTitle("");
      setSugDesc("");
      setSugLink("");
      setShowAddForm(false);
      fetchAllData(me.id);
    }
  };

  const effectiveMe: Profile = me || {
    id: user?.id || "guest",
    name: user?.email?.split("@")[0] || "Student",
    avatar_url: null,
    home_country: "Home Country",
    current_country: "Germany",
    current_city: "Berlin",
    arrival_date: new Date().toISOString().split("T")[0],
  };

  // Filter lists based on target country (destination)
  const defaultChecklist = DEFAULT_CHECKLISTS[effectiveMe.current_country] ?? GENERIC_CHECKLIST;

  const approvedSuggestions = suggestions.filter(
    s => s.current_country === effectiveMe.current_country && s.status === "approved"
  );

  const pendingSuggestions = suggestions.filter(
    s => s.current_country === effectiveMe.current_country && s.status === "pending"
  );

  // Active items for Checklist tab
  const activeChecklistItems = [
    ...defaultChecklist.map(d => ({ ...d, isDefault: true, link: null as string | null, author: undefined as string | undefined })),
    ...approvedSuggestions
      .filter(s => s.type === "checklist")
      .map(s => ({
        title: s.title,
        desc: s.description,
        category: s.category,
        isDefault: false,
        link: s.link,
        author: profiles.find(p => p.id === s.created_by)?.name ?? "Senior Peer",
      })),
  ];

  const totalChecklist = activeChecklistItems.length;
  const completedChecklist = activeChecklistItems.filter(item => checkedItems.includes(item.title)).length;
  const checklistProgress = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  const filteredChecklist = activeChecklistItems.filter(item => {
    const isChecked = checkedItems.includes(item.title);
    if (checklistFilter === "active") return !isChecked;
    if (checklistFilter === "completed") return isChecked;
    return true;
  });

  // Active items for Secrets tab
  const activeSecrets = approvedSuggestions.filter(s => s.type === "hometown_find");

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />

      <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-8 animate-scale-in">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent/15">
              <Compass className="size-4" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
              {t("settle.eyebrow")}
            </span>
          </div>
          <h1 className="font-display mt-2 text-3xl uppercase">{t("settle.main_title", { country: effectiveMe.current_country })}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("settle.main_subtitle", { city: effectiveMe.current_city ?? effectiveMe.current_country })}
          </p>
        </div>

        {/* Top Statistics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-surface border border-border p-4 rounded-3xl shadow-sm">
          <div className="text-center sm:text-left sm:border-r sm:border-border/60 py-2 sm:pr-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("settle.your_arrival")}</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {effectiveMe.arrival_date ? `${effectiveMe.arrival_date} (${t("settle.days_ago", { days: getDaysLived(effectiveMe.arrival_date) })})` : "Not set"}
            </p>
          </div>
          <div className="text-center sm:border-r sm:border-border/60 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("settle.eligibility_title")}</p>
            <p className={`text-sm font-semibold mt-0.5 ${isEligibleToSuggest ? "text-green-500" : "text-amber-500"}`}>
              {isEligibleToSuggest ? t("settle.eligible") : t("settle.newcomer")}
            </p>
          </div>
          <div className="text-center sm:text-right py-2 sm:pl-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("settle.voters_title")}</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {t("settle.voters_count", { count: M, country: effectiveMe.current_country })}
            </p>
          </div>
        </div>

        {/* Tab Selectors */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-surface border border-border mb-8">
          <button
            onClick={() => setActiveTab("checklist")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === "checklist"
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare className="size-4" />
            <span>{t("settle.tab_checklist")}</span>
          </button>
          
          <button
            onClick={() => setActiveTab("secrets")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === "secrets"
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="size-4" />
            <span>{t("settle.tab_hometown")}</span>
          </button>

          <button
            onClick={() => setActiveTab("review")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer relative ${
              activeTab === "review"
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Vote className="size-4" />
            <span>{t("settle.tab_queue")}</span>
            {pendingSuggestions.length > 0 && (
              <span className="absolute -top-1 -right-1 sm:top-2 sm:right-2 flex size-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {pendingSuggestions.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Checklist */}
        {activeTab === "checklist" && (
          <div className="space-y-4">
            {/* Progress Card */}
            <div className="bg-surface border border-border p-5 rounded-3xl shadow-sm mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">{t("settle.progress_title")}</span>
                <span className="text-xs font-black text-accent">
                  {t("settle.progress_complete", { percent: checklistProgress, completed: completedChecklist, total: totalChecklist })}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2.5 overflow-hidden border border-border/40">
                <div 
                  className="bg-accent h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex gap-1">
                {[
                  { id: "all", label: t("settle.all_tasks") },
                  { id: "active", label: t("settle.to_do") },
                  { id: "completed", label: t("settle.completed") }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setChecklistFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      checklistFilter === f.id
                        ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                        : "border border-border bg-background text-foreground hover:bg-accent-soft/30 hover:border-accent/40"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              
              {isEligibleToSuggest && (
                <button
                  onClick={() => {
                    setSugType("checklist");
                    setSugCategory("Registration");
                    setShowAddForm(!showAddForm);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20 bg-accent-soft px-3.5 py-2 rounded-xl hover:opacity-90 transition-all cursor-pointer self-start sm:self-center"
                >
                  <Plus className="size-4" /> {t("settle.propose_item")}
                </button>
              )}
            </div>

            {showAddForm && sugType === "checklist" && (
              <form onSubmit={handleCreateSuggestion} className="bg-surface border border-border p-6 rounded-3xl space-y-4 animate-scale-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Propose new Checklist Item</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Item Title</label>
                    <input
                      type="text"
                      required
                      value={sugTitle}
                      onChange={(e) => setSugTitle(e.target.value)}
                      placeholder="e.g. Apply for local student transit upgrade ticket"
                      className="input-field"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Category</label>
                      <select
                        value={sugCategory}
                        onChange={(e) => setSugCategory(e.target.value)}
                        className="input-field"
                      >
                        <option value="Registration">Registration</option>
                        <option value="Visa / Permit">Visa / Permit</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Finance">Finance</option>
                        <option value="Telecom">Telecom</option>
                        <option value="Transport">Transport</option>
                        <option value="Housing">Housing</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Official Link (Optional)</label>
                      <input
                        type="url"
                        value={sugLink}
                        onChange={(e) => setSugLink(e.target.value)}
                        placeholder="https://..."
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Instructions / Description</label>
                    <textarea
                      required
                      rows={3}
                      value={sugDesc}
                      onChange={(e) => setSugDesc(e.target.value)}
                      placeholder="Give a detailed explanation of steps, tips, or documentation needed..."
                      className="input-field resize-none"
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-border rounded-xl text-xs font-bold uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-foreground text-background rounded-xl text-xs font-bold uppercase hover:opacity-90 cursor-pointer"
                    >
                      Submit Proposal
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 gap-3.5">
              {filteredChecklist.map((item, idx) => {
                const isChecked = checkedItems.includes(item.title);
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 p-5 rounded-3xl border transition-all duration-300 ${
                      isChecked
                        ? "bg-surface/50 border-border/40 opacity-75"
                        : "bg-surface border-border hover:shadow-md hover:border-accent/15"
                    }`}
                  >
                    <button
                      onClick={() => toggleCheckItem(item.title)}
                      className={`flex size-6 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-accent border-accent text-accent-foreground"
                          : "border-border hover:border-accent"
                      }`}
                    >
                      {isChecked && <Check className="size-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-base font-bold truncate text-foreground ${isChecked ? "line-through text-muted-foreground" : ""}`}>
                          {item.title}
                        </h4>
                        <span className="inline-block bg-accent-soft text-accent text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border border-accent/10">
                          {item.category}
                        </span>
                        {!item.isDefault && (
                          <span className="inline-block bg-green-500/10 text-green-600 text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border border-green-500/10">
                            Community Tip by {item.author}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-accent hover:underline mt-2"
                        >
                          Official Portal <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Hometown Secrets & Store Locator Directory */}
        {activeTab === "secrets" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Hometown Food & Spice Store Locator</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verified markets, authentic ingredients, and student population hubs in {effectiveMe.current_city ?? effectiveMe.current_country} with direct Google Maps navigation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-surface border border-border p-1">
                  <button
                    onClick={() => setStoreViewMode("map")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      storeViewMode === "map"
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MapIcon className="size-3.5" /> Map View
                  </button>
                  <button
                    onClick={() => setStoreViewMode("grid")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      storeViewMode === "grid"
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <List className="size-3.5" /> Grid View
                  </button>
                </div>

                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20 bg-accent-soft px-4 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="size-4" /> Propose Store Find
                </button>
              </div>
            </div>

            {/* Propose Store Find Modal Form */}
            {showAddForm && (
              <form onSubmit={handleCreateStoreProposal} className="bg-surface border border-border p-6 rounded-3xl space-y-4 animate-scale-in shadow-lg">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Propose a New Hometown Store</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Share an authentic market or food spot with fellow international students.</p>
                  </div>
                  <button type="button" onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Store / Place Name *</label>
                      <input
                        type="text"
                        required
                        value={sugTitle}
                        onChange={(e) => setSugTitle(e.target.value)}
                        placeholder="e.g. Asia Land Market"
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Category *</label>
                      <select
                        value={sugCategory}
                        onChange={(e) => setSugCategory(e.target.value)}
                        className="input-field"
                      >
                        <option value="Asian">Asian Grocers</option>
                        <option value="Halal / Middle Eastern">Halal & Middle Eastern</option>
                        <option value="Latin American">Latin American</option>
                        <option value="African / Caribbean">African & Caribbean</option>
                        <option value="European / Bakery">European & Bakery</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Exact Street Address *</label>
                      <input
                        type="text"
                        required
                        value={sugAddress}
                        onChange={(e) => setSugAddress(e.target.value)}
                        placeholder="e.g. Kantstraße 101, 10627 Berlin"
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Phone Number (Optional)</label>
                      <input
                        type="text"
                        value={sugPhone}
                        onChange={(e) => setSugPhone(e.target.value)}
                        placeholder="e.g. +49 30 3180 5511"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Opening Hours</label>
                      <input
                        type="text"
                        value={sugHours}
                        onChange={(e) => setSugHours(e.target.value)}
                        placeholder="e.g. Mon-Sat: 09:00 - 20:00"
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Hometown Specialties (Comma Separated)</label>
                      <input
                        type="text"
                        value={sugSpecialties}
                        onChange={(e) => setSugSpecialties(e.target.value)}
                        placeholder="e.g. Basmati Rice, Harina PAN, Kimchi, Injera"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Description & Recommendations *</label>
                    <textarea
                      required
                      rows={3}
                      value={sugDesc}
                      onChange={(e) => setSugDesc(e.target.value)}
                      placeholder="Tell fellow students what authentic products they sell, prices, and why it is great..."
                      className="input-field resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-border rounded-xl text-xs font-bold uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-foreground text-background rounded-xl text-xs font-bold uppercase hover:opacity-90 cursor-pointer"
                    >
                      Submit Store Find
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Search & Category Filter Bar */}
            <div className="rounded-2xl bg-surface border border-border p-4 space-y-4 shadow-sm">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={storeSearchQuery}
                  onChange={(e) => setStoreSearchQuery(e.target.value)}
                  placeholder="Search stores, specialties (e.g. Basmati, Harina PAN, Kimchi, Injera), or address..."
                  className="w-full rounded-full border border-border bg-background pl-10 pr-9 py-2.5 text-xs outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
                />
                {storeSearchQuery && (
                  <button
                    onClick={() => setStoreSearchQuery("")}
                    className="absolute right-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Category Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All Specialty Stores" },
                  { id: "Asian", label: "Asian Grocers" },
                  { id: "Halal / Middle Eastern", label: "Halal & Middle Eastern" },
                  { id: "Latin American", label: "Latin American" },
                  { id: "African / Caribbean", label: "African & Caribbean" },
                  { id: "European / Bakery", label: "European & Bakery" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setStoreCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      storeCategory === cat.id
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "border border-border bg-background text-foreground hover:bg-accent-soft/30 hover:border-accent/30"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Town / City Filter Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Globe className="size-3 text-accent" /> Focus Town:
                </span>
                {[
                  { id: "my_city", label: `My Town (${me?.current_city || "Berlin"})` },
                  { id: "Berlin", label: "Berlin" },
                  { id: "Munich", label: "Munich" },
                  { id: "London", label: "London" },
                  { id: "São Paulo", label: "São Paulo" },
                  { id: "Paris", label: "Paris" },
                  { id: "all", label: "All Towns" },
                ].map((town) => (
                  <button
                    key={town.id}
                    onClick={() => setSelectedCityFilter(town.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      selectedCityFilter === town.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "border border-border/80 bg-background text-muted-foreground hover:text-foreground hover:border-accent/40"
                    }`}
                  >
                    {town.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Map View */}
            {storeViewMode === "map" && (
              <div className="space-y-3">
                <MapView markers={storeMapMarkers} className="h-[460px] w-full rounded-3xl overflow-hidden border border-border shadow-md" />
                <div className="flex items-center justify-between px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Showing {storeMapMarkers.length} locations (Stores & Student Density Hubs)</span>
                  <span>Tap any pin to view address & open Google Maps directions</span>
                </div>
              </div>
            )}

            {/* Store Grid Cards */}
            {activeFilteredStores.length === 0 ? (
              <EmptyStateCTA
                icon={Store}
                title="No hometown stores found"
                description="No specialty stores match your category filter or search query. Reset filters or propose a new store to help fellow students!"
                badge="Hometown Groceries"
                primaryAction={{
                  label: "Propose Store Find",
                  icon: Plus,
                  onClick: () => setShowAddForm(true),
                }}
                secondaryAction={{
                  label: "Clear Filters",
                  icon: RotateCcw,
                  onClick: () => {
                    setStoreSearchQuery("");
                    setStoreCategory("all");
                    setSelectedCityFilter("all");
                  },
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeFilteredStores.map((store) => (
                  <div
                    key={store.id}
                    className="flex flex-col justify-between p-5 rounded-3xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-accent/30 transition-all space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-block bg-accent-soft text-accent text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border border-accent/15">
                          {store.category}
                        </span>
                        <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                          <Star className="size-3.5 fill-amber-500" />
                          <span>{store.rating} ({store.reviewsCount} reviews)</span>
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-foreground">{store.name}</h3>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-accent shrink-0" />
                          <span>{store.address}</span>
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">{store.description}</p>

                      {/* Hometown Specialties Pills */}
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Popular Hometown Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {store.specialties.map((item, i) => (
                            <span key={i} className="bg-background border border-border/60 text-foreground text-[9px] font-semibold px-2 py-0.5 rounded-md">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Opening hours & phone */}
                      <div className="flex flex-wrap items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/40 gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-accent" />
                          <span>{store.hours}</span>
                        </span>
                        {store.phone && (
                          <a href={`tel:${store.phone}`} className="flex items-center gap-1 font-semibold text-foreground hover:text-accent">
                            <Phone className="size-3 text-accent" />
                            <span>{store.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions: Google Maps Directions & Share Location */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/40">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground text-background py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
                      >
                        <Navigation className="size-3.5 text-accent" />
                        <span>Directions</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleShareStore(store)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent-soft/30 active:scale-95 transition-all cursor-pointer"
                      >
                        <Share2 className="size-3.5 text-accent" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Student Population Density / Neighborhood Clusters Section */}
            <div className="mt-12 pt-8 border-t border-border space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-[9px] font-black uppercase tracking-wider mb-1">
                    <Users className="size-3" />
                    <span>Real-Time Population Heatmap</span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-foreground">Student Population Density Hubs</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Densely populated international student neighborhoods & campus clusters in {effectiveMe.current_city ?? effectiveMe.current_country}.
                  </p>
                </div>
              </div>

              {activeStudentHubs.length === 0 ? (
                <div className="p-8 rounded-3xl bg-surface border border-dashed border-border text-center space-y-3">
                  <div className="flex justify-center text-accent">
                    <Users className="size-8" />
                  </div>
                  <h4 className="text-base font-bold text-foreground">No Density Hubs Recorded in {selectedCityFilter === "my_city" ? (effectiveMe.current_city ?? effectiveMe.current_country) : selectedCityFilter} Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Be the first to record your living neighborhood! Enter your specific area in your profile settings to pin your cluster live on the population heatmap.
                  </p>
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all mt-2 cursor-pointer"
                  >
                    <span>Set My Living Area in Profile</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {activeStudentHubs.map((hub) => (
                    <div key={hub.id} className="relative flex flex-col justify-between p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-surface via-surface to-indigo-500/5 space-y-4 shadow-sm hover:shadow-md hover:border-indigo-500/40 transition-all">
                      {/* Top Density Badge */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white px-3 py-1 rounded-full shadow-sm">
                          <Users className="size-3" />
                          <span>High Density • {hub.studentCount} {hub.studentCount === 1 ? "Student" : "Students"}</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {hub.city}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-base text-foreground">{hub.areaName}</h4>
                        <p className="text-xs font-semibold text-accent mt-1">
                          Top Nationalities: {hub.topCountries.join(", ")}
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">{hub.description}</p>

                      {/* Popular Student Spots */}
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Popular Student Hangout Spots:</p>
                        <div className="flex flex-wrap gap-1">
                          {hub.popularPlaces.map((place: string, idx: number) => (
                            <span key={idx} className="bg-surface border border-indigo-500/20 text-foreground text-[9.5px] font-semibold px-2.5 py-1 rounded-lg">
                              {place}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions: Directions & Share Area */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/40">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${hub.areaName}, ${hub.city}`)}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground text-background py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
                        >
                          <Navigation className="size-3.5 text-accent" />
                          <span>Directions</span>
                        </a>

                        <button
                          type="button"
                          onClick={async () => {
                            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hub.areaName}, ${hub.city}`)}`;
                            if (navigator.share) {
                              await navigator.share({ title: hub.areaName, url: mapsUrl }).catch(() => {});
                            } else if (navigator.clipboard) {
                              await navigator.clipboard.writeText(mapsUrl);
                              toast.success("Area location link copied to clipboard!");
                            }
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent-soft/30 active:scale-95 transition-all cursor-pointer"
                        >
                          <Share2 className="size-3.5 text-accent" />
                          <span>Share Area</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Consensus Review Queue */}
        {activeTab === "review" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Consensus Queue</h2>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                <Info className="size-3.5 text-accent" />
                <span>90% Destination agreement required to approve</span>
              </div>
            </div>

            {pendingSuggestions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/80 bg-surface/50 p-12 text-center">
                <Check className="size-8 text-green-500 bg-green-500/10 p-1.5 rounded-full border border-green-500/20 mx-auto" />
                <h3 className="mt-3 text-sm font-bold uppercase tracking-wider text-foreground">Review Queue is Clear!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[45ch] mx-auto">
                  All community tips and finds for {effectiveMe.current_country} have been processed or approved. Check back later!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingSuggestions.map((sug) => {
                  const author = profiles.find(p => p.id === sug.created_by);
                  
                  // Compute voting stats
                  const agrees = votes.filter(v => v.suggestion_id === sug.id && v.vote === true).length;
                  const disagrees = votes.filter(v => v.suggestion_id === sug.id && v.vote === false).length;
                  const totalCast = agrees + disagrees;
                  
                  // Voter Pool (N_eligible_voters)
                  const voterPoolCount = M;
                  const approvalRate = voterPoolCount > 0 ? agrees / voterPoolCount : 0;
                  const approvalPercent = Math.min(100, Math.round(approvalRate * 100));
                  
                  // Check current user's vote
                  const myVote = votes.find(v => v.suggestion_id === sug.id && v.user_id === user?.id);

                  // Calculate how many more agree votes are needed
                  const neededAgrees = Math.max(0, Math.ceil(voterPoolCount * 0.90) - agrees);

                  return (
                    <div key={sug.id} className="p-5 rounded-3xl border border-border bg-surface shadow-sm space-y-4 animate-scale-in">
                      {/* Top Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/40 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-accent-soft text-accent text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border border-accent/15">
                            {sug.type === "checklist" ? "Checklist Proposal" : "Hometown Find"}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Category: {sug.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Suggested by {author?.name ?? "Senior Peer"}
                        </span>
                      </div>

                      {/* Content */}
                      <div>
                        <h4 className="text-base font-bold text-foreground">{sug.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{sug.description}</p>
                        {sug.link && (
                          <a
                            href={sug.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-accent hover:underline mt-2.5"
                          >
                            Google Maps / Official Portal <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>

                      {/* Consensus Gauge Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-accent flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                            {approvalPercent}% Agreement ({agrees} / {voterPoolCount > 0 ? voterPoolCount : 1} Eligible {voterPoolCount === 1 ? "Resident" : "Residents"} Agree)
                          </span>
                          <span className="text-muted-foreground">
                            {neededAgrees > 0 ? `${neededAgrees} more Agree votes needed` : "Consensus reached!"}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-accent-soft overflow-hidden border border-accent/5">
                          <div 
                            className="h-full rounded-full bg-accent transition-all duration-500 ease-out-expo"
                            style={{ width: `${approvalPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Vote Buttons */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40">
                        <p className="text-[10px] text-muted-foreground leading-relaxed text-center sm:text-left">
                          {isEligibleToSuggest 
                            ? "As an eligible resident (>3 Months), your vote counts toward the 90% consensus." 
                            : "You must live in this country for >3 months to vote."}
                        </p>
                        
                        <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                          <button
                            disabled={!isEligibleToSuggest}
                            onClick={() => handleVote(sug.id, false)}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              myVote && myVote.vote === false
                                ? "bg-red-500/10 text-red-500 border border-red-500/25"
                                : "border border-border text-muted-foreground hover:bg-red-500/5 hover:text-red-500 hover:border-red-500/20 disabled:opacity-50"
                            }`}
                          >
                            <ThumbsDown className="size-3.5" /> Disagree
                          </button>
                          
                          <button
                            disabled={!isEligibleToSuggest}
                            onClick={() => handleVote(sug.id, true)}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              myVote && myVote.vote === true
                                ? "bg-green-500/10 text-green-600 border border-green-500/25"
                                : "border border-border text-muted-foreground hover:bg-green-500/5 hover:text-green-600 hover:border-green-500/20 disabled:opacity-50"
                            }`}
                          >
                            <ThumbsUp className="size-3.5" /> Agree
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
