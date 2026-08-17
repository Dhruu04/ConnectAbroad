import { createFileRoute, Outlet, useLocation, redirect } from "@tanstack/react-router";
import { auth } from "@/integrations/firebase/config";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("connect_abroad_user_id") : null;
    const firebaseUser = auth.currentUser;
    
    if (!userId && !firebaseUser) {
      throw redirect({ to: "/" });
    }
    
    return { 
      user: { 
        id: userId || firebaseUser?.uid || "guest", 
        email: firebaseUser?.email || "student@connectabroad.com" 
      } 
    };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-background">
      <div key={location.pathname} className="animate-page-transition">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

