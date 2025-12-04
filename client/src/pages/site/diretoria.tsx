import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Users,
  Phone,
  Crown,
  Loader2
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StaggerContainer, StaggerItem } from "@/components/AnimatedPage";

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
}

const defaultBoardMembers: BoardMember[] = [
  {
    id: 1,
    name: "Joao Pedro Silva",
    position: "Presidente",
    bio: "Membro da UMP ha 5 anos, apaixonado por lideranca e estudos biblicos.",
    termStart: "2024",
    termEnd: "2025",
    orderIndex: 0,
    isCurrent: true,
  },
  {
    id: 2,
    name: "Maria Luisa Santos",
    position: "Vice-Presidente",
    bio: "Comprometida com o crescimento espiritual dos jovens e com a evangelizacao.",
    termStart: "2024",
    termEnd: "2025",
    orderIndex: 1,
    isCurrent: true,
  },
  {
    id: 3,
    name: "Lucas Oliveira",
    position: "1o Secretario",
    bio: "Responsavel pela organizacao e comunicacao interna da UMP.",
    termStart: "2024",
    termEnd: "2025",
    orderIndex: 2,
    isCurrent: true,
  },
  {
    id: 4,
    name: "Juliana Ferreira",
    position: "2o Secretario",
    bio: "Auxilia na secretaria e organizacao de documentos e atas.",
    termStart: "2024",
    termEnd: "2025",
    orderIndex: 3,
    isCurrent: true,
  },
  {
    id: 5,
    name: "Ana Carolina Lima",
    position: "Tesoureiro",
    bio: "Cuida das financas e prestacao de contas da mocidade.",
    termStart: "2024",
    termEnd: "2025",
    orderIndex: 4,
    isCurrent: true,
  },
];

function isFeaturedPosition(position: string): boolean {
  const featured = ["presidente", "vice-presidente", "vice presidente"];
  return featured.includes(position.toLowerCase());
}

export default function DiretoriaPage() {
  const { data: boardMembersData, isLoading, isError } = useQuery<BoardMember[]>({
    queryKey: ['/api/site/board-members'],
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const boardMembers = isError ? defaultBoardMembers : (boardMembersData && boardMembersData.length > 0 ? boardMembersData : defaultBoardMembers);
  const featuredMembers = boardMembers.filter(m => isFeaturedPosition(m.position));
  const otherMembers = boardMembers.filter(m => !isFeaturedPosition(m.position));
  const currentTerm = boardMembers[0]?.termStart && boardMembers[0]?.termEnd 
    ? `${boardMembers[0].termStart}-${boardMembers[0].termEnd}` 
    : "2024-2025";

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-gray-900 text-white py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-transparent" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-amber-500/30 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-amber-500 mb-6 shadow-lg shadow-primary/30">
              <Users className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Diretoria
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Conheca os lideres que servem na UMP Emaus
            </p>
            <p className="text-sm text-primary mt-2">
              Gestao {currentTerm}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
                    Lideranca
                  </h2>
                </div>
                <h3 className="text-2xl font-bold">Presidente e Vice</h3>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                {featuredMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden hover-elevate">
                      <CardContent className="p-0">
                        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-center">
                          <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/50 rounded-full blur-2xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/50 rounded-full blur-2xl" />
                          </div>
                          <Avatar className="w-32 h-32 mx-auto border-4 border-primary/30 shadow-lg relative z-10">
                            <AvatarImage src={member.photoUrl || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white text-3xl">
                              {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="p-6 text-center">
                          <h3 className="text-xl font-bold mb-1" data-testid={`member-name-${member.id}`}>
                            {member.name}
                          </h3>
                          <p className="text-primary font-medium mb-3">
                            {member.position}
                          </p>
                          <p className="text-sm text-muted-foreground mb-4">
                            {member.bio}
                          </p>
                          {member.whatsapp && (
                            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                              <a 
                                href={`https://wa.me/${member.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                                data-testid={`member-whatsapp-${member.id}`}
                              >
                                <Phone className="h-4 w-4" />
                                WhatsApp
                              </a>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h3 className="text-2xl font-bold">Demais Membros da Diretoria</h3>
              </motion.div>

              <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {otherMembers.map((member) => (
                  <StaggerItem key={member.id}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="h-full hover-elevate overflow-hidden">
                        <CardContent className="p-0">
                          <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 p-4">
                            <div className="absolute inset-0 opacity-40">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/50 rounded-full blur-xl" />
                            </div>
                            <div className="flex items-center gap-4 relative z-10">
                              <Avatar className="w-16 h-16 border-2 border-primary/30">
                                <AvatarImage src={member.photoUrl || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white text-lg">
                                  {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-white">
                                <h3 className="font-semibold" data-testid={`member-name-${member.id}`}>
                                  {member.name}
                                </h3>
                                <p className="text-sm text-primary">
                                  {member.position}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-muted-foreground mb-4">
                              {member.bio}
                            </p>
                            {member.whatsapp && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <a 
                                  href={`https://wa.me/${member.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  <Phone className="h-3 w-3" />
                                  WhatsApp
                                </a>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
