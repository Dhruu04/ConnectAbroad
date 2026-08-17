import React, { useState } from "react";
import { toast } from "sonner";
import { LogIn, UserPlus, Mail, Lock, User, X, ShieldCheck, Home, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isNative, setIsNative] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in email and password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, name, isNative);
        toast.success(isNative ? "Account created as Verified Native Host!" : "Account created and synced to Firebase!");
      } else {
        await signInWithEmail(email, password);
        toast.success("Signed in successfully!");
      }
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      toast.error(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google!");
      onClose();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      toast.error(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-surface border border-border p-6 rounded-3xl shadow-2xl animate-scale-in z-10 space-y-5">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <div className="text-center space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-accent">
            Firebase Cloud Authentication
          </span>
          <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">
            {mode === "login" ? "Welcome Back" : "Join ConnectAbroad"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {mode === "login" ? "Sign in to sync your profile across all devices" : "Create an account to connect with international peers"}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-background border border-border text-xs font-bold uppercase">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === "login" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === "signup" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 size-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 size-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 size-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div className="rounded-xl border border-accent/25 bg-accent-soft/15 p-3 space-y-1.5 transition-all">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-foreground">
                <input
                  type="checkbox"
                  checked={isNative}
                  onChange={(e) => setIsNative(e.target.checked)}
                  className="size-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Home className="size-4 text-accent" />
                  <span>I am a Native Resident / Local Guide</span>
                </span>
              </label>
              <p className="text-[11px] text-muted-foreground pl-6 leading-tight">
                Check this if you live in your home city. Your location is auto-set & you'll be highlighted as a local expert!
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-foreground text-background text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {mode === "login" ? <LogIn className="size-4 text-accent" /> : <UserPlus className="size-4 text-accent" />}
            <span>{loading ? "Authenticating..." : mode === "login" ? "Sign In with Email" : "Create Firebase Account"}</span>
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
          disabled={loading}
          className="w-full py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold uppercase tracking-wider hover:bg-accent-soft/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Globe className="size-4 text-accent" />
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}
