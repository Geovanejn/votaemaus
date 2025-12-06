import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Save, 
  FileText, 
  Target, 
  Eye, 
  Heart,
  MapPin,
  Clock,
  Phone,
  Mail,
  History,
  Loader2 
} from "lucide-react";
import type { SiteContent } from "@shared/schema";

interface ContentSection {
  page: string;
  section: string;
  title: string;
  content: string;
  imageUrl?: string;
  metadata?: string;
}

const sections = [
  { key: "historia", label: "Nossa Historia", icon: History, description: "Texto principal sobre a historia da UMP" },
  { key: "missao", label: "Missao", icon: Target, description: "A missao da organizacao" },
  { key: "visao", label: "Visao", icon: Eye, description: "A visao da organizacao" },
  { key: "valores", label: "Valores", icon: Heart, description: "Os valores que norteiam a UMP (formato JSON)" },
  { key: "timeline", label: "Linha do Tempo", icon: History, description: "Marcos historicos (formato JSON)" },
  { key: "endereco", label: "Endereco", icon: MapPin, description: "Endereco fisico" },
  { key: "horarios", label: "Horarios", icon: Clock, description: "Horarios de cultos e estudos" },
  { key: "telefone", label: "Telefone", icon: Phone, description: "Numero de contato" },
  { key: "email", label: "E-mail", icon: Mail, description: "E-mail de contato" },
];

export default function MarketingQuemSomos() {
  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, { title: string; content: string }>>({});

  const { data: siteContent, isLoading } = useQuery<SiteContent[]>({
    queryKey: ["/api/marketing/site-content"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ContentSection) => {
      const response = await apiRequest("PUT", "/api/marketing/site-content", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/site-content"] });
      toast({
        title: "Salvo!",
        description: "O conteudo foi salvo com sucesso.",
      });
      setEditingSection(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Nao foi possivel salvar o conteudo.",
        variant: "destructive",
      });
    },
  });

  const getContentForSection = (section: string) => {
    const content = siteContent?.find(c => c.page === "quem-somos" && c.section === section);
    return content;
  };

  const handleEdit = (section: string) => {
    const existing = getContentForSection(section);
    setFormData({
      ...formData,
      [section]: {
        title: existing?.title || "",
        content: existing?.content || "",
      },
    });
    setEditingSection(section);
  };

  const handleSave = (section: string) => {
    const data = formData[section];
    if (!data) return;

    saveMutation.mutate({
      page: "quem-somos",
      section,
      title: data.title,
      content: data.content,
    });
  };

  const handleCancel = () => {
    setEditingSection(null);
    setFormData({});
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Editar Quem Somos</h1>
          <p className="text-muted-foreground">
            Edite o conteudo da pagina "Quem Somos" do site
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const content = getContentForSection(section.key);
            const isEditing = editingSection === section.key;
            const sectionFormData = formData[section.key];

            return (
              <Card key={section.key} data-testid={`card-section-${section.key}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {section.label}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`title-${section.key}`}>Titulo (opcional)</Label>
                        <Input
                          id={`title-${section.key}`}
                          value={sectionFormData?.title || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            [section.key]: {
                              ...sectionFormData,
                              title: e.target.value,
                            },
                          })}
                          placeholder="Titulo da secao"
                          data-testid={`input-title-${section.key}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`content-${section.key}`}>Conteudo</Label>
                        <Textarea
                          id={`content-${section.key}`}
                          value={sectionFormData?.content || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            [section.key]: {
                              ...sectionFormData,
                              content: e.target.value,
                            },
                          })}
                          placeholder="Digite o conteudo..."
                          rows={section.key === "valores" || section.key === "timeline" ? 8 : 4}
                          data-testid={`input-content-${section.key}`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(section.key)}
                          disabled={saveMutation.isPending}
                          data-testid={`button-save-${section.key}`}
                        >
                          {saveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Salvar
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancel}
                          data-testid={`button-cancel-${section.key}`}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-muted/50 rounded-md p-3 min-h-[60px]">
                        {content?.content ? (
                          <p className="text-sm whitespace-pre-wrap" data-testid={`text-content-${section.key}`}>
                            {content.content.length > 200 
                              ? content.content.substring(0, 200) + "..." 
                              : content.content}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Nenhum conteudo definido
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => handleEdit(section.key)}
                        data-testid={`button-edit-${section.key}`}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dicas de Formato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            <strong>Valores e Linha do Tempo:</strong> Use formato JSON para dados estruturados. Exemplo para valores:
          </p>
          <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
{`[
  { "icon": "BookOpen", "title": "Palavra de Deus", "description": "..." },
  { "icon": "Heart", "title": "Amor", "description": "..." }
]`}
          </pre>
          <p>
            <strong>Linha do Tempo:</strong> Exemplo:
          </p>
          <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
{`[
  { "year": "1990", "title": "Fundacao", "description": "..." },
  { "year": "2024", "title": "Presente", "description": "..." }
]`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
