import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { 
  ArrowRight, 
  Heart, 
  MapPin, 
  Users, 
  Globe, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogOut, 
  Sparkles,
  Compass,
  Trophy
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TopBar } from "@/components/TopBar";
import { QrCode } from "@/components/QrCode";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ConnectAbroad — Find your hometown in a new city" },
      {
        name: "description",
        content: "A warm space for international students to connect with people from back home.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");

  // Auth Form State for Inline Registration/Login
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const inviteUrl = origin ? `${origin}/discover` : "/discover";

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        await signUpWithEmail(email, password, name);
        toast.success("Welcome to ConnectAbroad! Account created.");
      } else {
        await signInWithEmail(email, password);
        toast.success("Signed in successfully!");
      }
      navigate({ to: "/discover" });
    } catch (err: any) {
      console.error("Auth error:", err);
      toast.error(err.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google!");
      navigate({ to: "/discover" });
    } catch (err: any) {
      console.error("Google Auth error:", err);
      toast.error(err.message || "Google Sign-In failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between overflow-x-hidden">
      {/* Top Navbar */}
      <TopBar />

      {/* Main Aligned Hero Section */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 space-y-16">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Brand Hero Title & Highlights */}
          <div className="lg:col-span-7 space-y-6 text-left animate-reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft/40 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
              <Sparkles className="size-3.5" /> International Student Hub
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl leading-[0.95] uppercase tracking-tight text-foreground">
              {t("hero.title")}
            </h1>

            <p className="max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-muted-foreground font-normal">
              {t("hero.subtitle")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/40">
              <div className="p-4 rounded-2xl border border-border bg-surface/50 space-y-1">
                <Compass className="size-5 text-accent" />
                <h4 className="text-xs font-bold uppercase">Hometown Map</h4>
                <p className="text-[11px] text-muted-foreground">Locate peers & living areas near you.</p>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-surface/50 space-y-1">
                <Users className="size-5 text-accent" />
                <h4 className="text-xs font-bold uppercase">Community Peers</h4>
                <p className="text-[11px] text-muted-foreground">Connect with students from back home.</p>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-surface/50 space-y-1">
                <Trophy className="size-5 text-amber-500" />
                <h4 className="text-xs font-bold uppercase">Hall of Fame</h4>
                <p className="text-[11px] text-muted-foreground">Recognize & support peer mentors.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Inline Firebase Sign In / Register Card */}
          <div className="lg:col-span-5 w-full animate-scale-in">
            <div className="p-6 sm:p-8 rounded-3xl border border-border bg-surface shadow-xl space-y-6">
              {user ? (
                <div className="text-center space-y-4 py-4">
                  <div className="size-16 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto border border-accent/30 text-xl font-bold">
                    {user.email?.[0].toUpperCase() || "S"}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">Active Session</span>
                    <h3 className="text-lg font-bold text-foreground truncate">{user.email}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Welcome back to ConnectAbroad!</p>
                  </div>

                  <div className="pt-2 space-y-2">
                    <Link
                      to="/discover"
                      className="w-full py-3.5 rounded-2xl bg-foreground text-background text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                    >
                      <span>Explore Discover Map</span>
                      <ArrowRight className="size-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => logout()}
                      className="w-full py-3 rounded-2xl border border-border bg-background text-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
                    >
                      <LogOut className="size-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                      Cloud Authentication
                    </span>
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground">
                      {authMode === "signup" ? "Create Account" : "Sign In"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {authMode === "signup" ? "Join international peers in your new city" : "Enter your credentials to access your account"}
                    </p>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div className="grid grid-cols-2 p-1 rounded-xl bg-background border border-border text-xs font-bold uppercase">
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className={`py-2 rounded-lg transition-all cursor-pointer ${
                        authMode === "signup" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Register
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className={`py-2 rounded-lg transition-all cursor-pointer ${
                        authMode === "login" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Sign In
                    </button>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                    {authMode === "signup" && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                        <div className="relative flex items-center">
                          <UserIcon className="absolute left-3.5 size-4 text-muted-foreground" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Aarav Sharma"
                            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 size-4 text-muted-foreground" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="student@university.edu"
                          className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 size-4 text-muted-foreground" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3.5 rounded-xl bg-foreground text-background text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
                    >
                      {authMode === "signup" ? <UserPlus className="size-4 text-accent" /> : <LogIn className="size-4 text-accent" />}
                      <span>{authLoading ? "Processing..." : authMode === "signup" ? "Create Free Account" : "Sign In with Email"}</span>
                    </button>
                  </form>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-border w-full" />
                    <span className="bg-surface px-2 text-[10px] uppercase font-bold text-muted-foreground">OR</span>
                  </div>

                  {/* 1-Tap Google Sign-In */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl border border-border bg-background text-foreground text-xs font-bold uppercase tracking-wider hover:bg-accent-soft/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Globe className="size-4 text-accent" />
                    <span>Continue with Google</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* QR Code Share & Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-8 border-t border-border">
          <div className="md:col-span-7 space-y-4">
            <h3 className="font-display text-2xl uppercase tracking-wide text-foreground">
              {t("hero.how_it_works")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Step
                icon={<MapPin className="size-4 text-accent" />}
                step="01"
                title={t("hero.step1_title")}
                desc={t("hero.step1_desc")}
              />
              <Step
                icon={<Users className="size-4 text-accent" />}
                step="02"
                title={t("hero.step2_title")}
                desc={t("hero.step2_desc")}
              />
              <Step
                icon={<Heart className="size-4 text-accent" />}
                step="03"
                title={t("hero.step3_title")}
                desc={t("hero.step3_desc")}
              />
            </div>
          </div>

          <div className="md:col-span-5 bg-accent-soft/30 p-6 rounded-3xl border border-border text-center space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
              {t("nav.invite")}
            </span>
            <h4 className="text-lg font-bold text-foreground">{t("hero.share_qr")}</h4>
            <div className="rounded-2xl bg-surface p-4 inline-block border border-border shadow-inner">
              <QrCode value={inviteUrl} size={150} />
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
                  toast.success("Invite link copied!");
                }
              }}
              className="w-full py-3 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
            >
              {t("hero.share_link")}
            </button>
          </div>
        </section>
      </main>

      {/* Clean Symmetrical Footer */}
      <footer className="w-full border-t border-border py-6 px-4 bg-surface text-center">
        <p className="text-xs text-muted-foreground font-medium">
          ConnectAbroad © {new Date().getFullYear()} — Empowering International Students Worldwide
        </p>
      </footer>
    </div>
  );
}

function Step({
  icon,
  step,
  title,
  desc,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent border border-accent/20">
          {icon}
        </div>
        <span className="font-display text-xs font-bold text-muted-foreground">{step}</span>
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase text-foreground">{title}</h4>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
