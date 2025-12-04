import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { 
  Heart,
  Send,
  CheckCircle,
  Shield,
  Lock,
  Users,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
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

const categories = [
  { value: "saude", label: "Saúde" },
  { value: "familia", label: "Família" },
  { value: "trabalho", label: "Trabalho/Estudos" },
  { value: "financeiro", label: "Financeiro" },
  { value: "espiritual", label: "Vida Espiritual" },
  { value: "relacionamento", label: "Relacionamentos" },
  { value: "outros", label: "Outros" },
];

const prayerFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  category: z.string().min(1, "Selecione uma categoria"),
  request: z.string().min(10, "O pedido deve ter pelo menos 10 caracteres").max(1000, "O pedido deve ter no máximo 1000 caracteres"),
  isAnonymous: z.boolean().default(false),
  isPrivate: z.boolean().default(true),
});

type PrayerFormValues = z.infer<typeof prayerFormSchema>;

export default function OracaoPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<PrayerFormValues>({
    resolver: zodResolver(prayerFormSchema),
    defaultValues: {
      name: "",
      whatsapp: "",
      category: "",
      request: "",
      isAnonymous: false,
      isPrivate: true,
    },
  });

  const isAnonymous = form.watch("isAnonymous");

  const submitMutation = useMutation({
    mutationFn: async (data: PrayerFormValues) => {
      return apiRequest("POST", "/api/site/prayer-requests", {
        name: data.name,
        whatsapp: data.whatsapp,
        category: data.category,
        request: data.request,
        isAnonymous: data.isAnonymous,
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Nao foi possivel enviar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PrayerFormValues) => {
    submitMutation.mutate(data);
  };

  const handleNewRequest = () => {
    form.reset();
    setIsSubmitted(false);
  };

  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
              <Heart className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Pedido de Oração
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Compartilhe suas necessidades. Nossa equipe de espiritualidade 
              estará orando por você.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-4">
                  Pedido Recebido!
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Seu pedido de oração foi enviado com sucesso. Nossa equipe de 
                  espiritualidade já está intercedendo por você.
                </p>
                <blockquote className="border-l-4 border-primary pl-4 py-2 text-left max-w-md mx-auto mb-8 bg-primary/5 rounded-r-lg">
                  <p className="italic text-foreground/90">
                    "Orai uns pelos outros, para serdes curados. A súplica de um justo pode muito na sua atuação."
                  </p>
                  <cite className="text-sm text-muted-foreground mt-1 block">
                    — Tiago 5:16
                  </cite>
                </blockquote>
                <Button onClick={handleNewRequest} data-testid="button-new-prayer">
                  Enviar Novo Pedido
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-8">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="isAnonymous"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0 p-4 rounded-lg bg-muted/50">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-anonymous"
                                />
                              </FormControl>
                              <div className="flex-1">
                                <FormLabel className="text-base cursor-pointer">
                                  Enviar de forma anônima
                                </FormLabel>
                                <FormDescription>
                                  Seu nome não será exibido para a equipe de oração
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {!isAnonymous && (
                          <>
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Seu nome" 
                                      {...field}
                                      data-testid="input-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="whatsapp"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>WhatsApp (opcional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="(11) 99999-9999" 
                                      {...field}
                                      data-testid="input-whatsapp"
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Se desejar receber atualizações sobre as orações
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}

                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-category">
                                    <SelectValue placeholder="Selecione a categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem 
                                      key={category.value} 
                                      value={category.value}
                                    >
                                      {category.label}
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
                          name="request"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Seu Pedido</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Compartilhe seu pedido de oração..."
                                  className="min-h-[150px] resize-none"
                                  {...field}
                                  data-testid="textarea-request"
                                />
                              </FormControl>
                              <FormDescription>
                                {field.value.length}/1000 caracteres
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isPrivate"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0 p-4 rounded-lg bg-muted/50">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-private"
                                />
                              </FormControl>
                              <div className="flex-1">
                                <FormLabel className="text-base cursor-pointer">
                                  Manter privado
                                </FormLabel>
                                <FormDescription>
                                  Apenas a equipe de espiritualidade terá acesso
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full gap-2"
                          disabled={submitMutation.isPending}
                          data-testid="button-submit-prayer"
                        >
                          {submitMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Enviar Pedido
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <div className="mt-8 grid sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Seus dados estão seguros
                    </p>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                    <Lock className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Privacidade garantida
                    </p>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                    <Users className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Equipe dedicada
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
