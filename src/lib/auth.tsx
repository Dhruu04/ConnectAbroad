import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

type AuthState = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let userId = localStorage.getItem("connect_abroad_user_id");
      if (!userId) {
        // Generate simple UUID fallback if crypto.randomUUID isn't available
        userId = typeof crypto.randomUUID === "function" 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem("connect_abroad_user_id", userId);
      }
      setUser({
        id: userId,
        email: "student@connectabroad.com",
        user_metadata: {},
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User);
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
