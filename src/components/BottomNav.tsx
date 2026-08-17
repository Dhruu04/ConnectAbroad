import { Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Compass, Share2, User, MessageSquare, Calendar, CheckSquare, ShoppingBag } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function BottomNav() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Reveal at the top of the page
      if (currentScrollY < 30) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Hide on scroll down, reveal on scroll up
      if (currentScrollY > lastScrollY.current + 8) {
        setIsVisible(false); // Scrolling down
      } else if (currentScrollY < lastScrollY.current - 12) {
        setIsVisible(true);  // Scrolling up
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const items = [
    { to: "/discover", icon: Compass, labelKey: "nav.discover" },
    { to: "/chats", icon: MessageSquare, labelKey: "nav.chats" },
    { to: "/settle", icon: CheckSquare, labelKey: "nav.settle" },
    { to: "/activities", icon: Calendar, labelKey: "nav.events" },
    { to: "/marketplace", icon: ShoppingBag, labelKey: "nav.market" },
    { to: "/invite", icon: Share2, labelKey: "nav.invite" },
    { to: "/profile", icon: User, labelKey: "nav.profile" },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/60 px-1 py-1 shadow-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-transform duration-300 transform-gpu ${
        isVisible ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map(({ to, icon: Icon, labelKey }) => {
          const label = t(labelKey);
          return (
            <Link
              key={to}
              to={to}
              preload="intent"
              aria-label={label}
              title={label}
              className="group flex flex-1 flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all active:scale-95 transform-gpu min-w-0"
            >
              {({ isActive }) => (
                <div
                  className={`flex flex-col items-center justify-center size-full py-1 px-1 rounded-xl transition-colors ${
                    isActive
                      ? "bg-accent-soft/40 text-accent font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
                  }`}
                >
                  <Icon
                    className={`size-4.5 transition-transform duration-150 ${
                      isActive ? "scale-110 text-accent" : "opacity-80 group-hover:opacity-100"
                    }`}
                  />
                  <span className="text-[9px] uppercase tracking-tighter truncate mt-0.5 max-w-[48px] text-center font-medium">
                    {label}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
