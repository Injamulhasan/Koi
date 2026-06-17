import React, { createContext, useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMe,
  useLogin,
  useSignup,
  useLogout,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Predefined mock avatars/users for quick selection
export const PRESETS = [
  { name: "Rafir", email: "rafir@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Rafir" },
  { name: "Ratul", email: "ratul@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Ratul" },
  { name: "Saif", email: "saif@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Saif" },
  { name: "Mushfiq", email: "mushfiq@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Mushfiq" },
  { name: "Reja", email: "reja@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Reja" },
  { name: "Injam", email: "injam@example.com", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Injam" },
];

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isSignedIn: false,
});

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  });

  const isSignedIn = !!user && !error;

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, isSignedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const { user, isLoading, isSignedIn } = useContext(AuthContext);
  return {
    isLoaded: !isLoading,
    isSignedIn,
    user: user
      ? {
          id: user.clerkId || `user_${user.id}`,
          fullName: user.name,
          firstName: user.name.split(" ")[0] || user.name,
          lastName: user.name.split(" ").slice(1).join(" ") || "",
          imageUrl: user.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.name}`,
          primaryEmailAddress: {
            emailAddress: user.email,
          },
        }
      : null,
  };
}

export function useAuth() {
  const { user, isLoading, isSignedIn } = useContext(AuthContext);
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const signOut = async () => {
    await logoutMutation.mutateAsync(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        queryClient.clear();
        setLocation("/");
      },
    });
  };

  return {
    isLoaded: !isLoading,
    isSignedIn,
    userId: user ? user.clerkId || `user_${user.id}` : null,
    signOut,
  };
}

export function useClerk(): any {
  const { signOut } = useAuth();
  const { user } = useUser();
  return {
    user,
    signOut,
    addListener: () => () => {},
  };
}

export function Show({
  when,
  children,
}: {
  when: "signed-in" | "signed-out";
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoading } = useContext(AuthContext);

  if (isLoading) return null;
  if (when === "signed-in" && isSignedIn) return <>{children}</>;
  if (when === "signed-out" && !isSignedIn) return <>{children}</>;
  return null;
}

export function SignIn() {
  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [isSignUpMode, setIsSignUpMode] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState(PRESETS[0].avatarUrl);
  const [error, setError] = React.useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetMeQueryKey(), data);
          queryClient.invalidateQueries();
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          setError(err?.data?.error || err?.message || "Invalid email or password.");
        },
      }
    );
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !name) {
      setError("All fields are required.");
      return;
    }

    signupMutation.mutate(
      { data: { email, password, name, avatarUrl } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetMeQueryKey(), data);
          queryClient.invalidateQueries();
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          setError(err?.data?.error || err?.message || "Registration failed.");
        },
      }
    );
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setEmail(preset.email);
    setPassword("kamla123"); // Preset quick login password
    setName(preset.name);
    setAvatarUrl(preset.avatarUrl);

    // Auto signup/login for presets
    loginMutation.mutate(
      { data: { email: preset.email, password: "kamla123" } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetMeQueryKey(), data);
          queryClient.invalidateQueries();
          setLocation("/dashboard");
        },
        onError: () => {
          // If login fails, try to sign up
          signupMutation.mutate(
            { data: { email: preset.email, password: "kamla123", name: preset.name, avatarUrl: preset.avatarUrl } },
            {
              onSuccess: (signupData) => {
                queryClient.setQueryData(getGetMeQueryKey(), signupData);
                queryClient.invalidateQueries();
                setLocation("/dashboard");
              },
              onError: (err: any) => {
                setError(err?.data?.error || err?.message || "Preset login failed.");
              },
            }
          );
        },
      }
    );
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
                disabled={loginMutation.isPending || signupMutation.isPending}
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
            disabled={signupMutation.isPending}
            className="w-full h-10 bg-primary text-primary-foreground font-black text-sm rounded-md shadow-sm hover:bg-primary/90 transition-colors"
          >
            {signupMutation.isPending ? "Creating Citizen..." : "Sign Up"}
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
            disabled={loginMutation.isPending}
            className="w-full h-10 bg-primary text-primary-foreground font-black text-sm rounded-md shadow-sm hover:bg-primary/90 transition-colors"
          >
            {loginMutation.isPending ? "Entering..." : "Sign In"}
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
