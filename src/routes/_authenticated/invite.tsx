import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Share2, Award, Users, Globe, MapPin } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { QrCode } from "@/components/QrCode";

export const Route = createFileRoute("/_authenticated/invite")({
  component: Invite,
});

function Invite() {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);
  const url = origin ? `${origin}/discover` : "";

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }
  async function share() {
    if (!url) return;
    if (navigator.share)
      await navigator
        .share({ title: "Join me on ConnectAbroad", text: "Find your hometown abroad.", url })
        .catch(() => {});
    else copy();
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />

      <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-8 animate-scale-in">
        {/* Header Summary */}
        <div className="mb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Bring your people
          </span>
          <h1 className="font-display mt-2 text-3xl md:text-4xl uppercase leading-none">
            Every QR scan = one less lonely student.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Share this link in your university group chat, dorm WhatsApp, or hometown community.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: QR Card (5 cols) */}
          <div className="md:col-span-5 bg-accent-soft/40 p-1 rounded-3xl border border-border">
            <div className="flex flex-col items-center gap-6 rounded-3xl bg-surface p-6 md:p-8 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Invite QR Code</span>
                <h2 className="mt-1 text-xl font-semibold">Scan to join</h2>
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
                  onClick={copy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface py-3 text-sm font-medium hover:bg-accent-soft/30 hover:border-accent/40 active:scale-[0.97] transition-all duration-300"
                >
                  <Copy className="size-4" /> Copy
                </button>
                <button
                  onClick={share}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 active:scale-[0.97] transition-all duration-300"
                >
                  <Share2 className="size-4" /> Share
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Statistics & Share Guide (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            {/* Community Stats Card */}
            <div className="rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-sm space-y-6">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Users className="size-5 text-accent" /> Community Statistics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-background border border-border/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Members</p>
                  <p className="text-2xl font-display uppercase text-accent mt-1">154 Students</p>
                </div>
                <div className="p-4 rounded-2xl bg-background border border-border/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Countries Represented</p>
                  <p className="text-2xl font-display uppercase text-accent mt-1">28 Nations</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top Destination Clusters</p>
                
                {/* Stat row 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-accent" /> Berlin, Germany</span>
                    <span className="text-muted-foreground">56% of users</span>
                  </div>
                  <div className="h-2 w-full bg-accent-soft rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: "56%" }} />
                  </div>
                </div>

                {/* Stat row 2 */}
                <div className="space-y-1 pt-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-accent" /> Munich, Germany</span>
                    <span className="text-muted-foreground">32% of users</span>
                  </div>
                  <div className="h-2 w-full bg-accent-soft rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: "32%" }} />
                  </div>
                </div>

                {/* Stat row 3 */}
                <div className="space-y-1 pt-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-accent" /> Hamburg, Germany</span>
                    <span className="text-muted-foreground">12% of users</span>
                  </div>
                  <div className="h-2 w-full bg-accent-soft rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: "12%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Where to Share Quick Guide */}
            <div className="rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-sm space-y-4">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Award className="size-5 text-accent" /> Tips to Grow the Ecosystem
              </h3>
              <ul className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent font-bold text-[10px]">1</span>
                  <span><strong>WhatsApp & WeChat Groups:</strong> Drop the invite link in your university group chat, dorm floor groups, or regional student society circles.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent font-bold text-[10px]">2</span>
                  <span><strong>Instagram Direct Message:</strong> Send the link directly to incoming freshmen or peers looking for familiar faces from home.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent font-bold text-[10px]">3</span>
                  <span><strong>Discord & Slack Servers:</strong> Share it in the regional channels of your college's Discord/Slack communities.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
