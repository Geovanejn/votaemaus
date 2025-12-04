import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  User,
  Vote,
  GraduationCap,
  ArrowRight,
  Lock,
  Sparkles
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/AnimatedPage";

const systems = [
  {
    id: "emaus-vota",
    title: "Emaús Vota",
    subtitle: "Sistema de Eleições",
    description: "Participe das eleições da UMP Emaús de forma segura e transparente. Vote nos candidatos, acompanhe resultados em tempo real.",
    icon: Vote,
    color: "from-green-500 to-emerald-600",
    buttonColor: "bg-green-600 hover:bg-green-700",
    href: "/vote",
    features: [
      "Votação segura e anônima",
      "Resultados em tempo real",
      "Verificação por código único",
      "Histórico de eleições",
    ],
  },
  {
    id: "deoglory",
    title: "DeoGlory",
    subtitle: "Sistema de Estudos Bíblicos Gamificados",
    description: "Aprenda a Palavra de Deus de forma divertida! Complete lições, ganhe XP, desbloqueie conquistas e suba no ranking.",
    icon: GraduationCap,
    color: "from-blue-500 to-indigo-600",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    href: "/study",
    features: [
      "Lições interativas",
      "Sistema de XP e níveis",
      "Conquistas desbloqueáveis",
      "Ranking entre membros",
    ],
  },
];

export default function MembroPage() {
  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
              <User className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Área do Membro
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Escolha o sistema que deseja acessar
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {systems.map((system) => (
              <StaggerItem key={system.id}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Card className="h-full overflow-hidden">
                    <CardContent className="p-0">
                      <div className={`bg-gradient-to-br ${system.color} p-8 text-white`}>
                        <div className="flex items-center justify-between mb-4">
                          <system.icon className="h-12 w-12" />
                          <Sparkles className="h-6 w-6 opacity-50" />
                        </div>
                        <h2 className="text-2xl font-bold mb-1" data-testid={`system-title-${system.id}`}>
                          {system.title}
                        </h2>
                        <p className="opacity-90 text-sm">
                          {system.subtitle}
                        </p>
                      </div>
                      
                      <div className="p-6">
                        <p className="text-muted-foreground mb-6">
                          {system.description}
                        </p>
                        
                        <ul className="space-y-2 mb-6">
                          {system.features.map((feature, index) => (
                            <li 
                              key={index}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <Link href={system.href}>
                          <Button 
                            className={`w-full gap-2 ${system.buttonColor} text-white`}
                            data-testid={`button-access-${system.id}`}
                          >
                            Acessar Sistema
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mt-12"
          >
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Acesso Restrito</h3>
                    <p className="text-sm text-muted-foreground">
                      Os sistemas acima são exclusivos para membros da UMP Emaús. 
                      Você precisará fazer login com suas credenciais para acessar 
                      as funcionalidades completas.
                    </p>
                    <Link href="/" className="inline-block mt-4">
                      <Button variant="outline" size="sm" data-testid="button-login">
                        Fazer Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </SiteLayout>
  );
}
