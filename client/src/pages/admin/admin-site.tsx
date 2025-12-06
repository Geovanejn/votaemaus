import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Globe, 
  Users, 
  Heart, 
  Image, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BoardMember {
  id: number;
  name: string;
  position: string;
  bio?: string;
  photoUrl?: string;
  instagram?: string;
  whatsapp?: string;
  termStart: string;
  termEnd: string;
  orderIndex: number;
  isCurrent: boolean;
  createdAt: string;
}

interface PrayerRequest {
  id: number;
  name: string;
  whatsapp?: string;
  category: string;
  request: string;
  status: string;
  createdAt: string;
  processedBy?: number;
  processedAt?: string;
}

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  orderIndex: number;
  createdBy: number;
  createdAt: string;
}

const boardMemberSchema = z.object({
  name: z.string().min(2, "Nome e obrigatorio"),
  position: z.string().min(2, "Cargo e obrigatorio"),
  bio: z.string().optional(),
  photoUrl: z.string().url("URL invalida").optional().or(z.literal("")),
  instagram: z.string().optional(),
  whatsapp: z.string().optional(),
  termStart: z.string().min(4, "Ano de inicio e obrigatorio"),
  termEnd: z.string().min(4, "Ano de fim e obrigatorio"),
  orderIndex: z.number().default(0),
  isCurrent: z.boolean().default(true),
});

const bannerSchema = z.object({
  title: z.string().min(2, "Titulo e obrigatorio"),
  imageUrl: z.string().url("URL da imagem e obrigatoria"),
  linkUrl: z.string().url("URL invalida").optional().or(z.literal("")),
  position: z.string().default("home"),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  orderIndex: z.number().default(0),
});

type BoardMemberFormValues = z.infer<typeof boardMemberSchema>;
type BannerFormValues = z.infer<typeof bannerSchema>;

function BoardMembersTab() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: members = [], isLoading } = useQuery<BoardMember[]>({
    queryKey: ['/api/admin/board-members'],
  });

  const form = useForm<BoardMemberFormValues>({
    resolver: zodResolver(boardMemberSchema),
    defaultValues: {
      name: "",
      position: "",
      bio: "",
      photoUrl: "",
      instagram: "",
      whatsapp: "",
      termStart: new Date().getFullYear().toString(),
      termEnd: (new Date().getFullYear() + 1).toString(),
      orderIndex: 0,
      isCurrent: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BoardMemberFormValues) => {
      return apiRequest("POST", "/api/admin/board-members", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/board-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site/board-members'] });
      form.reset();
      setIsDialogOpen(false);
      toast({ title: "Sucesso", description: "Membro adicionado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao adicionar membro", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BoardMemberFormValues> }) => {
      return apiRequest("PATCH", `/api/admin/board-members/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/board-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site/board-members'] });
      setEditingId(null);
      toast({ title: "Sucesso", description: "Membro atualizado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao atualizar membro", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/board-members/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/board-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site/board-members'] });
      toast({ title: "Sucesso", description: "Membro removido com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao remover membro", variant: "destructive" });
    },
  });

  const onSubmit = (data: BoardMemberFormValues) => {
    createMutation.mutate(data);
  };

  const handleEdit = (member: BoardMember) => {
    setEditingId(member.id);
    form.reset({
      name: member.name,
      position: member.position,
      bio: member.bio || "",
      photoUrl: member.photoUrl || "",
      instagram: member.instagram || "",
      whatsapp: member.whatsapp || "",
      termStart: member.termStart,
      termEnd: member.termEnd,
      orderIndex: member.orderIndex,
      isCurrent: member.isCurrent,
    });
  };

  const handleUpdate = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form.getValues() });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Membros da Diretoria</h3>
          <p className="text-sm text-muted-foreground">Gerencie os membros da diretoria da UMP</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-member">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Membro da Diretoria</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} data-testid="input-member-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Presidente, Tesoureiro" {...field} data-testid="input-member-position" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Breve descricao..." {...field} data-testid="input-member-bio" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Foto</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} data-testid="input-member-photo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="termStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano Inicio</FormLabel>
                        <FormControl>
                          <Input placeholder="2024" {...field} data-testid="input-term-start" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="termEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano Fim</FormLabel>
                        <FormControl>
                          <Input placeholder="2025" {...field} data-testid="input-term-end" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="5511999999999" {...field} data-testid="input-member-whatsapp" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isCurrent"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel>Membro Atual</FormLabel>
                        <p className="text-sm text-muted-foreground">Mostrar no site</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-member-current"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createMutation.isPending}
                  data-testid="button-submit-member"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Adicionar
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {members.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum membro cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          members.map((member) => (
            <Card key={member.id} data-testid={`card-member-${member.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.photoUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{member.name}</h4>
                      {!member.isCurrent && (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.position}</p>
                    <p className="text-xs text-muted-foreground">
                      Gestao {member.termStart}-{member.termEnd}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(member)}
                      data-testid={`button-edit-member-${member.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(member.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-member-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function PrayerRequestsTab() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: requests = [], isLoading } = useQuery<PrayerRequest[]>({
    queryKey: ['/api/admin/prayer-requests', statusFilter !== "all" ? statusFilter : undefined],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/admin/prayer-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prayer-requests'] });
      toast({ title: "Sucesso", description: "Status atualizado" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao atualizar status", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      prayed: { variant: "default", label: "Orado" },
      answered: { variant: "outline", label: "Respondido" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      saude: "Saude",
      familia: "Familia",
      trabalho: "Trabalho",
      estudos: "Estudos",
      espiritual: "Vida Espiritual",
      relacionamento: "Relacionamento",
      outros: "Outros",
    };
    return categories[category] || category;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">Pedidos de Oracao</h3>
          <p className="text-sm text-muted-foreground">
            {requests.length} pedido(s) recebido(s)
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-prayer-status-filter">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="prayed">Orados</SelectItem>
            <SelectItem value="answered">Respondidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum pedido de oracao encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} data-testid={`card-prayer-${request.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {getStatusBadge(request.status)}
                      <Badge variant="outline">{getCategoryLabel(request.category)}</Badge>
                    </div>
                    <p className="text-sm mb-2">{request.request}</p>
                    <div className="text-xs text-muted-foreground">
                      <span className="mr-4">De: {request.name}</span>
                      <span>
                        Recebido em: {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: request.id, status: "prayed" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-mark-prayed-${request.id}`}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Orado
                      </Button>
                    )}
                    {request.status === "prayed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: request.id, status: "answered" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-mark-answered-${request.id}`}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Respondido
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BannersTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['/api/admin/banners'],
  });

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      imageUrl: "",
      linkUrl: "",
      position: "home",
      isActive: true,
      orderIndex: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BannerFormValues) => {
      return apiRequest("POST", "/api/admin/banners", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site/banners'] });
      form.reset();
      setIsDialogOpen(false);
      toast({ title: "Sucesso", description: "Banner criado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao criar banner", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/banners/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site/banners'] });
      toast({ title: "Sucesso", description: "Banner atualizado" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao atualizar banner", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/banners/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site/banners'] });
      toast({ title: "Sucesso", description: "Banner removido" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao remover banner", variant: "destructive" });
    },
  });

  const onSubmit = (data: BannerFormValues) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Banners</h3>
          <p className="text-sm text-muted-foreground">Gerencie os banners do site</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-banner">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Banner</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titulo</FormLabel>
                      <FormControl>
                        <Input placeholder="Titulo do banner" {...field} data-testid="input-banner-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} data-testid="input-banner-image" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} data-testid="input-banner-link" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posicao</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-banner-position">
                            <SelectValue placeholder="Selecione a posicao" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="home">Pagina Inicial</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                          <SelectItem value="footer">Rodape</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel>Ativo</FormLabel>
                        <p className="text-sm text-muted-foreground">Mostrar no site</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-banner-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createMutation.isPending}
                  data-testid="button-submit-banner"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Adicionar
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum banner cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <Card key={banner.id} data-testid={`card-banner-${banner.id}`}>
              <CardContent className="p-0">
                <div className="aspect-video relative bg-muted rounded-t-lg overflow-hidden">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/600x300?text=Imagem";
                    }}
                  />
                  {!banner.isActive && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Badge variant="secondary">Inativo</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold mb-2">{banner.title}</h4>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{banner.position}</Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleActiveMutation.mutate({ 
                          id: banner.id, 
                          isActive: !banner.isActive 
                        })}
                        data-testid={`button-toggle-banner-${banner.id}`}
                      >
                        {banner.isActive ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(banner.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-banner-${banner.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSitePage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Site Institucional</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie o conteudo do site institucional da UMP Emaus
        </p>
      </div>

      <Tabs defaultValue="board" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-admin-site">
          <TabsTrigger value="board" data-testid="tab-board">
            <Users className="h-4 w-4 mr-2" />
            Diretoria
          </TabsTrigger>
          <TabsTrigger value="prayers" data-testid="tab-prayers">
            <Heart className="h-4 w-4 mr-2" />
            Oracoes
          </TabsTrigger>
          <TabsTrigger value="banners" data-testid="tab-banners">
            <Image className="h-4 w-4 mr-2" />
            Banners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <BoardMembersTab />
        </TabsContent>

        <TabsContent value="prayers">
          <PrayerRequestsTab />
        </TabsContent>

        <TabsContent value="banners">
          <BannersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
