import { useState } from "react";
import { useListContributions, useUpsertMyContribution, getListContributionsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "@clerk/react";
import { motion } from "framer-motion";

export default function ContributionsPage() {
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();
  const { data: contributions, isLoading } = useListContributions();
  const upsertContribution = useUpsertMyContribution();

  const [amountInput, setAmountInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const myContribution = contributions?.find(c => c.userName === (currentUser?.fullName || currentUser?.firstName));
  const totalAmount = contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(amountInput);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    upsertContribution.mutate(
      { data: { amount } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContributionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast.success("Contribution updated");
          setIsEditing(false);
          setAmountInput("");
        },
        onError: () => {
          toast.error("Failed to update contribution");
        }
      }
    );
  };

  const handleEditClick = () => {
    setAmountInput(myContribution?.amount?.toString() || "");
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-40 rounded-3xl mb-8" />
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Wallet className="w-8 h-8 text-secondary" />
          Budget Pool
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Who's putting in what for the next hangout.</p>
      </div>

      {/* Hero Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <Card className="bg-gradient-to-br from-secondary/20 to-background border-secondary/30 shadow-2xl relative overflow-hidden rounded-3xl">
          <CardContent className="p-8 md:p-12 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-secondary mb-2">Total Budget</p>
            <h2 className="text-6xl md:text-7xl font-black text-foreground mb-6">৳ {totalAmount}</h2>
            
            {!isEditing ? (
              <Button 
                onClick={handleEditClick}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl px-8 h-12 text-base font-medium shadow-lg"
              >
                {myContribution ? "Update My Contribution" : "Add My Contribution"}
              </Button>
            ) : (
              <form onSubmit={handleSave} className="max-w-sm mx-auto flex gap-2 mt-4 bg-background/50 p-2 rounded-2xl border border-border backdrop-blur-sm">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className="pl-8 bg-transparent border-none focus-visible:ring-0 text-lg font-bold h-12"
                    autoFocus
                  />
                </div>
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" disabled={upsertContribution.isPending} className="bg-secondary text-secondary-foreground">
                  Save
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold px-2">The Roster</h3>
        {contributions && contributions.length > 0 ? (
          <div className="grid gap-4">
            {contributions.map((c, i) => (
              <motion.div 
                key={c.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-border bg-card/40 backdrop-blur-sm hover:bg-card/80 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                        <AvatarImage src={c.userAvatarUrl || undefined} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">{c.userName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-lg leading-none mb-1">{c.userName}</p>
                        <p className="text-xs text-muted-foreground">Updated {format(new Date(c.updatedAt), "MMM d")}</p>
                      </div>
                    </div>
                    <div className="text-2xl font-black text-secondary">
                      ৳ {c.amount}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-card/30 rounded-3xl border border-dashed border-border text-muted-foreground">
            No contributions set yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
}