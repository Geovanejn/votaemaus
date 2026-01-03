import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Pencil,
  Trash2,
  Search,
  Loader2,
  Store,
  ImagePlus,
  Eye,
  EyeOff,
  X,
  Upload,
  FolderPlus,
  Ruler
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

interface ShopCategory {
  id: number;
  name: string;
  isDefault: boolean;
}

interface ShopItemImage {
  id: number;
  itemId: number;
  gender: string;
  imageData: string;
  sortOrder: number;
}

interface ShopItemSize {
  id: number;
  itemId: number;
  gender: string;
  size: string;
  sortOrder: number;
}

interface ShopItemAdmin {
  id: number;
  name: string;
  description: string | null;
  price: number;
  categoryId: number;
  genderType: string;
  hasSize: boolean;
  isAvailable: boolean;
  isPreOrder: boolean;
  isFeatured: boolean;
  featuredOrder: number | null;
  bannerImageData: string | null;
  category?: ShopCategory;
  images?: ShopItemImage[];
  sizes?: ShopItemSize[];
}

const itemFormSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  price: z.number().min(0, "Preço deve ser positivo"),
  categoryId: z.number().min(1, "Selecione uma categoria"),
  genderType: z.string().min(1, "Selecione o tipo"),
  hasSize: z.boolean(),
  isAvailable: z.boolean(),
  isPreOrder: z.boolean(),
  isFeatured: z.boolean(),
  featuredOrder: z.number().optional(),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatCurrencyInput(value: number): string {
  return (value / 100).toFixed(2).replace(".", ",");
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  return Math.round(parseFloat(cleaned || "0") * 100);
}

function getGenderLabel(gender: string): string {
  const labels: Record<string, string> = {
    unissex: "Unissex",
    masculino: "Masculino",
    feminino: "Feminino",
    masculino_feminino: "Masc. e Fem.",
  };
  return labels[gender] || gender;
}

function getGendersForType(genderType: string): string[] {
  if (genderType === "masculino_feminino") return ["masculino", "feminino"];
  return [genderType];
}

export default function LojaAdmin() {
  const { hasMarketingPanel } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItemAdmin | null>(null);
  const [priceDisplay, setPriceDisplay] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [managingItem, setManagingItem] = useState<ShopItemAdmin | null>(null);
  const [manageTab, setManageTab] = useState<"images" | "sizes">("images");
  const [uploadingGender, setUploadingGender] = useState<string>("unissex");
  const [newSizeGender, setNewSizeGender] = useState<string>("unissex");
  const [newSizeName, setNewSizeName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const hasAccess = hasMarketingPanel;

  const { data: items, isLoading } = useQuery<ShopItemAdmin[]>({
    queryKey: ["/api/admin/shop/items"],
    enabled: hasAccess,
  });

  const { data: categories } = useQuery<ShopCategory[]>({
    queryKey: ["/api/admin/shop/categories"],
    enabled: hasAccess,
  });

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: 0,
      genderType: "unissex",
      hasSize: true,
      isAvailable: true,
      isPreOrder: false,
      isFeatured: false,
      featuredOrder: undefined,
    },
  });

  useEffect(() => {
    if (editingItem) {
      form.reset({
        name: editingItem.name,
        description: editingItem.description || "",
        price: editingItem.price,
        categoryId: editingItem.categoryId,
        genderType: editingItem.genderType,
        hasSize: editingItem.hasSize,
        isAvailable: editingItem.isAvailable,
        isPreOrder: editingItem.isPreOrder,
        isFeatured: editingItem.isFeatured,
        featuredOrder: editingItem.featuredOrder ?? undefined,
      });
      setPriceDisplay(formatCurrencyInput(editingItem.price));
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        categoryId: categories?.[0]?.id || 0,
        genderType: "unissex",
        hasSize: true,
        isAvailable: true,
        isPreOrder: false,
        isFeatured: false,
        featuredOrder: undefined,
      });
      setPriceDisplay("");
    }
  }, [editingItem, form, categories]);

  const createMutation = useMutation({
    mutationFn: async (data: ItemFormValues) => {
      return apiRequest("POST", "/api/admin/shop/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/items"] });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "Item criado", description: "O item foi adicionado à loja." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar o item.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ItemFormValues & { id: number }) => {
      return apiRequest("PATCH", `/api/admin/shop/items/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/items"] });
      setEditingItem(null);
      toast({ title: "Item atualizado", description: "As alterações foram salvas." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar o item.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/shop/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/items"] });
      toast({ title: "Item removido", description: "O item foi excluído da loja." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível excluir o item.", variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/admin/shop/categories", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/categories"] });
      setIsCategoryOpen(false);
      setNewCategoryName("");
      toast({ title: "Categoria criada", description: "A nova categoria foi adicionada." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar a categoria.", variant: "destructive" });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ itemId, gender, file }: { itemId: number; gender: string; file: File }) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("gender", gender);
      
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/admin/shop/items/${itemId}/images`, {
        method: "POST",
        body: formData,
        headers,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/items"] });
      toast({ title: "Imagem enviada", description: "A imagem foi adicionada ao item." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível enviar a imagem.", variant: "destructive" });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async ({ itemId, imageId }: { itemId: number; imageId: number }) => {
      return apiRequest("DELETE", `/api/admin/shop/items/${itemId}/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/items"] });
      toast({ title: "Imagem removida", description: "A imagem foi excluída." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível remover a imagem.", variant: "destructive" });
    },
  });

  const uploadBannerMutation = useMutation({
    mutationFn: async ({ itemId, file }: { itemId: number; file: File }) => {
      const formData = new FormData();
      formData.append("bannerImage", file);
      
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/admin/shop/items/${itemId}/banner`, {
        method: "POST",
        body: formData,
        headers,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/items"] });
      toast({ title: "Banner enviado", description: "A imagem de banner foi atualizada." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Nao foi possivel enviar o banner.", variant: "destructive" });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("DELETE", `/api/admin/shop/items/${itemId}/banner`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/items"] });
      toast({ title: "Banner removido", description: "A imagem de banner foi excluida." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Nao foi possivel remover o banner.", variant: "destructive" });
    },
  });

  const addSizeMutation = useMutation({
    mutationFn: async ({ itemId, gender, size }: { itemId: number; gender: string; size: string }) => {
      return apiRequest("POST", `/api/admin/shop/items/${itemId}/sizes`, { gender, size });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/items"] });
      setNewSizeName("");
      toast({ title: "Tamanho adicionado", description: "O tamanho foi adicionado ao item." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível adicionar o tamanho.", variant: "destructive" });
    },
  });

  if (!hasAccess) {
    setLocation("/admin");
    return null;
  }

  const filteredItems = items?.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const onSubmit = (data: ItemFormValues) => {
    const featuredOrder = data.isFeatured ? (data.featuredOrder ?? undefined) : undefined;
    const payload = {
      ...data,
      featuredOrder,
    };
    if (editingItem) {
      updateMutation.mutate({ ...payload, id: editingItem.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && managingItem) {
      uploadImageMutation.mutate({
        itemId: managingItem.id,
        gender: uploadingGender,
        file,
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddSize = () => {
    if (managingItem && newSizeName.trim()) {
      addSizeMutation.mutate({
        itemId: managingItem.id,
        gender: newSizeGender,
        size: newSizeName.trim(),
      });
    }
  };

  const currentItemData = managingItem 
    ? items?.find(i => i.id === managingItem.id) 
    : null;

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/admin">
              <Button 
                variant="ghost" 
                className="mb-4 text-white/80 gap-2"
                data-testid="button-back-admin"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-shop-admin-title">
                    Gestão da Loja
                  </h1>
                  <p className="text-white/80">
                    Marketing - Gerenciar produtos e categorias
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setIsCategoryOpen(true)}
                  className="gap-2 bg-white/10 border-white/30 text-white"
                  data-testid="button-add-category"
                >
                  <FolderPlus className="h-4 w-4" />
                  Nova Categoria
                </Button>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="gap-2"
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4" />
                  Novo Produto
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-items"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Tente outra busca" : "Adicione o primeiro produto da loja"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Produto
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative flex items-center justify-center">
                    {item.images && item.images.length > 0 ? (
                      <img 
                        src={item.images[0].imageData} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-muted-foreground" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {item.isFeatured && (
                        <Badge className="text-xs bg-yellow-400 text-zinc-950 hover:bg-yellow-500">
                          Destaque
                        </Badge>
                      )}
                      {!item.isAvailable && (
                        <Badge variant="destructive" className="text-xs">
                          ESGOTADO
                        </Badge>
                      )}
                      {item.isPreOrder && (
                        <Badge variant="outline" className="text-xs bg-background">
                          Pré-venda
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-medium truncate" data-testid={`text-item-name-${item.id}`}>
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.category?.name} - {getGenderLabel(item.genderType)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-lg" data-testid={`text-item-price-${item.id}`}>
                        {formatCurrency(item.price)}
                      </span>
                      <div className="flex gap-1">
                        {item.images && (
                          <Badge variant="outline" className="text-xs">
                            {item.images.length} img
                          </Badge>
                        )}
                        {item.sizes && item.hasSize && (
                          <Badge variant="outline" className="text-xs">
                            {item.sizes.length} tam
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={() => {
                          setManagingItem(item);
                          setManageTab("images");
                          setUploadingGender(getGendersForType(item.genderType)[0]);
                        }}
                        data-testid={`button-manage-item-${item.id}`}
                      >
                        <ImagePlus className="h-3 w-3" />
                        Gerenciar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingItem(item)}
                        data-testid={`button-edit-item-${item.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Excluir este item?")) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        data-testid={`button-delete-item-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para organizar os produtos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome da categoria</Label>
              <Input
                id="category-name"
                placeholder="Ex: Uniformes"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                data-testid="input-category-name"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCategoryOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createCategoryMutation.mutate(newCategoryName)}
              disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
              data-testid="button-save-category"
            >
              {createCategoryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!managingItem} onOpenChange={(open) => !open && setManagingItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar: {managingItem?.name}</DialogTitle>
            <DialogDescription>
              Adicione imagens e tamanhos ao produto
            </DialogDescription>
          </DialogHeader>

          <Tabs value={manageTab} onValueChange={(v) => setManageTab(v as "images" | "sizes")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="images" className="gap-2">
                <ImagePlus className="h-4 w-4" />
                Imagens
              </TabsTrigger>
              <TabsTrigger value="sizes" className="gap-2" disabled={!managingItem?.hasSize}>
                <Ruler className="h-4 w-4" />
                Tamanhos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="images" className="space-y-6 mt-4">
              {/* Banner Image Section - Available for all items */}
              {managingItem && (
                <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Label className="text-sm font-medium">Imagem do Banner</Label>
                      <p className="text-xs text-muted-foreground">
                        Aparece no carrossel da home. Recomendado: 1200x600px
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && managingItem) {
                            uploadBannerMutation.mutate({ itemId: managingItem.id, file });
                          }
                          if (bannerInputRef.current) {
                            bannerInputRef.current.value = "";
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={uploadBannerMutation.isPending}
                        data-testid="button-upload-banner"
                      >
                        {uploadBannerMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {currentItemData?.bannerImageData ? "Trocar" : "Enviar"}
                      </Button>
                      {currentItemData?.bannerImageData && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteBannerMutation.mutate(managingItem.id)}
                          disabled={deleteBannerMutation.isPending}
                          data-testid="button-delete-banner"
                        >
                          {deleteBannerMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  {currentItemData?.bannerImageData ? (
                    <div className="relative aspect-[2/1] rounded-md overflow-hidden bg-muted">
                      <img
                        src={currentItemData.bannerImageData}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[2/1] rounded-md bg-muted flex items-center justify-center text-muted-foreground text-sm">
                      Nenhum banner definido
                    </div>
                  )}
                </div>
              )}

              {/* Product Images Section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Imagens do Produto</Label>
                <div className="flex items-center gap-2">
                  <Select value={uploadingGender} onValueChange={setUploadingGender}>
                    <SelectTrigger className="w-40" data-testid="select-upload-gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {managingItem && getGendersForType(managingItem.genderType).map((g) => (
                        <SelectItem key={g} value={g}>{getGenderLabel(g)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="outline"
                    className="gap-2 flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadImageMutation.isPending}
                    data-testid="button-upload-image"
                  >
                    {uploadImageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Enviar Imagem
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Maximo 5 imagens por genero. Recomendado: 800x800px
                </p>
              </div>

              <div className="space-y-3">
                {managingItem && getGendersForType(managingItem.genderType).map((gender) => {
                  const genderImages = currentItemData?.images?.filter(img => img.gender === gender) || [];
                  return (
                    <div key={gender} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {getGenderLabel(gender)} ({genderImages.length}/5)
                      </Label>
                      {genderImages.length > 0 ? (
                        <div className="grid grid-cols-5 gap-2">
                          {genderImages.map((img) => (
                            <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden bg-muted">
                              <img 
                                src={img.imageData} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteImageMutation.mutate({ 
                                  itemId: managingItem.id, 
                                  imageId: img.id 
                                })}
                                data-testid={`button-delete-image-${img.id}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground py-2">
                          Nenhuma imagem adicionada
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="sizes" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Select value={newSizeGender} onValueChange={setNewSizeGender}>
                  <SelectTrigger className="w-40" data-testid="select-size-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {managingItem && getGendersForType(managingItem.genderType).map((g) => (
                      <SelectItem key={g} value={g}>{getGenderLabel(g)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Ex: P, M, G, GG"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  className="flex-1"
                  data-testid="input-size-name"
                />
                <Button
                  onClick={handleAddSize}
                  disabled={!newSizeName.trim() || addSizeMutation.isPending}
                  data-testid="button-add-size"
                >
                  {addSizeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                {managingItem && getGendersForType(managingItem.genderType).map((gender) => {
                  const genderSizes = currentItemData?.sizes?.filter(s => s.gender === gender) || [];
                  return (
                    <div key={gender} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {getGenderLabel(gender)}
                      </Label>
                      {genderSizes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {genderSizes.map((size) => (
                            <Badge key={size.id} variant="secondary" className="gap-1">
                              {size.size}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Nenhum tamanho adicionado
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingItem(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingItem(null);
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Atualize as informações do produto" : "Preencha os dados do novo produto"}
            </DialogDescription>
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
                      <Input 
                        placeholder="Nome do produto" 
                        {...field} 
                        data-testid="input-item-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição do produto (máx 500 caracteres)" 
                        {...field} 
                        maxLength={500}
                        data-testid="input-item-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          R$
                        </span>
                        <Input
                          type="text"
                          className="pl-10"
                          placeholder="0,00"
                          value={priceDisplay}
                          onChange={(e) => {
                            setPriceDisplay(e.target.value);
                            field.onChange(parseCurrencyInput(e.target.value));
                          }}
                          data-testid="input-item-price"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(v) => field.onChange(parseInt(v))}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-item-category">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-item-gender">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unissex">Unissex</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="masculino_feminino">Masculino e Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasSize"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <FormLabel>Possui tamanhos</FormLabel>
                        <FormDescription className="text-xs">
                          Habilitar seleção de tamanho
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-has-size"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className={`flex items-center justify-between rounded-md border p-3 ${!field.value ? "border-red-500/50 bg-red-500/10" : ""}`}>
                      <div>
                        <FormLabel className={!field.value ? "text-red-600 dark:text-red-400" : ""}>
                          {!field.value ? "ESGOTADO" : "Disponível na loja"}
                        </FormLabel>
                        <FormDescription className="text-xs">
                          {!field.value ? "Produto indisponível para compra" : "Exibir para compra"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-available"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPreOrder"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <FormLabel>Pré-venda</FormLabel>
                        <FormDescription className="text-xs">
                          Produto ainda não disponível
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-preorder"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3 border-yellow-500/30 bg-yellow-500/5">
                      <div>
                        <FormLabel className="text-yellow-600 dark:text-yellow-400">Destaque no Banner</FormLabel>
                        <FormDescription className="text-xs">
                          Exibir no carousel da loja
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-featured"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("isFeatured") && (
                  <FormField
                    control={form.control}
                    name="featuredOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem no Banner</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? undefined : parseInt(val, 10));
                            }}
                            data-testid="input-featured-order"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Menor numero aparece primeiro
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingItem(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="gap-2"
                  data-testid="button-save-item"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editingItem ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
