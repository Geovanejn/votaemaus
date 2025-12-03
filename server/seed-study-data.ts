import { storage } from "./storage";

const faithStudy = {
  title: "O Que É a Fé?",
  description: "Estudo bíblico sobre o significado e a importância da fé cristã baseado em Hebreus 11:1",
  weekNumber: 49,
  year: 2024,
  lessons: [
    {
      title: "O Que É a Fé?",
      type: "study",
      description: "Estudo completo sobre a fé cristã",
      xpReward: 50,
      estimatedMinutes: 15,
      units: [
        {
          type: "verse",
          stage: "estude",
          content: {
            title: "Versículo Base",
            body: "Ora, a fé é a certeza de coisas que se esperam, a convicção de fatos que se não veem.",
            highlight: "Hebreus 11:1 (ARA)"
          },
          xpValue: 3
        },
        {
          type: "text",
          stage: "estude",
          content: {
            title: "O Que É a Fé?",
            body: "A fé é a confiança firme no caráter de Deus e na veracidade de Sua Palavra. Não depende de emoções, mas de uma certeza interior gerada pelo Espírito Santo. Crer é caminhar \"por fé, e não pelo que vemos\" (2 Coríntios 5:7), confiando que Deus cumprirá Suas promessas mesmo antes de enxergar resultados concretos."
          },
          xpValue: 3
        },
        {
          type: "text",
          stage: "estude",
          content: {
            title: "A Fé Tem um Fundamento: Deus",
            body: "A verdadeira fé se apoia totalmente no Deus vivo. Ela é construída sobre Seu caráter imutável e Suas promessas confiáveis. Deus é o fundamento seguro que sustenta nossa esperança, pois Ele não falha. Por isso, a fé torna-se estável e firme, capaz de resistir às incertezas e aos temores que surgem na caminhada cristã."
          },
          xpValue: 3
        },
        {
          type: "text",
          stage: "estude",
          content: {
            title: "A Fé Tem um Objeto: Cristo",
            body: "A fé cristã tem foco claro: Jesus Cristo. Crer é confiar plenamente em Sua obra, Seu amor e Seu senhorio. Ele é o caminho, a verdade e a vida (João 14:6), e somente n'Ele encontramos perdão e reconciliação. Ter fé significa descansar em Cristo, sabendo que somente Ele pode sustentar, transformar e conduzir nossas vidas."
          },
          xpValue: 3
        },
        {
          type: "text",
          stage: "estude",
          content: {
            title: "A Fé Produz Obras e Frutos",
            body: "A fé verdadeira se manifesta em atitudes e mudança de vida. Não é apenas uma crença interna, mas algo que produz frutos visíveis na prática diária (Tiago 2:17). Ela nos leva a obedecer, amar, servir e buscar santidade. As obras não produzem salvação, mas revelam que a fé é viva, autêntica e operante no coração do cristão."
          },
          xpValue: 3
        },
        {
          type: "text",
          stage: "estude",
          content: {
            title: "A Fé Cresce e se Fortalece",
            body: "A fé se desenvolve quando é exercitada. Ela cresce pela Palavra de Deus (Romanos 10:17), pela oração, pela comunhão e pelas próprias lutas, que nos ensinam a depender mais do Senhor. Cada experiência vivida aprofunda nossa confiança. Com o tempo, a fé madura se torna mais firme, resistente e segura, mesmo em dias difíceis."
          },
          xpValue: 3
        },
        {
          type: "text",
          stage: "estude",
          content: {
            title: "Conclusão",
            body: "A fé é um dom de Deus que nos liga a Cristo e sustenta nossa caminhada. Ela nos capacita a enxergar além das circunstâncias e descansar nas promessas do Senhor. Pela fé encontramos paz, direção e esperança. Viver pela fé é confiar no que Deus disse, não no que sentimos, perseverando com confiança naquele que é fiel."
          },
          xpValue: 3
        },
        {
          type: "text",
          stage: "medite",
          content: {
            title: "Aplicação na Vida Pessoal",
            body: "A fé não é apenas um conceito teológico, mas uma realidade prática que deve transformar nosso dia a dia. Quando enfrentamos problemas financeiros, a fé nos leva a confiar na provisão de Deus. Quando a saúde falha, a fé nos sustenta na esperança do Senhor. Quando relacionamentos se quebram, a fé nos aponta para o Deus que restaura. Pratique a fé começando com pequenos passos: ore antes de tomar decisões, busque a Palavra quando estiver ansioso, e escolha confiar mesmo quando não entender o caminho."
          },
          xpValue: 3
        },
        {
          type: "text",
          stage: "medite",
          content: {
            title: "Aplicação na Comunidade",
            body: "A fé também se expressa em comunidade. Quando você compartilha seu testemunho com outros irmãos, fortalece a fé deles e a sua própria. Quando ora por alguém que está passando por dificuldades, você exercita a fé intercessória. Quando serve na igreja com dedicação, demonstra que crê no propósito de Deus para o Corpo de Cristo. Nesta semana, comprometa-se a encorajar pelo menos uma pessoa com uma palavra de fé, lembrando-a das promessas de Deus."
          },
          xpValue: 3
        },
        {
          type: "reflection",
          stage: "medite",
          content: {
            title: "Reflexão Pessoal",
            body: "Reflita sobre como a fé tem influenciado suas decisões diárias. Em quais áreas da sua vida você tem confiado mais em suas próprias forças do que em Deus? Pense em uma situação recente onde você poderia ter exercitado mais fé. O que te impediu? O medo? A dúvida? A pressa? Escreva em seu coração um compromisso de confiar mais no Senhor nesta área específica.",
            reflectionPrompt: "Em que área da minha vida preciso exercitar mais a fé em Deus?"
          },
          xpValue: 5
        },
        {
          type: "meditation",
          stage: "medite",
          content: {
            title: "Oração",
            body: "Senhor, agradeço por me conceder o dom da fé. Confesso que muitas vezes tenho duvidado das Tuas promessas e confiado mais em mim mesmo. Ajuda-me a crer firmemente em Ti, mesmo quando as circunstâncias parecem contrárias. Que minha fé não esteja fundamentada em minhas emoções, mas em Teu caráter imutável. Aumenta minha fé, Senhor, para que eu possa viver de maneira que Te glorifique. Que eu seja capaz de confiar em Ti nas pequenas e grandes decisões. Em nome de Jesus, amém.",
            meditationDuration: 120
          },
          xpValue: 5
        },
        {
          type: "multiple_choice",
          stage: "responda",
          content: {
            question: "Segundo Hebreus 11:1, a fé é:",
            options: [
              "A certeza de coisas que se esperam, a convicção de fatos que se não veem",
              "Um sentimento de paz interior que vem e vai",
              "A capacidade de fazer milagres e maravilhas",
              "Uma teoria sobre a existência de Deus"
            ],
            correctIndex: 0,
            explanationCorrect: "Excelente! Hebreus 11:1 define a fé como a certeza de coisas que se esperam e a convicção de fatos que se não veem.",
            explanationIncorrect: "A resposta correta é a primeira opção. Hebreus 11:1 define a fé como a certeza de coisas que se esperam e a convicção de fatos que se não veem."
          },
          xpValue: 5
        },
        {
          type: "true_false",
          stage: "responda",
          content: {
            statement: "A fé verdadeira depende das emoções e sentimentos do cristão.",
            isTrue: false,
            explanationCorrect: "Correto! A fé não depende de emoções, mas de uma certeza interior gerada pelo Espírito Santo.",
            explanationIncorrect: "A afirmação é falsa. A fé não depende de emoções, mas de uma certeza interior gerada pelo Espírito Santo, fundamentada no caráter de Deus."
          },
          xpValue: 5
        },
        {
          type: "fill_blank",
          stage: "responda",
          content: {
            question: "Jesus disse: Eu sou o ___, a verdade e a vida.",
            correctAnswer: "caminho",
            explanationCorrect: "Perfeito! Em João 14:6, Jesus se apresenta como o único caminho ao Pai.",
            explanationIncorrect: "A resposta correta é 'caminho'. Em João 14:6, Jesus diz: 'Eu sou o caminho, a verdade e a vida.'",
            hint: "Leia João 14:6"
          },
          xpValue: 5
        },
        {
          type: "multiple_choice",
          stage: "responda",
          content: {
            question: "De acordo com o estudo, em que a fé cristã está fundamentada?",
            options: [
              "Nas experiências pessoais do cristão",
              "No caráter imutável de Deus e Suas promessas confiáveis",
              "Na opinião dos líderes religiosos",
              "Nas tradições da igreja"
            ],
            correctIndex: 1,
            explanationCorrect: "Isso mesmo! A verdadeira fé se apoia no Deus vivo, em Seu caráter imutável e Suas promessas confiáveis.",
            explanationIncorrect: "A resposta correta é que a fé está fundamentada no caráter imutável de Deus e Suas promessas confiáveis."
          },
          xpValue: 5
        },
        {
          type: "fill_blank",
          stage: "responda",
          content: {
            question: "A fé cresce pela Palavra de Deus, conforme Romanos 10:17, que diz: A fé vem pelo ouvir, e o ouvir pela ___ de Cristo.",
            correctAnswer: "palavra",
            explanationCorrect: "Correto! Romanos 10:17 nos ensina que a fé vem pelo ouvir a Palavra de Cristo.",
            explanationIncorrect: "A resposta é 'palavra'. Romanos 10:17 diz: 'A fé vem pelo ouvir, e o ouvir pela palavra de Cristo.'",
            hint: "Complete com o que ouvimos de Cristo"
          },
          xpValue: 5
        },
        {
          type: "true_false",
          stage: "responda",
          content: {
            statement: "Segundo Tiago 2:17, a fé sem obras é morta.",
            isTrue: true,
            explanationCorrect: "Exato! Tiago 2:17 nos ensina que a fé verdadeira se manifesta em obras e frutos visíveis.",
            explanationIncorrect: "A afirmação é verdadeira. Tiago 2:17 declara que a fé sem obras é morta, pois a fé verdadeira produz frutos."
          },
          xpValue: 5
        },
        {
          type: "multiple_choice",
          stage: "responda",
          content: {
            question: "Qual é o objeto principal da fé cristã, segundo o estudo?",
            options: [
              "A igreja e suas doutrinas",
              "Os anjos e seres celestiais",
              "Jesus Cristo",
              "Os profetas do Antigo Testamento"
            ],
            correctIndex: 2,
            explanationCorrect: "Perfeito! A fé cristã tem foco claro: Jesus Cristo. Crer é confiar plenamente em Sua obra, Seu amor e Seu senhorio.",
            explanationIncorrect: "A resposta correta é Jesus Cristo. A fé cristã tem foco claro: Jesus Cristo é o caminho, a verdade e a vida."
          },
          xpValue: 5
        },
        {
          type: "multiple_choice",
          stage: "responda",
          content: {
            question: "Como a fé cristã se desenvolve e fortalece?",
            options: [
              "Apenas através de experiências sobrenaturais",
              "Pela Palavra de Deus, oração, comunhão e pelas lutas",
              "Automaticamente com o passar do tempo",
              "Somente através do estudo teológico formal"
            ],
            correctIndex: 1,
            explanationCorrect: "Correto! A fé cresce pela Palavra de Deus, pela oração, pela comunhão e pelas próprias lutas que nos ensinam a depender mais do Senhor.",
            explanationIncorrect: "A resposta correta é: pela Palavra de Deus, oração, comunhão e pelas lutas. Cada experiência vivida aprofunda nossa confiança no Senhor."
          },
          xpValue: 5
        }
      ]
    }
  ]
};

const bibleVerses = [
  { reference: "Salmos 23:1", text: "O Senhor é o meu pastor; nada me faltará.", book: "Salmos", chapter: 23, verse: 1, reflection: "Deus cuida de todas as nossas necessidades como um bom pastor cuida de suas ovelhas." },
  { reference: "Provérbios 3:5-6", text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.", book: "Provérbios", chapter: 3, verse: 5, reflection: "A verdadeira sabedoria vem de confiar completamente em Deus." },
  { reference: "Isaías 41:10", text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a minha destra fiel.", book: "Isaías", chapter: 41, verse: 10, reflection: "Deus promete estar conosco em todos os momentos." },
  { reference: "Jeremias 29:11", text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais.", book: "Jeremias", chapter: 29, verse: 11, reflection: "Deus tem planos maravilhosos para cada um de nós." },
  { reference: "Filipenses 4:13", text: "Posso todas as coisas naquele que me fortalece.", book: "Filipenses", chapter: 4, verse: 13, reflection: "Nossa força vem de Cristo que habita em nós." },
  { reference: "Romanos 8:28", text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados por seu decreto.", book: "Romanos", chapter: 8, verse: 28, reflection: "Deus trabalha em todas as circunstâncias para nosso bem." },
  { reference: "Mateus 11:28", text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", book: "Mateus", chapter: 11, verse: 28, reflection: "Jesus oferece descanso para nossas almas cansadas." },
  { reference: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", book: "João", chapter: 3, verse: 16, reflection: "O amor de Deus é infinito e nos oferece vida eterna." },
  { reference: "Salmos 46:1", text: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", book: "Salmos", chapter: 46, verse: 1, reflection: "Em tempos de dificuldade, Deus é nosso refúgio seguro." },
  { reference: "2 Timóteo 1:7", text: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.", book: "2 Timóteo", chapter: 1, verse: 7, reflection: "O Espírito de Deus nos capacita com poder, amor e domínio próprio." },
  { reference: "Josué 1:9", text: "Não to mandei eu? Esforça-te e tem bom ânimo; não pasmes, nem te espantes, porque o Senhor, teu Deus, é contigo, por onde quer que andares.", book: "Josué", chapter: 1, verse: 9, reflection: "Coragem vem da certeza de que Deus está conosco." },
  { reference: "Salmos 27:1", text: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?", book: "Salmos", chapter: 27, verse: 1, reflection: "Com Deus ao nosso lado, não há razão para temer." },
  { reference: "1 Pedro 5:7", text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", book: "1 Pedro", chapter: 5, verse: 7, reflection: "Podemos entregar todas as nossas preocupações a Deus." },
  { reference: "Efésios 2:8-9", text: "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós; é dom de Deus. Não vem das obras, para que ninguém se glorie.", book: "Efésios", chapter: 2, verse: 8, reflection: "A salvação é um presente gratuito de Deus." },
  { reference: "Hebreus 13:5", text: "Não te deixarei, nem te desampararei.", book: "Hebreus", chapter: 13, verse: 5, reflection: "A promessa de Deus é permanecer conosco sempre." },
  { reference: "Salmos 121:1-2", text: "Elevo os meus olhos para os montes: de onde me virá o socorro? O meu socorro vem do Senhor, que fez o céu e a terra.", book: "Salmos", chapter: 121, verse: 1, reflection: "Nosso socorro vem do Criador de todas as coisas." },
  { reference: "Isaías 40:31", text: "Mas os que esperam no Senhor renovarão as suas forças, subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão.", book: "Isaías", chapter: 40, verse: 31, reflection: "Esperar no Senhor renova nossas forças." },
  { reference: "Gálatas 5:22-23", text: "Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança.", book: "Gálatas", chapter: 5, verse: 22, reflection: "O Espírito Santo produz frutos em nossa vida." },
  { reference: "Tiago 1:2-3", text: "Meus irmãos, tende grande gozo quando cairdes em várias tentações, sabendo que a prova da vossa fé produz a paciência.", book: "Tiago", chapter: 1, verse: 2, reflection: "As provações fortalecem nossa fé e produzem perseverança." },
  { reference: "1 Coríntios 10:13", text: "Não veio sobre vós tentação, senão humana; mas fiel é Deus, que vos não deixará tentar acima do que podeis; antes, com a tentação dará também o escape, para que a possais suportar.", book: "1 Coríntios", chapter: 10, verse: 13, reflection: "Deus sempre provê uma saída em meio às tentações." }
];

const dailyMissions = [
  { type: "complete_lesson", title: "Complete uma lição", description: "Termine uma lição de estudo bíblico", icon: "book", xpReward: 20 },
  { type: "read_verses", title: "Leia 3 versículos", description: "Leia versículos bíblicos para edificação", icon: "book-open", xpReward: 15 },
  { type: "perfect_lesson", title: "Lição perfeita", description: "Complete uma lição sem errar nenhuma pergunta", icon: "star", xpReward: 30 },
  { type: "maintain_streak", title: "Mantenha a ofensiva", description: "Estude pelo menos uma lição hoje", icon: "flame", xpReward: 10 },
  { type: "study_time", title: "10 minutos de estudo", description: "Dedique 10 minutos aos estudos bíblicos", icon: "clock", xpReward: 15 }
];

export async function seedStudyData() {
  try {
    console.log("Limpando dados de estudo existentes...");
    
    const existingWeeks = storage.getAllStudyWeeks();
    for (const week of existingWeeks) {
      const lessons = storage.getLessonsForWeek(week.id);
      for (const lesson of lessons) {
        const units = storage.getUnitsForLesson(lesson.id);
        for (const unit of units) {
          storage.deleteStudyUnit(unit.id);
        }
        storage.deleteStudyLesson(lesson.id);
      }
      storage.deleteStudyWeek(week.id);
    }
    
    console.log("Inserindo novos dados de estudo...");
    
    const week = storage.createStudyWeek({
      weekNumber: faithStudy.weekNumber,
      year: faithStudy.year,
      title: faithStudy.title,
      description: faithStudy.description
    });
    
    console.log(`Semana criada: ${week.title} (ID: ${week.id})`);
    
    for (let i = 0; i < faithStudy.lessons.length; i++) {
      const lessonData = faithStudy.lessons[i];
      
      const lesson = storage.createStudyLesson({
        studyWeekId: week.id,
        orderIndex: i,
        title: lessonData.title,
        type: lessonData.type,
        description: lessonData.description,
        xpReward: lessonData.xpReward,
        estimatedMinutes: lessonData.estimatedMinutes,
        isLocked: false
      });
      
      console.log(`  Lição criada: ${lesson.title} (ID: ${lesson.id})`);
      
      for (let j = 0; j < lessonData.units.length; j++) {
        const unitData = lessonData.units[j];
        
        const unit = storage.createStudyUnit({
          lessonId: lesson.id,
          orderIndex: j,
          type: unitData.type,
          content: unitData.content,
          xpValue: unitData.xpValue,
          stage: unitData.stage
        });
        
        console.log(`    Unidade criada: ${unitData.type} - ${unitData.stage} (ID: ${unit.id})`);
      }
    }
    
    console.log("\nDados de estudo inseridos com sucesso!");
    return { success: true, weekId: week.id };
  } catch (error) {
    console.error("Erro ao inserir dados de estudo:", error);
    throw error;
  }
}

export async function seedBibleVerses() {
  try {
    console.log("\nLimpando versículos existentes...");
    storage.clearAllBibleVerses();
    
    console.log("Inserindo versículos bíblicos...");
    for (const verse of bibleVerses) {
      storage.createBibleVerse(verse.reference, verse.text, verse.reflection, "geral");
      console.log(`  Versículo inserido: ${verse.reference}`);
    }
    
    console.log(`\n${bibleVerses.length} versículos inseridos com sucesso!`);
    return { success: true, count: bibleVerses.length };
  } catch (error) {
    console.error("Erro ao inserir versículos:", error);
    throw error;
  }
}

export async function seedDailyMissions() {
  try {
    console.log("\nLimpando missões diárias existentes...");
    storage.clearAllDailyMissions();
    
    console.log("Inserindo missões diárias...");
    for (const mission of dailyMissions) {
      storage.createDailyMission(mission);
      console.log(`  Missão inserida: ${mission.title}`);
    }
    
    console.log(`\n${dailyMissions.length} missões inseridas com sucesso!`);
    return { success: true, count: dailyMissions.length };
  } catch (error) {
    console.error("Erro ao inserir missões:", error);
    throw error;
  }
}

export async function clearAllStudyProgress() {
  try {
    console.log("\nLimpando todo o progresso de estudo dos usuários...");
    storage.clearAllStudyProgress();
    console.log("Progresso limpo com sucesso!");
    return { success: true };
  } catch (error) {
    console.error("Erro ao limpar progresso:", error);
    throw error;
  }
}

export async function seedAllData() {
  console.log("=".repeat(50));
  console.log("INICIANDO SEED COMPLETO DO SISTEMA DEOGLORY");
  console.log("=".repeat(50));
  
  await clearAllStudyProgress();
  await seedStudyData();
  await seedBibleVerses();
  await seedDailyMissions();
  
  console.log("\n" + "=".repeat(50));
  console.log("SEED COMPLETO FINALIZADO COM SUCESSO!");
  console.log("=".repeat(50));
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedAllData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
