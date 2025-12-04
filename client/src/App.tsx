import { Switch, Route, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/login";
import VerifyPage from "@/pages/verify";

const AdminPage = lazy(() => import("@/pages/admin"));
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
const StudyPreviewPage = lazy(() => import("@/pages/study/preview"));
const StudyAdminPage = lazy(() => import("@/pages/study/admin/index"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Carregando...</p>
    </div>
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
          <Route path="/" component={LoginPage} />
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
          <Route>
            <Redirect to="/admin" />
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
        <Route>
          <Redirect to="/vote" />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
