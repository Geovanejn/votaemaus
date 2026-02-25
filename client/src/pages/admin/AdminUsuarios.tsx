import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  UserCheck,
  Globe,
  ArrowLeft,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLocation, Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ImageCropDialog from "@/components/ImageCropDialog";

const SECRETARIA_OPTIONS = [
  { value: "espiritualidade", label: "Espiritualidade" },
  { value: "estatistica", label: "Estatística" },
  { value: "marketing", label: "Marketing" },
  { value: "tesouraria", label: "Tesouraria" },
];

function parseSecretarias(secretaria?: string | null): string[] {
  if (!secretaria || secretaria === "none") return [];
  return secretaria.split(",").filter(Boolean);
}

function joinSecretarias(selected: string[]): string {
  return selected.length > 0 ? selected.join(",") : "";
}

function SecretariaCheckboxes({
  value,
  onChange,
  idPrefix,
}: {
  value: string;
  onChange: (val: string) => void;
  idPrefix: string;
}) {
  const selected = parseSecretarias(value);

  const toggle = (sec: string) => {
    const newSelected = selected.includes(sec)
      ? selected.filter(s => s !== sec)
      : [...selected, sec];
    onChange(joinSecretarias(newSelected));
  };

  return (
    <div className="space-y-2">
      <Label>Secretarias (Opcional)</Label>
      <div className="grid grid-cols-2 gap-2">
        {SECRETARIA_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${idPrefix}-sec-${opt.value}`}
              checked={selected.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
              data-testid={`checkbox-${idPrefix}-secretaria-${opt.value}`}
            />
            <Label htmlFor={`${idPrefix}-sec-${opt.value}`} className="cursor-pointer text-sm">
              {opt.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminUsuarios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [isMembersListOpen, setIsMembersListOpen] = useState(true);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState("");
  const [cropContext, setCropContext] = useState<"add" | "edit">("add");
  const [expandedGoogleUser, setExpandedGoogleUser] = useState<number | null>(null);
  const [googleUserEdits, setGoogleUserEdits] = useState<Record<number, {
    isMember: boolean;
    activeMember: boolean;
    isTreasurer: boolean;
    secretaria: string;
  }>>({});
  const [newMember, setNewMember] = useState({
    fullName: "",
    email: "",
    photoUrl: "",
    birthdate: "",
    activeMember: false,
    isTreasurer: false,
    secretaria: "" as string,
  });
  const [editingMember, setEditingMember] = useState<{
    id: number;
    fullName: string;
    email: string;
    photoUrl?: string;
    birthdate?: string;
    activeMember?: boolean;
    isTreasurer?: boolean;
    secretaria?: string;
  } | null>(null);

  const { data: members = [] } = useQuery<Array<{ id: number; fullName: string; email: string; isAdmin: boolean; photoUrl?: string; birthdate?: string; activeMember?: boolean; secretaria?: string; isTreasurer?: boolean }>>({
    queryKey: ["/api/members"],
    staleTime: 30000,
  });

  const { data: googleUsers = [], isLoading: loadingGoogleUsers } = useQuery<Array<{ id: number; fullName: string; email: string; photoUrl?: string; createdAt?: string; isMember?: boolean; activeMember?: boolean; isTreasurer?: boolean; secretaria?: string }>>({
    queryKey: ["/api/admin/google-users"],
    staleTime: 30000,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (member: { fullName: string; email: string; photoUrl?: string; birthdate?: string; activeMember: boolean; isTreasurer?: boolean; secretaria?: string }) => {
      return await apiRequest("POST", "/api/admin/members", member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Membro cadastrado!",
        description: "O membro foi cadastrado com sucesso",
      });
      setIsAddMemberOpen(false);
      setNewMember({ fullName: "", email: "", photoUrl: "", birthdate: "", activeMember: false, isTreasurer: false, secretaria: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar membro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return await apiRequest("DELETE", `/api/admin/members/${memberId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/google-users"] });
      toast({
        title: "Usuário removido!",
        description: "O usuário foi removido com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<{ fullName: string; email: string; photoUrl?: string; birthdate?: string; activeMember?: boolean; isTreasurer?: boolean; secretaria?: string; isMember?: boolean }> }) => {
      return await apiRequest("PATCH", `/api/admin/members/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/google-users"] });
      toast({
        title: "Dados atualizados!",
        description: "Os dados foram atualizados com sucesso",
      });
      setIsEditMemberOpen(false);
      setEditingMember(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX_SIZE = 1200;
      let width = img.width;
      let height = img.height;

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImageToCrop(resizedDataUrl);
        setCropContext("add");
        setIsCropDialogOpen(true);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({
        title: "Erro ao carregar imagem",
        description: "Não foi possível processar a imagem",
        variant: "destructive",
      });
    };

    img.src = objectUrl;
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX_SIZE = 1200;
      let width = img.width;
      let height = img.height;

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImageToCrop(resizedDataUrl);
        setCropContext("edit");
        setIsCropDialogOpen(true);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({
        title: "Erro ao carregar imagem",
        description: "Não foi possível processar a imagem",
        variant: "destructive",
      });
    };

    img.src = objectUrl;
  };

  const handleCropComplete = (croppedImage: string) => {
    if (cropContext === "add") {
      setNewMember({ ...newMember, photoUrl: croppedImage });
    } else if (cropContext === "edit" && editingMember) {
      setEditingMember({ ...editingMember, photoUrl: croppedImage });
    }
  };

  const handleAddMember = () => {
    if (!newMember.fullName || !newMember.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    addMemberMutation.mutate({
      fullName: newMember.fullName,
      email: newMember.email,
      photoUrl: newMember.photoUrl || undefined,
      birthdate: newMember.birthdate || undefined,
      activeMember: newMember.activeMember,
      isTreasurer: newMember.isTreasurer,
      secretaria: newMember.secretaria || undefined,
    });
  };

  const handleDeleteMember = (memberId: number) => {
    if (confirm("Tem certeza que deseja remover este membro?")) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const handleDeleteGoogleUser = (userId: number) => {
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      deleteMemberMutation.mutate(userId);
    }
  };

  const handleEditMember = (member: { id: number; fullName: string; email: string; photoUrl?: string; birthdate?: string; activeMember?: boolean; isTreasurer?: boolean; secretaria?: string }) => {
    setEditingMember(member);
    setIsEditMemberOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingMember) return;

    if (!editingMember.fullName || !editingMember.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e email são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    updateMemberMutation.mutate({
      id: editingMember.id,
      data: {
        fullName: editingMember.fullName,
        email: editingMember.email,
        photoUrl: editingMember.photoUrl || undefined,
        birthdate: editingMember.birthdate || undefined,
        activeMember: editingMember.activeMember,
        isTreasurer: editingMember.isTreasurer,
        secretaria: editingMember.secretaria || undefined,
      },
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getGoogleUserEdits = (gUser: { id: number; isMember?: boolean; activeMember?: boolean; isTreasurer?: boolean; secretaria?: string }) => {
    return googleUserEdits[gUser.id] ?? {
      isMember: gUser.isMember ?? false,
      activeMember: gUser.activeMember ?? false,
      isTreasurer: gUser.isTreasurer ?? false,
      secretaria: gUser.secretaria ?? "",
    };
  };

  const updateGoogleUserField = (userId: number, field: string, value: any) => {
    const gUser = googleUsers.find(u => u.id === userId);
    if (!gUser) return;
    const current = getGoogleUserEdits(gUser);
    const updated = { ...current, [field]: value };
    setGoogleUserEdits(prev => ({ ...prev, [userId]: updated }));
  };

  const handleToggleGoogleMember = (gUser: { id: number; isMember?: boolean; activeMember?: boolean; isTreasurer?: boolean; secretaria?: string }) => {
    const current = getGoogleUserEdits(gUser);
    const newIsMember = !current.isMember;

    if (newIsMember) {
      setExpandedGoogleUser(gUser.id);
      updateGoogleUserField(gUser.id, "isMember", true);
    } else {
      updateMemberMutation.mutate({
        id: gUser.id,
        data: {
          isMember: false,
          activeMember: false,
          isTreasurer: false,
          secretaria: "",
        },
      });
      setExpandedGoogleUser(null);
      setGoogleUserEdits(prev => {
        const copy = { ...prev };
        delete copy[gUser.id];
        return copy;
      });
    }
  };

  const handleSaveGoogleUserMember = (userId: number) => {
    const edits = googleUserEdits[userId];
    if (!edits) return;

    updateMemberMutation.mutate({
      id: userId,
      data: {
        isMember: edits.isMember,
        activeMember: edits.activeMember,
        isTreasurer: edits.isTreasurer,
        secretaria: edits.secretaria || "",
      },
    });
    setExpandedGoogleUser(null);
  };

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="h-2 bg-primary w-full" />

      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="outline" size="icon" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-usuarios-title">
              Gestão de Usuários
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie membros e visualize usuários cadastrados
            </p>
          </div>
        </div>

        <Tabs defaultValue="membros" className="w-full">
          <TabsList className="grid w-full grid-cols-2" data-testid="tabs-usuarios">
            <TabsTrigger value="membros" data-testid="tab-membros">
              <UserCheck className="w-4 h-4 mr-2" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="google" data-testid="tab-google-users">
              <Globe className="w-4 h-4 mr-2" />
              Usuários Google
            </TabsTrigger>
          </TabsList>

          <TabsContent value="membros" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={() => setIsAddMemberOpen(true)}
                  data-testid="button-add-member"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Cadastrar Membro
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl" data-testid="text-members-count">Membros Cadastrados</CardTitle>
                  <CardDescription>
                    {members.length} membros registrados no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {members.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum membro cadastrado ainda</p>
                      <p className="text-sm mt-1">Cadastre membros para o sistema</p>
                    </div>
                  ) : (
                    <Collapsible open={isMembersListOpen} onOpenChange={setIsMembersListOpen}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between mb-3"
                          data-testid="button-toggle-members-list"
                        >
                          <span>Ver Lista de Membros</span>
                          {isMembersListOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="block sm:hidden space-y-3">
                          {members.map((member) => (
                            <div
                              key={member.id}
                              className="p-4 border border-border rounded-lg"
                              data-testid={`row-member-${member.id}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate" data-testid={`text-member-name-${member.id}`}>
                                    {member.fullName}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate mt-1">
                                    {member.email}
                                  </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditMember(member)}
                                    data-testid={`button-edit-member-${member.id}`}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteMember(member.id)}
                                    data-testid={`button-delete-member-${member.id}`}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="hidden sm:block overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border bg-muted/50">
                                <th className="text-left px-6 py-3 font-semibold text-sm">Nome</th>
                                <th className="text-left px-6 py-3 font-semibold text-sm">Email</th>
                                <th className="text-right px-6 py-3 font-semibold text-sm">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {members.map((member) => (
                                <tr
                                  key={member.id}
                                  className="border-b border-border hover:bg-muted/30 transition-colors"
                                  data-testid={`row-member-${member.id}`}
                                >
                                  <td className="px-6 py-4" data-testid={`text-member-name-${member.id}`}>{member.fullName}</td>
                                  <td className="px-6 py-4 text-muted-foreground">{member.email}</td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditMember(member)}
                                        data-testid={`button-edit-member-${member.id}`}
                                      >
                                        Editar
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteMember(member.id)}
                                        data-testid={`button-delete-member-${member.id}`}
                                      >
                                        Remover
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="google" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl" data-testid="text-google-users-title">Usuários Google</CardTitle>
                <CardDescription>
                  {googleUsers.length} usuários cadastrados via Google
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingGoogleUsers ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Carregando...</p>
                  </div>
                ) : googleUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum usuário Google cadastrado ainda</p>
                    <p className="text-sm mt-1">Usuários que fizerem login com Google aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {googleUsers.map((gUser) => {
                      const edits = getGoogleUserEdits(gUser);
                      const isExpanded = expandedGoogleUser === gUser.id;
                      return (
                        <div
                          key={gUser.id}
                          className="border border-border rounded-lg overflow-hidden"
                          data-testid={`row-google-user-${gUser.id}`}
                        >
                          <div className="flex items-center gap-4 p-4">
                            <Avatar className="h-10 w-10">
                              {gUser.photoUrl ? (
                                <AvatarImage src={gUser.photoUrl} alt={gUser.fullName} />
                              ) : null}
                              <AvatarFallback>{getInitials(gUser.fullName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate" data-testid={`text-google-user-name-${gUser.id}`}>
                                {gUser.fullName}
                              </p>
                              <p className="text-sm text-muted-foreground truncate" data-testid={`text-google-user-email-${gUser.id}`}>
                                {gUser.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`google-member-${gUser.id}`}
                                  checked={edits.isMember}
                                  onCheckedChange={() => handleToggleGoogleMember(gUser)}
                                  data-testid={`checkbox-google-member-${gUser.id}`}
                                />
                                <Label htmlFor={`google-member-${gUser.id}`} className="cursor-pointer text-sm">
                                  Membro
                                </Label>
                              </div>
                              {gUser.createdAt && (
                                <p className="text-xs text-muted-foreground hidden sm:block" data-testid={`text-google-user-date-${gUser.id}`}>
                                  {new Date(gUser.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteGoogleUser(gUser.id)}
                                data-testid={`button-delete-google-user-${gUser.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {isExpanded && edits.isMember && (
                            <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/20 space-y-3">
                              <p className="text-sm font-medium text-muted-foreground">Configurações de Membro</p>

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`google-active-${gUser.id}`}
                                  checked={edits.activeMember}
                                  onCheckedChange={(checked) =>
                                    updateGoogleUserField(gUser.id, "activeMember", checked === true)
                                  }
                                  data-testid={`checkbox-google-active-${gUser.id}`}
                                />
                                <Label htmlFor={`google-active-${gUser.id}`} className="cursor-pointer text-sm">
                                  Sócio Ativo
                                </Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`google-treasurer-${gUser.id}`}
                                  checked={edits.isTreasurer}
                                  onCheckedChange={(checked) =>
                                    updateGoogleUserField(gUser.id, "isTreasurer", checked === true)
                                  }
                                  data-testid={`checkbox-google-treasurer-${gUser.id}`}
                                />
                                <Label htmlFor={`google-treasurer-${gUser.id}`} className="cursor-pointer text-sm">
                                  Tesoureiro
                                </Label>
                              </div>

                              <SecretariaCheckboxes
                                value={edits.secretaria}
                                onChange={(val) => updateGoogleUserField(gUser.id, "secretaria", val)}
                                idPrefix={`google-${gUser.id}`}
                              />

                              <Button
                                size="sm"
                                onClick={() => handleSaveGoogleUserMember(gUser.id)}
                                disabled={updateMemberMutation.isPending}
                                data-testid={`button-save-google-member-${gUser.id}`}
                              >
                                {updateMemberMutation.isPending ? "Salvando..." : "Salvar como Membro"}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Membro</DialogTitle>
            <DialogDescription>
              Adicione um novo membro ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Nome Completo</Label>
              <Input
                id="member-name"
                placeholder="Nome completo do membro"
                value={newMember.fullName}
                onChange={(e) =>
                  setNewMember({ ...newMember, fullName: e.target.value })
                }
                data-testid="input-member-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="email@exemplo.com"
                value={newMember.email}
                onChange={(e) =>
                  setNewMember({ ...newMember, email: e.target.value })
                }
                data-testid="input-member-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-birthdate">Data de Nascimento (Opcional)</Label>
              <Input
                id="member-birthdate"
                type="date"
                value={newMember.birthdate}
                onChange={(e) =>
                  setNewMember({ ...newMember, birthdate: e.target.value })
                }
                data-testid="input-member-birthdate"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="member-active"
                checked={newMember.activeMember}
                onCheckedChange={(checked) =>
                  setNewMember({ ...newMember, activeMember: checked === true })
                }
                data-testid="checkbox-member-active"
              />
              <Label htmlFor="member-active" className="cursor-pointer">
                Sócio Ativo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="member-treasurer"
                checked={newMember.isTreasurer}
                onCheckedChange={(checked) =>
                  setNewMember({ ...newMember, isTreasurer: checked === true })
                }
                data-testid="checkbox-member-treasurer"
              />
              <Label htmlFor="member-treasurer" className="cursor-pointer">
                Tesoureiro
              </Label>
            </div>

            <SecretariaCheckboxes
              value={newMember.secretaria}
              onChange={(val) => setNewMember({ ...newMember, secretaria: val })}
              idPrefix="add-member"
            />

            <div className="space-y-2">
              <Label htmlFor="member-photo">Foto do Membro (Opcional)</Label>
              <Input
                id="member-photo"
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp"
                onChange={handlePhotoUpload}
                data-testid="input-member-photo"
              />
              {newMember.photoUrl && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={newMember.photoUrl}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-full border-2 border-primary"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleAddMember}
              className="w-full"
              disabled={addMemberMutation.isPending}
              data-testid="button-submit-member"
            >
              {addMemberMutation.isPending ? "Cadastrando..." : "Cadastrar Membro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditMemberOpen} onOpenChange={(open) => {
        setIsEditMemberOpen(open);
        if (!open) setEditingMember(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Dados do Membro</DialogTitle>
            <DialogDescription>
              Atualize as informações do membro cadastrado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-member-name">Nome Completo</Label>
              <Input
                id="edit-member-name"
                placeholder="Nome completo do membro"
                value={editingMember?.fullName || ""}
                onChange={(e) =>
                  setEditingMember(editingMember ? { ...editingMember, fullName: e.target.value } : null)
                }
                data-testid="input-edit-member-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-member-email">Email</Label>
              <Input
                id="edit-member-email"
                type="email"
                placeholder="email@exemplo.com"
                value={editingMember?.email || ""}
                onChange={(e) =>
                  setEditingMember(editingMember ? { ...editingMember, email: e.target.value } : null)
                }
                data-testid="input-edit-member-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-member-birthdate">Data de Nascimento (Opcional)</Label>
              <Input
                id="edit-member-birthdate"
                type="date"
                value={editingMember?.birthdate || ""}
                onChange={(e) =>
                  setEditingMember(editingMember ? { ...editingMember, birthdate: e.target.value } : null)
                }
                data-testid="input-edit-member-birthdate"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-member-active"
                checked={editingMember?.activeMember ?? true}
                onCheckedChange={(checked) =>
                  setEditingMember(editingMember ? { ...editingMember, activeMember: checked === true } : null)
                }
                data-testid="checkbox-edit-member-active"
              />
              <Label htmlFor="edit-member-active" className="cursor-pointer">
                Sócio Ativo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-member-treasurer"
                checked={editingMember?.isTreasurer ?? false}
                onCheckedChange={(checked) =>
                  setEditingMember(editingMember ? { ...editingMember, isTreasurer: checked === true } : null)
                }
                data-testid="checkbox-edit-member-treasurer"
              />
              <Label htmlFor="edit-member-treasurer" className="cursor-pointer">
                Tesoureiro
              </Label>
            </div>

            <SecretariaCheckboxes
              value={editingMember?.secretaria || ""}
              onChange={(val) =>
                setEditingMember(editingMember ? { ...editingMember, secretaria: val } : null)
              }
              idPrefix="edit-member"
            />

            <div className="space-y-2">
              <Label htmlFor="edit-member-photo">Foto do Membro (Opcional)</Label>
              <Input
                id="edit-member-photo"
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp"
                onChange={handleEditPhotoUpload}
                data-testid="input-edit-member-photo"
              />
              {editingMember?.photoUrl && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={editingMember.photoUrl}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-full border-2 border-primary"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditMemberOpen(false);
                  setEditingMember(null);
                }}
                className="flex-1"
                data-testid="button-cancel-edit"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="flex-1"
                disabled={updateMemberMutation.isPending}
                data-testid="button-save-edit"
              >
                {updateMemberMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImageCropDialog
        open={isCropDialogOpen}
        onOpenChange={setIsCropDialogOpen}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
