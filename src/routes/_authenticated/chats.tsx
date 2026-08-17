import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, Globe, Home, MapPin, Sparkles, Compass } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { EmptyStateCTA } from "@/components/EmptyStateCTA";
import { useAuth } from "@/lib/auth";
import { codeFor } from "@/lib/countries";
import { useTranslation } from "@/lib/i18n";
import {
  subscribeProfiles,
  subscribeChannelChats,
  addChatMessageToFirebase,
  type ChatMessageItem,
} from "@/integrations/firebase/firestore";

export const Route = createFileRoute("/_authenticated/chats")({
  component: ChatsPage,
});

type Profile = {
  id: string;
  name: string;
  home_country: string;
  current_country: string;
  current_city: string;
  onboarded: boolean;
};

function ChatsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [me, setMe] = useState<Profile | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("connect_abroad_profile");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"global" | "home_country" | "current_country" | "current_city">("global");
  const feedContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to live Firebase Firestore user profiles to keep details updated
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeProfiles((profiles: any[]) => {
      const mine = profiles.find(
        (p) =>
          p.id === user.id ||
          (p.name && user.displayName && p.name.toLowerCase() === user.displayName.toLowerCase()) ||
          (p.name && me?.name && p.name.toLowerCase() === me.name.toLowerCase())
      );
      if (mine) {
        setMe(mine as Profile);
        localStorage.setItem("connect_abroad_profile", JSON.stringify(mine));
      }
    });
    return () => unsubscribe();
  }, [user]);

  const effectiveMe: Profile = me || {
    id: user?.id || "guest",
    name: user?.displayName || user?.email?.split("@")[0] || "Student",
    home_country: "India",
    current_country: "Italy",
    current_city: "Parma",
    onboarded: true,
  };

  // Determine current channel name based on exact user details
  const currentChannel = activeTab === "global" 
    ? "global" 
    : activeTab === "home_country" 
      ? `home_country_${effectiveMe.home_country}` 
      : activeTab === "current_country"
        ? `current_country_${effectiveMe.current_country}`
        : `current_city_${effectiveMe.current_city ?? effectiveMe.current_country}`;

  // Subscribe to real-time Firebase Cloud Chat Messages
  useEffect(() => {
    if (!currentChannel) return;
    const unsubscribe = subscribeChannelChats(currentChannel, (cloudMsgs) => {
      setMessages(cloudMsgs);
    });
    return () => unsubscribe();
  }, [currentChannel]);

  // Scroll to bottom on new messages without moving page viewport
  useEffect(() => {
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTop = feedContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const contentText = newMessage.trim();
    setNewMessage("");

    await addChatMessageToFirebase({
      user_id: user.id,
      user_name: effectiveMe.name,
      home_country: effectiveMe.home_country,
      current_city: effectiveMe.current_city ?? effectiveMe.current_country,
      channel: currentChannel,
      content: contentText,
    });
  };

  const channelLabel = activeTab === "global" 
    ? t("chats.global_community") 
    : activeTab === "home_country" 
      ? t("chats.home_country_desc", { country: effectiveMe.home_country })
      : activeTab === "current_country"
        ? t("chats.current_country_desc", { country: effectiveMe.current_country })
        : t("chats.current_city_desc", { city: effectiveMe.current_city ?? effectiveMe.current_country });

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
                {t("chats.eyebrow")}
              </span>
            </div>
            <h1 className="font-display mt-2 text-3xl uppercase">{t("chats.title")}</h1>
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
            <span>{t("chats.global")}</span>
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
            <span>{t("chats.from_in", { country: codeFor(effectiveMe.home_country) })}</span>
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
            <span>{t("chats.in_country", { country: codeFor(effectiveMe.current_country) })}</span>
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
            <span>{t("chats.in_city", { city: effectiveMe.current_city ?? effectiveMe.current_country })}</span>
          </button>
        </div>

        {/* Responsive Flex Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Chat Room Details (4 cols - Desktop Only) */}
          <div className="md:col-span-4 bg-surface border border-border rounded-3xl p-5 space-y-4 hidden md:block md:sticky md:top-24">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border">{t("chats.channel_details")}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  {activeTab === "global" ? t("chats.global_community") : channelLabel}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {activeTab === "global" && t("chats.global_desc")}
                  {activeTab === "home_country" && t("chats.home_country_desc", { country: effectiveMe.home_country })}
                  {activeTab === "current_country" && t("chats.current_country_desc", { country: effectiveMe.current_country })}
                  {activeTab === "current_city" && t("chats.current_city_desc", { city: effectiveMe.current_city ?? effectiveMe.current_country })}
                </p>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("chats.posting_as")}</p>
                <div className="flex items-center gap-3 mt-2 p-2 rounded-xl bg-background border border-border/40">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground text-xs font-black">
                    {effectiveMe.name.split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate text-foreground">{effectiveMe.name}</p>
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase">{codeFor(effectiveMe.home_country)} &rarr; {effectiveMe.current_city ?? effectiveMe.current_country}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Chat Box & Send Form (8 cols) */}
          <div className="md:col-span-8 flex flex-col rounded-3xl border border-border bg-surface shadow-sm overflow-hidden h-[500px]">
            {/* Feed Header */}
            <div className="bg-background/40 border-b border-border px-5 py-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                {activeTab === "global" ? t("chats.global_community") : channelLabel}
              </span>
              <span className="inline-flex size-2 animate-pulse rounded-full bg-accent" />
            </div>

            {/* Chat message feed log */}
            <div ref={feedContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {messages.length === 0 && (
                <EmptyStateCTA
                  icon={MessageSquare}
                  title="No chat messages yet"
                  description="Be the first to say hello in this channel! Connect with peers and native local hosts."
                  badge="Real-Time Chat"
                  primaryAction={{
                    label: "Say Hello",
                    icon: Send,
                    onClick: () => {
                      setNewMessage("Hello everyone! Glad to connect here.");
                    },
                  }}
                />
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

            {/* Quick Greeting Action Chips */}
            <div className="px-4 pt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-border/40">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 mr-1">Quick Greetings:</span>
              {[
                { label: "Hello", text: "Hello everyone!" },
                { label: "Welcome", text: "Welcome to the group!" },
                { label: "Coffee", text: "Anyone free for coffee today?" },
                { label: "Local Guide", text: "Any local native guides around?" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setNewMessage((prev) => (prev ? `${prev} ${chip.text}` : chip.text))}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-surface border border-border text-foreground hover:bg-accent-soft/30 hover:border-accent/30 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Send Message Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-border/40 bg-background/20 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("chats.type_message")}
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
    </div>
  );
}
