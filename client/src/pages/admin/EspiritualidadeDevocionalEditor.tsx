import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload, IMAGE_UPLOAD_CONFIGS } from "@/components/ui/image-upload";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Save, Eye, Star } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { Devotional } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  verse: z.string().min(1, "Versículo é obrigatório"),
  verseReference: z.string().min(1, "Referência é obrigatória"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  contentHtml: z.string().optional(),
  summary: z.string().optional(),
  prayer: z.string().optional(),
  imageUrl: z.string().optional(),
  author: z.string().optional(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function EspiritualidadeDevocionalEditor() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = params.id && params.id !== "novo";
  const devotionalId = isEditing ? parseInt(params.id as string) : null;

  const { data: devotional, isLoading } = useQuery<Devotional>({
    queryKey: ["/api/espiritualidade/devotionals", devotionalId],
    enabled: !!devotionalId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      verse: "",
      verseReference: "",
      content: "",
      contentHtml: "",
      summary: "",
      prayer: "",
      imageUrl: "",
      author: "",
      isPublished: false,
      isFeatured: false,
    },
    values: devotional ? {
      title: devotional.title || "",
      verse: devotional.verse || "",
      verseReference: devotional.verseReference || "",
      content: devotional.content || "",
      contentHtml: devotional.contentHtml || "",
      summary: devotional.summary || "",
      prayer: devotional.prayer || "",
      imageUrl: devotional.imageUrl || "",
      author: devotional.author || "",
      isPublished: devotional.isPublished || false,
      isFeatured: devotional.isFeatured || false,
    } : undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/espiritualidade/devotionals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/espiritualidade/devotionals"] });
      toast({ title: "Devocional criado com sucesso!" });
      setLocation("/admin/espiritualidade/devocionais");
    },
    onError: () => {
      toast({ title: "Erro ao criar devocional", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("PUT", `/api/espiritualidade/devotionals/${devotionalId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/espiritualidade/devotionals"] });
      toast({ title: "Devocional atualizado com sucesso!" });
      setLocation("/admin/espiritualidade/devocionais");
    },
    onError: () => {
      toast({ title: "Erro ao atualizar devocional", variant: "destructive" });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/espiritualidade/devocionais">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {isEditing ? "Editar Devocional" : "Novo Devocional"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Atualize as informações do devocional" : "Crie um novo devocional para a UMP"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Principais</CardTitle>
                  <CardDescription>Título, versículo e conteúdo do devocional</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: A Fé que Move Montanhas" {...field} data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="verse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Versículo</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Digite o texto do versículo" 
                              className="min-h-[80px]"
                              {...field} 
                              data-testid="input-verse" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="verseReference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referência</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: João 3:16" {...field} data-testid="input-reference" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conteúdo</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            content={field.value}
                            onChange={(content, html) => {
                              field.onChange(content);
                              form.setValue("contentHtml", html);
                            }}
                            placeholder="Escreva o conteúdo do devocional..."
                            data-testid="editor-content"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prayer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Oração Final (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Uma oração para encerrar o devocional..." 
                            className="min-h-[80px]"
                            {...field} 
                            data-testid="input-prayer" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publicação</CardTitle>
                  <CardDescription>Controle de visibilidade</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Publicar
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Tornar visível no site
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-published"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Destaque
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Destacar na página inicial
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-featured"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes</CardTitle>
                  <CardDescription>Informações adicionais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Autor</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do autor" {...field} data-testid="input-author" />
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
                        <FormLabel>Imagem de Capa (opcional)</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            aspectRatio={IMAGE_UPLOAD_CONFIGS.devotional.aspectRatio}
                            placeholder={IMAGE_UPLOAD_CONFIGS.devotional.placeholder}
                          />
                        </FormControl>
                        <FormDescription>
                          Imagem em formato 16:9 (landscape) para capa do devocional
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resumo (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Breve resumo do devocional..." 
                            className="min-h-[60px]"
                            {...field} 
                            data-testid="input-summary" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save"
              >
                <Save className="h-4 w-4 mr-2" />
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar Devocional"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
