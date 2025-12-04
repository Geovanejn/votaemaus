import { motion } from "framer-motion";
import { 
  Users,
  Mail,
  Phone,
  Crown
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StaggerContainer, StaggerItem } from "@/components/AnimatedPage";

const boardMembers = [
  {
    id: 1,
    name: "João Pedro Silva",
    role: "Presidente",
    bio: "Membro da UMP há 5 anos, apaixonado por liderança e estudos bíblicos.",
    email: "presidente@umpemaus.org.br",
    phone: "(11) 99999-0001",
    image: null,
    featured: true,
  },
  {
    id: 2,
    name: "Maria Luísa Santos",
    role: "Vice-Presidente",
    bio: "Comprometida com o crescimento espiritual dos jovens e com a evangelização.",
    email: "vice@umpemaus.org.br",
    phone: "(11) 99999-0002",
    image: null,
    featured: true,
  },
  {
    id: 3,
    name: "Lucas Oliveira",
    role: "1º Secretário",
    bio: "Responsável pela organização e comunicação interna da UMP.",
    email: "secretaria@umpemaus.org.br",
    phone: "(11) 99999-0003",
    image: null,
    featured: false,
  },
  {
    id: 4,
    name: "Juliana Ferreira",
    role: "2º Secretário",
    bio: "Auxilia na secretaria e organização de documentos e atas.",
    email: "secretaria2@umpemaus.org.br",
    phone: "(11) 99999-0004",
    image: null,
    featured: false,
  },
  {
    id: 5,
    name: "Ana Carolina Lima",
    role: "Tesoureiro",
    bio: "Cuida das finanças e prestação de contas da mocidade.",
    email: "tesouraria@umpemaus.org.br",
    phone: "(11) 99999-0005",
    image: null,
    featured: false,
  },
];

const featuredMembers = boardMembers.filter(m => m.featured);
const otherMembers = boardMembers.filter(m => !m.featured);

export default function DiretoriaPage() {
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
              Conheça os líderes que servem na UMP Emaús
            </p>
            <p className="text-sm text-primary mt-2">
              Gestão 2024-2025
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
                Liderança
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
                        <AvatarImage src={member.image || undefined} />
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
                        {member.role}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {member.bio}
                      </p>
                      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <a 
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                          data-testid={`member-email-${member.id}`}
                        >
                          <Mail className="h-4 w-4" />
                          E-mail
                        </a>
                        <a 
                          href={`tel:${member.phone}`}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                          data-testid={`member-phone-${member.id}`}
                        >
                          <Phone className="h-4 w-4" />
                          Telefone
                        </a>
                      </div>
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
                            <AvatarImage src={member.image || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white text-lg">
                              {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-white">
                            <h3 className="font-semibold" data-testid={`member-name-${member.id}`}>
                              {member.name}
                            </h3>
                            <p className="text-sm text-primary">
                              {member.role}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          {member.bio}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <a 
                            href={`mailto:${member.email}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Mail className="h-3 w-3" />
                            E-mail
                          </a>
                          <a 
                            href={`tel:${member.phone}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            Telefone
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </SiteLayout>
  );
}
