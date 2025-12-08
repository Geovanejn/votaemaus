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
  Loader2,
  Plus,
  Trash2,
  BookOpen,
  Church
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SiteContent } from "@shared/schema";

interface ContentSection {
  page: string;
  section: string;
  title: string;
  content: string;
  imageUrl?: string;
  metadata?: string;
}

interface ValueItem {
  icon: string;
  title: string;
  description: string;
}

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

const iconOptions = [
  { value: "BookOpen", label: "Livro Aberto" },
  { value: "Heart", label: "Coracao" },
  { value: "Church", label: "Igreja" },
  { value: "Target", label: "Alvo" },
];

const sections = [
  { key: "historia", label: "Nossa Historia", icon: History, description: "Texto principal sobre a historia da UMP", type: "text" },
  { key: "missao", label: "Missao", icon: Target, description: "A missao da organizacao", type: "text" },
  { key: "visao", label: "Visao", icon: Eye, description: "A visao da organizacao", type: "text" },
  { key: "valores", label: "Valores", icon: Heart, description: "Os valores que norteiam a UMP", type: "values" },
  { key: "timeline", label: "Linha do Tempo", icon: History, description: "Marcos historicos", type: "timeline" },
  { key: "endereco", label: "Endereco", icon: MapPin, description: "Endereco fisico", type: "text" },
  { key: "horarios", label: "Horarios", icon: Clock, description: "Horarios de cultos e estudos", type: "text" },
  { key: "telefone", label: "Telefone", icon: Phone, description: "Numero de contato", type: "text" },
  { key: "email", label: "E-mail", icon: Mail, description: "E-mail de contato", type: "text" },
];

function ValuesEditor({ 
  values, 
  onChange 
}: { 
  values: ValueItem[]; 
  onChange: (values: ValueItem[]) => void;
}) {
  const addValue = () => {
    onChange([...values, { icon: "Heart", title: "", description: "" }]);
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const updateValue = (index: number, field: keyof ValueItem, value: string) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], [field]: value };
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      {values.map((item, index) => (
        <Card key={index} className="bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">Valor {index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeValue(index)}
                className="text-destructive"
                data-testid={`button-remove-value-${index}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Icone</Label>
                <Select
                  value={item.icon}
                  onValueChange={(value) => updateValue(index, "icon", value)}
                >
                  <SelectTrigger data-testid={`select-icon-${index}`}>
                    <SelectValue placeholder="Selecione um icone" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input
                  value={item.title}
                  onChange={(e) => updateValue(index, "title", e.target.value)}
                  placeholder="Ex: Amor ao proximo"
                  data-testid={`input-value-title-${index}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                value={item.description}
                onChange={(e) => updateValue(index, "description", e.target.value)}
                placeholder="Descreva este valor..."
                rows={2}
                data-testid={`input-value-description-${index}`}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={addValue} className="w-full" data-testid="button-add-value">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Valor
      </Button>
    </div>
  );
}

function TimelineEditor({ 
  items, 
  onChange 
}: { 
  items: TimelineItem[]; 
  onChange: (items: TimelineItem[]) => void;
}) {
  const addItem = () => {
    onChange([...items, { year: "", title: "", description: "" }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TimelineItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={index} className="bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">Marco {index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                className="text-destructive"
                data-testid={`button-remove-timeline-${index}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input
                  value={item.year}
                  onChange={(e) => updateItem(index, "year", e.target.value)}
                  placeholder="Ex: 2024"
                  data-testid={`input-timeline-year-${index}`}
                />
              </div>
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input
                  value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  placeholder="Ex: Fundacao"
                  data-testid={`input-timeline-title-${index}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
                placeholder="Descreva este marco historico..."
                rows={2}
                data-testid={`input-timeline-description-${index}`}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={addItem} className="w-full" data-testid="button-add-timeline">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Marco
      </Button>
    </div>
  );
}

export default function MarketingQuemSomos() {
  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, { title: string; content: string }>>({});
  const [valuesData, setValuesData] = useState<ValueItem[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/site-content/quem-somos"] });
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

  const parseJsonContent = <T,>(content: string | undefined, fallback: T[]): T[] => {
    if (!content) return fallback;
    try {
      return JSON.parse(content);
    } catch {
      return fallback;
    }
  };

  const handleEdit = (section: string, sectionType: string) => {
    const existing = getContentForSection(section);
    
    // Always store the existing title in formData to preserve it on save
    setFormData({
      ...formData,
      [section]: {
        title: existing?.title || "",
        content: existing?.content || "",
      },
    });
    
    if (sectionType === "values") {
      const parsed = parseJsonContent<ValueItem>(existing?.content, []);
      setValuesData(parsed.length > 0 ? parsed : [{ icon: "Heart", title: "", description: "" }]);
    } else if (sectionType === "timeline") {
      const parsed = parseJsonContent<TimelineItem>(existing?.content, []);
      setTimelineData(parsed.length > 0 ? parsed : [{ year: "", title: "", description: "" }]);
    }
    setEditingSection(section);
  };

  const handleSave = (section: string, sectionType: string) => {
    let content = "";
    
    if (sectionType === "values") {
      const validValues = valuesData.filter(v => v.title.trim() !== "");
      content = JSON.stringify(validValues);
    } else if (sectionType === "timeline") {
      const validItems = timelineData.filter(t => t.year.trim() !== "" || t.title.trim() !== "");
      content = JSON.stringify(validItems);
    } else {
      const data = formData[section];
      if (!data) return;
      content = data.content;
    }

    saveMutation.mutate({
      page: "quem-somos",
      section,
      title: formData[section]?.title || "",
      content,
    });
  };

  const handleCancel = () => {
    setEditingSection(null);
    setFormData({});
    setValuesData([]);
    setTimelineData([]);
  };

  const renderPreview = (section: string, sectionType: string) => {
    const content = getContentForSection(section);
    
    if (sectionType === "values") {
      const values = parseJsonContent<ValueItem>(content?.content, []);
      if (values.length === 0) {
        return <p className="text-sm text-muted-foreground italic">Nenhum valor definido</p>;
      }
      return (
        <div className="space-y-2">
          {values.slice(0, 3).map((v, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{v.title}</span>
              {v.description && <span className="text-muted-foreground"> - {v.description.substring(0, 50)}...</span>}
            </div>
          ))}
          {values.length > 3 && <p className="text-xs text-muted-foreground">+{values.length - 3} mais...</p>}
        </div>
      );
    }
    
    if (sectionType === "timeline") {
      const items = parseJsonContent<TimelineItem>(content?.content, []);
      if (items.length === 0) {
        return <p className="text-sm text-muted-foreground italic">Nenhum marco definido</p>;
      }
      return (
        <div className="space-y-2">
          {items.slice(0, 3).map((t, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{t.year}</span>
              {t.title && <span className="text-muted-foreground"> - {t.title}</span>}
            </div>
          ))}
          {items.length > 3 && <p className="text-xs text-muted-foreground">+{items.length - 3} mais...</p>}
        </div>
      );
    }
    
    if (content?.content) {
      return (
        <p className="text-sm whitespace-pre-wrap" data-testid={`text-content-${section}`}>
          {content.content.length > 200 
            ? content.content.substring(0, 200) + "..." 
            : content.content}
        </p>
      );
    }
    
    return <p className="text-sm text-muted-foreground italic">Nenhum conteudo definido</p>;
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
            const isEditing = editingSection === section.key;
            const sectionFormData = formData[section.key];

            return (
              <Card key={section.key} data-testid={`card-section-${section.key}`} className={section.type !== "text" ? "md:col-span-2" : ""}>
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
                      {section.type === "text" && (
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
                              rows={4}
                              data-testid={`input-content-${section.key}`}
                            />
                          </div>
                        </>
                      )}
                      
                      {section.type === "values" && (
                        <ValuesEditor values={valuesData} onChange={setValuesData} />
                      )}
                      
                      {section.type === "timeline" && (
                        <TimelineEditor items={timelineData} onChange={setTimelineData} />
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(section.key, section.type)}
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
                        {renderPreview(section.key, section.type)}
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => handleEdit(section.key, section.type)}
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
    </div>
  );
}
