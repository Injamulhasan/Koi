import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MapPin, Calendar, MessageSquare, Wallet, HandCoins, Bell, ArrowRight, Clock } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "react-day-picker";

export default function DashboardPage() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return <div className="p-6 text-destructive">Failed to load dashboard data.</div>;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const scheduleDate = summary.schedule?.date ? new Date(`${summary.schedule.date}T${summary.schedule.time}`) : null;
  const isSchedulePast = scheduleDate ? isPast(scheduleDate) : false;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">What's happening with the crew.</p>
        </div>
        {summary.unreadNotifications > 0 && (
          <Link href="/notifications">
            <div className="hidden md:flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-medium hover:bg-primary/20 transition-colors cursor-pointer border border-primary/20">
              <Bell className="w-4 h-4" />
              <span>{summary.unreadNotifications} new alerts</span>
            </div>
          </Link>
        )}
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Leading Vote */}
        <motion.div variants={item}>
          <Link href="/vote">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group bg-card/50 backdrop-blur-xl border-card-border/50 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <MapPin className="w-24 h-24 text-primary" />
              </div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <MapPin className="w-5 h-5" />
                  Top Spot
                </CardTitle>
                <CardDescription>Current leader</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1 truncate">{summary.leadingLocation || "No votes yet"}</div>
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <span>{summary.leadingLocationVotes || 0} votes</span>
                  <span className="text-border mx-1">•</span>
                  <span>{summary.totalVotes || 0} total</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Schedule */}
        <motion.div variants={item}>
          <Link href="/schedule">
            <Card className="h-full hover:border-accent/50 transition-colors cursor-pointer group bg-card/50 backdrop-blur-xl border-card-border/50 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calendar className="w-24 h-24 text-accent" />
              </div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="flex items-center gap-2 text-accent">
                  <Calendar className="w-5 h-5" />
                  Next Hangout
                </CardTitle>
                <CardDescription>
                  {scheduleDate ? (isSchedulePast ? "Past event" : "Countdown") : "Not set"}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold mb-1">
                  {scheduleDate ? format(scheduleDate, "MMM d, yyyy") : "TBD"}
                </div>
                {scheduleDate && (
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {format(scheduleDate, "h:mm a")} 
                    {!isSchedulePast && (
                      <span className="text-accent ml-1 bg-accent/10 px-2 py-0.5 rounded-full text-xs">
                        in {formatDistanceToNow(scheduleDate)}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Funds Summary */}
        <motion.div variants={item}>
          <div className="grid grid-rows-2 gap-6 h-full">
            <Link href="/contributions" className="block h-full">
              <Card className="h-full hover:border-secondary/50 transition-colors cursor-pointer bg-card/50 backdrop-blur-xl border-card-border/50 shadow-md flex flex-col justify-center relative overflow-hidden">
                <div className="absolute right-0 -mr-2 opacity-5">
                  <Wallet className="w-20 h-20 text-secondary" />
                </div>
                <CardContent className="p-5 flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                      <Wallet className="w-4 h-4 text-secondary" /> Budget Pool
                    </p>
                    <p className="text-2xl font-bold">৳ {summary.totalContributions || 0}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/lending" className="block h-full">
              <Card className="h-full hover:border-destructive/50 transition-colors cursor-pointer bg-card/50 backdrop-blur-xl border-card-border/50 shadow-md flex flex-col justify-center relative overflow-hidden">
                <div className="absolute right-0 -mr-2 opacity-5">
                  <HandCoins className="w-20 h-20 text-destructive" />
                </div>
                <CardContent className="p-5 flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                      <HandCoins className="w-4 h-4 text-destructive" /> Active Loans
                    </p>
                    <p className="text-2xl font-bold">{summary.activeLoans || 0} pending</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Recent Chat */}
        <motion.div variants={item} className="lg:col-span-3">
          <Card className="bg-card/50 backdrop-blur-xl border-card-border/50 shadow-xl overflow-hidden flex flex-col h-full min-h-[300px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20 border-b border-border">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Recent Chatter
                </CardTitle>
              </div>
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Open Chat <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              {summary.recentMessages && summary.recentMessages.length > 0 ? (
                <div className="p-6 space-y-6">
                  {summary.recentMessages.map((msg, i) => (
                    <div key={msg.id} className="flex gap-4">
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={msg.userAvatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">{msg.userName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-sm">{msg.userName}</span>
                          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                        </div>
                        {msg.messageText && (
                          <p className="text-foreground/90 text-sm leading-relaxed">{msg.messageText}</p>
                        )}
                        {msg.imageUrl && (
                          <div className="mt-2 text-xs text-muted flex items-center gap-1 bg-muted/50 w-fit px-2 py-1 rounded">
                            <span className="text-xl">🖼️</span> Image attached
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Fade out bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/90 to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-10 opacity-60">
                  <MessageSquare className="w-12 h-12 mb-3 stroke-1" />
                  <p>It's quiet. Too quiet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}