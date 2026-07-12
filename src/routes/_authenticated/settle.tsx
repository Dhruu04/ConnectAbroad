import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Compass
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

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
  arrival_date: string | null;
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
  const [sugCategory, setSugCategory] = useState("Registration");
  const [sugLink, setSugLink] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchAllData = async (userId: string) => {
    // 1. Fetch current profile
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (myProfile) {
      setMe(myProfile as Profile);
    }

    // 2. Fetch all profiles (to calculate voter pool count)
    const { data: allProfiles } = await supabase.from("profiles").select("*");
    setProfiles((allProfiles ?? []) as Profile[]);

    // 3. Fetch suggestions
    const { data: allSug } = await supabase.from("suggestions").select("*");
    setSuggestions((allSug ?? []) as Suggestion[]);

    // 4. Fetch votes
    const { data: allVotes } = await supabase.from("votes").select("*");
    setVotes((allVotes ?? []) as VoteType[]);
  };

  useEffect(() => {
    if (!user) return;
    fetchAllData(user.id).then(() => {
      setLoading(false);
    });

    // Load checkbox states from localStorage
    const saved = localStorage.getItem(CHECKED_ITEMS_KEY);
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch {
        setCheckedItems([]);
      }
    }
  }, [user]);

  const toggleCheckItem = (title: string) => {
    let updated = [...checkedItems];
    if (updated.includes(title)) {
      updated = updated.filter(t => t !== title);
    } else {
      updated.push(title);
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

  // Calculate Voter Pool: registered students in the same current country who have been there > 3 months (90 days)
  const eligibleVoters = me
    ? profiles.filter(
        p =>
          p.current_country === me.current_country &&
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
        toast.success(`🎉 Suggestion "${targetSug.title}" reached 90% consensus and has been approved!`);
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

  if (loading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground bg-background animate-pulse">
        Loading settlement guides...
      </div>
    );
  }

  // Filter lists based on target country (destination)
  const defaultChecklist = DEFAULT_CHECKLISTS[me.current_country] ?? GENERIC_CHECKLIST;

  const approvedSuggestions = suggestions.filter(
    s => s.current_country === me.current_country && s.status === "approved"
  );

  const pendingSuggestions = suggestions.filter(
    s => s.current_country === me.current_country && s.status === "pending"
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
              Arrival & Settlement Wiki
            </span>
          </div>
          <h1 className="font-display mt-2 text-3xl uppercase">Settle In {me.current_country}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Navigate administrative steps and find hometown goods in {me.current_city ?? me.current_country} with consensus-approved guides.
          </p>
        </div>

        {/* Top Statistics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-surface border border-border p-4 rounded-3xl shadow-sm">
          <div className="text-center sm:text-left sm:border-r sm:border-border/60 py-2 sm:pr-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Your Arrival</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {me.arrival_date ? `${me.arrival_date} (${getDaysLived(me.arrival_date)} days ago)` : "Not set"}
            </p>
          </div>
          <div className="text-center sm:border-r sm:border-border/60 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suggest & Vote Eligibility</p>
            <p className={`text-sm font-semibold mt-0.5 ${isEligibleToSuggest ? "text-green-500" : "text-amber-500"}`}>
              {isEligibleToSuggest ? "Eligible (>3 Months)" : "Ineligible (Lived here <90 Days)"}
            </p>
          </div>
          <div className="text-center sm:text-right py-2 sm:pl-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Local Consensus Voters</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {M} voters ({me.current_country})
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
            <span>Relocation Checklist</span>
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
            <span>Hometown Finds</span>
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
            <span>Consensus Queue</span>
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
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Relocation Progress</span>
                <span className="text-xs font-black text-accent">{checklistProgress}% Complete ({completedChecklist}/{totalChecklist} Tasks)</span>
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
                  { id: "all", label: "All Tasks" },
                  { id: "active", label: "To Do" },
                  { id: "completed", label: "Completed" }
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
                  <Plus className="size-4" /> Propose Item
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

        {/* Tab 2: Hometown Secrets Directory */}
        {activeTab === "secrets" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Hometown Finds</h2>
              {isEligibleToSuggest && (
                <button
                  onClick={() => {
                    setSugType("hometown_find");
                    setSugCategory("Grocery Store");
                    setShowAddForm(!showAddForm);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20 bg-accent-soft px-3.5 py-2 rounded-xl hover:opacity-90 transition-all cursor-pointer"
                >
                  <Plus className="size-4" /> Propose Find
                </button>
              )}
            </div>

            {showAddForm && sugType === "hometown_find" && (
              <form onSubmit={handleCreateSuggestion} className="bg-surface border border-border p-6 rounded-3xl space-y-4 animate-scale-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Propose new Hometown Find</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Place Name</label>
                    <input
                      type="text"
                      required
                      value={sugTitle}
                      onChange={(e) => setSugTitle(e.target.value)}
                      placeholder="e.g. Little Asia Market"
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
                        <option value="Grocery Store">Grocery Store</option>
                        <option value="Restaurant">Restaurant</option>
                        <option value="Student Hub">Student Hub</option>
                        <option value="Hair Salon / Beauty">Hair Salon / Beauty</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Google Maps Link (Optional)</label>
                      <input
                        type="url"
                        value={sugLink}
                        onChange={(e) => setSugLink(e.target.value)}
                        placeholder="https://maps.google.com/..."
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Why recommend this place?</label>
                    <textarea
                      required
                      rows={3}
                      value={sugDesc}
                      onChange={(e) => setSugDesc(e.target.value)}
                      placeholder="Describe what they sell, home country items they carry, prices, and where it is..."
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
                      Submit Find
                    </button>
                  </div>
                </div>
              </form>
            )}

            {activeSecrets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/80 bg-surface/50 p-12 text-center">
                <MapPin className="size-8 text-muted-foreground mx-auto opacity-60" />
                <h3 className="mt-3 text-sm font-bold uppercase tracking-wider">No local secrets recorded yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[40ch] mx-auto">
                  Be the first to list a grocery store, authentic restaurant, or local student hub in {me.current_city}!
                </p>
                {isEligibleToSuggest && (
                  <button
                    onClick={() => {
                      setSugType("hometown_find");
                      setSugCategory("Grocery Store");
                      setShowAddForm(true);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/20 bg-accent-soft px-3.5 py-2 rounded-xl hover:opacity-90 transition-all mt-4 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Submit new place
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeSecrets.map((find) => {
                  const author = profiles.find(p => p.id === find.created_by);
                  return (
                    <div key={find.id} className="flex flex-col justify-between p-5 rounded-3xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-accent/15 transition-all">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-block bg-accent-soft text-accent text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border border-accent/10">
                            {find.category}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            Shared by {author?.name ?? "Senior Peer"}
                          </span>
                        </div>
                        <h4 className="text-base font-bold mt-2 text-foreground">{find.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{find.description}</p>
                      </div>
                      
                      {find.link && (
                        <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center">
                          <a
                            href={find.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent hover:underline"
                          >
                            Google Maps location <ExternalLink className="size-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
                  All community tips and finds for {me.current_country} have been processed or approved. Check back later!
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
                            {approvalPercent}% Agreement ({agrees} / {voterPoolCount} Eligible Residents Agree)
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

      <BottomNav />
    </div>
  );
}
