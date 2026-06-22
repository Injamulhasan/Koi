import { Link } from "wouter";
import { Button } from "@/components/ui/button.jsx";
import { motion } from "framer-motion";
import { Megaphone, Coffee, Shield, Vote } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden relative selection:bg-primary selection:text-primary-foreground">
      <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--secondary)),hsl(var(--accent)),hsl(var(--destructive)))]" />

      <header className="px-5 md:px-6 py-6 flex justify-between items-center z-10 relative max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-md border border-foreground shadow-[3px_3px_0_hsl(var(--accent))]">
            <img src="/logo.svg" alt="কই Logo" className="w-8 h-8" />
          </div>
          <div>
            <span className="block text-xl font-black tracking-tight text-foreground">KOI</span>
            <span className="hidden sm:block text-[10px] font-black uppercase tracking-wide text-primary">Everything here is a joke.</span>
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
          <span>The Daily Grind Command Center</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-7xl font-black tracking-tight text-foreground mb-6 leading-[0.95]"
        >
          Diagnose exactly how toxic,<span className="bg-primary text-primary-foreground px-2 box-decoration-clone">broke, or flakey </span> your friend circle is.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl leading-relaxed"
        >
          No more. We brought back democracy. Cast your vote or shut up when you get dragged to Dhanmandi again.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link href="/sign-up">
            <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[6px_6px_0_hsl(var(--accent))] transition-all hover:-translate-y-0.5 active:translate-y-0 rounded-md font-black">
              Enter the Brainrot
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 border-border bg-card hover:bg-muted rounded-md font-bold">
              Existing Wage Slave
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
            <h3 className="text-xl font-black mb-2">The Satire Clause</h3>
            <p className="text-muted-foreground leading-relaxed">Everything here is a joke. Do not take career advice from a meme site.If you find yourself offended, please submit a pull request to your sense of humor. Repeat offenders will be forcefully logged out and ghosted.</p>
          </div>
          <div className="p-5 rounded-lg bg-card border border-card-border shadow-[5px_5px_0_hsl(var(--secondary))]">
            <div className="w-11 h-11 rounded-md bg-secondary flex items-center justify-center mb-4 border border-foreground text-secondary-foreground">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2">Liability Protocol</h3>
            <p className="text-muted-foreground leading-relaxed">Users are solely responsible for their generated content.KOI acts purely as an intermediary platform. We do not endorse any user-generated content. By posting, you agree to indemnify us against any legal action resulting from your inability to read this document.</p>
          </div>
          <div className="p-5 rounded-lg bg-card border border-card-border shadow-[5px_5px_0_hsl(var(--destructive))]">
            <div className="w-11 h-11 rounded-md bg-destructive flex items-center justify-center mb-4 border border-foreground text-destructive-foreground">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2">Cookie Policy</h3>
            <p className="text-muted-foreground leading-relaxed">We use cookies to track your misery (and analytics). Deal with it.Specifically, we use cookies for authentication (so you stay logged in to your shift) and basic analytics (so we know how many builders are clocking in). We don't sell your data because frankly, nobody wants to buy a list of burnout symptoms.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="mt-10 flex flex-wrap justify-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground"
        >
          <span className="border border-border bg-card px-3 py-1 rounded">I'll pay you back next life.</span>
          <span className="border border-border bg-card px-3 py-1 rounded">Chat, dump unhinged memes</span>
          <span className="border border-border bg-card px-3 py-1 rounded">Absolute ghost energy</span>
        </motion.div>
      </main>

      <footer className="py-8 border-t border-border/40 text-center text-xs text-muted-foreground space-y-1.5 max-w-5xl mx-auto w-full z-10 relative mt-16">
        <p className="font-semibold text-foreground/80">© 2026 KOI.bd. All wrongs reserved.</p>
        <p className="max-w-xl mx-auto text-[11px] leading-relaxed text-muted-foreground/60 px-4">
          This site is a work of fiction and satire for entertainment purposes only. Any resemblance to actual persons, living or dead, or actual software companies, is purely coincidental (and hilarious). Please don't sue us; we are broke.
        </p>
        <p className="text-[11px] pt-1 text-muted-foreground/50">
          Made with <span className="text-destructive font-emoji">❤️</span> in Bangladesh
        </p>
      </footer>
    </div>
  );
}
