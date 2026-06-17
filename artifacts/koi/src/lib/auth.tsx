import React, { createContext, useContext, useState, useEffect } from "react";
import * as ClerkReact from "@clerk/react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

// Determine if Clerk keys are present
export const isClerkEnabled = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// PREDEFINED MOCK USERS
// ─────────────────────────────────────────────────────────────────────────────
export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: "mock_rafir", name: "Rafir", email: "rafir@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Rafir" },
  { id: "mock_ratul", name: "Ratul", email: "ratul@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Ratul" },
  { id: "mock_saif", name: "Saif", email: "saif@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Saif" },
  { id: "mock_mushfiq", name: "Mushfiq", email: "mushfiq@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Mushfiq" },
  { id: "mock_reja", name: "Reja", email: "reja@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Reja" },
  { id: "mock_injam", name: "Injam", email: "injam@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Injam" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK AUTH CONTEXT & PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
interface MockAuthContextType {
  currentUser: MockUser | null;
  login: (user: MockUser) => void;
  register: (name: string, email: string) => void;
  logout: () => void;
}

const MockAuthContext = createContext<MockAuthContextType | null>(null);

export function ClerkProvider({ children, ...props }: any) {
  if (isClerkEnabled) {
    return <ClerkReact.ClerkProvider {...props}>{children}</ClerkReact.ClerkProvider>;
  }

  return <MockAuthProvider>{children}</MockAuthProvider>;
}

function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(() => {
    const saved = localStorage.getItem("mock_clerk_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const syncUserWithDb = async (user: MockUser) => {
    try {
      localStorage.setItem("mock_clerk_id", user.id);
      localStorage.setItem("mock_clerk_user", JSON.stringify(user));
      
      const response = await fetch("/api/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Mock-User-Id": user.id,
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        }),
      });

      if (response.ok) {
        queryClient.invalidateQueries();
      }
    } catch (e) {
      console.error("Failed to sync mock user with DB", e);
    }
  };

  const login = (user: MockUser) => {
    setCurrentUser(user);
    syncUserWithDb(user).then(() => {
      setLocation("/dashboard");
    });
  };

  const register = (name: string, email: string) => {
    const seed = name.trim().replace(/\s+/g, "");
    const newUser: MockUser = {
      id: `mock_${Date.now()}`,
      name,
      email: email || `${seed.toLowerCase()}@mock.com`,
      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`,
    };
    login(newUser);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("mock_clerk_id");
    localStorage.removeItem("mock_clerk_user");
    queryClient.clear();
    setLocation("/");
  };

  return (
    <MockAuthContext.Provider value={{ currentUser, login, register, logout }}>
      {children}
    </MockAuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTER HOOKS
// ─────────────────────────────────────────────────────────────────────────────
export function useUser() {
  if (isClerkEnabled) {
    return ClerkReact.useUser();
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useContext(MockAuthContext);
  if (!context) throw new Error("useUser must be used within MockAuthProvider");

  const { currentUser } = context;

  if (!currentUser) {
    return {
      isLoaded: true,
      isSignedIn: false,
      user: null,
    };
  }

  const parts = currentUser.name.split(" ");
  const firstName = parts[0] || "Friend";
  const lastName = parts.slice(1).join(" ") || "";

  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: currentUser.id,
      fullName: currentUser.name,
      firstName,
      lastName,
      imageUrl: currentUser.avatarUrl,
      primaryEmailAddress: {
        emailAddress: currentUser.email,
      },
    },
  };
}

export function useAuth() {
  if (isClerkEnabled) {
    return ClerkReact.useAuth();
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useContext(MockAuthContext);
  if (!context) throw new Error("useAuth must be used within MockAuthProvider");

  const { currentUser, logout } = context;

  return {
    isLoaded: true,
    isSignedIn: !!currentUser,
    userId: currentUser?.id ?? null,
    signOut: async () => {
      logout();
    },
  };
}

export function useClerk(): any {
  if (isClerkEnabled) {
    return ClerkReact.useClerk();
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useContext(MockAuthContext);
  if (!context) throw new Error("useClerk must be used within MockAuthProvider");

  const { currentUser, logout } = context;

  const parts = currentUser?.name.split(" ") || [];
  const firstName = parts[0] || "Friend";
  const lastName = parts.slice(1).join(" ") || "";

  return {
    user: currentUser ? {
      id: currentUser.id,
      fullName: currentUser.name,
      firstName,
      lastName,
      imageUrl: currentUser.avatarUrl,
      primaryEmailAddress: {
        emailAddress: currentUser.email,
      },
    } : null,
    signOut: async () => {
      logout();
    },
    addListener: () => {
      return () => {};
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export function Show({ when, children }: { when: "signed-in" | "signed-out"; children: React.ReactNode }) {
  if (isClerkEnabled) {
    return <ClerkReact.Show when={when === "signed-in" ? "signed-in" : "signed-out"}>{children}</ClerkReact.Show>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isSignedIn } = useAuth();
  if (when === "signed-in" && isSignedIn) return <>{children}</>;
  if (when === "signed-out" && !isSignedIn) return <>{children}</>;
  return null;
}

// Custom Mock Sign In Component
export function SignIn() {
  if (isClerkEnabled) {
    return <ClerkReact.SignIn />;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useContext(MockAuthContext);
  if (!context) throw new Error("SignIn must be used within MockAuthProvider");

  const { login } = context;
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [error, setError] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setError("Please enter a name.");
      return;
    }
    context.register(customName.trim(), customEmail.trim());
  };

  return (
    <div className="w-full max-w-md p-6 bg-card border border-card-border rounded-lg shadow-[8px_8px_0_hsl(var(--primary))] text-foreground">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black tracking-tight text-primary">Enter the Republic</h2>
        <p className="text-sm text-muted-foreground mt-1">Select a citizen or check in with a new identity</p>
      </div>

      <div className="space-y-4 mb-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Select citizen</p>
        <div className="grid grid-cols-2 gap-2">
          {MOCK_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => login(user)}
              className="flex items-center gap-3 p-3 bg-secondary/10 hover:bg-secondary/20 border border-border rounded-md text-left transition-colors cursor-pointer group"
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-border group-hover:scale-105 transition-transform"
              />
              <span className="font-semibold text-sm truncate">{user.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-x-0 h-px bg-border"></div>
        <span className="relative bg-card px-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Or create new citizen</span>
      </div>

      <form onSubmit={handleCustomSubmit} className="space-y-4">
        {error && <p className="text-xs text-destructive font-semibold">{error}</p>}
        <div>
          <label className="block text-xs font-black uppercase tracking-[0.15em] mb-1.5">Name</label>
          <input
            type="text"
            placeholder="e.g. Robin"
            value={customName}
            onChange={(e) => { setCustomName(e.target.value); setError(""); }}
            className="w-full h-10 px-3 bg-input border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-[0.15em] mb-1.5">Email (Optional)</label>
          <input
            type="email"
            placeholder="robin@example.com"
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
            className="w-full h-10 px-3 bg-input border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="w-full h-10 bg-primary text-primary-foreground font-black text-sm rounded-md shadow-sm hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Check In
        </button>
      </form>
    </div>
  );
}

// For Mock mode, sign up is the same selection as sign in
export function SignUp() {
  return <SignIn />;
}
