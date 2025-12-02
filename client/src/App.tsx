import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import LoginPage from "@/pages/login";
import AdminPage from "@/pages/admin";
import VotePage from "@/pages/vote";
import ResultsPage from "@/pages/results";
import VerifyPage from "@/pages/verify";
import StudyHomePage from "@/pages/study/index";
import LessonPage from "@/pages/study/lesson";
import VersesPage from "@/pages/study/verses";
import ExplorePage from "@/pages/study/explore";
import ProfilePage from "@/pages/study/profile";
import RankingPage from "@/pages/study/ranking";
import StudyPreviewPage from "@/pages/study/preview";

function Router() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/verificar/:hash" component={VerifyPage} />
        <Route path="/results" component={ResultsPage} />
        {/* Preview routes - todas as páginas do sistema de estudo acessíveis sem login */}
        <Route path="/study-preview" component={StudyPreviewPage} />
        <Route path="/study-preview/explore" component={ExplorePage} />
        <Route path="/study-preview/ranking" component={RankingPage} />
        <Route path="/study-preview/profile" component={ProfilePage} />
        <Route path="/study-preview/verses" component={VersesPage} />
        <Route path="/study-preview/lesson/:id" component={LessonPage} />
        <Route path="/" component={LoginPage} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    );
  }

  if (isAdmin) {
    return (
      <Switch>
        <Route path="/verificar/:hash" component={VerifyPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/vote" component={VotePage} />
        <Route path="/results" component={ResultsPage} />
        <Route path="/study" component={StudyHomePage} />
        <Route path="/study/lesson/:id" component={LessonPage} />
        <Route path="/study/explore" component={ExplorePage} />
        <Route path="/study/verses" component={VersesPage} />
        <Route path="/study/profile" component={ProfilePage} />
        <Route path="/study/ranking" component={RankingPage} />
        <Route>
          <Redirect to="/admin" />
        </Route>
      </Switch>
    );
  }

  return (
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
      <Route>
        <Redirect to="/vote" />
      </Route>
    </Switch>
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
