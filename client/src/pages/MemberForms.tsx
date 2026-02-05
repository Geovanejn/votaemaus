import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle, ArrowRight, Clock } from "lucide-react";

interface FormWithStatus {
  id: number;
  title: string;
  description: string | null;
  status: string;
  publishedAt: string | null;
  hasResponded: boolean;
}

export default function MemberForms() {
  const [, setLocation] = useLocation();

  const { data: forms, isLoading } = useQuery<FormWithStatus[]>({
    queryKey: ["/api/forms/available"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingForms = forms?.filter((f) => !f.hasResponded) || [];
  const completedForms = forms?.filter((f) => f.hasResponded) || [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Formularios
        </h1>
        <p className="text-muted-foreground mt-1">
          Responda os formularios disponibilizados pela secretaria de estatistica.
        </p>
      </div>

      {pendingForms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Pendentes ({pendingForms.length})
          </h2>
          <div className="space-y-3">
            {pendingForms.map((form) => (
              <Card
                key={form.id}
                className="cursor-pointer hover-elevate border-orange-200 dark:border-orange-900"
                onClick={() => setLocation(`/forms/${form.id}`)}
                data-testid={`card-form-pending-${form.id}`}
              >
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{form.title}</p>
                      <Badge variant="outline" className="text-orange-600 border-orange-300 flex-shrink-0">
                        Pendente
                      </Badge>
                    </div>
                    {form.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {form.description}
                      </p>
                    )}
                  </div>
                  <Button size="sm" data-testid={`button-respond-${form.id}`}>
                    Responder
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completedForms.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Respondidos ({completedForms.length})
          </h2>
          <div className="space-y-3">
            {completedForms.map((form) => (
              <Card
                key={form.id}
                className="opacity-70"
                data-testid={`card-form-completed-${form.id}`}
              >
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{form.title}</p>
                      <Badge variant="secondary" className="text-green-600 flex-shrink-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Respondido
                      </Badge>
                    </div>
                    {form.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {form.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!forms || forms.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum formulario disponivel no momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
