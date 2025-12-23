import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowLeft, Star, Trash2, ChevronUp, ChevronDown, BookOpen, Calendar, Instagram, Plus, Image } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BannerHighlight {
  id: number;
  contentType: 'devotional' | 'event' | 'instagram';
  contentId: number;
  orderIndex: number;
  content: {
    id: number;
    title?: string;
    caption?: string;
    imageUrl?: string;
    verse?: string;
    description?: string;
    startDate?: string;
  };
}

interface HighlightsResponse {
  highlights: BannerHighlight[];
  count: number;
  maxAllowed: number;
}

interface Devotional {
  id: number;
  title: string;
  verse: string;
  imageUrl?: string;
  isPublished: boolean;
}

interface SiteEvent {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
}

interface InstagramPost {
  id: number;
  caption?: string;
  imageUrl: string;
}

export default function MarketingBannerDestaques() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<HighlightsResponse>({
    queryKey: ["/api/admin/banner-highlights"],
  });

  const { data: devotionals } = useQuery<Devotional[]>({
    queryKey: ["/api/espiritualidade/devotionals"],
  });

  const { data: events } = useQuery<SiteEvent[]>({
    queryKey: ["/api/site/events"],
  });

  const { data: instagramData } = useQuery<{ posts: InstagramPost[] }>({
    queryKey: ["/api/admin/instagram"],
  });

  const addMutation = useMutation({
    mutationFn: async ({ contentType, contentId }: { contentType: string; contentId: number }) => {
      const res = await apiRequest("POST", "/api/admin/banner-highlights", { contentType, contentId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banner-highlights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site/highlights"] });
      setIsAddDialogOpen(false);
      toast({ title: "Destaque adicionado", description: "O item foi adicionado ao banner" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Falha ao adicionar destaque", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/banner-highlights/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banner-highlights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site/highlights"] });
      toast({ title: "Destaque removido", description: "O item foi removido do banner" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao remover destaque", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      await apiRequest("PATCH", "/api/admin/banner-highlights/reorder", { orderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banner-highlights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site/highlights"] });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao reordenar destaques", variant: "destructive" });
    },
  });

  const moveUp = (index: number) => {
    if (!data?.highlights || index === 0) return;
    const newOrder = [...data.highlights];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderMutation.mutate(newOrder.map(h => h.id));
  };

  const moveDown = (index: number) => {
    if (!data?.highlights || index === data.highlights.length - 1) return;
    const newOrder = [...data.highlights];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderMutation.mutate(newOrder.map(h => h.id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'devotional': return BookOpen;
      case 'event': return Calendar;
      case 'instagram': return Instagram;
      default: return Star;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'devotional': return 'Devocional';
      case 'event': return 'Evento';
      case 'instagram': return 'Instagram';
      default: return type;
    }
  };

  const existingIds = data?.highlights?.map(h => `${h.contentType}-${h.contentId}`) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Destaques do Banner</h1>
            <p className="text-muted-foreground">
              Gerencie os itens exibidos no banner da pagina inicial (maximo 10)
            </p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={(data?.count || 0) >= 10} data-testid="button-add-highlight">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Destaque
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Destaque</DialogTitle>
              <DialogDescription>
                Escolha um item para destacar no banner da pagina inicial
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="devotional">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="devotional">Devocionais</TabsTrigger>
                <TabsTrigger value="event">Eventos</TabsTrigger>
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
              </TabsList>
              <TabsContent value="devotional" className="space-y-2 max-h-[400px] overflow-y-auto">
                {devotionals?.filter(d => d.isPublished && !existingIds.includes(`devotional-${d.id}`)).map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 border rounded-md">
                    {d.imageUrl ? (
                      <img src={d.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{d.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{d.verse}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addMutation.mutate({ contentType: 'devotional', contentId: d.id })}
                      disabled={addMutation.isPending}
                      data-testid={`button-add-devotional-${d.id}`}
                    >
                      Adicionar
                    </Button>
                  </div>
                ))}
                {(!devotionals || devotionals.filter(d => d.isPublished && !existingIds.includes(`devotional-${d.id}`)).length === 0) && (
                  <p className="text-center text-muted-foreground py-4">Nenhum devocional disponivel</p>
                )}
              </TabsContent>
              <TabsContent value="event" className="space-y-2 max-h-[400px] overflow-y-auto">
                {events?.filter(e => !existingIds.includes(`event-${e.id}`)).map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-3 border rounded-md">
                    {e.imageUrl ? (
                      <img src={e.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{e.title}</p>
                      <p className="text-sm text-muted-foreground">{new Date(e.startDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addMutation.mutate({ contentType: 'event', contentId: e.id })}
                      disabled={addMutation.isPending}
                      data-testid={`button-add-event-${e.id}`}
                    >
                      Adicionar
                    </Button>
                  </div>
                ))}
                {(!events || events.filter(e => !existingIds.includes(`event-${e.id}`)).length === 0) && (
                  <p className="text-center text-muted-foreground py-4">Nenhum evento disponivel</p>
                )}
              </TabsContent>
              <TabsContent value="instagram" className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                {instagramData?.posts?.filter(p => !existingIds.includes(`instagram-${p.id}`)).map(p => (
                  <div
                    key={p.id}
                    className="relative aspect-square rounded-md overflow-hidden border cursor-pointer group"
                    onClick={() => addMutation.mutate({ contentType: 'instagram', contentId: p.id })}
                    data-testid={`button-add-instagram-${p.id}`}
                  >
                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ))}
                {(!instagramData?.posts || instagramData.posts.filter(p => !existingIds.includes(`instagram-${p.id}`)).length === 0) && (
                  <p className="text-center text-muted-foreground py-4 col-span-3">Nenhum post disponivel</p>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Destaques Atuais ({data?.count || 0}/10)
          </CardTitle>
          <CardDescription>
            Arraste para reordenar ou use os botões de seta. O primeiro item sera exibido primeiro no banner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : data?.highlights && data.highlights.length > 0 ? (
            <div className="space-y-3">
              {data.highlights.map((highlight, index) => {
                const Icon = getIcon(highlight.contentType);
                return (
                  <div
                    key={highlight.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                    data-testid={`highlight-item-${highlight.id}`}
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveUp(index)}
                        disabled={index === 0 || reorderMutation.isPending}
                        className="h-6 w-6"
                        data-testid={`button-move-up-${highlight.id}`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveDown(index)}
                        disabled={index === data.highlights.length - 1 || reorderMutation.isPending}
                        className="h-6 w-6"
                        data-testid={`button-move-down-${highlight.id}`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </div>
                    {highlight.content?.imageUrl ? (
                      <img
                        src={highlight.content.imageUrl}
                        alt=""
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="gap-1">
                          <Icon className="h-3 w-3" />
                          {getTypeLabel(highlight.contentType)}
                        </Badge>
                      </div>
                      <p className="font-medium truncate">
                        {highlight.content?.title || highlight.content?.caption || 'Sem titulo'}
                      </p>
                      {highlight.content?.verse && (
                        <p className="text-sm text-muted-foreground truncate">{highlight.content.verse}</p>
                      )}
                      {highlight.content?.description && (
                        <p className="text-sm text-muted-foreground truncate">{highlight.content.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMutation.mutate(highlight.id)}
                      disabled={removeMutation.isPending}
                      data-testid={`button-remove-${highlight.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum destaque configurado</p>
              <p className="text-sm">Adicione devocionais, eventos ou posts do Instagram para exibir no banner</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
