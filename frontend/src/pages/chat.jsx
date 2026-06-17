import { useState, useEffect, useRef } from "react";
import { useListMessages, useSendMessage, useAddReaction, getListMessagesQueryKey } from "@/lib/api.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { format, isToday, isYesterday } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Image as ImageIcon, SmilePlus, Loader2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx";
import { cn } from "@/lib/utils.js";
import { useUser } from "@/lib/auth.jsx";

const EMOJIS = ["❤️", "😂", "👍", "🔥", "😮", "😢"];

export default function ChatPage() {
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const scrollRef = useRef(null);

  const { data: messages, isLoading } = useListMessages();
  const sendMessage = useSendMessage();
  const addReaction = useAddReaction();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
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

  const handleReaction = (messageId, emoji) => {
    addReaction.mutate(
      { id: messageId, data: { emoji } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
        }
      }
    );
  };

  const formatMessageDate = (dateStr) => {
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

  const displayMessages = messages ? [...messages].reverse() : [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen max-w-4xl mx-auto w-full relative">
      <div className="flex-none p-4 md:p-6 border-b border-border bg-background/90 backdrop-blur-sm z-10">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-accent mb-1">Townhall, but useful</p>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          Tong Feed
        </h1>
        <p className="text-sm text-muted-foreground">Posts, images, reactions, and the receipts of decisions.</p>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth"
      >
        {displayMessages.map((msg) => {
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
                  "px-4 py-2.5 rounded-lg shadow-sm relative group",
                  isMyMessage 
                    ? "bg-primary text-primary-foreground rounded-br-sm shadow-[3px_3px_0_hsl(var(--accent))]" 
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
                          className="text-xs bg-background/50 hover:bg-background border border-border/50 text-foreground px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 shadow-sm backdrop-blur-sm"
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
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md bg-background border border-border shadow-sm text-muted-foreground hover:text-foreground">
                          <SmilePlus className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-auto p-2 flex gap-1 bg-card/90 backdrop-blur-lg border-card-border">
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-md transition-colors text-lg font-emoji"
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
              className="bg-card border-card-border rounded-md"
            />
            <Button variant="ghost" size="icon" onClick={() => setShowImageInput(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="shrink-0 h-12 w-12 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => setShowImageInput(!showImageInput)}
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Input 
            placeholder="Drop a message..." 
            value={text}
            onChange={e => setText(e.target.value)}
            className="h-12 rounded-md bg-card border-card-border px-6 text-[15px] shadow-sm focus-visible:ring-primary/50"
            autoFocus
          />
          <Button 
            type="submit" 
            disabled={(!text.trim() && !imageUrl.trim()) || sendMessage.isPending}
            className="shrink-0 h-12 w-12 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-[3px_3px_0_hsl(var(--accent))]"
          >
            {sendMessage.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
