import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabaseClient.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getGetMeQueryKey } from "./api.js";

export const PRESETS = [
  { name: "Rafir", email: "rafir@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Rafir" },
  { name: "Ratul", email: "ratul@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Ratul" },
  { name: "Saif", email: "saif@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Saif" },
  { name: "Mushfiq", email: "mushfiq@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Mushfiq" },
  { name: "Reja", email: "reja@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Reja" },
  { name: "Injam", email: "injam@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Injam" },
];

const AuthContext = createContext({
  session: null,
  user: null,
  isLoading: true,
  isSignedIn: false,
});

export function ClerkProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setIsLoading(false);
      queryClient.invalidateQueries();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const user = session?.user ?? null;
  const isSignedIn = !!user;

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isSignedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const { user, isLoading, isSignedIn } = useContext(AuthContext);

  if (isLoading || !user) {
    return { isLoaded: !isLoading, isSignedIn: false, user: null };
  }

  const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email.split("@")[0];
  const avatarUrl = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${name}`;

  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: user.id,
      fullName: name,
      firstName: name.split(" ")[0] || name,
      lastName: name.split(" ").slice(1).join(" ") || "",
      imageUrl: avatarUrl,
      primaryEmailAddress: {
        emailAddress: user.email,
      },
    },
  };
}

export function useAuth() {
  const { user, isLoading, isSignedIn } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.setQueryData(getGetMeQueryKey(), null);
    queryClient.clear();
    setLocation("/");
  };

  return {
    isLoaded: !isLoading,
    isSignedIn,
    userId: user ? user.id : null,
    signOut,
  };
}

export function useClerk() {
  const { signOut } = useAuth();
  const { user } = useUser();
  return {
    user,
    signOut,
    addListener: () => () => {},
  };
}

export function Show({ when, children }) {
  const { isSignedIn, isLoading } = useContext(AuthContext);

  if (isLoading) return null;
  if (when === "signed-in" && isSignedIn) return <>{children}</>;
  if (when === "signed-out" && !isSignedIn) return <>{children}</>;
  return null;
}

export function SignIn() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(PRESETS[0].avatarUrl);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setSubmitting(false);
      return;
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setSubmitting(false);
    } else {
      queryClient.invalidateQueries();
      setLocation("/dashboard");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!email || !password || !name) {
      setError("All fields are required.");
      setSubmitting(false);
      return;
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
          avatar_url: avatarUrl,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setSubmitting(false);
    } else {
      if (data?.session) {
        queryClient.invalidateQueries();
        setLocation("/dashboard");
      } else {
        setError("Sign up successful! Please check your email for confirmation.");
        setSubmitting(false);
      }
    }
  };

  const handlePresetSelect = async (preset) => {
    setError("");
    setSubmitting(true);

    // Try to login with preset email & default password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: preset.email,
      password: "kamla123",
    });

    if (signInError) {
      // If login fails, try to sign up the preset citizen
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: preset.email,
        password: "kamla123",
        options: {
          data: {
            name: preset.name,
            avatar_url: preset.avatarUrl,
          },
        },
      });

      if (signUpError) {
        setError("Preset login failed: " + signUpError.message);
        setSubmitting(false);
      } else {
        if (signUpData?.session) {
          queryClient.invalidateQueries();
          setLocation("/dashboard");
        } else {
          setError("Preset citizen created! Please check your email or disable email confirmations in Supabase.");
          setSubmitting(false);
        }
      }
    } else {
      queryClient.invalidateQueries();
      setLocation("/dashboard");
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-card border border-card-border rounded-lg shadow-[8px_8px_0_hsl(var(--primary))] text-foreground">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black tracking-tight text-primary">
          {isSignUpMode ? "Create Account" : "Enter the Republic"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isSignUpMode
            ? "Register a new citizen identity"
            : "Select a citizen or sign in with your credentials"}
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Preset selection for quick access */}
      {!isSignUpMode && (
        <div className="space-y-3 mb-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
            Quick Citizen Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.email}
                onClick={() => handlePresetSelect(preset)}
                disabled={submitting}
                className="flex items-center gap-3 p-2.5 bg-secondary/5 hover:bg-secondary/15 border border-border rounded-md text-left transition-all cursor-pointer group"
              >
                <Avatar className="w-7 h-7 border border-border group-hover:scale-105 transition-transform">
                  <AvatarImage src={preset.avatarUrl} />
                  <AvatarFallback className="text-[10px]">{preset.name[0]}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-xs truncate">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isSignUpMode && (
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-border"></div>
          <span className="relative bg-card px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Or Use Account
          </span>
        </div>
      )}

      {isSignUpMode ? (
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.15em] mb-1.5">
              Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Robin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 bg-input border border-border text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.15em] mb-1.5">
              Email
            </label>
            <Input
              type="email"
              placeholder="robin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 bg-input border border-border text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.15em] mb-1.5">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 bg-input border border-border text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.15em] mb-2">
              Select Avatar Seed
            </label>
            <div className="flex gap-2 items-center flex-wrap">
              {PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => setAvatarUrl(preset.avatarUrl)}
                  className={`w-9 h-9 rounded-full border-2 overflow-hidden transition-all ${
                    avatarUrl === preset.avatarUrl ? "border-primary scale-110 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={preset.avatarUrl} alt={preset.name} className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-10 bg-primary text-primary-foreground font-black text-sm rounded-md shadow-sm hover:bg-primary/90 transition-colors"
          >
            {submitting ? "Creating Citizen..." : "Sign Up"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.15em] mb-1.5">
              Email
            </label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 bg-input border border-border text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.15em] mb-1.5">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 bg-input border border-border text-sm"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-10 bg-primary text-primary-foreground font-black text-sm rounded-md shadow-sm hover:bg-primary/90 transition-colors"
          >
            {submitting ? "Entering..." : "Sign In"}
          </Button>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-muted-foreground">
        {isSignUpMode ? "Already a citizen?" : "New to the group?"}{" "}
        <button
          onClick={() => setIsSignUpMode(!isSignUpMode)}
          className="text-primary hover:underline font-bold transition-all"
        >
          {isSignUpMode ? "Sign In Instead" : "Create Citizen Identity"}
        </button>
      </div>
    </div>
  );
}

export function SignUp() {
  return <SignIn />;
}
