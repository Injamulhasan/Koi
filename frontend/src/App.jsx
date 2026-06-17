import { useEffect } from "react";
import { ClerkProvider, SignIn, SignUp, Show } from '@/lib/auth';
import { Switch, Route, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

function ProtectedRoute({ component: Component }) {
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

function ClerkProviderWithRoutes() {
  return (
    <ClerkProvider>
      <WsProvider>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
          <Route path="/vote" component={() => <ProtectedRoute component={VotePage} />} />
          <Route path="/chat" component={() => <ProtectedRoute component={ChatPage} />} />
          <Route path="/schedule" component={() => <ProtectedRoute component={SchedulePage} />} />
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

function App() {
  // Enforce dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ClerkProviderWithRoutes />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
