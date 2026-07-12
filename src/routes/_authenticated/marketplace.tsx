import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  User, 
  ExternalLink, 
  MessageCircle, 
  Globe, 
  GraduationCap, 
  ArrowUpRight, 
  Search, 
  MapPin, 
  Home, 
  Heart,
  X,
  Languages,
  ChefHat,
  Clock
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { codeFor } from "@/lib/countries";

export const Route = createFileRoute("/_authenticated/marketplace")({
  component: MarketplacePage,
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
  favorite_dish: string | null;
  languages_spoken: string | null;
  languages_learning: string | null;
  major: string | null;
  is_buddy?: boolean;
  arrival_date: string | null;
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

type MarketItem = {
  id: string;
  user_id: string;
  user_name: string;
  category: "sublet" | "flatshare" | "sale" | "free" | "wanted";
  title: string;
  description: string;
  price: string | null;
  contact_info: string;
  current_city: string;
  created_at: string;
};

function MarketplacePage() {
  const { user } = useAuth();
  const [me, setMe] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Post form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState<"sublet" | "flatshare" | "sale" | "free" | "wanted">("sublet");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newContact, setNewContact] = useState("");

  // Detailed profile overlay modal state
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const fetchMarketData = async (userId: string) => {
    // 1. Fetch current profile
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (myProfile) setMe(myProfile as Profile);

    // 2. Fetch all profiles (to display poster info)
    const { data: allProfiles } = await supabase.from("profiles").select("*");
    setProfiles((allProfiles ?? []) as Profile[]);

    // 3. Fetch marketplace items
    const { data: allItems } = await supabase.from("marketplace").select("*");
    setItems((allItems ?? []) as MarketItem[]);
  };

  useEffect(() => {
    if (!user) return;
    fetchMarketData(user.id).then(() => {
      setLoading(false);
    });
  }, [user]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me || !newTitle.trim() || !newDesc.trim() || !newContact.trim()) return;

    const payload = {
      user_id: me.id,
      user_name: me.name,
      category: newCategory,
      title: newTitle.trim(),
      description: newDesc.trim(),
      price: newPrice.trim() || null,
      contact_info: newContact.trim(),
      current_city: me.current_city ?? "Berlin",
    };

    const { error } = await supabase.from("marketplace").upsert(payload);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Marketplace post created successfully!");
      setNewTitle("");
      setNewDesc("");
      setNewPrice("");
      setNewContact("");
      setShowAddModal(false);
      fetchMarketData(me.id);
    }
  };

  const handleDeletePost = async (itemId: string) => {
    if (!me) return;
    const confirm = window.confirm("Are you sure you want to delete this listing?");
    if (!confirm) return;

    const { error } = await supabase.from("marketplace").eq("id", itemId).delete();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Listing deleted");
      fetchMarketData(me.id);
    }
  };

  const handleOpenProfile = (userId: string) => {
    const poster = profiles.find(p => p.id === userId);
    if (poster) {
      setSelectedProfile(poster);
    } else {
      toast.error("Could not load user profile");
    }
  };

  if (loading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground bg-background animate-pulse">
        Loading student marketplace...
      </div>
    );
  }

  // Filter items by city (local exchange) and apply search query
  const cityItems = items.filter(
    item => item.current_city.toLowerCase() === (me.current_city ?? "berlin").toLowerCase()
  );

  const filteredItems = cityItems
    .filter(item => {
      // Category check
      if (activeCategory !== "all" && item.category !== activeCategory) return false;

      // Text search check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.user_name.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />

      <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-8 animate-scale-in">
        {/* Header summary */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent/15">
                <ShoppingBag className="size-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                Student Housing & Trade
              </span>
            </div>
            <h1 className="font-display mt-2 text-3xl uppercase">Marketplace in {me.current_city}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Find student sublets, roommates, and buy or sell furniture and textbooks within your trusted university network.
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="self-start md:self-center inline-flex items-center gap-1.5 rounded-full bg-foreground px-6 py-3.5 text-xs font-semibold text-background hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-black/10 cursor-pointer"
          >
            <Plus className="size-4" /> Create Listing
          </button>
        </div>

        {/* Search and Category Filters Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-surface border border-border p-4 rounded-3xl shadow-sm mb-6">
          {/* Search */}
          <div className="relative flex items-center md:col-span-4">
            <Search className="absolute left-3.5 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms, tables, books..."
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40 focus:shadow-md transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="md:col-span-8 flex flex-wrap gap-1.5 md:justify-end">
            {[
              { id: "all", label: "All Items" },
              { id: "sublet", label: "Sublets" },
              { id: "flatshare", label: "Flatshares" },
              { id: "sale", label: "For Sale" },
              { id: "free", label: "Free Items" },
              { id: "wanted", label: "Wanted" },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                    : "border border-border bg-background text-foreground hover:bg-accent-soft/30 hover:border-accent/40"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Feed */}
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 bg-surface/50 p-12 text-center">
            <ShoppingBag className="size-10 text-muted-foreground mx-auto opacity-50" />
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wider text-foreground">No listings found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[38ch] mx-auto">
              We couldn't find any listings matching your selection in {me.current_city}. Try adjusting your search query or create the first post!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const poster = profiles.find(p => p.id === item.user_id);
              const posterInitials = item.user_name
                .split(" ")
                .map(s => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div 
                  key={item.id} 
                  onClick={() => handleOpenProfile(item.user_id)}
                  className="group flex flex-col justify-between p-5 rounded-3xl border border-border bg-surface shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:shadow-md hover:border-accent/15 duration-150 animate-scale-in"
                >
                  <div>
                    {/* Category and Price Bar */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3.5">
                      <span className="inline-block bg-accent-soft text-accent text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border border-accent/10">
                        {item.category === "sublet" ? "Sublet" : item.category === "flatshare" ? "Flatshare" : item.category === "sale" ? "For Sale" : item.category === "free" ? "Free" : "Wanted"}
                      </span>
                      {item.price ? (
                        <span className="text-xs font-bold text-accent">{item.price}</span>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Value details N/A</span>
                      )}
                    </div>

                    {/* Listing Title */}
                    <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors truncate">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-4 leading-relaxed h-[72px] overflow-hidden">{item.description}</p>
                  </div>

                  {/* Poster details & Actions */}
                  <div className="mt-4 pt-3.5 border-t border-border/40 flex items-center justify-between gap-3">
                    {/* User profile bubble click */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProfile(item.user_id);
                      }}
                      className="flex items-center gap-2 text-left hover:opacity-85 cursor-pointer min-w-0"
                    >
                      {poster?.avatar_url ? (
                        <img
                          src={poster.avatar_url}
                          alt={item.user_name}
                          className="size-7.5 shrink-0 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent text-[10px] font-bold border border-accent/15">
                          {posterInitials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-foreground truncate">{item.user_name}</p>
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5 truncate">
                          {poster?.home_country ? `${codeFor(poster.home_country)} Peer` : "View Profile"}
                        </p>
                      </div>
                    </button>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {me.id === item.user_id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(item.id);
                          }}
                          className="p-2 rounded-lg border border-red-500/10 hover:bg-red-500/5 text-red-500 transition-colors cursor-pointer"
                          title="Delete Listing"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProfile(item.user_id);
                          }}
                          className="px-3 py-2 rounded-lg border border-border hover:bg-accent-soft/30 text-accent font-bold uppercase tracking-wider text-[9px] cursor-pointer"
                        >
                          Connect
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

      {/* CREATE POST MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-surface border border-border p-6 rounded-3xl shadow-2xl animate-scale-in z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h2 className="text-base font-bold uppercase tracking-wider text-foreground">Create a Listing</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="input-field cursor-pointer"
                  >
                    <option value="sublet">Sublet / Room</option>
                    <option value="flatshare">Roommate Search</option>
                    <option value="sale">For Sale (Used item)</option>
                    <option value="free">Free Stuff</option>
                    <option value="wanted">Wanted Requests</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Price / Budget</label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. €450/mo or Free"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Listing Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Bedroom in cozy Berlin apartment"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Listing Details</label>
                <textarea
                  required
                  rows={4}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe location, condition of items, room sizes, lease parameters, etc..."
                  className="input-field resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">How to contact you?</label>
                <input
                  type="text"
                  required
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="e.g. WhatsApp: +49..., IG: @handle, or Email"
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-foreground text-background rounded-xl text-xs font-bold uppercase hover:opacity-90 cursor-pointer"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PEER PROFILE DRAWER / OVERLAY */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedProfile(null)} />

          {/* Card overlay container */}
          <div className="relative w-full max-w-md bg-surface border border-border p-6 rounded-3xl shadow-2xl animate-scale-in z-10">
            {/* Close */}
            <button 
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer p-1"
            >
              <X className="size-5" />
            </button>

            {/* Profile contents */}
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
                        `Hi ${selectedProfile.name}! I saw your listing on ConnectAbroad. I am also from ${
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
                        const message = `Hi ${selectedProfile.name}! I saw your listing on ConnectAbroad. I am also from ${
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
