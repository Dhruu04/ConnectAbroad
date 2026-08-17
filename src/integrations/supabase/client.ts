// Local storage backed Mock Supabase client to run the app purely locally.

const PROFILES_KEY = "connect_abroad_local_db_profiles";
const CHATS_KEY = "connect_abroad_local_db_chats";
const HANGOUTS_KEY = "connect_abroad_local_db_hangouts";
const MARKETPLACE_KEY = "connect_abroad_local_db_marketplace";
const SUGGESTIONS_KEY = "connect_abroad_local_db_suggestions";
const VOTES_KEY = "connect_abroad_local_db_votes";

function generateMockProfiles(count: number): any[] {
  const countries = [
    { name: "Brazil", cities: ["São Paulo", "Rio de Janeiro"], names: ["Lucas Santos", "Gabriel Silva", "Mariana Costa", "Beatriz Rocha", "Bruno Oliveira", "Julia Lima"], dish: ["Feijoada", "Pão de Queijo", "Coxinha"], lang: ["Portuguese, English", "German, Spanish"], majors: ["Computer Science", "Business Administration", "Architecture"] },
    { name: "India", cities: ["Mumbai", "Delhi", "Bangalore"], names: ["Rohan Sharma", "Priya Patel", "Kabir Singh", "Anjali Rao", "Ishaan Verma", "Meera Nair"], dish: ["Biryani", "Samosa", "Butter Chicken"], lang: ["Hindi, English", "German, French, Italian"], majors: ["Data Science", "Information Systems", "Mechanical Engineering"] },
    { name: "China", cities: ["Beijing", "Shanghai", "Shenzhen"], names: ["Li Wei", "Zhang Min", "Wang Jun", "Liu Yan", "Chen Long", "Yang Mei"], dish: ["Dim Sum", "Hotpot", "Dumplings"], lang: ["Mandarin, English", "German, Italian"], majors: ["Physics", "Electrical Engineering", "Finance"] },
    { name: "United States", cities: ["New York", "Boston", "San Francisco"], names: ["Sarah Miller", "John Davis", "Emily Wilson", "David Taylor", "Emma Jones"], dish: ["Apple Pie", "Burger", "Mac and Cheese"], lang: ["English", "Italian, Spanish, German"], majors: ["Literature", "Political Science", "Economics"] },
    { name: "France", cities: ["Paris", "Lyon", "Marseille"], names: ["Pierre Dubois", "Marie Martin", "Thomas Bernard", "Léa Petit", "Lucas Richard"], dish: ["Croissant", "Quiche", "Ratatouille"], lang: ["French, English", "German, Italian"], majors: ["Philosophy", "Chemistry", "Art History"] },
    { name: "Spain", cities: ["Madrid", "Barcelona", "Valencia"], names: ["Carlos Gomez", "María López", "Alejandro Ruiz", "Lucía Fernández", "Manuel Sanz"], dish: ["Paella", "Tortilla Española", "Tapas"], lang: ["Spanish, English", "Italian, German, French"], majors: ["Biology", "Civil Engineering", "Languages"] },
    { name: "Italy", cities: ["Rome", "Milan", "Naples", "Florence"], names: ["Matteo Rossi", "Francesca Bianchi", "Alessandro Ricci", "Giulia Marino", "Lorenzo Bruno"], dish: ["Pasta Carbonara", "Pizza Margherita", "Lasagna"], lang: ["Italian, English", "German, Spanish, French"], majors: ["Law", "Design", "Medicine"] }
  ];

  const destinationCities = [
    { country: "Germany", city: "Berlin", unis: ["TU Berlin", "FU Berlin", "HU Berlin"] },
    { country: "Germany", city: "Munich", unis: ["TUM Munich", "LMU Munich"] },
    { country: "Italy", city: "Milan", unis: ["Politecnico di Milano", "Università Bocconi", "University of Milan"] },
    { country: "Italy", city: "Rome", unis: ["Sapienza University of Rome", "Tor Vergata University"] },
    { country: "France", city: "Paris", unis: ["Sorbonne University", "Sciences Po"] }
  ];

  const bios = [
    "Studying engineering. Big fan of music festivals and exploring local parks!",
    "Master's student. Always down for coffee, board games, or language swaps.",
    "Exchange semester here. Missing home food but loving the international vibe!",
    "Data science student. Let's team up for study sessions or weekend hikes.",
    "Love food, photography, and visiting museums. Ping me to hang out!",
    "Curious mind, coffee addict, and casual runner. Let's explore the city!",
    "Passionate about tech, soccer, and cultural dinners. Let's connect!"
  ];

  const list: any[] = [];
  
  // Seed initial 3 specific ones for compatibility
  list.push(
    {
      id: "mock-user-1",
      name: "Luisa Santos",
      home_country: "Brazil",
      home_city: "São Paulo",
      current_country: "Germany",
      current_city: "Berlin",
      university: "TU Berlin",
      bio: "Studying computer science. Love coffee and tech meetups!",
      instagram: "luisa_santos",
      linkedin: "luisasantos",
      whatsapp: "+49123456789",
      favorite_dish: "Feijoada",
      languages_spoken: "Portuguese, English",
      languages_learning: "German, Spanish",
      onboarded: true,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      arrival_date: "2025-09-01",
      is_buddy: true,
      major: "Computer Science",
      study_interests: "Algorithms, React, Frontend development",
    },
    {
      id: "mock-user-2",
      name: "Aarav Mehta",
      home_country: "India",
      home_city: "Mumbai",
      current_country: "Germany",
      current_city: "Berlin",
      university: "FU Berlin",
      bio: "Master's in Data Science. Let's connect for cricket and study groups!",
      instagram: "aarav_mehta",
      whatsapp: "+49987654321",
      favorite_dish: "Biryani",
      languages_spoken: "Hindi, English, Marathi",
      languages_learning: "German, Portuguese",
      onboarded: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      arrival_date: "2026-02-15",
      is_buddy: false,
      major: "Data Science",
      study_interests: "Machine Learning, Python, Statistics",
    },
    {
      id: "mock-user-3",
      name: "Chen Wei",
      home_country: "China",
      home_city: "Beijing",
      current_country: "Germany",
      current_city: "Munich",
      university: "TUM Munich",
      bio: "Physics enthusiast. Miss good dim sum and tea ceremonies.",
      instagram: "chen_wei_physics",
      linkedin: "chenwei-physics",
      favorite_dish: "Dim Sum",
      languages_spoken: "Mandarin, English",
      languages_learning: "German, French",
      onboarded: true,
      created_at: new Date().toISOString(),
      arrival_date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0], // 15 days ago (< 3 months)
      is_buddy: false,
      major: "Physics",
      study_interests: "Quantum Mechanics, Thermodynamics",
    }
  );

  // Generate the rest
  for (let i = 4; i <= count; i++) {
    const origin = countries[Math.floor(Math.random() * countries.length)];
    const destination = destinationCities[Math.floor(Math.random() * destinationCities.length)];
    
    // Pick name
    const rawName = origin.names[Math.floor(Math.random() * origin.names.length)];
    const uniqueName = `${rawName} #${i}`;

    const homeCity = origin.cities[Math.floor(Math.random() * origin.cities.length)];
    const uni = destination.unis[Math.floor(Math.random() * destination.unis.length)];
    const bio = bios[Math.floor(Math.random() * bios.length)];
    const dish = origin.dish[Math.floor(Math.random() * origin.dish.length)];
    
    const speaks = origin.lang[0];
    const learning = origin.lang[1];

    const major = origin.majors[Math.floor(Math.random() * origin.majors.length)];
    
    const arrivalDaysAgo = Math.floor(Math.random() * 365); // up to 1 year
    const arrivalDateStr = new Date(Date.now() - arrivalDaysAgo * 24 * 3600 * 1000).toISOString().split('T')[0];
    const isBuddy = arrivalDaysAgo > 270 && Math.random() > 0.4; // volunteer senior buddy if here for > 9 months

    list.push({
      id: `mock-user-${i}`,
      name: uniqueName,
      home_country: origin.name,
      home_city: homeCity,
      current_country: destination.country,
      current_city: destination.city,
      university: uni,
      bio: bio,
      instagram: `${uniqueName.toLowerCase().replace(/[^a-z0-9]/g, "")}_ig`,
      whatsapp: `+39${Math.floor(300000000 + Math.random() * 700000000)}`,
      favorite_dish: dish,
      languages_spoken: speaks,
      languages_learning: learning,
      onboarded: true,
      created_at: new Date(Date.now() - Math.random() * 3600000 * 24 * 30).toISOString(),
      arrival_date: arrivalDateStr,
      is_buddy: isBuddy,
      major: major,
      study_interests: `${major} topics, exam prep`,
    });
  }

  return list;
}

function getLocalProfiles(): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PROFILES_KEY);
  if (!raw || JSON.parse(raw).length < 10) {
    const seed = generateMockProfiles(150);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalProfiles(profiles: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function getLocalMarketplace(): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(MARKETPLACE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw).filter((item: any) => !item.id?.startsWith("market-") && item.user_name !== "Luisa Santos");
  } catch {
    return [];
  }
}

function saveLocalMarketplace(items: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(items));
}

function getLocalSuggestions(): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(SUGGESTIONS_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw).filter((item: any) => !item.id?.startsWith("sug-"));
  } catch {
    return [];
  }
}

function saveLocalSuggestions(items: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(items));
}

function getLocalVotes(): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(VOTES_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw).filter((item: any) => !item.suggestion_id?.startsWith("sug-"));
  } catch {
    return [];
  }
}

function saveLocalVotes(items: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOTES_KEY, JSON.stringify(items));
}

function getLocalChats(): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CHATS_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw).filter((item: any) => !item.id?.startsWith("chat-") && item.user_name !== "Luisa Santos");
  } catch {
    return [];
  }
}

function saveLocalChats(chats: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

function getLocalHangouts(): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(HANGOUTS_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw).filter((item: any) => !item.id?.startsWith("event-") && item.created_by_name !== "Luisa Santos");
  } catch {
    return [];
  }
}

function saveLocalHangouts(hangouts: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HANGOUTS_KEY, JSON.stringify(hangouts));
}

class MockQueryBuilder {
  private tableName: string;
  private data: any[] = [];
  private error: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
    if (tableName === "profiles") {
      this.data = getLocalProfiles();
    } else if (tableName === "chats") {
      this.data = getLocalChats();
    } else if (tableName === "hangouts") {
      this.data = getLocalHangouts();
    } else if (tableName === "marketplace") {
      this.data = getLocalMarketplace();
    } else if (tableName === "suggestions") {
      this.data = getLocalSuggestions();
    } else if (tableName === "votes") {
      this.data = getLocalVotes();
    }
  }

  select(columns: string = "*") {
    return this;
  }

  eq(column: string, value: any) {
    this.data = this.data.filter(item => item[column] === value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const ascending = options?.ascending ?? true;
    this.data.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
    return this;
  }

  async then(onfulfilled?: (value: any) => any) {
    const result = { data: this.data, error: this.error };
    if (onfulfilled) {
      return onfulfilled(result);
    }
    return result;
  }

  async maybeSingle() {
    return { data: this.data.length > 0 ? this.data[0] : null, error: this.error };
  }

  async delete() {
    if (this.tableName === "marketplace") {
      const all = getLocalMarketplace();
      const idsToRemove = this.data.map(item => item.id);
      const updated = all.filter(item => !idsToRemove.includes(item.id));
      saveLocalMarketplace(updated);
    } else if (this.tableName === "suggestions") {
      const all = getLocalSuggestions();
      const idsToRemove = this.data.map(item => item.id);
      const updated = all.filter(item => !idsToRemove.includes(item.id));
      saveLocalSuggestions(updated);
    } else if (this.tableName === "votes") {
      const all = getLocalVotes();
      const updated = all.filter(v => !this.data.some(d => d.suggestion_id === v.suggestion_id && d.user_id === v.user_id));
      saveLocalVotes(updated);
    }
    return { data: this.data, error: null };
  }

  async upsert(payload: any) {
    const now = new Date().toISOString();
    if (this.tableName === "profiles") {
      const list = getLocalProfiles();
      const index = list.findIndex(p => p.id === payload.id);
      const item = {
        ...payload,
        updated_at: now,
        created_at: index >= 0 ? list[index].created_at : now,
      };

      if (index >= 0) {
        list[index] = item;
      } else {
        list.push(item);
      }
      saveLocalProfiles(list);
      this.data = [item];
    } else if (this.tableName === "chats") {
      const list = getLocalChats();
      const item = {
        id: payload.id || Math.random().toString(36).substring(2),
        created_at: now,
        ...payload
      };
      list.push(item);
      saveLocalChats(list);
      this.data = [item];
    } else if (this.tableName === "hangouts") {
      const list = getLocalHangouts();
      const index = list.findIndex(h => h.id === payload.id);
      const item = {
        id: payload.id || Math.random().toString(36).substring(2),
        created_at: index >= 0 ? list[index].created_at : now,
        rsvps: payload.rsvps || (index >= 0 ? list[index].rsvps : []),
        attendee_count: payload.attendee_count ?? (index >= 0 ? list[index].attendee_count : 0),
        ...payload
      };
      if (index >= 0) {
        list[index] = item;
      } else {
        list.push(item);
      }
      saveLocalHangouts(list);
      this.data = [item];
    } else if (this.tableName === "marketplace") {
      const list = getLocalMarketplace();
      const index = list.findIndex(m => m.id === payload.id);
      const item = {
        id: payload.id || Math.random().toString(36).substring(2),
        created_at: index >= 0 ? list[index].created_at : now,
        ...payload
      };
      if (index >= 0) {
        list[index] = item;
      } else {
        list.push(item);
      }
      saveLocalMarketplace(list);
      this.data = [item];
    } else if (this.tableName === "suggestions") {
      const list = getLocalSuggestions();
      const index = list.findIndex(s => s.id === payload.id);
      const item = {
        id: payload.id || Math.random().toString(36).substring(2),
        created_at: index >= 0 ? list[index].created_at : now,
        status: payload.status || (index >= 0 ? list[index].status : "pending"),
        ...payload
      };
      if (index >= 0) {
        list[index] = item;
      } else {
        list.push(item);
      }
      saveLocalSuggestions(list);
      this.data = [item];
    } else if (this.tableName === "votes") {
      const list = getLocalVotes();
      const index = list.findIndex(v => v.suggestion_id === payload.suggestion_id && v.user_id === payload.user_id);
      const item = {
        created_at: now,
        ...payload
      };
      if (index >= 0) {
        list[index] = item;
      } else {
        list.push(item);
      }
      saveLocalVotes(list);
      this.data = [item];
    }
    return { data: this.data, error: this.error };
  }
}

let authChangeListeners: Array<(event: string) => void> = [];

export const supabase = {
  from: (tableName: string) => {
    return new MockQueryBuilder(tableName);
  },
  auth: {
    getSession: async () => {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback: (event: string) => void) => {
      authChangeListeners.push(callback);
      // Immediately trigger SIGNED_IN since we auto-log in locally
      setTimeout(() => callback("SIGNED_IN"), 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authChangeListeners = authChangeListeners.filter(l => l !== callback);
            }
          }
        }
      };
    },
    signOut: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("connect_abroad_user_id");
      }
      authChangeListeners.forEach(listener => listener("SIGNED_OUT"));
      return { error: null };
    }
  }
} as any;
