import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Share2, Award, Users, MapPin } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { QrCode } from "@/components/QrCode";
import { useTranslation } from "@/lib/i18n";
import { subscribeProfiles } from "@/integrations/firebase/firestore";
import type { Profile } from "@/routes/_authenticated/discover";

export const Route = createFileRoute("/_authenticated/invite")({
  component: Invite,
});

function Invite() {
  const { t } = useTranslation();
  const [origin, setOrigin] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);

    // Real-time Cloud Synchronization via Firebase Firestore
    const unsubscribe = subscribeProfiles((cloudProfiles) => {
      setProfiles(cloudProfiles);
      setLoadingStats(false);
    });

    return () => unsubscribe();
  }, []);

  const url = origin ? `${origin}/discover` : "";

  // Real Dynamic Community Statistics calculated live from Firebase Firestore
  const totalMembers = profiles.length;
  const nationsCount = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.home_country).filter(Boolean))).length,
    [profiles]
  );

  const destinationClusters = useMemo(() => {
    if (profiles.length === 0) return [];
    const cityCounts: Record<string, number> = {};
    profiles.forEach((p) => {
      const city = p.current_city || p.current_country || "Germany";
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    return Object.entries(cityCounts)
      .map(([city, count]) => ({
        city,
        count,
        percentage: Math.round((count / profiles.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [profiles]);

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  }

  async function share() {
    if (!url) return;
    if (navigator.share) {
      await navigator
        .share({ title: "Join me on ConnectAbroad", text: "Find your hometown abroad.", url })
        .catch(() => {});
    } else {
      copy();
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />

      <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-8 animate-scale-in">
        {/* Header Summary */}
        <div className="mb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
            {t("invite.eyebrow")}
          </span>
          <h1 className="font-display mt-2 text-3xl md:text-4xl uppercase leading-none">
            {t("invite.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("invite.subtitle")}
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: QR Card (5 cols) */}
          <div className="md:col-span-5 bg-accent-soft/40 p-1 rounded-3xl border border-border">
            <div className="flex flex-col items-center gap-6 rounded-3xl bg-surface p-6 md:p-8 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{t("invite.qr_label")}</span>
                <h2 className="mt-1 text-xl font-semibold">{t("invite.scan_to_join")}</h2>
              </div>
              <div className="rounded-2xl bg-accent-soft p-5 shadow-inner transition-transform duration-300 hover:scale-105">
                {url ? <QrCode value={url} size={200} /> : <div className="size-52 animate-pulse bg-accent-soft/50 rounded-2xl" />}
              </div>
              {url && (
                <p className="break-all text-center text-xs font-semibold text-muted-foreground bg-background/50 rounded-lg px-3 py-1 border border-border/40">
                  {url}
                </p>
              )}
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={copy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface py-3 text-sm font-medium hover:bg-accent-soft/30 hover:border-accent/40 active:scale-[0.97] transition-all duration-300 cursor-pointer"
                >
                  <Copy className="size-4" /> {t("invite.copy")}
                </button>
                <button
                  type="button"
                  onClick={share}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 active:scale-[0.97] transition-all duration-300 cursor-pointer"
                >
                  <Share2 className="size-4" /> {t("invite.share")}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Real Statistics & Share Guide (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            {/* Community Stats Card */}
            <div className="rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                  <Users className="size-5 text-accent" /> {t("invite.community_stats")}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent-soft/40 px-2 py-0.5 rounded-full border border-accent/20">
                  Live Cloud Data
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-background border border-border/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("invite.active_members")}</p>
                  <p className="text-2xl font-display uppercase text-accent mt-1">
                    {loadingStats ? "..." : `${totalMembers} ${totalMembers === 1 ? "Student" : "Students"}`}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-background border border-border/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("invite.countries")}</p>
                  <p className="text-2xl font-display uppercase text-accent mt-1">
                    {loadingStats ? "..." : `${nationsCount} ${nationsCount === 1 ? "Nation" : "Nations"}`}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("invite.destination_clusters")}</p>
                
                {loadingStats ? (
                  <p className="text-xs text-muted-foreground animate-pulse py-2">Loading live city statistics...</p>
                ) : destinationClusters.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-background border border-dashed border-border text-center">
                    <p className="text-xs text-muted-foreground font-medium">No registered students yet — be the first to register!</p>
                  </div>
                ) : (
                  destinationClusters.map((cluster) => (
                    <div key={cluster.city} className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-accent" /> {cluster.city}
                        </span>
                        <span className="text-muted-foreground">{cluster.percentage}% of users ({cluster.count})</span>
                      </div>
                      <div className="h-2 w-full bg-accent-soft rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, cluster.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Where to Share Quick Guide */}
            <div className="rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-sm space-y-4">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Award className="size-5 text-accent" /> {t("invite.tips_title")}
              </h3>
              <ul className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-accent">1.</span>
                  <span><strong>WhatsApp & WeChat Groups:</strong> Drop the invite link in your university group chat, dorm floor groups, or regional student society circles.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent">2.</span>
                  <span><strong>Campus Welcome Days:</strong> Print or screenshot the QR code for freshmen orientation week.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent">3.</span>
                  <span><strong>Local Grocery & Specialty Stores:</strong> Pin a flyer near community bulletin boards at local hometown markets.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
