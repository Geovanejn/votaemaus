import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Vote, 
  Heart, 
  Megaphone, 
  GraduationCap, 
  ArrowRight, 
  LogOut,
  Settings,
  Wallet,
  ShoppingBag,
  Store,
  Home
} from "lucide-react";

const StaggerContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const StaggerItem = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
  >
    {children}
  </motion.div>
);

const adminPanels = [
  // === ELECTIONS GROUP (Green) ===
  {
    id: "emaus-vota",
    title: "Eleicoes",
    subtitle: "Sistema de Votacao",
    description: "Participe das eleicoes e acompanhe os resultados em tempo real.",
    icon: Vote,
    color: "from-green-500 to-emerald-600",
    buttonColor: "bg-green-600 hover:bg-green-700",
    href: "/vote",
    features: [
      "Votar em eleicoes ativas",
      "Ver resultados",
      "Acompanhar votacoes",
    ],
    forMember: true,
  },
  {
    id: "emaus-vota-admin",
    title: "Painel de Eleicoes",
    subtitle: "Gerenciamento de Votacoes",
    description: "Gerencie eleicoes, candidatos, membros e acompanhe votacoes em tempo real.",
    icon: Vote,
    color: "from-green-500 to-emerald-600",
    buttonColor: "bg-green-600 hover:bg-green-700",
    href: "/admin/emaus-vota",
    features: [
      "Criar e gerenciar eleicoes",
      "Cadastrar membros e candidatos",
      "Controlar lista de presenca",
    ],
    forAdmin: true,
  },
  // === DEOGLORY GROUP (Blue) ===
  {
    id: "deoglory-study",
    title: "DeoGlory",
    subtitle: "Plataforma de Estudos",
    description: "Estude a Biblia de forma gamificada, ganhe conquistas e suba no ranking.",
    icon: GraduationCap,
    color: "from-blue-500 to-indigo-600",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    href: "/study",
    features: [
      "Estudos biblicos interativos",
      "Conquistas e recompensas",
      "Ranking entre membros",
    ],
    forMember: true,
  },
  {
    id: "deoglory-admin",
    title: "DeoGlory Admin",
    subtitle: "Gerenciamento de Estudos",
    description: "Gerencie temporadas, licoes e conteudo do sistema de estudos gamificado.",
    icon: GraduationCap,
    color: "from-blue-500 to-indigo-600",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    href: "/admin/study",
    features: [
      "Criar temporadas e licoes",
      "Gerenciar conquistas",
      "Acompanhar progresso",
    ],
    forAdmin: true,
  },
  // === SHOP GROUP (Purple) ===
  {
    id: "loja",
    title: "Loja UMP",
    subtitle: "Produtos e Acessorios",
    description: "Adquira camisetas, kits, livros e outros produtos da UMP Emaus.",
    icon: ShoppingBag,
    color: "from-purple-500 to-violet-600",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    href: "/loja",
    features: [
      "Catalogo de produtos",
      "Pagamento via PIX",
      "Acompanhe seus pedidos",
    ],
    forMember: true,
    isShop: true,
  },
  {
    id: "loja-admin",
    title: "Gestao da Loja",
    subtitle: "Administracao de Produtos",
    description: "Gerencie produtos, categorias e pedidos da loja virtual da UMP.",
    icon: Store,
    color: "from-purple-500 to-violet-600",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    href: "/admin/loja",
    features: [
      "Cadastrar e editar produtos",
      "Gerenciar categorias",
      "Acompanhar pedidos",
    ],
    forMarketing: true,
  },
  // === TREASURY GROUP (Amber/Orange) ===
  {
    id: "meu-financeiro",
    title: "Meu Financeiro",
    subtitle: "Status Financeiro",
    description: "Consulte suas taxas, pagamentos e acompanhe sua situacao financeira com a UMP.",
    icon: Wallet,
    color: "from-amber-500 to-orange-600",
    buttonColor: "bg-amber-600 hover:bg-amber-700",
    href: "/financeiro",
    features: [
      "Ver taxas Percapta e UMP",
      "Acompanhar pagamentos",
      "Pagar via PIX",
    ],
    forMember: true,
  },
  {
    id: "tesouraria",
    title: "Tesouraria",
    subtitle: "Gestao Financeira",
    description: "Gerencie pagamentos, taxas, emprestimos e acompanhe as financas da UMP.",
    icon: Wallet,
    color: "from-amber-500 to-orange-600",
    buttonColor: "bg-amber-600 hover:bg-amber-700",
    href: "/admin/tesouraria",
    features: [
      "Controle de entradas e saidas",
      "Gerenciar taxas e emprestimos",
      "Loja virtual e relatorios",
    ],
    forTreasurer: true,
  },
  // === MARKETING & SPIRITUALITY GROUP (Cyan/Purple) ===
  {
    id: "marketing",
    title: "Painel Marketing",
    subtitle: "Eventos e Comunicacao",
    description: "Gerencie eventos, diretoria e a comunicacao visual da UMP.",
    icon: Megaphone,
    color: "from-cyan-500 to-cyan-600",
    buttonColor: "bg-cyan-600 hover:bg-cyan-700",
    href: "/admin/marketing",
    features: [
      "Criar e gerenciar eventos",
      "Editar membros da diretoria",
      "Gerenciar pagina Quem Somos",
    ],
    forSecretaria: "marketing",
  },
  {
    id: "espiritualidade",
    title: "Painel Espiritualidade",
    subtitle: "Gerenciamento Devocional",
    description: "Gerencie devocionais, pedidos de oracao e conteudo espiritual da UMP.",
    icon: Heart,
    color: "from-rose-500 to-pink-600",
    buttonColor: "bg-rose-600 hover:bg-rose-700",
    href: "/admin/espiritualidade",
    features: [
      "Criar e editar devocionais",
      "Moderar pedidos de oracao",
      "Gerenciar comentarios",
    ],
    forSecretaria: "espiritualidade",
  },
];

export default function AdminDashboard() {
  const { user, logout, isAdmin, hasEspiritualidadePanel, hasMarketingPanel, hasTreasuryPanel } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const filteredPanels = adminPanels.filter((panel) => {
    if (panel.forMember) return true;
    if (panel.forAdmin && isAdmin) return true;
    if (panel.forSecretaria === "espiritualidade" && hasEspiritualidadePanel) return true;
    if (panel.forSecretaria === "marketing" && hasMarketingPanel) return true;
    if (panel.forTreasurer && hasTreasuryPanel) return true;
    if (panel.forMarketing && hasMarketingPanel) return true;
    return false;
  });

  const pageTitle = isAdmin ? "Painel Administrativo" : "Meus Painéis";
  const pageSubtitle = isAdmin ? "Escolha o sistema que deseja gerenciar" : "Acesse suas funcionalidades";

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
              <Settings className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-admin-title">
              {pageTitle}
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {pageSubtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto mb-6">
            <Link href="/">
              <Button variant="outline" className="gap-2" data-testid="button-go-home">
                <Home className="h-4 w-4" />
                Ir para o Site
              </Button>
            </Link>
          </div>
          
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredPanels.map((panel) => (
              <StaggerItem key={panel.id}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Card className={`h-full overflow-hidden ${panel.isShop ? 'ring-2 ring-purple-500/30' : ''}`}>
                    <CardContent className="p-0">
                      <div className={`bg-gradient-to-br ${panel.color} p-6 text-white`}>
                        <div className="flex items-center justify-between mb-4">
                          {panel.isShop ? (
                            <img src="/emaustore-logo.png" alt="Emaustore" className="h-10 w-auto" />
                          ) : (
                            <panel.icon className="h-10 w-10" />
                          )}
                        </div>
                        <h2 className="text-xl font-bold mb-1" data-testid={`panel-title-${panel.id}`}>
                          {panel.title}
                        </h2>
                        <p className="opacity-90 text-sm">
                          {panel.subtitle}
                        </p>
                      </div>
                      
                      <div className="p-5">
                        <p className="text-muted-foreground text-sm mb-4">
                          {panel.description}
                        </p>
                        
                        <ul className="space-y-1.5 mb-5">
                          {panel.features.map((feature, index) => (
                            <li 
                              key={index}
                              className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <Link href={panel.href}>
                          <Button 
                            className={`w-full gap-2 ${panel.buttonColor} text-white`}
                            data-testid={`button-access-${panel.id}`}
                          >
                            Acessar Painel
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
            className="max-w-md mx-auto mt-12 text-center"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Logado como <span className="font-medium text-foreground">{user?.fullName}</span>
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="gap-2"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
