import { useState, useEffect } from "react";
import { useGetSchedule, useUpdateSchedule, getGetScheduleQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Edit3 } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const { data: schedule, isLoading } = useGetSchedule();
  const updateSchedule = useUpdateSchedule();

  const [isEditing, setIsEditing] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    if (schedule && !isEditing) {
      setDateStr(schedule.date);
      setTimeStr(schedule.time);
    }
  }, [schedule, isEditing]);

  const handleSave = () => {
    if (!dateStr || !timeStr) {
      toast.error("Both date and time are required");
      return;
    }

    updateSchedule.mutate(
      { data: { date: dateStr, time: timeStr } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetScheduleQueryKey() });
          toast.success("Schedule updated!");
          setIsEditing(false);
        },
        onError: () => {
          toast.error("Failed to update schedule");
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  const scheduleDate = schedule?.date && schedule?.time 
    ? new Date(`${schedule.date}T${schedule.time}`) 
    : null;
    
  const isPastEvent = scheduleDate ? isPast(scheduleDate) : false;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto w-full pb-24 md:pb-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Calendar className="w-8 h-8 text-accent" />
            Schedule Board
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Lock in the time before democracy expires.</p>
        </div>
        {!isEditing && (
          <Button variant="outline" className="gap-2" onClick={() => setIsEditing(true)}>
            <Edit3 className="w-4 h-4" /> Edit
          </Button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-card/90 backdrop-blur-xl border-card-border shadow-[6px_6px_0_hsl(var(--accent))] rounded-lg relative overflow-hidden">
          <CardContent className="p-6 md:p-10 relative z-10">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Date</label>
                    <Input 
                      type="date" 
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="bg-background border-border h-12 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Time</label>
                    <Input 
                      type="time" 
                      value={timeStr}
                      onChange={(e) => setTimeStr(e.target.value)}
                      className="bg-background border-border h-12 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button 
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={handleSave}
                    disabled={updateSchedule.isPending}
                  >
                    {updateSchedule.isPending ? "Saving..." : "Save Schedule"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-8 py-8">
                {scheduleDate ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-accent font-semibold tracking-wider uppercase text-sm">
                        {isPastEvent ? "Last Hangout" : "Next Hangout"}
                      </p>
                      <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
                        {format(scheduleDate, "EEEE")}
                      </h2>
                      <p className="text-2xl text-muted-foreground font-medium">
                        {format(scheduleDate, "MMMM do, yyyy")}
                      </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 pt-8 border-t border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground font-medium">Time</p>
                          <p className="text-xl font-bold text-foreground">{format(scheduleDate, "h:mm a")}</p>
                        </div>
                      </div>
                      
                      {!isPastEvent && (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-muted-foreground font-medium">Countdown</p>
                            <p className="text-xl font-bold text-primary">{formatDistanceToNow(scheduleDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {schedule?.updatedByName && (
                      <p className="text-xs text-muted-foreground/60 pt-8">
                        Last updated by {schedule.updatedByName} on {format(new Date(schedule.updatedAt), "MMM d")}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="py-12">
                    <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">No Hangout Scheduled</h2>
                    <p className="text-muted-foreground mb-6">Coordinate with the group and set a time.</p>
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setIsEditing(true)}>
                      Set Date & Time
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
