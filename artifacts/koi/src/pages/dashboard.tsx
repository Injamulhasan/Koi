import { useState, useEffect, useMemo } from "react";
import {
  useGetDashboardSummary,
  useListLocations,
  useListVotes,
  useGetMyVote,
  useCastVote,
  useGetSchedule,
  useUpdateSchedule,
  useListContributions,
  useUpsertMyContribution,
  getListVotesQueryKey,
  getGetMyVoteQueryKey,
  getListLocationsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetScheduleQueryKey,
  getListContributionsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, MessageSquare, Wallet, HandCoins,
  Trophy, CheckCircle2, Clock, Edit3, ArrowRight, Loader2
} from "lucide-react";
import { Link } from "wouter";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/auth";

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, color = "text-primary" }: {
  icon: React.ElementType; title: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={cn("w-9 h-9 rounded-md flex items-center justify-center bg-current/10 border border-current/25", color)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <h2 className="text-xl font-black tracking-tight">{title}</h2>
    </div>
  );
}

// ── Vote section ─────────────────────────────────────────────────────────────
function VoteSection() {
  const queryClient = useQueryClient();
  const { data: locations, isLoading: loadingLocs } = useListLocations();
  const { data: votes, isLoading: loadingVotes } = useListVotes();
  const { data: myVote } = useGetMyVote();
  const castVote = useCastVote();
  const [selected, setSelected] = useState<number | null>(null);

  const votesByLocation = useMemo(() => {
    if (!votes) return {} as Record<number, typeof votes>;
    return votes.reduce((acc, v) => {
      if (!acc[v.locationId]) acc[v.locationId] = [];
      acc[v.locationId].push(v);
      return acc;
    }, {} as Record<number, typeof votes>);
  }, [votes]);

  const maxVotes = locations?.length ? Math.max(...locations.map(l => l.voteCount)) : 0;
  const leadingIds = locations?.filter(l => l.voteCount === maxVotes && maxVotes > 0).map(l => l.id) || [];

  const handleVote = (locationId: number) => {
    castVote.mutate({ data: { locationId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVotesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyVoteQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast.success("Vote cast!");
        setSelected(null);
      },
      onError: () => toast.error("Failed to cast vote"),
    });
  };

  if (loadingLocs || loadingVotes) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <AnimatePresence>
        {locations?.map(loc => {
          const locVotes = votesByLocation[loc.id] || [];
          const isMyVote = myVote?.locationId === loc.id;
          const isLeading = leadingIds.includes(loc.id);
          const isSelected = selected === loc.id;

          const handleCardClick = () => {
            if (isMyVote) return;
            if (isSelected) {
              handleVote(loc.id);
            } else {
              setSelected(loc.id);
            }
          };

          return (
            <motion.div
              key={loc.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.18 }}
            >
              <Card
                className={cn(
                  "overflow-hidden transition-all duration-200 cursor-pointer relative group h-full rounded-lg select-none",
                  isMyVote
                    ? "border-primary bg-primary/15 shadow-[4px_4px_0_hsl(var(--primary))]"
                    : isSelected
                      ? "border-accent bg-accent/10 shadow-[4px_4px_0_hsl(var(--accent))] animate-pulse"
                      : "border-card-border bg-card/90 hover:border-primary/50",
                )}
                onClick={handleCardClick}
              >
                {isLeading && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1">
                    <Trophy className="w-2.5 h-2.5" /> LEAD
                  </div>
                )}
                {isMyVote && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}

                <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={cn("font-black leading-tight text-xs md:text-sm", isMyVote ? "text-primary" : isSelected ? "text-accent" : "text-foreground")}>
                      {loc.name}
                    </h3>
                    {isMyVote ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono bg-background/50 px-1.5 py-0.5 rounded border border-border/20">{loc.voteCount}</span>
                    )}
                  </div>

                  {/* Voters list avatar grid */}
                  <div className="flex -space-x-1.5 mb-2 min-h-[24px]">
                    {locVotes.slice(0, 4).map(v => (
                      <Avatar key={v.id} className="w-6 h-6 border border-background">
                        <AvatarImage src={v.userAvatarUrl || undefined} />
                        <AvatarFallback className="text-[9px] bg-secondary/50">{v.userName?.[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                    {locVotes.length === 0 && <span className="text-[10px] text-muted-foreground/40 italic mt-1">No votes</span>}
                  </div>

                  {/* Call to action message */}
                  {isSelected && (
                    <div className="text-[10px] font-black uppercase tracking-wider text-accent text-center bg-accent/15 py-1 rounded border border-accent/25 animate-bounce">
                      Tap again to confirm
                    </div>
                  )}
                  {!isSelected && !isMyVote && (
                    <div className="text-[9px] font-bold text-muted-foreground/30 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      Tap to select
                    </div>
                  )}
                  {isMyVote && (
                    <div className="text-[10px] font-black uppercase tracking-wider text-primary text-center bg-primary/10 py-1 rounded border border-primary/20">
                      Your Choice
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ── Schedule section ──────────────────────────────────────────────────────────
function ScheduleSection() {
  const queryClient = useQueryClient();
  const { data: schedule, isLoading } = useGetSchedule();
  const updateSchedule = useUpdateSchedule();
  const [editing, setEditing] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    if (schedule && !editing) {
      setDateStr(schedule.date);
      setTimeStr(schedule.time);
    }
  }, [schedule, editing]);

  const handleSave = () => {
    if (!dateStr || !timeStr) { toast.error("Date and time required"); return; }
    updateSchedule.mutate({ data: { date: dateStr, time: timeStr } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetScheduleQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast.success("Schedule updated!");
        setEditing(false);
      },
      onError: () => toast.error("Failed to update"),
    });
  };

  if (isLoading) return <Skeleton className="h-28 rounded-xl" />;

  const scheduleDate = schedule?.date && schedule?.time
    ? new Date(`${schedule.date}T${schedule.time}`) : null;
  const past = scheduleDate ? isPast(scheduleDate) : false;

  return (
    <Card className="bg-card/90 border-card-border rounded-lg">
      <CardContent className="p-5">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date</label>
                <Input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)}
                  className="h-10 bg-background border-border rounded-md text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Time</label>
                <Input type="time" value={timeStr} onChange={e => setTimeStr(e.target.value)}
                  className="h-10 bg-background border-border rounded-md text-xs" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleSave} disabled={updateSchedule.isPending}>
                {updateSchedule.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : scheduleDate ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{past ? "Past event" : "Next hangout"}</p>
              <p className="text-2xl font-bold">{format(scheduleDate, "EEE, MMM d")}</p>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(scheduleDate, "h:mm a")}</span>
                {!past && (
                  <span className="text-accent font-medium bg-accent/10 px-2 py-0.5 rounded-full text-xs">
                    in {formatDistanceToNow(scheduleDate)}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setEditing(true)}>
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">No date set yet</p>
              <p className="text-sm text-muted-foreground">Lock in when the crew meets</p>
            </div>
            <Button size="sm" className="bg-accent text-accent-foreground" onClick={() => setEditing(true)}>
              Set Date
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Contributions section ─────────────────────────────────────────────────────
function ContributionsSection() {
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();
  const { data: contributions, isLoading } = useListContributions();
  const upsert = useUpsertMyContribution();
  const [amountInput, setAmountInput] = useState("");
  const [editing, setEditing] = useState(false);

  const myContribution = contributions?.find(c =>
    c.userName === (currentUser?.fullName || currentUser?.firstName)
  );
  const total = contributions?.reduce((s, c) => s + c.amount, 0) || 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(amountInput);
    if (isNaN(amount) || amount < 0) { toast.error("Enter a valid amount"); return; }
    upsert.mutate({ data: { amount } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListContributionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast.success("Contribution updated!");
        setEditing(false);
        setAmountInput("");
      },
      onError: () => toast.error("Failed to update"),
    });
  };

  if (isLoading) return <Skeleton className="h-32 rounded-xl" />;

  return (
    <div className="space-y-3">
      {/* Total + my contribution input */}
      <Card className="bg-card/90 border-secondary/40 shadow-[4px_4px_0_hsl(var(--secondary))] rounded-lg">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Budget Pool</p>
              <p className="text-3xl font-black text-foreground">৳ {total}</p>
            </div>
            {!editing ? (
              <Button size="sm" variant="outline" className="border-secondary/40 text-secondary"
                onClick={() => { setAmountInput(myContribution?.amount?.toString() || ""); setEditing(true); }}>
                {myContribution ? "Update Mine" : "+ Add Mine"}
              </Button>
            ) : (
              <form onSubmit={handleSave} className="flex gap-2 items-center">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                  <Input type="number" placeholder="0" value={amountInput} onChange={e => setAmountInput(e.target.value)}
                    className="pl-6 w-24 h-9 bg-background border-border text-sm"
                    autoFocus />
                </div>
                <Button type="button" variant="ghost" size="sm" className="px-2" onClick={() => setEditing(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={upsert.isPending} className="bg-secondary text-secondary-foreground h-9 px-3">
                  {upsert.isPending ? "…" : "Save"}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Member list */}
      {contributions && contributions.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {contributions.map(c => (
            <div key={c.id} className="flex items-center gap-2 bg-card/80 border border-card-border rounded-lg px-3 py-2">
              <Avatar className="w-7 h-7 border border-border">
                <AvatarImage src={c.userAvatarUrl || undefined} />
                <AvatarFallback className="text-[10px] bg-secondary/20 text-secondary">{c.userName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate leading-none mb-0.5">{c.userName}</p>
                <p className="text-[10px] text-muted-foreground font-mono">৳ {c.amount}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-28 md:pb-10">
      {/* Header */}
      <div className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-primary mb-2">Kamla-mode control room</p>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">KOI</h1>
        <p className="text-muted-foreground mt-2">Everything the crew needs, without a 79-message meeting.</p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

        {/* Unified Hangout Planning Control Center */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vote section (takes 2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <SectionHeader icon={MapPin} title="Gonotontro - Where to next?" color="text-primary" />
            <VoteSection />
          </div>

          {/* Schedule & Budget (stacked on 1/3 width on desktop) */}
          <div className="space-y-6">
            <div className="space-y-4">
              <SectionHeader icon={Calendar} title="Schedule" color="text-accent" />
              <ScheduleSection />
            </div>

            <div className="space-y-4">
              <SectionHeader icon={Wallet} title="Budget Pool" color="text-secondary" />
              <ContributionsSection />
            </div>
          </div>
        </motion.div>

        {/* ── Bottom row: chat + loans ── */}
        <motion.section variants={item} className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
          {/* Recent chat */}
          <Card className="bg-card/90 backdrop-blur-xl border-card-border shadow-[4px_4px_0_hsl(var(--accent))] rounded-lg flex flex-col min-h-[200px]">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" /> Tong Feed
              </CardTitle>
              <Link href="/chat">
                <span className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer">
                  Open <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </CardHeader>
            <CardContent className="flex-1 p-4 pt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-10 rounded-xl" />)}
                </div>
              ) : summary?.recentMessages?.length ? (
                <div className="space-y-3">
                  {summary.recentMessages.slice(0, 3).map(msg => (
                    <div key={msg.id} className="flex gap-3">
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarImage src={msg.userAvatarUrl || undefined} />
                        <AvatarFallback className="text-[9px] bg-primary/20 text-primary">{msg.userName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-semibold text-foreground/80 truncate pr-2">{msg.userName} </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                        </div>
                        {msg.messageText && <p className="text-sm leading-snug text-foreground/90 mt-0.5 truncate">{msg.messageText}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">The airwaves are silent.</p>
              )}
            </CardContent>
          </Card>

          {/* Active loans */}
          <Card className="bg-card/90 backdrop-blur-xl border-card-border shadow-[4px_4px_0_hsl(var(--destructive))] rounded-lg flex flex-col min-h-[200px]">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-destructive" /> Receipts
              </CardTitle>
              <Link href="/lending">
                <span className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer">
                  Manage <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex flex-col justify-center flex-1">
              {isLoading ? (
                <Skeleton className="h-16 rounded-xl" />
              ) : (
                <div className="flex items-center gap-4 py-4">
                  <div className="text-4xl font-black text-destructive">{summary?.activeLoans || 0}</div>
                  <p className="text-sm text-muted-foreground">pending {summary?.activeLoans === 1 ? "loan" : "loans"} in the group</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

      </motion.div>
    </div>
  );
}
