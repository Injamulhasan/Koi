import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Megaphone, Coffee, Shield, Vote } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden relative selection:bg-primary selection:text-primary-foreground">
      <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--secondary)),hsl(var(--accent)),hsl(var(--destructive)))]" />

      <header className="px-5 md:px-6 py-6 flex justify-between items-center z-10 relative max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-md border border-foreground shadow-[3px_3px_0_hsl(var(--accent))]">
            <img src="/logo.svg" alt="KOI Logo" className="w-8 h-8" />
          </div>
          <div>
            <span className="block text-xl font-black tracking-tight text-foreground">KOI</span>
            <span className="hidden sm:block text-[10px] font-black uppercase tracking-[0.3em] text-primary">friends, votes, receipts</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-bold hover:bg-muted">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-[4px_4px_0_hsl(var(--foreground))]">Join</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 relative mt-8 mb-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-card border border-card-border text-sm font-black text-foreground mb-7 shadow-[3px_3px_0_hsl(var(--primary))]"
        >
          <Megaphone className="w-4 h-4 text-primary" />
          <span>Digital tong for the overbooked crew</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-7xl font-black tracking-tight text-foreground mb-6 leading-[0.95]"
        >
          Because <span className="bg-primary text-primary-foreground px-2 box-decoration-clone">"we should hang out"</span> deserves a quorum.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl leading-relaxed"
        >
          A private republic for friends who plan hangouts, food runs, and all the tiny debts that mysteriously become national issues.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link href="/sign-up">
            <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[6px_6px_0_hsl(var(--accent))] transition-all hover:-translate-y-0.5 active:translate-y-0 rounded-md font-black">
              Open the Tong
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 border-border bg-card hover:bg-muted rounded-md font-bold">
              Existing citizen
            </Button>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-5xl w-full text-left"
        >
          <div className="p-5 rounded-lg bg-card border border-card-border shadow-[5px_5px_0_hsl(var(--primary))]">
            <div className="w-11 h-11 rounded-md bg-primary flex items-center justify-center mb-4 border border-foreground text-primary-foreground">
              <Vote className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2">Gonotontro</h3>
            <p className="text-muted-foreground leading-relaxed">Locations win by votes, not by whoever types the longest paragraph in chat.</p>
          </div>
          <div className="p-5 rounded-lg bg-card border border-card-border shadow-[5px_5px_0_hsl(var(--secondary))]">
            <div className="w-11 h-11 rounded-md bg-secondary flex items-center justify-center mb-4 border border-foreground text-secondary-foreground">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2">Tong</h3>
            <p className="text-muted-foreground leading-relaxed">Chat, drop images, react, and preserve the decisions before they dissolve.</p>
          </div>
          <div className="p-5 rounded-lg bg-card border border-card-border shadow-[5px_5px_0_hsl(var(--destructive))]">
            <div className="w-11 h-11 rounded-md bg-destructive flex items-center justify-center mb-4 border border-foreground text-destructive-foreground">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2">Receipts</h3>
            <p className="text-muted-foreground leading-relaxed">Budgets and IOUs stay visible, so friendship survives accounting season.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="mt-10 flex flex-wrap justify-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground"
        >
          <span className="border border-border bg-card px-3 py-1 rounded">Vote</span>
          <span className="border border-border bg-card px-3 py-1 rounded">Schedule</span>
          <span className="border border-border bg-card px-3 py-1 rounded">Budget</span>
          <span className="border border-border bg-card px-3 py-1 rounded">No agency needed</span>
        </motion.div>
      </main>
    </div>
  );
}
