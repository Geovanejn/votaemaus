import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ExternalLink } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const logoPath = "/logo.png";

export interface InstagramPostData {
  id: number;
  caption?: string;
  imageUrl: string;
  videoUrl?: string;
  mediaType?: string;
  permalink?: string;
  postedAt?: string;
  likesCount?: number;
  commentsCount?: number;
}

interface InstagramPostModalProps {
  post: InstagramPostData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatRelativeDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InstagramPostModal({
  post,
  open,
  onOpenChange,
}: InstagramPostModalProps) {
  return (
    <Dialog open={open && post !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 max-h-[90vh] overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Post do Instagram</DialogTitle>
        </VisuallyHidden>
        {post && (
          <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
            <div className="md:w-[60%] bg-black flex items-center justify-center flex-shrink-0">
              {post.mediaType === "VIDEO" && post.videoUrl ? (
                <video
                  src={post.videoUrl}
                  poster={post.imageUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-auto max-h-[90vh] object-contain"
                  data-testid="modal-instagram-video"
                />
              ) : (
                <img
                  src={post.imageUrl}
                  alt={post.caption || "Post do Instagram"}
                  className="w-full h-auto max-h-[90vh] object-contain"
                  data-testid="modal-instagram-image"
                />
              )}
            </div>
            
            <div className="md:w-[40%] flex flex-col bg-background min-h-0">
              <div className="flex items-center justify-between gap-3 p-3 border-b flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 ring-2 ring-primary ring-offset-2 ring-offset-background">
                    <AvatarImage src={logoPath} alt="UMP Emaús" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">UE</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm" data-testid="modal-instagram-handle">umpemaus</span>
                    <span className="text-xs text-muted-foreground">Igreja Presbiteriana Emaús</span>
                  </div>
                </div>
                {post.permalink && (
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="ghost" data-testid="button-more-options">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </a>
                )}
              </div>
              
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-3">
                  {post.caption && (
                    <div className="flex gap-3 mb-4">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={logoPath} alt="UMP Emaús" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">UE</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm" data-testid="modal-instagram-caption">
                          <span className="font-semibold mr-1">umpemaus</span>
                          <span className="whitespace-pre-wrap">{post.caption}</span>
                        </p>
                        {post.postedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeDate(post.postedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {(post.commentsCount !== undefined && post.commentsCount > 0) && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm text-muted-foreground mb-3" data-testid="modal-instagram-comments-count">
                        Ver todos os {post.commentsCount.toLocaleString("pt-BR")} comentários no Instagram
                      </p>
                      <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="block">
                        <Button variant="outline" size="sm" className="w-full gap-2" data-testid="button-view-comments">
                          <MessageCircle className="h-4 w-4" />
                          Ver comentários
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="border-t p-3 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button className="hover:opacity-70 transition-opacity" data-testid="button-like">
                      <Heart className="h-6 w-6" />
                    </button>
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                      <button className="hover:opacity-70 transition-opacity" data-testid="button-comment">
                        <MessageCircle className="h-6 w-6" />
                      </button>
                    </a>
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                      <button className="hover:opacity-70 transition-opacity" data-testid="button-share">
                        <Send className="h-6 w-6" />
                      </button>
                    </a>
                  </div>
                  <button className="hover:opacity-70 transition-opacity" data-testid="button-save">
                    <Bookmark className="h-6 w-6" />
                  </button>
                </div>
                
                {(post.likesCount !== undefined && post.likesCount > 0) && (
                  <p className="font-semibold text-sm mb-1" data-testid="modal-instagram-likes">
                    {post.likesCount.toLocaleString("pt-BR")} curtidas
                  </p>
                )}
                
                {post.postedAt && (
                  <p className="text-xs text-muted-foreground uppercase">
                    {formatRelativeDate(post.postedAt)}
                  </p>
                )}
              </div>
              
              {post.permalink && (
                <div className="border-t p-3 flex-shrink-0">
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full gap-2" data-testid="button-view-on-instagram">
                      <ExternalLink className="h-4 w-4" />
                      Ver no Instagram
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
