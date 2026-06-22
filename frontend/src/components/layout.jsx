import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@/lib/auth.jsx";
import {
  Home,
  MessageSquare,
  HandCoins,
  UserCircle,
  Bell,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button.jsx";
import { cn } from "@/lib/utils.js";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import { useListNotifications } from "@/lib/api.js";

export default function Layout({ children }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: notifications } = useListNotifications();
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/lending", label: "Lending", icon: HandCoins },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 bg-sidebar border-r border-sidebar-border z-20">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-9 h-9" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-primary">Everything here is a joke.</p>
              <h1 className="text-xl font-black tracking-tight text-sidebar-foreground">KOI</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer group relative border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary font-black shadow-[4px_4px_0_hsl(var(--accent))]"
                    : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-sidebar-border"
                )}>
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-primary")} />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border mt-auto">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="w-9 h-9 border border-border">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.firstName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {user?.fullName || user?.firstName || 'User'}
              </p>
              <p className="text-xs text-sidebar-foreground/45 truncate">builder, not a resource</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive group"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:text-destructive" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="w-7 h-7" />
          <h1 className="font-black tracking-tight text-sidebar-foreground">KOI</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/notifications">
            <div className="relative p-2">
              <Bell className="w-5 h-5 text-sidebar-foreground/70" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
              )}
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-sidebar z-20 flex flex-col">
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md transition-colors cursor-pointer border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary font-black"
                        : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-lg">{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="p-6 border-t border-border mt-auto">
            <Button
              variant="destructive"
              className="w-full justify-start h-12 text-base"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-72 pt-16 md:pt-0 min-h-screen flex flex-col relative overflow-hidden">
        <div className="flex-1">
          {children}
        </div>
        <footer className="py-8 border-t border-border/40 text-center text-xs text-muted-foreground space-y-1.5 max-w-5xl mx-auto w-full">
          <p className="font-semibold text-foreground/80">© 2026 KOI.bd. All wrongs reserved.</p>
          <p className="max-w-xl mx-auto text-[11px] leading-relaxed text-muted-foreground/60 px-4">
            This site is a work of fiction and satire for entertainment purposes only. Any resemblance to actual persons, living or dead, or actual software companies, is purely coincidental (and hilarious). Please don't sue us; we are broke.
          </p>
          <p className="text-[11px] pt-1 text-muted-foreground/50">
            Made with <span className="text-destructive font-emoji">❤️</span> in Bangladesh
          </p>
        </footer>
      </main>

      {/* Bottom Nav (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-sidebar/95 backdrop-blur-lg border-t border-sidebar-border z-30 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center justify-center w-14 h-full relative cursor-pointer">
                {isActive && (
                  <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-1 bg-primary"></span>
                )}
                <Icon className={cn("w-6 h-6 mb-1 transition-colors", isActive ? "text-primary" : "text-sidebar-foreground/60")} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
