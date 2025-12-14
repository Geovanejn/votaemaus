import { Switch, Route, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { VisitorNotificationPrompt } from "@/components/visitor-notification-prompt";

import LoginPage from "@/pages/login";
import VerifyPage from "@/pages/verify";

import SiteHomePage from "@/pages/site/home";
import DevocionaisPage from "@/pages/site/devocionais";
import DevocionalDetailPage from "@/pages/site/devocional-detail";
import AgendaPage from "@/pages/site/agenda";
import QuemSomosPage from "@/pages/site/quem-somos";
import DiretoriaPage from "@/pages/site/diretoria";
import OracaoPage from "@/pages/site/oracao";
import MembroPage from "@/pages/site/membro";
import PoliticaPrivacidadePage from "@/pages/site/politica-privacidade";

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminEmausVota = lazy(() => import("@/pages/admin"));
const AdminSitePage = lazy(() => import("@/pages/admin/admin-site"));
const EspiritualidadeDashboard = lazy(() => import("@/pages/admin/EspiritualidadeDashboard"));
const EspiritualidadeDevocionais = lazy(() => import("@/pages/admin/EspiritualidadeDevocionais"));
const EspiritualidadeDevocionalEditor = lazy(() => import("@/pages/admin/EspiritualidadeDevocionalEditor"));
const EspiritualidadeOracoes = lazy(() => import("@/pages/admin/EspiritualidadeOracoes"));
const EspiritualidadeComentarios = lazy(() => import("@/pages/admin/EspiritualidadeComentarios"));
const MarketingDashboard = lazy(() => import("@/pages/admin/MarketingDashboard"));
const MarketingEventos = lazy(() => import("@/pages/admin/MarketingEventos"));
const MarketingEventoEditor = lazy(() => import("@/pages/admin/MarketingEventoEditor"));
const MarketingDiretoria = lazy(() => import("@/pages/admin/MarketingDiretoria"));
const MarketingDiretoriaEditor = lazy(() => import("@/pages/admin/MarketingDiretoriaEditor"));
const MarketingQuemSomos = lazy(() => import("@/pages/admin/MarketingQuemSomos"));
const VotePage = lazy(() => import("@/pages/vote"));
const ResultsPage = lazy(() => import("@/pages/results"));
const StudyHomePage = lazy(() => import("@/pages/study/index"));
const LessonPage = lazy(() => import("@/pages/study/lesson"));
const VersesPage = lazy(() => import("@/pages/study/verses"));
const ExplorePage = lazy(() => import("@/pages/study/explore"));
const ProfilePage = lazy(() => import("@/pages/study/profile"));
const RankingPage = lazy(() => import("@/pages/study/ranking"));
const MissionsPage = lazy(() => import("@/pages/study/missions"));
const MissionActivityPage = lazy(() => import("@/pages/study/mission-activity"));
const AchievementsPage = lazy(() => import("@/pages/study/achievements"));
const SeasonsPage = lazy(() => import("@/pages/study/seasons"));
const SeasonDetailPage = lazy(() => import("@/pages/study/season-detail"));
const FinalChallengePage = lazy(() => import("@/pages/study/final-challenge"));
const SeasonRankingPage = lazy(() => import("@/pages/study/season-ranking"));
const StudyPreviewPage = lazy(() => import("@/pages/study/preview"));
const StudyAdminPage = lazy(() => import("@/pages/study/admin/index"));
const PracticePage = lazy(() => import("@/pages/study/practice"));
const DeoGloryDashboard = lazy(() => import("@/pages/study/admin/DeoGloryDashboard"));
const DeoGloryLicoes = lazy(() => import("@/pages/study/admin/DeoGloryLicoes"));
const DeoGloryEstudos = lazy(() => import("@/pages/study/admin/DeoGloryEstudos"));

function PageLoader() {
  return (
    <motion.div 
      className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-8 w-8 text-primary" />
      </motion.div>
      <motion.p 
        className="text-muted-foreground text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Carregando...
      </motion.p>
    </motion.div>
  );
}

function Router() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/verificar/:hash" component={VerifyPage} />
            <Route path="/results" component={ResultsPage} />
            <Route path="/study-preview" component={StudyPreviewPage} />
            <Route path="/study-preview/explore" component={ExplorePage} />
            <Route path="/study-preview/ranking" component={RankingPage} />
            <Route path="/study-preview/profile" component={ProfilePage} />
            <Route path="/study-preview/verses" component={VersesPage} />
            <Route path="/study-preview/lesson/:id" component={LessonPage} />
            <Route path="/study-preview/achievements" component={AchievementsPage} />
            {/* Site Institucional - Public Routes */}
            <Route path="/" component={SiteHomePage} />
            <Route path="/devocionais" component={DevocionaisPage} />
            <Route path="/devocionais/:id" component={DevocionalDetailPage} />
            <Route path="/agenda" component={AgendaPage} />
            <Route path="/agenda/:id" component={AgendaPage} />
            <Route path="/quem-somos" component={QuemSomosPage} />
            <Route path="/diretoria" component={DiretoriaPage} />
            <Route path="/oracao" component={OracaoPage} />
            <Route path="/membro" component={MembroPage} />
            <Route path="/politica-privacidade" component={PoliticaPrivacidadePage} />
            <Route path="/login" component={LoginPage} />
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        </Suspense>
        <VisitorNotificationPrompt />
      </>
    );
  }

  if (isAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/verificar/:hash" component={VerifyPage} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/emaus-vota" component={AdminEmausVota} />
          <Route path="/admin/study" component={DeoGloryDashboard} />
          <Route path="/admin/study/licoes" component={DeoGloryLicoes} />
          <Route path="/admin/study/estudos" component={DeoGloryEstudos} />
          <Route path="/admin/study/old" component={StudyAdminPage} />
          <Route path="/admin/site" component={AdminSitePage} />
          <Route path="/admin/espiritualidade" component={EspiritualidadeDashboard} />
          <Route path="/admin/espiritualidade/devocionais" component={EspiritualidadeDevocionais} />
          <Route path="/admin/espiritualidade/devocionais/:id" component={EspiritualidadeDevocionalEditor} />
          <Route path="/admin/espiritualidade/oracoes" component={EspiritualidadeOracoes} />
          <Route path="/admin/espiritualidade/comentarios" component={EspiritualidadeComentarios} />
          <Route path="/admin/marketing" component={MarketingDashboard} />
          <Route path="/admin/marketing/eventos" component={MarketingEventos} />
          <Route path="/admin/marketing/eventos/:id" component={MarketingEventoEditor} />
          <Route path="/admin/marketing/diretoria" component={MarketingDiretoria} />
          <Route path="/admin/marketing/diretoria/:id" component={MarketingDiretoriaEditor} />
          <Route path="/admin/marketing/quem-somos" component={MarketingQuemSomos} />
          <Route path="/vote" component={VotePage} />
          <Route path="/results" component={ResultsPage} />
          <Route path="/study" component={StudyHomePage} />
          <Route path="/study/lesson/:id" component={LessonPage} />
          <Route path="/study/explore" component={ExplorePage} />
          <Route path="/study/verses" component={VersesPage} />
          <Route path="/study/profile" component={ProfilePage} />
          <Route path="/study/ranking" component={RankingPage} />
          <Route path="/study/missions" component={MissionsPage} />
          <Route path="/study/missions/:missionId" component={MissionActivityPage} />
          <Route path="/study/achievements" component={AchievementsPage} />
          <Route path="/study/estudos" component={SeasonsPage} />
          <Route path="/study/season/:id" component={SeasonDetailPage} />
          <Route path="/study/season/:id/challenge" component={FinalChallengePage} />
          <Route path="/study/season/:id/ranking" component={SeasonRankingPage} />
          <Route path="/study/practice/:weekId" component={PracticePage} />
          <Route path="/study/practice" component={PracticePage} />
          {/* Site Institucional - Public Routes */}
          <Route path="/" component={SiteHomePage} />
          <Route path="/devocionais" component={DevocionaisPage} />
          <Route path="/devocionais/:id" component={DevocionalDetailPage} />
          <Route path="/agenda" component={AgendaPage} />
          <Route path="/agenda/:id" component={AgendaPage} />
          <Route path="/quem-somos" component={QuemSomosPage} />
          <Route path="/diretoria" component={DiretoriaPage} />
          <Route path="/oracao" component={OracaoPage} />
          <Route path="/membro" component={MembroPage} />
          <Route path="/politica-privacidade" component={PoliticaPrivacidadePage} />
          <Route path="/login" component={LoginPage} />
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/verificar/:hash" component={VerifyPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/vote" component={VotePage} />
        <Route path="/results" component={ResultsPage} />
        <Route path="/study" component={StudyHomePage} />
        <Route path="/study/lesson/:id" component={LessonPage} />
        <Route path="/study/explore" component={ExplorePage} />
        <Route path="/study/verses" component={VersesPage} />
        <Route path="/study/profile" component={ProfilePage} />
        <Route path="/study/ranking" component={RankingPage} />
        <Route path="/study/missions" component={MissionsPage} />
        <Route path="/study/missions/:missionId" component={MissionActivityPage} />
        <Route path="/study/achievements" component={AchievementsPage} />
        <Route path="/study/estudos" component={SeasonsPage} />
        <Route path="/study/season/:id" component={SeasonDetailPage} />
        <Route path="/study/season/:id/challenge" component={FinalChallengePage} />
        <Route path="/study/season/:id/ranking" component={SeasonRankingPage} />
        <Route path="/study/practice/:weekId" component={PracticePage} />
        <Route path="/study/practice" component={PracticePage} />
        {/* Secretaria Panels - Access controlled by backend */}
        <Route path="/admin/espiritualidade" component={EspiritualidadeDashboard} />
        <Route path="/admin/espiritualidade/devocionais" component={EspiritualidadeDevocionais} />
        <Route path="/admin/espiritualidade/devocionais/:id" component={EspiritualidadeDevocionalEditor} />
        <Route path="/admin/espiritualidade/oracoes" component={EspiritualidadeOracoes} />
        <Route path="/admin/espiritualidade/comentarios" component={EspiritualidadeComentarios} />
        <Route path="/admin/marketing" component={MarketingDashboard} />
        <Route path="/admin/marketing/eventos" component={MarketingEventos} />
        <Route path="/admin/marketing/eventos/:id" component={MarketingEventoEditor} />
        <Route path="/admin/marketing/diretoria" component={MarketingDiretoria} />
        <Route path="/admin/marketing/diretoria/:id" component={MarketingDiretoriaEditor} />
        <Route path="/admin/marketing/quem-somos" component={MarketingQuemSomos} />
        {/* Site Institucional - Public Routes */}
        <Route path="/" component={SiteHomePage} />
        <Route path="/devocionais" component={DevocionaisPage} />
        <Route path="/devocionais/:id" component={DevocionalDetailPage} />
        <Route path="/agenda" component={AgendaPage} />
        <Route path="/agenda/:id" component={AgendaPage} />
        <Route path="/quem-somos" component={QuemSomosPage} />
        <Route path="/diretoria" component={DiretoriaPage} />
        <Route path="/oracao" component={OracaoPage} />
        <Route path="/membro" component={MembroPage} />
        <Route path="/politica-privacidade" component={PoliticaPrivacidadePage} />
        <Route path="/login" component={LoginPage} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
