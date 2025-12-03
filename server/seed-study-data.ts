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
          type: "reflection",
          stage: "medite",
          content: {
            title: "Aplicação Prática",
            body: "Reflita sobre como a fé tem influenciado suas decisões diárias. Em quais áreas da sua vida você tem confiado mais em suas próprias forças do que em Deus? Ore pedindo ao Senhor que fortaleça sua fé e que você possa descansar completamente em Suas promessas, mesmo quando não consegue ver o caminho à frente.",
            reflectionPrompt: "Em que área da minha vida preciso exercitar mais a fé em Deus?"
          },
          xpValue: 5
        },
        {
          type: "meditation",
          stage: "medite",
          content: {
            title: "Meditação na Palavra",
            body: "Senhor, agradeço por me conceder o dom da fé. Confesso que muitas vezes tenho duvidado das Tuas promessas e confiado mais em mim mesmo. Ajuda-me a crer firmemente em Ti, mesmo quando as circunstâncias parecem contrárias. Que minha fé não esteja fundamentada em minhas emoções, mas em Teu caráter imutável. Aumenta minha fé, Senhor, para que eu possa viver de maneira que Te glorifique. Em nome de Jesus, amém.",
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
        }
      ]
    }
  ]
};

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

if (require.main === module) {
  seedStudyData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
