import { storage } from "./storage";

const devotionalsData = [
  {
    title: "A Forca da Oracao",
    verse: "Orai sem cessar.",
    verseReference: "1 Tessalonicenses 5:17",
    content: `A oracao e a nossa linha direta com Deus. Atraves dela, podemos expressar nossas alegrias, tristezas, pedidos e agradecimentos ao nosso Pai celestial.

Quando oramos com fe, abrimos espaco para que Deus opere em nossas vidas de maneiras extraordinarias. A oracao nao muda apenas as circunstancias ao nosso redor, mas transforma nosso coracao e nos aproxima do Criador.

Paulo nos exorta a orar sem cessar - nao porque devemos estar de joelhos 24 horas por dia, mas porque devemos manter uma atitude de oracao constante, reconhecendo a presenca de Deus em todos os momentos.`,
    summary: "A oracao e nossa conexao direta com Deus, transformando nossos coracoes.",
    imageUrl: "/api/placeholder/800/400",
    author: "Secretaria de Espiritualidade",
  },
  {
    title: "Confianca em Deus",
    verse: "Confia no Senhor de todo o teu coracao.",
    verseReference: "Proverbios 3:5",
    content: `Confiar em Deus e um ato de fe que vai alem da nossa compreensao. Em momentos de duvida e incerteza, somos chamados a depositar nossa confianca Naquele que tudo ve e tudo sabe.

Proverbios nos ensina a nao nos apoiarmos em nosso proprio entendimento. Isso significa que, mesmo quando as coisas nao fazem sentido para nos, Deus esta no controle e tem um proposito maior.

Confiar em Deus e reconhecer que Ele e soberano sobre todas as coisas e que Seus caminhos sao mais altos que os nossos.`,
    summary: "Confiar em Deus significa reconhecer Sua soberania sobre nossas vidas.",
    imageUrl: "/api/placeholder/800/400",
    author: "Secretaria de Espiritualidade",
  },
  {
    title: "O Amor de Cristo",
    verse: "Deus amou o mundo de tal maneira que deu o seu Filho.",
    verseReference: "Joao 3:16",
    content: `O amor de Deus e a essencia do Evangelho. Ele nos amou primeiro, mesmo quando eramos pecadores, e enviou Seu Filho para morrer por nos.

Este amor nao e condicional - nao depende de nossas acoes ou meritos. E um amor gracioso que nos alcanca onde estamos e nos transforma pelo poder do Espirito Santo.

Quando compreendemos a profundidade do amor de Deus, somos motivados a amar os outros da mesma forma - incondicionalmente e sacrificialmente.`,
    summary: "O amor de Deus e incondicional e transformador.",
    imageUrl: "/api/placeholder/800/400",
    author: "Secretaria de Espiritualidade",
  },
];

const eventsData = [
  {
    title: "Culto Jovem",
    description: "Venha participar do nosso culto jovem com louvor, palavra e comunhao.",
    imageUrl: "/api/placeholder/400/300",
    startDate: "2025-12-15",
    time: "19:30",
    location: "Igreja Presbiteriana Emaus",
  },
  {
    title: "Retiro Anual UMP",
    description: "Nosso retiro anual de fim de ano. Tres dias de comunhao, estudos e diversao.",
    imageUrl: "/api/placeholder/400/300",
    startDate: "2025-12-20",
    endDate: "2025-12-22",
    time: "08:00",
    location: "Sitio Recanto da Graca",
  },
  {
    title: "Celebracao de Natal",
    description: "Celebracao especial de Natal da UMP Emaus com cantata e ceia.",
    imageUrl: "/api/placeholder/400/300",
    startDate: "2025-12-25",
    time: "20:00",
    location: "Igreja Presbiteriana Emaus",
  },
  {
    title: "Virada de Ano",
    description: "Culto de gratidao e vigilia de passagem de ano.",
    imageUrl: "/api/placeholder/400/300",
    startDate: "2025-12-31",
    time: "22:00",
    location: "Igreja Presbiteriana Emaus",
  },
];

const instagramPostsData = [
  {
    caption: "Culto jovem ontem foi uma bencao! Deus esta agindo em nosso meio.",
    imageUrl: "/api/placeholder/400/400",
    permalink: "https://instagram.com/umpemaus",
    postedAt: "2025-12-03T18:00:00Z",
  },
  {
    caption: "Estudo biblico sobre fe. Venha crescer conosco!",
    imageUrl: "/api/placeholder/400/400",
    permalink: "https://instagram.com/umpemaus",
    postedAt: "2025-12-02T15:00:00Z",
  },
  {
    caption: "Momento de oracao pela nossa cidade.",
    imageUrl: "/api/placeholder/400/400",
    permalink: "https://instagram.com/umpemaus",
    postedAt: "2025-12-01T20:00:00Z",
  },
  {
    caption: "Confraternizacao da juventude. Alegria em servir!",
    imageUrl: "/api/placeholder/400/400",
    permalink: "https://instagram.com/umpemaus",
    postedAt: "2025-11-30T19:00:00Z",
  },
  {
    caption: "Acampamento de inverno foi incrivel!",
    imageUrl: "/api/placeholder/400/400",
    permalink: "https://instagram.com/umpemaus",
    postedAt: "2025-11-28T12:00:00Z",
  },
  {
    caption: "Louvando ao Senhor com todo o coracao.",
    imageUrl: "/api/placeholder/400/400",
    permalink: "https://instagram.com/umpemaus",
    postedAt: "2025-11-25T18:00:00Z",
  },
];

export async function seedSiteContent() {
  console.log("\n" + "=".repeat(50));
  console.log("INICIANDO SEED DO CONTEUDO DO SITE");
  console.log("=".repeat(50));

  console.log("\nLimpando dados existentes...");
  storage.clearAllDevotionals();
  storage.clearAllSiteEvents();
  storage.clearAllInstagramPosts();

  console.log("\nInserindo devocionais...");
  for (const devotional of devotionalsData) {
    const created = storage.createDevotional(devotional);
    console.log(`  Devocional criado: ${created.title}`);
  }

  console.log("\nInserindo eventos...");
  for (const event of eventsData) {
    const created = storage.createSiteEvent(event);
    console.log(`  Evento criado: ${created.title}`);
  }

  console.log("\nInserindo posts do Instagram...");
  for (const post of instagramPostsData) {
    const created = storage.createInstagramPost(post);
    console.log(`  Post criado: ${created.caption?.substring(0, 30)}...`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("SEED DO CONTEUDO DO SITE CONCLUIDO!");
  console.log("=".repeat(50));
}

const isMainModule = process.argv[1]?.includes('seed-site-content');
if (isMainModule) {
  seedSiteContent()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Erro no seed:", error);
      process.exit(1);
    });
}
