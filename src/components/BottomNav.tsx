import { Link } from "@tanstack/react-router";
import { Compass, Share2, User, MessageSquare, Calendar, CheckSquare, ShoppingBag } from "lucide-react";

export function BottomNav() {
  const base =
    "flex flex-col items-center justify-center p-2.5 rounded-full transition-all cursor-pointer relative";
  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-24px)] max-w-[400px] -translate-x-1/2 md:hidden">
      <div className="flex items-center justify-between rounded-full bg-foreground p-1.5 text-background shadow-2xl shadow-black/25 border border-white/5">
        <Link
          to="/discover"
          className={base}
          activeProps={{ className: `${base} text-accent` }}
          inactiveProps={{ className: `${base} opacity-50` }}
        >
          {({ isActive }) => (
            <>
              <Compass className="size-5 transition-transform duration-300 active:scale-90" />
              <span className={`absolute bottom-0.5 size-1 rounded-full bg-accent transition-all duration-300 ${isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
            </>
          )}
        </Link>

        <Link
          to="/chats"
          className={base}
          activeProps={{ className: `${base} text-accent` }}
          inactiveProps={{ className: `${base} opacity-50` }}
        >
          {({ isActive }) => (
            <>
              <MessageSquare className="size-5 transition-transform duration-300 active:scale-90" />
              <span className={`absolute bottom-0.5 size-1 rounded-full bg-accent transition-all duration-300 ${isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
            </>
          )}
        </Link>

        <Link
          to="/settle"
          className={base}
          activeProps={{ className: `${base} text-accent` }}
          inactiveProps={{ className: `${base} opacity-50` }}
        >
          {({ isActive }) => (
            <>
              <CheckSquare className="size-5 transition-transform duration-300 active:scale-90" />
              <span className={`absolute bottom-0.5 size-1 rounded-full bg-accent transition-all duration-300 ${isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
            </>
          )}
        </Link>

        <Link
          to="/activities"
          className={base}
          activeProps={{ className: `${base} text-accent` }}
          inactiveProps={{ className: `${base} opacity-50` }}
        >
          {({ isActive }) => (
            <>
              <Calendar className="size-5 transition-transform duration-300 active:scale-90" />
              <span className={`absolute bottom-0.5 size-1 rounded-full bg-accent transition-all duration-300 ${isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
            </>
          )}
        </Link>

        <Link
          to="/marketplace"
          className={base}
          activeProps={{ className: `${base} text-accent` }}
          inactiveProps={{ className: `${base} opacity-50` }}
        >
          {({ isActive }) => (
            <>
              <ShoppingBag className="size-5 transition-transform duration-300 active:scale-90" />
              <span className={`absolute bottom-0.5 size-1 rounded-full bg-accent transition-all duration-300 ${isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
            </>
          )}
        </Link>

        <Link
          to="/invite"
          className={base}
          activeProps={{ className: `${base} text-accent` }}
          inactiveProps={{ className: `${base} opacity-50` }}
        >
          {({ isActive }) => (
            <>
              <Share2 className="size-5 transition-transform duration-300 active:scale-90" />
              <span className={`absolute bottom-0.5 size-1 rounded-full bg-accent transition-all duration-300 ${isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
            </>
          )}
        </Link>

        <Link
          to="/profile"
          className={base}
          activeProps={{ className: `${base} text-accent` }}
          inactiveProps={{ className: `${base} opacity-50` }}
        >
          {({ isActive }) => (
            <>
              <User className="size-5 transition-transform duration-300 active:scale-90" />
              <span className={`absolute bottom-0.5 size-1 rounded-full bg-accent transition-all duration-300 ${isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
            </>
          )}
        </Link>
      </div>
    </div>
  );
}
