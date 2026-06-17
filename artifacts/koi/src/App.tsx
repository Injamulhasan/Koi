import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@/lib/auth';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WsProvider } from "@/context/ws-context";

import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import DashboardPage from "@/pages/dashboard";
import VotePage from "@/pages/vote";
import ChatPage from "@/pages/chat";
import SchedulePage from "@/pages/schedule";
import ContributionsPage from "@/pages/contributions";
import LendingPage from "@/pages/lending";
import ProfilePage from "@/pages/profile";
import NotificationsPage from "@/pages/notifications";
import LandingPage from "@/pages/landing";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(47 100% 56%)",
    colorForeground: "hsl(42 38% 94%)",
    colorMutedForeground: "hsl(42 14% 66%)",
    colorDanger: "hsl(5 85% 58%)",
    colorBackground: "hsl(210 26% 10%)",
    colorInput: "hsl(210 22% 15%)",
    colorInputForeground: "hsl(42 38% 94%)",
    colorNeutral: "hsl(210 22% 15%)",
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card border-card-border rounded-lg w-[440px] max-w-full overflow-hidden shadow-[8px_8px_0_hsl(var(--primary))]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold tracking-tight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-green-500",
    alertText: "text-destructive",
    logoBox: "flex justify-center",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border-border bg-transparent hover:bg-muted/50",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-black h-10 shadow-sm",
    formFieldInput: "bg-input border-border text-foreground h-10 rounded-md",
    footerAction: "bg-transparent",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive text-destructive",
    otpCodeFieldInput: "bg-input border-border text-foreground",
    formFieldRow: "mb-4",
    main: "gap-6",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignIn />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignUp />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function UserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const queryClient = useQueryClient();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (hasSynced.current) return;
    hasSynced.current = true;

    fetch("/api/users/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: user.fullName || user.firstName || "Friend",
        email: user.primaryEmailAddress?.emailAddress || "",
        avatarUrl: user.imageUrl || null,
      }),
    })
      .then(() => queryClient.invalidateQueries())
      .catch(() => {});
  }, [isLoaded, isSignedIn, user, queryClient]);

  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }: any) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to: string) => setLocation(stripBase(to))}
      routerReplace={(to: string) => setLocation(stripBase(to), { replace: true })}
    >
      {!clerkPubKey ? null : <ClerkQueryClientCacheInvalidator />}
      <UserSync />
      <WsProvider>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
        <Route path="/vote" component={() => <ProtectedRoute component={VotePage} />} />
        <Route path="/chat" component={() => <ProtectedRoute component={ChatPage} />} />
        <Route path="/schedule" component={() => <ProtectedRoute component={protectedComponent(SchedulePage)} />} />
        <Route path="/contributions" component={() => <ProtectedRoute component={ContributionsPage} />} />
        <Route path="/lending" component={() => <ProtectedRoute component={LendingPage} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
        <Route path="/notifications" component={() => <ProtectedRoute component={NotificationsPage} />} />
        <Route component={NotFound} />
      </Switch>
      </WsProvider>
    </ClerkProvider>
  );
}

function protectedComponent(Comp: any) {
  return Comp;
}

function App() {
  // Enforce dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={basePath}>
        <TooltipProvider>
          <ClerkProviderWithRoutes />
          <Toaster />
        </TooltipProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
