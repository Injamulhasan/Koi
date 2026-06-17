import { useState, useMemo } from "react";
import { useListLocations, useListVotes, useCastVote, getListVotesQueryKey, getGetMyVoteQueryKey, useGetMyVote, getGetDashboardSummaryQueryKey, getListLocationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Trophy, CheckCircle2, UserCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function VotePage() {
  const queryClient = useQueryClient();
  const { data: locations, isLoading: loadingLocs } = useListLocations();
  const { data: votes, isLoading: loadingVotes } = useListVotes();
  const { data: myVote } = useGetMyVote();
  const castVote = useCastVote();

  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  const handleVote = (locationId: number) => {
    castVote.mutate(
      { data: { locationId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVotesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMyVoteQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
          toast.success("Vote cast successfully!");
          setSelectedLocation(null);
        },
        onError: () => {
          toast.error("Failed to cast vote");
        }
      }
    );
  };

  const votesByLocation = useMemo(() => {
    if (!votes) return {};
    return votes.reduce((acc, vote) => {
      if (!acc[vote.locationId]) acc[vote.locationId] = [];
      acc[vote.locationId].push(vote);
      return acc;
    }, {} as Record<number, typeof votes>);
  }, [votes]);

  const maxVotes = locations?.length ? Math.max(...locations.map(l => l.voteCount)) : 0;
  const leadingLocations = locations?.filter(l => l.voteCount === maxVotes && maxVotes > 0) || [];

  if (loadingLocs || loadingVotes) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <MapPin className="w-8 h-8 text-primary" />
          Location Vote
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Where to next? Cast your vote.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AnimatePresence>
          {locations?.map((loc) => {
            const locVotes = votesByLocation[loc.id] || [];
            const isMyVote = myVote?.locationId === loc.id;
            const isLeading = leadingLocations.some(l => l.id === loc.id);
            const isSelected = selectedLocation === loc.id;

            return (
              <motion.div
                key={loc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className={cn(
                    "overflow-hidden transition-all duration-300 relative group cursor-pointer",
                    isMyVote ? "border-primary shadow-lg shadow-primary/20 bg-primary/5" : "border-card-border bg-card shadow-sm hover:border-primary/30",
                    isSelected && !isMyVote && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  onClick={() => !isMyVote && setSelectedLocation(loc.id)}
                >
                  {isLeading && (
                    <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 shadow-sm">
                      <Trophy className="w-3 h-3" /> LEADER
                    </div>
                  )}
                  
                  {isMyVote && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                  )}

                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className={cn("text-xl font-bold", isMyVote ? "text-primary" : "text-foreground")}>
                          {loc.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                          <span className="font-mono font-medium">{loc.voteCount}</span>
                          <span>votes</span>
                        </div>
                      </div>
                      
                      {isMyVote ? (
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground/30 group-hover:border-primary/50 group-hover:text-primary/50 transition-colors">
                          <MapPin className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 min-h-[40px]">
                      <div className="flex -space-x-2 overflow-hidden">
                        {locVotes.map((v) => (
                          <Avatar key={v.id} className="w-8 h-8 border-2 border-background shadow-sm hover:z-10 transition-transform hover:scale-110" title={v.userName}>
                            <AvatarImage src={v.userAvatarUrl || undefined} />
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{v.userName?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      
                      {isSelected && !isMyVote && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-2"
                        >
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90 shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(loc.id);
                            }}
                            disabled={castVote.isPending}
                          >
                            {castVote.isPending ? "Voting..." : "Cast Vote"}
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}