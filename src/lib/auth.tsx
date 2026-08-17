import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  deleteUser,
  type User 
} from "firebase/auth";
import { auth } from "@/integrations/firebase/config";
import { saveUserProfile, deleteUserProfileFromFirebase } from "@/integrations/firebase/firestore";

export type AppUser = User & {
  id: string;
  user_metadata?: { full_name?: string };
};

function toAppUser(u: User | null): AppUser | null {
  if (!u) return null;
  return Object.assign(u, {
    id: u.uid,
    user_metadata: { full_name: u.displayName || undefined }
  });
}

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  signInWithEmail: (e: string, p: string) => Promise<AppUser>;
  signUpWithEmail: (e: string, p: string, name?: string, isNative?: boolean) => Promise<AppUser>;
  signInWithGoogle: () => Promise<AppUser>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithEmail: async () => { throw new Error("AuthProvider not mounted"); },
  signUpWithEmail: async () => { throw new Error("AuthProvider not mounted"); },
  signInWithGoogle: async () => { throw new Error("AuthProvider not mounted"); },
  logout: async () => {},
  deleteAccount: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    if (typeof window !== "undefined") {
      let userId = localStorage.getItem("connect_abroad_user_id");
      if (userId && auth.currentUser) {
        return toAppUser(auth.currentUser);
      } else if (userId) {
        return {
          id: userId,
          uid: userId,
          email: "student@connectabroad.com",
          displayName: "Student Peer",
          user_metadata: { full_name: "Student Peer" },
        } as AppUser;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const appUser = toAppUser(currentUser)!;
        setUser(appUser);
        localStorage.setItem("connect_abroad_user_id", currentUser.uid);
      } else {
        let userId = localStorage.getItem("connect_abroad_user_id");
        if (userId) {
          setUser({
            id: userId,
            uid: userId,
            email: "student@connectabroad.com",
            displayName: "Student Peer",
            user_metadata: { full_name: "Student Peer" },
          } as AppUser);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const u = toAppUser(userCredential.user)!;
    localStorage.setItem("connect_abroad_user_id", u.uid);
    setUser(u);
    return u;
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string, isNative?: boolean) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const u = toAppUser(userCredential.user)!;
    localStorage.setItem("connect_abroad_user_id", u.uid);
    setUser(u);

    await saveUserProfile({
      id: u.uid,
      name: name || email.split("@")[0],
      home_country: "International",
      home_city: null,
      current_country: "Germany",
      current_city: "Berlin",
      current_area: null,
      university: null,
      bio: isNative ? "Native Local Resident & Guide. Happy to help newcomers!" : null,
      avatar_url: u.photoURL || null,
      instagram: null,
      linkedin: null,
      whatsapp: null,
      twitter: null,
      website: null,
      is_buddy: true,
      is_native: isNative ?? false,
      relocation_type: isNative ? "native" : "international",
      major: null,
      arrival_date: new Date().toISOString().split("T")[0],
      favorite_dish: null,
      languages_spoken: null,
      languages_learning: null,
      onboarded: false,
      study_interests: null,
      kudos_count: 0,
      honor_title: isNative ? "Verified Native Host" : null,
    });

    return u;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const u = toAppUser(userCredential.user)!;
    localStorage.setItem("connect_abroad_user_id", u.uid);
    setUser(u);

    await saveUserProfile({
      id: u.uid,
      name: u.displayName || u.email?.split("@")[0] || "Student Peer",
      home_country: "International",
      home_city: null,
      current_country: "Germany",
      current_city: "Berlin",
      current_area: null,
      university: null,
      bio: null,
      avatar_url: u.photoURL || null,
      instagram: null,
      linkedin: null,
      whatsapp: null,
      twitter: null,
      website: null,
      is_buddy: false,
      major: null,
      arrival_date: new Date().toISOString().split("T")[0],
      favorite_dish: null,
      languages_spoken: null,
      languages_learning: null,
      onboarded: true,
      study_interests: null,
      kudos_count: 0,
      honor_title: null,
    });

    return u;
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("connect_abroad_user_id");
    setUser(null);
  };

  const deleteAccount = async () => {
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await deleteUserProfileFromFirebase(uid);
    }
    if (auth.currentUser) {
      await deleteUser(auth.currentUser);
    }
    localStorage.removeItem("connect_abroad_user_id");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
