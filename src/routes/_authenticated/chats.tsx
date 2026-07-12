import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, Globe, Home, MapPin, Sparkles, Compass } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { codeFor } from "@/lib/countries";

export const Route = createFileRoute("/_authenticated/chats")({
  component: ChatsPage,
});

type Message = {
  id: string;
  user_id: string;
  user_name: string;
  home_country: string;
  current_city: string;
  channel: string;
  content: string;
  created_at: string;
};

type Profile = {
  id: string;
  name: string;
  home_country: string;
  current_country: string;
  current_city: string;
  onboarded: boolean;
};

function ChatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"global" | "home_country" | "current_country" | "current_city">("global");
  const feedContainerRef = useRef<HTMLDivElement>(null);

  // Fetch current user details
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (!data || !data.onboarded) {
        navigate({ to: "/onboarding" });
        return;
      }
      setMe(data as Profile);
      setLoading(false);
    })();
  }, [user, navigate]);

  // Determine current channel name
  const currentChannel = typeof window !== "undefined" && me 
    ? activeTab === "global" 
      ? "global" 
      : activeTab === "home_country" 
        ? `home_country_${me.home_country}` 
        : activeTab === "current_country"
          ? `current_country_${me.current_country}`
          : `current_city_${me.current_city}`
    : "global";

  // Fetch channel messages
  const fetchMessages = async () => {
    if (!me) return;
    const { data } = await supabase
      .from("chats")
      .select("*")
      .eq("channel", currentChannel);
    // Sort chronologically by date
    const sorted = (data ?? []).sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    setMessages(sorted as Message[]);
  };

  useEffect(() => {
    if (!me) return;
    fetchMessages();
    
    // Set up a tiny local storage polling interval to simulate "live" updates if they open two tabs
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [me, currentChannel]);

  // Scroll to bottom on new messages without moving page viewport
  useEffect(() => {
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTop = feedContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !me || !user) return;

    const payload = {
      user_id: user.id,
      user_name: me.name,
      home_country: me.home_country,
      current_city: me.current_city,
      channel: currentChannel,
      content: newMessage.trim(),
    };

    await supabase.from("chats").upsert(payload);
    setNewMessage("");
    fetchMessages();
  };

  if (loading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground animate-pulse bg-background">
        Loading chats...
      </div>
    );
  }

  const channelLabel = activeTab === "global" 
    ? "Global Community" 
    : activeTab === "home_country" 
      ? `Students from ${me.home_country}` 
      : activeTab === "current_country"
        ? `Students in ${me.current_country}`
        : `Students in ${me.current_city}`;

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />

      <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-8 animate-scale-in">
        {/* Header Summary */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent/15">
                <MessageSquare className="size-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                Cluster Live Chats
              </span>
            </div>
            <h1 className="font-display mt-2 text-3xl uppercase">Chat Rooms</h1>
          </div>
        </div>

        {/* Tab Channel Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-surface border border-border mb-6">
          <button
            onClick={() => setActiveTab("global")}
            className={`flex items-center justify-center gap-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.96] duration-150 cursor-pointer ${
              activeTab === "global"
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="size-4" />
            <span>Global</span>
          </button>
          
          <button
            onClick={() => setActiveTab("home_country")}
            className={`flex items-center justify-center gap-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.96] duration-150 cursor-pointer ${
              activeTab === "home_country"
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="size-4" />
            <span>From {codeFor(me.home_country)}</span>
          </button>

          <button
            onClick={() => setActiveTab("current_country")}
            className={`flex items-center justify-center gap-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.96] duration-150 cursor-pointer ${
              activeTab === "current_country"
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Compass className="size-4" />
            <span>In {codeFor(me.current_country)}</span>
          </button>

          <button
            onClick={() => setActiveTab("current_city")}
            className={`flex items-center justify-center gap-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.96] duration-150 cursor-pointer ${
              activeTab === "current_city"
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="size-4" />
            <span>In {me.current_city}</span>
          </button>
        </div>

        {/* Responsive Flex Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Chat Room Details (4 cols - Desktop Only) */}
          <div className="md:col-span-4 bg-surface border border-border rounded-3xl p-5 space-y-4 hidden md:block md:sticky md:top-24">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border">Channel details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent">{channelLabel}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {activeTab === "global" && "A public lobby to chat with every international student registered on ConnectAbroad."}
                  {activeTab === "home_country" && `Connect and share advice with other students who came from ${me.home_country}.`}
                  {activeTab === "current_country" && `Discuss events, housing, visas, and travel tips with students living in ${me.current_country}.`}
                  {activeTab === "current_city" && `Discuss local spots, housing, and university tips with students located in ${me.current_city}.`}
                </p>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Posting as:</p>
                <div className="flex items-center gap-3 mt-2 p-2 rounded-xl bg-background border border-border/40">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground text-xs font-black">
                    {me.name.split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate text-foreground">{me.name}</p>
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase">{codeFor(me.home_country)} &rarr; {me.current_city}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Chat Box & Send Form (8 cols) */}
          <div className="md:col-span-8 flex flex-col rounded-3xl border border-border bg-surface shadow-sm overflow-hidden h-[500px]">
            {/* Feed Header */}
            <div className="bg-background/40 border-b border-border px-5 py-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">{channelLabel}</span>
              <span className="inline-flex size-2 animate-pulse rounded-full bg-accent" />
            </div>

            {/* Chat message feed log */}
            <div ref={feedContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <MessageSquare className="size-8 text-accent/40 mb-2" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No messages yet</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[28ch]">Be the first to post a message in this channel!</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.user_id === user?.id;
                const initials = msg.user_name
                  .split(" ")
                  .map(s => s[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-end gap-2.5 animate-scale-in max-w-[85%] ${
                      isMine ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    {/* User Initials Circle */}
                    {!isMine && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent text-[10px] font-black border border-accent/15">
                        {initials}
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`rounded-2xl p-3 border text-xs shadow-sm ${
                      isMine 
                        ? "bg-foreground text-background border-foreground" 
                        : "bg-background text-foreground border-border"
                    }`}>
                      {!isMine && (
                        <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold text-accent uppercase tracking-wider">
                          <span>{msg.user_name}</span>
                          <span className="inline-flex items-center justify-center bg-accent-soft text-accent text-[8px] px-1 rounded">
                            {codeFor(msg.home_country)}
                          </span>
                        </div>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap break-all">{msg.content}</p>
                      <span className={`block text-[8px] mt-1.5 text-right ${
                        isMine ? "text-background/60" : "text-muted-foreground"
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Send Message Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-border bg-background/20 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Type a message in ${activeTab}...`}
                className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs outline-none transition-all duration-300 focus:border-accent focus:ring-4 focus:ring-accent/15"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-all duration-300 hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:scale-100 cursor-pointer"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
