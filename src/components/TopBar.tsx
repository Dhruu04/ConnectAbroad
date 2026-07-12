import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Compass, Share2, User, MessageSquare, Calendar, CheckSquare, ShoppingBag, Sun, Moon, Bell } from "lucide-react";
import { Logo } from "@/components/Logo";

export function TopBar() {
  const linkBase = "flex items-center gap-1.5 px-2 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 border-transparent duration-300 relative rounded-none hover:text-foreground";

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
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 px-6 py-2 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1300px] items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="group flex items-center gap-2.5 font-display text-xl uppercase tracking-[0.12em] text-accent shrink-0"
          >
            <Logo className="size-6 text-foreground transition-all duration-300 group-hover:scale-105 group-hover:rotate-6" />
            <span>ConnectAbroad</span>
          </Link>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/discover"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <Compass className="size-4" />
              <span>Discover</span>
            </Link>
            
            <Link
              to="/chats"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <MessageSquare className="size-4" />
              <span>Chats</span>
            </Link>

            <Link
              to="/settle"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <CheckSquare className="size-4" />
              <span>Settle In</span>
            </Link>

            <Link
              to="/activities"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <Calendar className="size-4" />
              <span>Events</span>
            </Link>

            <Link
              to="/marketplace"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <ShoppingBag className="size-4" />
              <span>Market</span>
            </Link>

            <Link
              to="/invite"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <Share2 className="size-4" />
              <span>Invite</span>
            </Link>

            <Link
              to="/profile"
              className={linkBase}
              activeProps={{ className: `${linkBase} border-accent text-accent` }}
              inactiveProps={{ className: `${linkBase} text-muted-foreground` }}
            >
              <User className="size-4" />
              <span>Profile</span>
            </Link>
          </div>
        </div>
        
        {/* Right side controls: Notification, Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0 relative">
          {/* Notifications Button */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl border border-border hover:bg-accent-soft/30 text-foreground transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-black text-accent-foreground animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border hover:bg-accent-soft/30 text-foreground transition-colors cursor-pointer"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>

          {/* Dynamic pulsing dot indicator */}
          <div className="hidden sm:flex size-8 items-center justify-center rounded-full border border-accent/20 bg-accent-soft">
            <span className="size-2 animate-pulse rounded-full bg-accent" />
          </div>

          {/* Notification dropdown card overlay */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2.5 z-50 w-72 rounded-2xl border border-border bg-surface p-4 shadow-xl animate-scale-in">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Updates</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[9px] font-bold uppercase tracking-wider text-accent hover:underline cursor-pointer border-none bg-transparent"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border text-[10px] transition-colors leading-relaxed ${
                        n.read
                          ? "bg-background/40 border-border/40 text-muted-foreground"
                          : "bg-accent-soft/20 border-accent/20 text-foreground font-semibold"
                      }`}
                    >
                      <p>{n.text}</p>
                      <span className="block mt-1 text-[8px] text-muted-foreground">{n.time}</span>
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
