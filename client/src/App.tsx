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

const AdminPage = lazy(() => import("@/pages/admin"));
const AdminSitePage = lazy(() => import("@/pages/admin/admin-site"));
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
const StudyPreviewPage = lazy(() => import("@/pages/study/preview"));
const StudyAdminPage = lazy(() => import("@/pages/study/admin/index"));

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
          <Route path="/quem-somos" component={QuemSomosPage} />
          <Route path="/diretoria" component={DiretoriaPage} />
          <Route path="/oracao" component={OracaoPage} />
          <Route path="/membro" component={MembroPage} />
          <Route path="/login" component={LoginPage} />
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </Suspense>
    );
  }

  if (isAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/verificar/:hash" component={VerifyPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/study" component={StudyAdminPage} />
          <Route path="/admin/site" component={AdminSitePage} />
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
          <Route path="/study/seasons" component={SeasonsPage} />
          <Route path="/study/season/:id" component={SeasonDetailPage} />
          <Route path="/study/season/:id/challenge" component={FinalChallengePage} />
          {/* Site Institucional - Public Routes */}
          <Route path="/" component={SiteHomePage} />
          <Route path="/devocionais" component={DevocionaisPage} />
          <Route path="/devocionais/:id" component={DevocionalDetailPage} />
          <Route path="/agenda" component={AgendaPage} />
          <Route path="/quem-somos" component={QuemSomosPage} />
          <Route path="/diretoria" component={DiretoriaPage} />
          <Route path="/oracao" component={OracaoPage} />
          <Route path="/membro" component={MembroPage} />
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
        <Route path="/study/seasons" component={SeasonsPage} />
        <Route path="/study/season/:id" component={SeasonDetailPage} />
        <Route path="/study/season/:id/challenge" component={FinalChallengePage} />
        {/* Site Institucional - Public Routes */}
        <Route path="/" component={SiteHomePage} />
        <Route path="/devocionais" component={DevocionaisPage} />
        <Route path="/devocionais/:id" component={DevocionalDetailPage} />
        <Route path="/agenda" component={AgendaPage} />
        <Route path="/quem-somos" component={QuemSomosPage} />
        <Route path="/diretoria" component={DiretoriaPage} />
        <Route path="/oracao" component={OracaoPage} />
        <Route path="/membro" component={MembroPage} />
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
