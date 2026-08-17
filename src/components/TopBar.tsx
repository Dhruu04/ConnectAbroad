import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Compass, Share2, User, MessageSquare, Calendar, CheckSquare, ShoppingBag, Sun, Moon, Bell, Globe, ChevronDown, LogIn, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTranslation, LANGUAGES } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { AuthModal } from "@/components/AuthModal";

export function TopBar() {
  const { t, language, setLanguage, currentLanguage } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  const linkBase = "flex items-center gap-1.5 px-2.5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 border-transparent duration-300 relative rounded-none hover:text-foreground whitespace-nowrap shrink-0";

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const defaultList = [
      {
        id: "1",
        text: "Proposed Settle In item 'Halal Meat shop' was approved by 90% consensus!",
        time: "2 hours ago",
        read: false
      },
      {
        id: "2",
        text: "3 new Study Matches found studying Computer Science at TU Berlin!",
        time: "5 hours ago",
        read: false
      },
      {
        id: "3",
        text: "Anna sent a message in Berlin general group chat.",
        time: "1 day ago",
        read: true
      }
    ];
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("connect_abroad_notifications_v1");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultList;
        }
      }
    }
    return defaultList;
  });

  const saveNotifications = (list: typeof notifications) => {
    setNotifications(list);
    localStorage.setItem("connect_abroad_notifications_v1", JSON.stringify(list));
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map((n: any) => ({ ...n, read: true }));
    saveNotifications(updated);
  };
  
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-2.5 sm:px-6 py-2 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1300px] items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-2 sm:gap-8">
          <Link
            to="/"
            className="group flex items-center gap-1.5 sm:gap-2.5 font-display text-xs sm:text-xl uppercase tracking-[0.08em] sm:tracking-[0.12em] text-accent shrink-0"
          >
            <Logo className="size-5 sm:size-6 text-foreground transition-all duration-300 group-hover:scale-105 group-hover:rotate-6" />
            <span className="font-black text-accent tracking-wide">ConnectAbroad</span>
          </Link>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/discover"
              preload="intent"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <Compass className="size-4" />
              <span>{t("nav.discover")}</span>
            </Link>
            
            <Link
              to="/chats"
              preload="intent"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <MessageSquare className="size-4" />
              <span>{t("nav.chats")}</span>
            </Link>

            <Link
              to="/settle"
              preload="intent"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <CheckSquare className="size-4" />
              <span>{t("nav.settle")}</span>
            </Link>

            <Link
              to="/activities"
              preload="intent"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <Calendar className="size-4" />
              <span>{t("nav.events")}</span>
            </Link>

            <Link
              to="/marketplace"
              preload="intent"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <ShoppingBag className="size-4" />
              <span>{t("nav.market")}</span>
            </Link>

            <Link
              to="/invite"
              preload="intent"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <Share2 className="size-4" />
              <span>{t("nav.invite")}</span>
            </Link>

            <Link
              to="/profile"
              preload="intent"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <User className="size-4" />
              <span>{t("nav.profile")}</span>
            </Link>
          </div>
        </div>
        
        {/* Right side controls: Language Selector, Notification, Theme Toggle */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 relative">
          {/* Language Selector Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLangDropdown(!showLangDropdown);
                setShowNotifications(false);
              }}
              aria-expanded={showLangDropdown}
              aria-label="Select Language"
              className="flex min-h-[38px] sm:min-h-[44px] items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-border bg-surface hover:bg-accent-soft/30 active:scale-95 text-foreground text-[11px] sm:text-xs font-semibold transition-all cursor-pointer"
              title="Change Language"
            >
              <span className="text-xs sm:text-sm">{currentLanguage.flag}</span>
              <span className="hidden sm:inline">{currentLanguage.label}</span>
              <ChevronDown className={`size-3 text-muted-foreground transition-transform duration-200 ${showLangDropdown ? "rotate-180" : ""}`} />
            </button>

            {showLangDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-48 max-h-72 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-2xl animate-scale-in">
                  <div className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
                    {t("common.language")}
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangDropdown(false);
                      }}
                      className={`flex items-center justify-between w-full min-h-[40px] px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer border-none ${
                        language === lang.code
                          ? "bg-accent text-accent-foreground font-bold"
                          : "hover:bg-accent-soft/40 active:scale-98 text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {language === lang.code && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notifications Button */}
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowLangDropdown(false);
            }}
            aria-expanded={showNotifications}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
            className="relative flex min-h-[38px] min-w-[38px] sm:min-h-[44px] sm:min-w-[44px] items-center justify-center rounded-xl border border-border hover:bg-accent-soft/30 active:scale-95 text-foreground transition-all cursor-pointer"
            title="Notifications"
          >
            <Bell className="size-3.5 sm:size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-black text-accent-foreground animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            className="flex min-h-[38px] min-w-[38px] sm:min-h-[44px] sm:min-w-[44px] items-center justify-center rounded-xl border border-border hover:bg-accent-soft/30 active:scale-95 text-foreground transition-all cursor-pointer"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="size-3.5 sm:size-4" /> : <Sun className="size-3.5 sm:size-4" />}
          </button>

          {/* Firebase Authentication Button */}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex min-h-[38px] sm:min-h-[44px] px-2.5 sm:px-3 items-center justify-center gap-1.5 rounded-xl border border-border hover:bg-red-500/10 hover:border-red-500/30 text-foreground transition-all cursor-pointer text-[11px] sm:text-xs font-bold uppercase"
              title="Sign Out"
            >
              <LogOut className="size-3.5 text-red-500" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex min-h-[38px] sm:min-h-[44px] px-2.5 sm:px-3.5 items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer text-[11px] sm:text-xs font-bold uppercase tracking-wider"
            >
              <LogIn className="size-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

          {/* Notification dropdown card overlay */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2.5 z-50 w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-surface p-4 shadow-2xl animate-scale-in">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Updates & Alerts</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[9px] font-bold uppercase tracking-wider text-accent hover:underline cursor-pointer border-none bg-transparent"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-[11px] transition-colors leading-relaxed ${
                        n.read
                          ? "bg-background/40 border-border/40 text-muted-foreground"
                          : "bg-accent-soft/20 border-accent/20 text-foreground font-semibold"
                      }`}
                    >
                      <p>{n.text}</p>
                      <span className="block mt-1 text-[9px] text-muted-foreground">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}


