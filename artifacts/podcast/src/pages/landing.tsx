import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users, Moon, Coffee, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden relative selection:bg-primary/20 selection:text-primary">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none" />

      <header className="px-6 py-8 flex justify-between items-center z-10 relative max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
            <img src="/logo.svg" alt="Podcast Logo" className="w-8 h-8" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Podcast</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-medium hover:bg-primary/10 hover:text-primary">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">Sign Up</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 relative mt-12 mb-20 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-secondary-border text-sm font-medium text-secondary-foreground mb-8"
        >
          <Moon className="w-4 h-4 text-primary" />
          <span>The late-night group planner</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight"
        >
          Because <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">"we should hang out"</span> shouldn't be a lie.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed"
        >
          Your friend group's private hub. Vote on spots, set schedules, track group funds, and keep the receipts. No noise, just the crew.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link href="/sign-up">
            <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:scale-105 active:scale-95 rounded-2xl">
              Get Started
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 border-border bg-background hover:bg-muted/50 rounded-2xl">
              Already have an account?
            </Button>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full text-left"
        >
          <div className="p-6 rounded-3xl bg-card border border-card-border shadow-lg shadow-black/5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <Coffee className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Vote on the Spot</h3>
            <p className="text-muted-foreground leading-relaxed">No more infinite group chat scrolling. See where everyone wants to go, instantly.</p>
          </div>
          <div className="p-6 rounded-3xl bg-card border border-card-border shadow-lg shadow-black/5">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 border border-accent/20">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Split the Bill</h3>
            <p className="text-muted-foreground leading-relaxed">Keep track of who owes what and who covered the last chaotic late-night food run.</p>
          </div>
          <div className="p-6 rounded-3xl bg-card border border-card-border shadow-lg shadow-black/5">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4 border border-secondary/20">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Private & Secure</h3>
            <p className="text-muted-foreground leading-relaxed">Invites only. This isn't a public feed, it's just the group chat evolved.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}