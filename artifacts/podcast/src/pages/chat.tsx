import { useState, useEffect, useRef } from "react";
import { useListMessages, useSendMessage, useAddReaction, getListMessagesQueryKey, Message } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Image as ImageIcon, SmilePlus, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/react";

const EMOJIS = ["❤️", "😂", "👍", "🔥", "😮", "😢"];

export default function ChatPage() {
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll every 3 seconds for new messages
  const { data: messages, isLoading } = useListMessages({ query: { refetchInterval: 3000 } });
  const sendMessage = useSendMessage();
  const addReaction = useAddReaction();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imageUrl.trim()) return;

    sendMessage.mutate(
      { data: { messageText: text, imageUrl: imageUrl || null } },
      {
        onSuccess: () => {
          setText("");
          setImageUrl("");
          setShowImageInput(false);
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
        }
      }
    );
  };

  const handleReaction = (messageId: number, emoji: string) => {
    addReaction.mutate(
      { messageId, data: { emoji } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
        }
      }
    );
  };

  const formatMessageDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
    return format(d, "MMM d, h:mm a");
  };

  if (isLoading && !messages) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen p-4 max-w-4xl mx-auto w-full gap-4">
        <Skeleton className="h-12 w-48" />
        <div className="flex-1 rounded-2xl border border-border bg-card p-4 space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className={cn("flex gap-3", i%2===0 ? "flex-row-reverse" : "flex-row")}>
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <Skeleton className="h-16 w-64 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Reverse messages to show oldest at top, newest at bottom, assuming API returns newest first (limit default).
  // Actually, usually chat APIs return newest first. Let's reverse them for display.
  const displayMessages = messages ? [...messages].reverse() : [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen max-w-4xl mx-auto w-full relative">
      <div className="flex-none p-4 md:p-6 border-b border-border bg-background/80 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Group Chat
        </h1>
        <p className="text-sm text-muted-foreground">End-to-end encrypted vibes.</p>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"
      >
        {displayMessages.map((msg: Message) => {
          const isMe = msg.userId.toString() === currentUser?.id || currentUser?.primaryEmailAddress?.emailAddress === msg.userName; // Hacky fallback check for isMe
          // A better check if we have our own user profile ID from db, but we don't have it explicitly without useGetCurrentUser.
          // Let's just guess it from clerk styling or just assume we don't know perfectly, 
          // wait, we can just use `useUser` id vs `msg.userId`... wait `msg.userId` is the DB integer ID, `currentUser.id` is the clerk string ID.
          // Let's use `msg.userName === currentUser.fullName` as a fallback heuristic since this is a private group app.
          const isMyMessage = msg.userName === (currentUser?.fullName || currentUser?.firstName);

          return (
            <div key={msg.id} className={cn("flex gap-3 max-w-[85%]", isMyMessage ? "ml-auto flex-row-reverse" : "")}>
              <Avatar className="w-8 h-8 md:w-10 md:h-10 border border-border shrink-0 mt-auto shadow-sm">
                <AvatarImage src={msg.userAvatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">{msg.userName?.[0] || 'U'}</AvatarFallback>
              </Avatar>

              <div className={cn("flex flex-col gap-1", isMyMessage ? "items-end" : "items-start")}>
                <div className="flex items-baseline gap-2 px-1">
                  <span className="text-xs font-semibold text-foreground/80">{msg.userName}</span>
                  <span className="text-[10px] text-muted-foreground">{formatMessageDate(msg.createdAt)}</span>
                </div>

                <div className={cn(
                  "px-4 py-2.5 rounded-2xl shadow-sm relative group",
                  isMyMessage 
                    ? "bg-primary text-primary-foreground rounded-br-sm" 
                    : "bg-card border border-card-border text-card-foreground rounded-bl-sm"
                )}>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="attachment" className="max-w-full h-auto rounded-lg mb-2 max-h-[300px] object-cover" />
                  )}
                  {msg.messageText && (
                    <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">{msg.messageText}</p>
                  )}

                  {/* Reactions Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={cn("flex flex-wrap gap-1 mt-2 -mb-1", isMyMessage ? "justify-end" : "justify-start")}>
                      {msg.reactions.map(r => (
                        <button 
                          key={r.emoji}
                          onClick={() => handleReaction(msg.id, r.emoji)}
                          className="text-xs bg-background/50 hover:bg-background border border-border/50 text-foreground px-1.5 py-0.5 rounded-full transition-colors flex items-center gap-1 shadow-sm backdrop-blur-sm"
                        >
                          <span className="font-emoji">{r.emoji}</span>
                          <span className="opacity-70">{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Reaction Button Hover */}
                  <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                    isMyMessage ? "-left-12" : "-right-12"
                  )}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-background border border-border shadow-sm text-muted-foreground hover:text-foreground">
                          <SmilePlus className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-auto p-2 flex gap-1 bg-card/90 backdrop-blur-lg border-card-border">
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors text-lg font-emoji"
                            onClick={() => handleReaction(msg.id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-none p-4 bg-background/80 backdrop-blur-md border-t border-border z-10">
        {showImageInput && (
          <div className="mb-3 flex gap-2">
            <Input 
              placeholder="Paste image URL..." 
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="bg-card border-card-border rounded-xl"
            />
            <Button variant="ghost" size="icon" onClick={() => setShowImageInput(false)}>
              <Loader2 className="w-4 h-4 rotate-45" /> {/* Close icon visual placeholder */}
            </Button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="shrink-0 h-12 w-12 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => setShowImageInput(!showImageInput)}
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Input 
            placeholder="Type a message..." 
            value={text}
            onChange={e => setText(e.target.value)}
            className="h-12 rounded-full bg-card border-card-border px-6 text-[15px] shadow-sm focus-visible:ring-primary/50"
            autoFocus
          />
          <Button 
            type="submit" 
            disabled={(!text.trim() && !imageUrl.trim()) || sendMessage.isPending}
            className="shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            {sendMessage.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}