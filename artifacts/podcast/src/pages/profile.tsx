import { useState, useEffect } from "react";
import { useGetCurrentUser, useUpdateCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Camera, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetCurrentUser();
  const updateUser = useUpdateCurrentUser();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user && !isEditing) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user, isEditing]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser.mutate(
      { data: { name, avatarUrl: avatarUrl || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          toast.success("Profile updated");
          setIsEditing(false);
        },
        onError: () => toast.error("Failed to update profile")
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto w-full pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-primary" />
          Your Identity
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">How the squad sees you.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-card/50 backdrop-blur-xl border-card-border overflow-hidden rounded-3xl">
          <div className="h-32 bg-gradient-to-r from-primary/40 to-accent/40 w-full relative"></div>
          
          <CardContent className="px-6 md:px-10 pb-10 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 mb-8">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-card shadow-xl bg-background">
                  <AvatarImage src={avatarUrl || user?.avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">
                    {name?.[0] || user?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              
              <div className="text-center sm:text-left pb-2 flex-1">
                {!isEditing ? (
                  <>
                    <h2 className="text-3xl font-bold text-foreground">{user?.name}</h2>
                    <p className="text-muted-foreground mt-1">{user?.email}</p>
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Display Name</p>
                    <Input 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="text-xl font-bold h-auto py-2 bg-input border-border"
                    />
                  </div>
                )}
              </div>
              
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl border-border bg-background hover:bg-muted mb-2">
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditing && (
              <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-2 p-5 bg-muted/30 rounded-2xl border border-border/50">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Camera className="w-4 h-4 text-muted-foreground" /> Avatar URL
                  </label>
                  <Input 
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="bg-background border-border rounded-xl h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Paste an image link to update your avatar.</p>
                </div>
                
                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl">Cancel</Button>
                  <Button type="submit" disabled={updateUser.isPending} className="bg-primary text-primary-foreground rounded-xl px-8 shadow-md">
                    {updateUser.isPending ? "Saving..." : <><Check className="w-4 h-4 mr-2" /> Save Changes</>}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}