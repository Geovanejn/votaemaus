import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, ArrowRight, X } from "lucide-react";
import type { Form } from "@shared/schema";

const DISMISSED_KEY = "pendingFormsDismissed";

export function PendingFormsPopup() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Record<number, number>>({});

  const { data: pendingForms } = useQuery<Form[]>({
    queryKey: ["/api/forms/pending"],
    enabled: isAuthenticated && !!user?.isMember,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem(DISMISSED_KEY);
    if (stored) {
      try {
        setDismissed(JSON.parse(stored));
      } catch {
        setDismissed({});
      }
    }
  }, []);

  useEffect(() => {
    if (!pendingForms || pendingForms.length === 0) {
      setOpen(false);
      return;
    }

    const now = Date.now();
    const notDismissed = pendingForms.filter(form => {
      const dismissedAt = dismissed[form.id];
      if (!dismissedAt) return true;
      return now - dismissedAt > 1000 * 60 * 30;
    });

    if (notDismissed.length > 0) {
      const timer = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [pendingForms, dismissed]);

  const handleDismiss = () => {
    if (pendingForms) {
      const now = Date.now();
      const newDismissed = { ...dismissed };
      pendingForms.forEach(form => {
        newDismissed[form.id] = now;
      });
      setDismissed(newDismissed);
      sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(newDismissed));
    }
    setOpen(false);
  };

  const handleRespond = (formId: number) => {
    setOpen(false);
    setLocation(`/forms/${formId}`);
  };

  if (!isAuthenticated || !user?.isMember || !pendingForms || pendingForms.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Formularios Pendentes
          </DialogTitle>
          <DialogDescription>
            {pendingForms.length === 1
              ? "Voce tem 1 formulario pendente para responder."
              : `Voce tem ${pendingForms.length} formularios pendentes para responder.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-[300px] overflow-y-auto">
          {pendingForms.map((form) => (
            <Card
              key={form.id}
              className="cursor-pointer hover-elevate"
              onClick={() => handleRespond(form.id)}
              data-testid={`card-pending-form-${form.id}`}
            >
              <CardContent className="py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{form.title}</p>
                  {form.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {form.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full sm:w-auto"
            data-testid="button-dismiss-forms"
          >
            Lembrar depois
          </Button>
          {pendingForms.length === 1 && (
            <Button
              onClick={() => handleRespond(pendingForms[0].id)}
              className="w-full sm:w-auto"
              data-testid="button-respond-now"
            >
              Responder agora
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
