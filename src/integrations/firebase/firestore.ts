import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  increment, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { ref, set, remove } from "firebase/database";
import { db, rtdb } from "./config";
import type { HometownStore } from "@/lib/mock-data";
import type { Profile } from "@/routes/_authenticated/discover";

// Collection References
const PROFILES_COLLECTION = "profiles";
const STORES_COLLECTION = "hometown_stores";
const LIKES_COLLECTION = "peer_likes";

import { DIVERSE_PROFILES } from "@/lib/mock-data";

/**
 * Real-time listener for profiles collection in Firebase Firestore.
 * Streams real live registered user profiles entered dynamically, merging with seed data so dataset is never empty.
 */
export function subscribeProfiles(onUpdate: (profiles: Profile[]) => void) {
  const colRef = collection(db, PROFILES_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const cloudProfiles: Profile[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const homeCity = data.home_city || null;
        const currentCity = data.current_city || null;
        const isNative = data.is_native ?? (homeCity && currentCity && homeCity === currentCity ? true : false);
        const relocationType = data.relocation_type || (isNative ? "native" : (data.home_country && data.current_country && data.home_country === data.current_country ? "national" : "international"));

        return {
          id: docSnap.id,
          name: data.name || "Student Peer",
          avatar_url: data.avatar_url || null,
          bio: data.bio || null,
          home_country: data.home_country || "International",
          home_city: homeCity,
          current_country: data.current_country || "Germany",
          current_city: currentCity,
          current_area: data.current_area || null,
          university: data.university || null,
          instagram: data.instagram || null,
          linkedin: data.linkedin || null,
          whatsapp: data.whatsapp || null,
          twitter: data.twitter || null,
          website: data.website || null,
          is_buddy: data.is_buddy ?? false,
          is_native: isNative,
          relocation_type: relocationType,
          major: data.major || null,
          arrival_date: data.arrival_date || null,
          favorite_dish: data.favorite_dish || null,
          languages_spoken: data.languages_spoken || null,
          languages_learning: data.languages_learning || null,
          onboarded: data.onboarded ?? true,
          study_interests: data.study_interests || null,
          kudos_count: data.kudos_count || 0,
          honor_title: data.honor_title || null,
        };
      });

      // Combine cloud profiles with diverse fallback profiles, eliminating duplicates
      const cloudIds = new Set(cloudProfiles.map(p => p.id));
      const combined = [...cloudProfiles, ...DIVERSE_PROFILES.filter(p => !cloudIds.has(p.id))];
      onUpdate(combined);
    },
    (error) => {
      console.warn("Firestore profiles subscription note (using seed data fallback):", error);
      onUpdate(DIVERSE_PROFILES);
    }
  );

  return unsubscribe;
}

/**
 * Fetch a single user profile directly from Firestore.
 */
export async function getUserProfileFromFirebase(userId: string): Promise<Profile | null> {
  try {
    const docRef = doc(db, PROFILES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const homeCity = data.home_city || null;
      const currentCity = data.current_city || null;
      const isNative = data.is_native ?? (homeCity && currentCity && homeCity === currentCity ? true : false);
      const relocationType = data.relocation_type || (isNative ? "native" : (data.home_country && data.current_country && data.home_country === data.current_country ? "national" : "international"));

      return {
        id: docSnap.id,
        name: data.name || "Student Peer",
        avatar_url: data.avatar_url || null,
        bio: data.bio || null,
        home_country: data.home_country || "International",
        home_city: homeCity,
        current_country: data.current_country || "Germany",
        current_city: currentCity,
        current_area: data.current_area || null,
        university: data.university || null,
        instagram: data.instagram || null,
        linkedin: data.linkedin || null,
        whatsapp: data.whatsapp || null,
        twitter: data.twitter || null,
        website: data.website || null,
        is_buddy: data.is_buddy ?? false,
        is_native: isNative,
        relocation_type: relocationType,
        major: data.major || null,
        arrival_date: data.arrival_date || null,
        favorite_dish: data.favorite_dish || null,
        languages_spoken: data.languages_spoken || null,
        languages_learning: data.languages_learning || null,
        onboarded: data.onboarded ?? true,
        study_interests: data.study_interests || null,
        kudos_count: data.kudos_count || 0,
        honor_title: data.honor_title || null,
      };
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch user profile from Firebase:", err);
    return null;
  }
}

/**
 * Real-time listener for a single user's profile in Firebase Firestore.
 */
export function subscribeUserProfile(userId: string, onUpdate: (profile: Profile | null) => void) {
  const docRef = doc(db, PROFILES_COLLECTION, userId);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const homeCity = data.home_city || null;
        const currentCity = data.current_city || null;
        const isNative = data.is_native ?? (homeCity && currentCity && homeCity === currentCity ? true : false);
        const relocationType = data.relocation_type || (isNative ? "native" : (data.home_country && data.current_country && data.home_country === data.current_country ? "national" : "international"));

        onUpdate({
          id: docSnap.id,
          name: data.name || "Student Peer",
          avatar_url: data.avatar_url || null,
          bio: data.bio || null,
          home_country: data.home_country || "International",
          home_city: homeCity,
          current_country: data.current_country || "Germany",
          current_city: currentCity,
          current_area: data.current_area || null,
          university: data.university || null,
          instagram: data.instagram || null,
          linkedin: data.linkedin || null,
          whatsapp: data.whatsapp || null,
          twitter: data.twitter || null,
          website: data.website || null,
          is_buddy: data.is_buddy ?? false,
          is_native: isNative,
          relocation_type: relocationType,
          major: data.major || null,
          arrival_date: data.arrival_date || null,
          favorite_dish: data.favorite_dish || null,
          languages_spoken: data.languages_spoken || null,
          languages_learning: data.languages_learning || null,
          onboarded: data.onboarded ?? true,
          study_interests: data.study_interests || null,
          kudos_count: data.kudos_count || 0,
          honor_title: data.honor_title || null,
        });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn("User profile subscription note:", err);
    }
  );
}

/**
 * Save or update a user profile in Firestore cloud database.
 * Ensures all user edits and new user registrations sync live across all clients.
 */
export async function saveUserProfile(profile: Partial<Profile> & { id: string }) {
  try {
    const docRef = doc(db, PROFILES_COLLECTION, profile.id);
    await setDoc(docRef, { ...profile, updated_at: serverTimestamp() }, { merge: true });

    // Sync directly to Realtime Database (RTDB) node
    try {
      const rtdbRef = ref(rtdb, `profiles/${profile.id}`);
      await set(rtdbRef, { ...profile, updated_at: new Date().toISOString() });
    } catch (e) {
      console.warn("RTDB profile sync note:", e);
    }

    return true;
  } catch (error) {
    console.error("Failed to save user profile to Firebase:", error);
    return false;
  }
}

import { HOMETOWN_STORES } from "@/lib/mock-data";

/**
 * Real-time listener for hometown stores collection in Firebase Firestore.
 * Streams real live specialty stores proposed dynamically by users, fallback to seed stores.
 */
export function subscribeHometownStores(onUpdate: (stores: HometownStore[]) => void) {
  const colRef = collection(db, STORES_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const cloudStores: HometownStore[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          category: data.category,
          address: data.address,
          city: data.city,
          country: data.country,
          lat: data.lat,
          lng: data.lng,
          phone: data.phone || "",
          hours: data.hours || "Mon-Sat: 09:00 - 20:00",
          priceLevel: data.priceLevel || "$$",
          specialties: data.specialties || [],
          rating: data.rating || 5.0,
          reviewsCount: data.reviewsCount || 1,
          description: data.description || "",
        };
      });

      const cloudIds = new Set(cloudStores.map(s => s.id));
      const combined = [...cloudStores, ...HOMETOWN_STORES.filter(s => !cloudIds.has(s.id))];
      onUpdate(combined);
    },
    (error) => {
      console.warn("Firestore stores subscription note (using seed stores fallback):", error);
      onUpdate(HOMETOWN_STORES);
    }
  );

  return unsubscribe;
}

/**
 * Propose a new hometown store and save directly to Firebase Firestore.
 * Automatically syncs to all connected users online in real time.
 */
export async function addHometownStoreToFirebase(store: HometownStore) {
  try {
    const docRef = doc(db, STORES_COLLECTION, store.id);
    await setDoc(docRef, {
      ...store,
      created_at: serverTimestamp(),
    });

    try {
      const rtdbRef = ref(rtdb, `hometown_stores/${store.id}`);
      await set(rtdbRef, { ...store, created_at: new Date().toISOString() });
    } catch (e) {
      console.warn("RTDB store sync note:", e);
    }

    return true;
  } catch (error) {
    console.error("Failed to add store to Firebase:", error);
    return false;
  }
}

/**
 * Toggle peer support / appreciation like in Firebase Firestore.
 * Updates the user's kudos_count atomically and logs the like.
 */
export async function togglePeerSupportInFirebase(
  targetProfileId: string,
  currentUserId: string,
  isCurrentlyLiked: boolean
) {
  try {
    const likeDocId = `${currentUserId}_${targetProfileId}`;
    const likeDocRef = doc(db, LIKES_COLLECTION, likeDocId);
    const profileDocRef = doc(db, PROFILES_COLLECTION, targetProfileId);

    if (isCurrentlyLiked) {
      // Remove support
      await setDoc(likeDocRef, { active: false }, { merge: true });
      await updateDoc(profileDocRef, { kudos_count: increment(-1) }).catch(() => {});
    } else {
      // Add support
      await setDoc(likeDocRef, {
        active: true,
        user_id: currentUserId,
        target_id: targetProfileId,
        created_at: serverTimestamp(),
      });
      await updateDoc(profileDocRef, { kudos_count: increment(1) }).catch(() => {});
    }
    return true;
  } catch (error) {
    console.error("Error toggling peer support in Firebase:", error);
    return false;
  }
}

/**
 * Permanently delete user profile document from Firebase Firestore and Realtime Database.
 */
export async function deleteUserProfileFromFirebase(userId: string) {
  try {
    const profileRef = doc(db, PROFILES_COLLECTION, userId);
    await deleteDoc(profileRef);

    try {
      const rtdbRef = ref(rtdb, `profiles/${userId}`);
      await remove(rtdbRef);
    } catch (e) {
      console.warn("RTDB delete note:", e);
    }

    return true;
  } catch (error) {
    console.error("Failed to delete user profile from Firestore:", error);
    return false;
  }
}

// Chat Messages Collection
const CHATS_COLLECTION = "chats";

export interface ChatMessageItem {
  id: string;
  user_id: string;
  user_name: string;
  home_country: string;
  current_city: string;
  channel: string;
  content: string;
  created_at: string;
}

/**
 * Real-time listener for channel chat messages in Firebase Firestore.
 * Ensures everyone connected online sees all sent messages instantly in real time!
 */
export function subscribeChannelChats(
  channelName: string,
  onUpdate: (messages: ChatMessageItem[]) => void
) {
  const colRef = collection(db, CHATS_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const allMsgs: ChatMessageItem[] = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            user_id: data.user_id || "",
            user_name: data.user_name || "Peer",
            home_country: data.home_country || "International",
            current_city: data.current_city || "City",
            channel: data.channel || "global",
            content: data.content || "",
            created_at: data.created_at?.toDate
              ? data.created_at.toDate().toISOString()
              : typeof data.created_at === "string"
              ? data.created_at
              : new Date().toISOString(),
          };
        })
        .filter((m) => m.channel === channelName)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      onUpdate(allMsgs);
    },
    (error) => {
      console.warn("Firestore chats subscription note:", error);
      onUpdate([]);
    }
  );

  return unsubscribe;
}

/**
 * Send a chat message directly to Firebase Firestore.
 */
export async function addChatMessageToFirebase(msg: Omit<ChatMessageItem, "id" | "created_at">) {
  try {
    const chatDocRef = doc(collection(db, CHATS_COLLECTION));
    const nowIso = new Date().toISOString();
    const chatData = {
      ...msg,
      created_at: serverTimestamp(),
    };

    await setDoc(chatDocRef, chatData);

    try {
      const rtdbRef = ref(rtdb, `chats/${chatDocRef.id}`);
      await set(rtdbRef, {
        id: chatDocRef.id,
        ...msg,
        created_at: nowIso,
      });
    } catch (e) {
      console.warn("RTDB chat msg sync note:", e);
    }

    return true;
  } catch (error) {
    console.error("Failed to post chat message to Firebase:", error);
    return false;
  }
}
