import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";
import { initBirthdayScheduler, initDeoGlorySchedulers, initDailyVerseScheduler, initRecoveryVersesScheduler, initInstagramScheduler } from "./scheduler";
import { initializeWebSocket } from "./websocket";
import { storage } from "./storage";
import cors from "cors";
import path from "path";

async function seedAchievementsAndVerses() {
  try {
    const existingVerses = await storage.getAllBibleVerses();
    if (existingVerses.length === 0) {
      console.log("[Seed] Criando versiculos biblicos iniciais...");
      const verses = [
        { reference: "Joao 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna.", reflection: "O amor de Deus e tao grande que Ele sacrificou Seu proprio Filho por nos.", category: "amor" },
        { reference: "Salmos 23:1", text: "O Senhor e o meu pastor; nada me faltara.", reflection: "Deus cuida de nos como um pastor cuida de suas ovelhas.", category: "provisao" },
        { reference: "Filipenses 4:13", text: "Posso todas as coisas naquele que me fortalece.", reflection: "Cristo nos da forca para enfrentar qualquer situacao.", category: "forca" },
        { reference: "Jeremias 29:11", text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e nao de mal, para vos dar o fim que esperais.", reflection: "Deus tem planos de esperanca e futuro para nos.", category: "esperanca" },
        { reference: "Isaias 41:10", text: "Nao temas, porque eu sou contigo; nao te assombres, porque eu sou teu Deus; eu te fortaleco, e te ajudo, e te sustento com a destra da minha justica.", reflection: "Deus esta sempre conosco para nos fortalecer.", category: "forca" },
        { reference: "Romanos 8:28", text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que sao chamados segundo o seu proposito.", reflection: "Deus transforma todas as situacoes para o nosso bem.", category: "esperanca" },
        { reference: "Salmos 46:1", text: "Deus e o nosso refugio e fortaleza, socorro bem presente na angustia.", reflection: "Podemos confiar em Deus em todos os momentos.", category: "protecao" },
        { reference: "Mateus 11:28", text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reflection: "Jesus oferece descanso para nossas almas.", category: "descanso" },
        { reference: "Proverbios 3:5-6", text: "Confia no Senhor de todo o teu coracao, e nao te estribes no teu proprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitara as tuas veredas.", reflection: "Confiar em Deus nos guia pelo caminho certo.", category: "sabedoria" },
        { reference: "1 Corintios 10:13", text: "Nao veio sobre vos tentacao, senao humana; mas fiel e Deus, que nao vos deixara tentar acima do que podeis, antes com a tentacao dara tambem o escape, para que a possais suportar.", reflection: "Deus sempre nos da um caminho de saida nas tentacoes.", category: "forca" },
        { reference: "Salmos 119:105", text: "Lampada para os meus pes e a tua palavra, e luz para o meu caminho.", reflection: "A Palavra de Deus ilumina nossa vida.", category: "sabedoria" },
        { reference: "2 Timoteo 1:7", text: "Porque Deus nao nos deu o espirito de temor, mas de fortaleza, e de amor, e de moderacao.", reflection: "Deus nos capacita com coragem e amor.", category: "coragem" },
        { reference: "Hebreus 11:1", text: "Ora, a fe e o firme fundamento das coisas que se esperam, e a prova das coisas que se nao veem.", reflection: "A fe e a certeza do que esperamos em Deus.", category: "fe" },
        { reference: "Romanos 12:2", text: "E nao sede conformados com este mundo, mas sede transformados pela renovacao do vosso entendimento, para que experimenteis qual seja a boa, agradavel, e perfeita vontade de Deus.", reflection: "Devemos buscar a transformacao em Cristo.", category: "transformacao" },
        { reference: "Galatas 5:22-23", text: "Mas o fruto do Espirito e: amor, gozo, paz, longanimidade, benignidade, bondade, fe, mansidao, temperanca. Contra estas coisas nao ha lei.", reflection: "O Espirito Santo produz frutos em nossa vida.", category: "espirito" }
      ];

      for (const verse of verses) {
        await storage.createBibleVerse(verse.reference, verse.text, verse.reflection, verse.category);
      }
      console.log(`[Seed] ${verses.length} versiculos biblicos criados com sucesso!`);
    }

    const existingAchievements = await storage.getAllAchievements();
    if (existingAchievements.length === 0) {
      console.log("[Seed] Criando conquistas iniciais...");
      const achievements = [
        // LICOES (12 conquistas)
        { code: "first_lesson", name: "Primeiro Passo", description: "Complete sua primeira licao", icon: "trophy", xpReward: 50, category: "lessons", requirement: JSON.stringify({ lessons: 1 }) },
        { code: "lessons_3", name: "Comecando Bem", description: "Complete 3 licoes", icon: "book", xpReward: 40, category: "lessons", requirement: JSON.stringify({ lessons: 3 }) },
        { code: "lessons_5", name: "Estudante Dedicado", description: "Complete 5 licoes", icon: "book-open", xpReward: 75, category: "lessons", requirement: JSON.stringify({ lessons: 5 }) },
        { code: "lessons_10", name: "Discipulo Fiel", description: "Complete 10 licoes", icon: "book-marked", xpReward: 150, category: "lessons", requirement: JSON.stringify({ lessons: 10 }) },
        { code: "lessons_15", name: "Estudioso", description: "Complete 15 licoes", icon: "bookmark", xpReward: 200, category: "lessons", requirement: JSON.stringify({ lessons: 15 }) },
        { code: "lessons_25", name: "Mestre da Palavra", description: "Complete 25 licoes", icon: "graduation-cap", xpReward: 300, category: "lessons", requirement: JSON.stringify({ lessons: 25 }) },
        { code: "lessons_50", name: "Erudito Biblico", description: "Complete 50 licoes", icon: "library", xpReward: 500, category: "lessons", requirement: JSON.stringify({ lessons: 50 }) },
        { code: "lessons_75", name: "Teologo", description: "Complete 75 licoes", icon: "scroll", xpReward: 750, category: "lessons", requirement: JSON.stringify({ lessons: 75 }) },
        { code: "lessons_100", name: "Centuriao da Palavra", description: "Complete 100 licoes", icon: "shield", xpReward: 1000, category: "lessons", requirement: JSON.stringify({ lessons: 100 }) },
        { code: "lessons_150", name: "Apostolo do Estudo", description: "Complete 150 licoes", icon: "crown", xpReward: 1500, category: "lessons", requirement: JSON.stringify({ lessons: 150 }) },
        { code: "lessons_200", name: "Doutor das Escrituras", description: "Complete 200 licoes", icon: "sparkles", xpReward: 2000, category: "lessons", requirement: JSON.stringify({ lessons: 200 }) },
        { code: "lessons_365", name: "Um Ano de Estudos", description: "Complete 365 licoes", icon: "calendar", xpReward: 3650, category: "lessons", requirement: JSON.stringify({ lessons: 365 }) },
        
        // OFENSIVA/STREAK (15 conquistas)
        { code: "streak_3", name: "Constante", description: "Mantenha uma sequencia de 3 dias", icon: "flame", xpReward: 30, category: "streak", requirement: JSON.stringify({ streak: 3 }) },
        { code: "streak_5", name: "Comprometido", description: "Mantenha uma sequencia de 5 dias", icon: "flame", xpReward: 50, category: "streak", requirement: JSON.stringify({ streak: 5 }) },
        { code: "streak_7", name: "Dedicado", description: "Mantenha uma sequencia de 7 dias", icon: "flame", xpReward: 100, category: "streak", requirement: JSON.stringify({ streak: 7 }) },
        { code: "streak_14", name: "Perseverante", description: "Mantenha uma sequencia de 14 dias", icon: "flame", xpReward: 200, category: "streak", requirement: JSON.stringify({ streak: 14 }) },
        { code: "streak_21", name: "Formador de Habito", description: "Mantenha uma sequencia de 21 dias", icon: "flame", xpReward: 300, category: "streak", requirement: JSON.stringify({ streak: 21 }) },
        { code: "streak_30", name: "Imbativel", description: "Mantenha uma sequencia de 30 dias", icon: "flame", xpReward: 500, category: "streak", requirement: JSON.stringify({ streak: 30 }) },
        { code: "streak_45", name: "Quarentena Espiritual", description: "Mantenha uma sequencia de 45 dias", icon: "flame", xpReward: 700, category: "streak", requirement: JSON.stringify({ streak: 45 }) },
        { code: "streak_60", name: "Lenda Viva", description: "Mantenha uma sequencia de 60 dias", icon: "crown", xpReward: 1000, category: "streak", requirement: JSON.stringify({ streak: 60 }) },
        { code: "streak_90", name: "Trimestre de Fe", description: "Mantenha uma sequencia de 90 dias", icon: "crown", xpReward: 1500, category: "streak", requirement: JSON.stringify({ streak: 90 }) },
        { code: "streak_120", name: "Fidelidade Inabalavel", description: "Mantenha uma sequencia de 120 dias", icon: "crown", xpReward: 2000, category: "streak", requirement: JSON.stringify({ streak: 120 }) },
        { code: "streak_150", name: "Semestre de Dedicacao", description: "Mantenha uma sequencia de 150 dias", icon: "crown", xpReward: 2500, category: "streak", requirement: JSON.stringify({ streak: 150 }) },
        { code: "streak_180", name: "Meio Ano Invicto", description: "Mantenha uma sequencia de 180 dias", icon: "crown", xpReward: 3000, category: "streak", requirement: JSON.stringify({ streak: 180 }) },
        { code: "streak_270", name: "Tres Quartos do Ano", description: "Mantenha uma sequencia de 270 dias", icon: "crown", xpReward: 4000, category: "streak", requirement: JSON.stringify({ streak: 270 }) },
        { code: "streak_365", name: "Um Ano Perfeito", description: "Mantenha uma sequencia de 365 dias", icon: "crown", xpReward: 5000, category: "streak", requirement: JSON.stringify({ streak: 365 }) },
        { code: "streak_500", name: "Guerreiro da Fe", description: "Mantenha uma sequencia de 500 dias", icon: "sword", xpReward: 7500, category: "streak", requirement: JSON.stringify({ streak: 500 }) },
        
        // XP (10 conquistas)
        { code: "xp_100", name: "Iniciante", description: "Alcance 100 XP", icon: "zap", xpReward: 25, category: "xp", requirement: JSON.stringify({ xp: 100 }) },
        { code: "xp_250", name: "Em Crescimento", description: "Alcance 250 XP", icon: "zap", xpReward: 35, category: "xp", requirement: JSON.stringify({ xp: 250 }) },
        { code: "xp_500", name: "Intermediario", description: "Alcance 500 XP", icon: "zap", xpReward: 50, category: "xp", requirement: JSON.stringify({ xp: 500 }) },
        { code: "xp_1000", name: "Avancado", description: "Alcance 1000 XP", icon: "trending-up", xpReward: 100, category: "xp", requirement: JSON.stringify({ xp: 1000 }) },
        { code: "xp_2500", name: "Experiente", description: "Alcance 2500 XP", icon: "trending-up", xpReward: 150, category: "xp", requirement: JSON.stringify({ xp: 2500 }) },
        { code: "xp_5000", name: "Expert", description: "Alcance 5000 XP", icon: "star", xpReward: 250, category: "xp", requirement: JSON.stringify({ xp: 5000 }) },
        { code: "xp_10000", name: "Mestre XP", description: "Alcance 10000 XP", icon: "star", xpReward: 500, category: "xp", requirement: JSON.stringify({ xp: 10000 }) },
        { code: "xp_25000", name: "Grande Mestre", description: "Alcance 25000 XP", icon: "crown", xpReward: 1000, category: "xp", requirement: JSON.stringify({ xp: 25000 }) },
        { code: "xp_50000", name: "Lendario", description: "Alcance 50000 XP", icon: "crown", xpReward: 2000, category: "xp", requirement: JSON.stringify({ xp: 50000 }) },
        { code: "xp_100000", name: "Mitico", description: "Alcance 100000 XP", icon: "sparkles", xpReward: 5000, category: "xp", requirement: JSON.stringify({ xp: 100000 }) },
        
        // NIVEIS (8 conquistas)
        { code: "level_3", name: "Novico", description: "Alcance o nivel 3", icon: "award", xpReward: 50, category: "level", requirement: JSON.stringify({ level: 3 }) },
        { code: "level_5", name: "Aprendiz", description: "Alcance o nivel 5", icon: "award", xpReward: 100, category: "level", requirement: JSON.stringify({ level: 5 }) },
        { code: "level_10", name: "Estudante", description: "Alcance o nivel 10", icon: "award", xpReward: 200, category: "level", requirement: JSON.stringify({ level: 10 }) },
        { code: "level_15", name: "Discipulo", description: "Alcance o nivel 15", icon: "award", xpReward: 300, category: "level", requirement: JSON.stringify({ level: 15 }) },
        { code: "level_20", name: "Pregador", description: "Alcance o nivel 20", icon: "award", xpReward: 400, category: "level", requirement: JSON.stringify({ level: 20 }) },
        { code: "level_25", name: "Mestre", description: "Alcance o nivel 25", icon: "crown", xpReward: 500, category: "level", requirement: JSON.stringify({ level: 25 }) },
        { code: "level_50", name: "Sabio", description: "Alcance o nivel 50", icon: "crown", xpReward: 1000, category: "level", requirement: JSON.stringify({ level: 50 }) },
        { code: "level_100", name: "Patriarca", description: "Alcance o nivel 100", icon: "sparkles", xpReward: 2500, category: "level", requirement: JSON.stringify({ level: 100 }) },
        
        // ESPECIAIS (5 conquistas)
        { code: "perfect_lesson", name: "Perfeito!", description: "Complete uma licao sem erros", icon: "star", xpReward: 25, category: "special", isSecret: false },
        { code: "early_bird", name: "Madrugador", description: "Estude antes das 7h da manha", icon: "sunrise", xpReward: 30, category: "special", isSecret: false },
        { code: "night_owl", name: "Coruja Noturna", description: "Estude apos as 22h", icon: "moon", xpReward: 30, category: "special", isSecret: false },
        { code: "bookworm", name: "Leitor Voraz", description: "Leia 10 versiculos biblicos", icon: "book-heart", xpReward: 50, category: "special", isSecret: false },
        { code: "comeback_kid", name: "Nunca Desisto", description: "Recupere todas as vidas usando versiculos", icon: "heart", xpReward: 30, category: "special", isSecret: false }
      ];

      for (const achievement of achievements) {
        await storage.createAchievement(achievement);
      }
      console.log(`[Seed] ${achievements.length} conquistas criadas com sucesso!`);
    }

    // Inicializar missoes diarias
    const existingMissions = await storage.getDailyMissions();
    if (existingMissions.length === 0) {
      console.log("[Seed] Criando missoes diarias iniciais...");
      await storage.initializeDailyMissions();
      console.log("[Seed] Missoes diarias criadas com sucesso!");
    }
  } catch (error: any) {
    console.error("[Seed] Erro ao inicializar conquistas e versiculos:", error.message);
  }
}

const app = express();

app.set('trust proxy', 1);

app.use(cors());

app.use('/attached_assets', express.static(path.resolve(process.cwd(), 'attached_assets')));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await initializeDatabase();
  await seedAchievementsAndVerses();
  initBirthdayScheduler();
  initDeoGlorySchedulers();
  initDailyVerseScheduler();
  initRecoveryVersesScheduler();
  initInstagramScheduler();
  
  const server = await registerRoutes(app);
  
  // Initialize WebSocket server
  initializeWebSocket(server);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
