import { useListNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, getListNotificationsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, BellRing } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      }
    });
  };

  const handleMarkRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    markRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full pb-24 md:pb-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Alerts
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">You have {unreadCount} new notifications.</p>
        </div>
        
        {unreadCount > 0 && (
          <Button variant="outline" className="gap-2 rounded-xl" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
            <Check className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {notifications && notifications.length > 0 ? (
            notifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className={cn(
                  "overflow-hidden transition-colors border",
                  n.read ? "bg-card/40 border-card-border/50 opacity-70" : "bg-card border-primary/30 shadow-md relative"
                )}>
                  {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                  <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    )}>
                      {n.read ? <Bell className="w-5 h-5" /> : <BellRing className="w-5 h-5 animate-pulse" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-base leading-snug", n.read ? "text-foreground/80" : "text-foreground font-medium")}>
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(n.createdAt))} ago
                      </p>
                    </div>

                    {!n.read && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full w-8 h-8"
                        onClick={(e) => handleMarkRead(n.id, e)}
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center p-16 bg-card/20 rounded-3xl border border-dashed border-border text-muted-foreground flex flex-col items-center">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg">You're all caught up!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}