import { useState } from "react";
import { useListLendingRecords, useCreateLendingRecord, useMarkLoanRepaid, useDeleteLendingRecord, useListUsers, getListLendingRecordsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { HandCoins, Plus, ArrowRight, CheckCircle2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function LendingPage() {
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();
  const { data: records, isLoading } = useListLendingRecords();
  const { data: users } = useListUsers();
  
  const createRecord = useCreateLendingRecord();
  const markRepaid = useMarkLoanRepaid();
  const deleteRecord = useDeleteLendingRecord();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [borrowerId, setBorrowerId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerId || !amount) {
      toast.error("Borrower and amount are required");
      return;
    }

    createRecord.mutate(
      { data: { borrowerId: Number(borrowerId), amount: Number(amount), note: note || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLendingRecordsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast.success("Record added");
          setIsDialogOpen(false);
          setBorrowerId("");
          setAmount("");
          setNote("");
        },
        onError: () => toast.error("Failed to add record")
      }
    );
  };

  const handleRepay = (id: number) => {
    markRepaid.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLendingRecordsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast.success("Marked as repaid!");
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteRecord.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLendingRecordsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast.success("Record deleted");
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const activeRecords = records?.filter(r => r.status === 'active') || [];
  const repaidRecords = records?.filter(r => r.status === 'repaid') || [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-24 md:pb-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <HandCoins className="w-8 h-8 text-destructive" />
            Receipt Court
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Keep the receipts before memory becomes creative accounting.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md h-12 px-6 shadow-[4px_4px_0_hsl(var(--primary))] gap-2 font-black">
              <Plus className="w-5 h-5" /> New Record
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-card-border sm:max-w-[425px] rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Add IOU</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Who owes you?</label>
                <Select value={borrowerId} onValueChange={setBorrowerId}>
                  <SelectTrigger className="bg-input border-border h-12 rounded-md">
                    <SelectValue placeholder="Select a friend" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (৳)</label>
                <Input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="bg-input border-border h-12 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">What for? (Optional)</label>
                <Input 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Late night kacchi"
                  className="bg-input border-border h-12 rounded-md"
                />
              </div>
              <Button type="submit" disabled={createRecord.isPending} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 h-12 rounded-md text-base mt-2 font-black">
                {createRecord.isPending ? "Adding..." : "Save Record"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-12">
        {/* Active IOUs */}
        <section>
          <h2 className="text-xl font-bold mb-4 px-1 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-destructive animate-pulse"></span>
            Active IOUs
          </h2>
          {activeRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {activeRecords.map(record => {
                  const isMyLoan = record.lenderName === (currentUser?.fullName || currentUser?.firstName);
                  const isMyDebt = record.borrowerName === (currentUser?.fullName || currentUser?.firstName);

                  return (
                    <motion.div key={record.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <Card className="bg-card/90 backdrop-blur-xl border-card-border overflow-hidden rounded-lg shadow-[4px_4px_0_hsl(var(--destructive))]">
                        <CardContent className="p-0">
                          <div className="p-5 flex items-center justify-between border-b border-border/50">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border border-border">
                                <AvatarImage src={record.lenderAvatarUrl || undefined} />
                                <AvatarFallback className="bg-primary/20 text-primary">{record.lenderName?.[0]}</AvatarFallback>
                              </Avatar>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <Avatar className="w-10 h-10 border border-border">
                                <AvatarImage src={record.borrowerAvatarUrl || undefined} />
                                <AvatarFallback className="bg-destructive/20 text-destructive">{record.borrowerName?.[0]}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-foreground">৳ {record.amount}</p>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-muted/20 flex flex-col gap-3">
                            <div className="flex justify-between items-start text-sm">
                              <div>
                                <p className="font-medium text-foreground">
                                  <span className={isMyLoan ? "text-primary" : ""}>{record.lenderName}</span>
                                  {" lent to "}
                                  <span className={isMyDebt ? "text-destructive" : ""}>{record.borrowerName}</span>
                                </p>
                                {record.note && <p className="text-muted-foreground italic mt-1">"{record.note}"</p>}
                                <p className="text-xs text-muted-foreground/60 mt-1">{format(new Date(record.createdAt), "MMM d, yyyy")}</p>
                              </div>
                            </div>
                            
                            {isMyLoan && (
                              <div className="flex gap-2 justify-end mt-2">
                                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(record.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button size="sm" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20" onClick={() => handleRepay(record.id)}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Repaid
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center p-10 bg-card/80 rounded-lg border border-dashed border-border text-muted-foreground">
              All debts are settled!
            </div>
          )}
        </section>

        {/* History */}
        {repaidRecords.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 px-1 text-muted-foreground">History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
              {repaidRecords.map(record => (
                <Card key={record.id} className="bg-card/70 border-card-border/50 rounded-lg">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium line-through decoration-muted-foreground/50">{record.lenderName} → {record.borrowerName}</p>
                      <p className="text-xs text-muted-foreground mt-1">Repaid {record.repaidAt ? format(new Date(record.repaidAt), "MMM d") : ""}</p>
                    </div>
                    <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/5">৳ {record.amount}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
