import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Heart, MapPin } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { QrCode } from "@/components/QrCode";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ConnectAbroad — Find your hometown in a new city" },
      {
        name: "description",
        content:
          "A warm space for international students to connect with people from back home.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const [origin, setOrigin] = useState("");
  
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);
  
  const inviteUrl = origin ? `${origin}/discover` : "/discover";

  return (
    <div className="mx-auto min-h-screen max-w-5xl bg-background pb-20 px-4 md:px-8">
      <TopBar />

      {/* Main Hero & Invite Columns */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 py-12 md:py-20 items-center">
        {/* Left Side: Welcome Hero */}
        <div className="animate-reveal md:col-span-7 space-y-6">
          <h1 className="font-display text-balance text-5xl md:text-7xl leading-[0.9] uppercase">
            Find your <span className="text-accent">hometown</span> in a new city.
          </h1>
          <p className="max-w-[35ch] text-pretty text-lg md:text-xl leading-relaxed text-muted-foreground">
            A friendly space for international students to connect with people from back home — wherever
            you've landed.
          </p>

          {loading ? null : (
            <div className="pt-2">
              <Link
                to="/discover"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-8 py-4 font-semibold text-background transition-transform duration-300 hover:scale-[1.03] active:scale-95 shadow-lg shadow-black/10 hover:shadow-xl"
              >
                Enter ConnectAbroad <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Side: QR Share */}
        <div className="md:col-span-5 bg-accent-soft/40 p-1 rounded-3xl border border-border animate-scale-in" style={{ animationDelay: "150ms" }}>
          <div className="flex flex-col items-center gap-6 rounded-3xl bg-surface p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                Invite your community
              </span>
              <h2 className="mt-1 text-xl font-semibold">Share the QR</h2>
            </div>
            <div className="rounded-2xl bg-accent-soft p-4 shadow-inner transition-transform duration-300 hover:scale-105">
              <QrCode value={inviteUrl} size={180} />
            </div>
            <button
              type="button"
              onClick={async () => {
                if (navigator.share) {
                  await navigator
                    .share({ title: "Join me on ConnectAbroad", url: inviteUrl })
                    .catch(() => {});
                } else if (navigator.clipboard && origin) {
                  await navigator.clipboard.writeText(inviteUrl);
                }
              }}
              className="w-full rounded-full bg-foreground py-3.5 text-sm font-medium text-background transition-all duration-300 hover:opacity-90 hover:scale-[1.01] active:scale-95"
            >
              Share invite link
            </button>
            {origin && (
              <p className="break-all text-center text-xs text-muted-foreground">{inviteUrl}</p>
            )}
          </div>
        </div>
      </section>

      {/* Grid: How it works */}
      <section className="py-12 border-t border-border">
        <h3 className="font-display mb-8 text-2xl uppercase tracking-wide text-center md:text-left">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Step
            icon={<MapPin className="size-5" />}
            title="Drop your pin"
            body="Tell us where you're from and where you've landed."
            delay="200ms"
          />
          <Step
            icon={<Compass className="size-5" />}
            title="Discover your people"
            body="Filter by home country, hometown, or current city."
            delay="300ms"
          />
          <Step
            icon={<Heart className="size-5" />}
            title="One tap to connect"
            body="Jump straight to their Instagram, WhatsApp, or LinkedIn."
            delay="400ms"
          />
        </div>
      </section>

      <footer className="pt-12 pb-8 text-center border-t border-border/40">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          International Student Collective
        </p>
        <div className="flex items-center justify-center gap-2.5 font-display text-4xl uppercase tracking-tighter opacity-15">
          <Logo className="size-8 text-foreground" />
          <span>ConnectAbroad</span>
        </div>
      </footer>
    </div>
  );
}

function Step({ icon, title, body, delay }: { icon: React.ReactNode; title: string; body: string; delay?: string }) {
  return (
    <div 
      className="flex flex-col items-center md:items-start gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-accent/30 animate-scale-in"
      style={{ animationDelay: delay }}
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent border border-accent/15 transition-transform duration-300 hover:scale-110">
        {icon}
      </div>
      <div className="text-center md:text-left">
        <h4 className="font-semibold text-lg text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
