import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, ExternalLink, Calendar } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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

function formatPostDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
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
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Post do Instagram</DialogTitle>
        </VisuallyHidden>
        {post && (
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-black flex items-center justify-center">
              {post.mediaType === "VIDEO" && post.videoUrl ? (
                <video
                  src={post.videoUrl}
                  poster={post.imageUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-auto max-h-[60vh] object-contain"
                  data-testid="modal-instagram-video"
                />
              ) : (
                <img
                  src={post.imageUrl}
                  alt={post.caption || "Post do Instagram"}
                  className="w-full h-auto max-h-[60vh] object-contain"
                  data-testid="modal-instagram-image"
                />
              )}
            </div>
            <div className="md:w-1/2 p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold" data-testid="modal-instagram-handle">@umpemaus</p>
                  {post.postedAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatPostDate(post.postedAt)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                {(post.likesCount !== undefined && post.likesCount > 0) && (
                  <div className="flex items-center gap-1.5 text-muted-foreground" data-testid="modal-instagram-likes">
                    <Heart className="h-5 w-5 text-red-500" fill="currentColor" />
                    <span className="font-medium">{post.likesCount.toLocaleString("pt-BR")}</span>
                  </div>
                )}
                {(post.commentsCount !== undefined && post.commentsCount > 0) && (
                  <div className="flex items-center gap-1.5 text-muted-foreground" data-testid="modal-instagram-comments">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium">{post.commentsCount.toLocaleString("pt-BR")}</span>
                  </div>
                )}
              </div>

              {post.caption && (
                <div className="flex-1 overflow-y-auto mb-4">
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap" data-testid="modal-instagram-caption">
                    {post.caption}
                  </p>
                </div>
              )}

              {post.permalink && (
                <div className="mt-auto pt-4 border-t">
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full gap-2" data-testid="button-view-on-instagram">
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
