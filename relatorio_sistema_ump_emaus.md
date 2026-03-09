# Relatório Técnico-Funcional — Sistema UMP Emaús

**Data de emissão:** 28 de fevereiro de 2026
**Versão do sistema:** Produção
**Plataforma:** Aplicação Web Responsiva (PWA)

---

## 1. Conceito Geral

O Sistema UMP Emaús é uma plataforma web integrada desenvolvida para a União de Mocidade da Igreja Presbiteriana de Emaús. Seu propósito central é promover o engajamento comunitário, o crescimento espiritual e a gestão administrativa eficiente da mocidade, reunindo em um único ambiente digital todas as necessidades operacionais, educacionais, financeiras e comunicacionais do grupo.

A plataforma opera em três camadas de acesso:

- **Site Público:** Vitrine institucional acessível a qualquer visitante.
- **Área do Membro:** Ambiente restrito com funcionalidades completas para membros cadastrados.
- **Painéis Administrativos:** Ferramentas de gestão distribuídas por secretarias (Espiritualidade, Marketing, Estatística e Tesouraria), além do painel geral de administração.

A arquitetura técnica é composta por React (frontend), Express.js (backend), PostgreSQL (banco de dados) e integrações com serviços externos como Google Gemini (IA), Mercado Pago (pagamentos), Cloudflare R2 (armazenamento de mídia), Instagram Graph API e Web Push Notifications.

---

## 2. Objetivo Geral

Centralizar a gestão, a comunicação e a formação espiritual da mocidade em uma única ferramenta digital, eliminando a fragmentação de processos manuais e proporcionando uma experiência moderna, gamificada e acessível a todos os membros e visitantes.

---

## 3. Funcionalidades Detalhadas

### 3.1. Site Institucional Público

**Objetivo:** Apresentar a mocidade ao público externo, divulgar atividades e servir como ponto de entrada para novos interessados.

**Recursos:**
- **Página Inicial:** Banner dinâmico com destaques (devocionais, eventos, versículo do dia e posts do Instagram), navegação intuitiva e acesso rápido às principais seções.
- **Quem Somos:** Apresentação da missão, visão e valores da mocidade.
- **Diretoria:** Exibição da estrutura de liderança atual com fotos e cargos.
- **Agenda:** Calendário público de eventos e atividades com detalhes de data, local e descrição.
- **Devocionais:** Publicações espirituais acessíveis ao público, com suporte a áudio (leitura em voz alta) e seção de comentários.
- **Versículo do Dia:** Página dedicada ao versículo diário com reflexão gerada por inteligência artificial, imagem de fundo e opção de compartilhamento em redes sociais.
- **Pedido de Oração:** Formulário para que visitantes e membros enviem pedidos de oração.
- **Política de Privacidade:** Página com termos de uso e tratamento de dados.
- **Aniversários:** Página personalizada de felicitação com animações e detalhes do aniversariante.

---

### 3.2. Sistema de Autenticação e Cadastro

**Objetivo:** Controlar o acesso à plataforma de forma segura, distinguindo visitantes, membros e administradores.

**Recursos:**
- **Login Local:** Autenticação por e-mail e senha com token JWT (validade de 96 horas).
- **Login com Google:** Acesso via OAuth para usuários não-membros, permitindo participação limitada (DeoGlory em temporadas públicas e Loja).
- **Verificação de Membro:** Sistema de código de verificação para validar novos cadastros.
- **Promoção de Usuários:** Administradores podem promover usuários Google a membros plenos, com atribuição de funções (sócio ativo, tesoureiro, secretarias).
- **Controle de Acesso por Papel:** Permissões granulares baseadas em cargo (admin, tesoureiro, secretarias de espiritualidade, marketing e estatística), com suporte a múltiplas secretarias por usuário.

---

### 3.3. DeoGlory — Plataforma de Estudo Gamificada

**Objetivo:** Incentivar o estudo bíblico consistente por meio de mecânicas de gamificação inspiradas em plataformas de aprendizado modernas, transformando a formação espiritual em uma experiência envolvente e progressiva.

**Recursos:**

#### 3.3.1. Estrutura de Estudo
- **Revistas (Temporadas):** Períodos de estudo de longa duração contendo múltiplas lições organizadas sequencialmente. Cada revista possui um tema central, capa, descrição e classificação de acesso (exclusiva para membros ou aberta ao público).
- **Eventos Especiais:** Campanhas temáticas de curta duração (ex.: Semana da Reforma, Semana Missionária) com lições específicas, recompensas exclusivas e contagem regressiva.
- **Lições:** Cada lição é dividida em três estágios:
  - **Estude:** Leitura e estudo do conteúdo (sem penalidade por erros).
  - **Medite:** Reflexão guiada com versículos e provocações espirituais.
  - **Responda:** Exercícios interativos (múltipla escolha, verdadeiro ou falso, preencha a lacuna, leitura de versículo e reflexão escrita).
- **Liberação Progressiva:** Lições podem ser liberadas manualmente pelo administrador ou automaticamente por agendamento, com notificação push enviada aos membros.
- **Geração por IA:** Lições e exercícios podem ser gerados automaticamente por inteligência artificial a partir de PDFs ou textos fornecidos pelo administrador.

#### 3.3.2. Mecânicas de Gamificação
- **XP (Pontos de Experiência):** Acumulados ao completar unidades, lições e missões. Bônus para acertos perfeitos e conclusão sem dicas.
- **Corações (Vidas):** O jogador inicia com 5 corações. Erros no estágio "Responda" consomem 1 coração. Recuperação passiva (1 coração a cada 6 horas) ou ativa (leitura de 3 versículos bíblicos).
- **Ofensiva (Streak):** Rastreamento de dias consecutivos de estudo. Manter a ofensiva gera bônus de XP e emblemas visuais.
- **Cristais:** Moeda virtual acumulada como recompensa por atividades, utilizável em funcionalidades futuras.
- **Conquistas:** Medalhas desbloqueáveis por marcos específicos (ex.: primeira lição, 7 dias seguidos, 100% de acertos).

#### 3.3.3. Ranking e Competição
- **Ranking Global:** Classificação geral de todos os usuários por XP acumulado.
- **Ranking UMP:** Classificação restrita a membros oficiais.
- **Ranking Anual:** Acumulado do ano corrente.
- **Ranking por Revista:** Classificação específica de cada temporada de estudo.

#### 3.3.4. Missões Diárias
- Conjunto de 4 a 5 tarefas geradas diariamente por IA (ex.: "Complete 2 lições", "Leia o versículo do dia", "Mantenha sua ofensiva").
- Inclui quiz diário, fato bíblico, personagem bíblico e versículo para memorização.
- Sistema anti-chute que prioriza qualidade nas respostas.

#### 3.3.5. Cards Colecionáveis
- Recompensas digitais obtidas ao completar eventos ou temporadas.
- Níveis de raridade: Comum, Raro, Épico e Lendário.
- Raridade determinada por desempenho (acertos, velocidade, ausência de dicas).
- Galeria de coleção no perfil do usuário.

#### 3.3.6. Desafio Final
- Prova abrangente disponível após conclusão de todas as lições de uma temporada.
- Resultados influenciam o ranking e distribuição de cards.

---

### 3.4. Loja Virtual (E-commerce)

**Objetivo:** Comercializar produtos relacionados à mocidade (camisetas, bonés, acessórios, materiais) de forma integrada ao sistema, com controle de estoque e pagamento digital.

**Recursos:**
- **Catálogo de Produtos:** Exibição em grade com filtros por categoria, busca, e carrossel de imagens por produto.
- **Página de Produto:** Detalhamento com galeria de fotos, seleção de variantes (tamanho, cor, gênero), preço e disponibilidade. Produtos esgotados mantêm a página acessível com aviso de indisponibilidade.
- **Banners Promocionais:** Carrossel de destaque na página inicial da loja.
- **Códigos Promocionais:** Suporte a cupons de desconto com validação automática.
- **Carrinho de Compras:** Gestão de itens com cálculo de total, aplicação de cupons e resumo do pedido.
- **Kits:** Produtos compostos por múltiplos itens com seleção de componentes individuais.
- **Pagamento via PIX:** Integração com Mercado Pago para geração de QR Code e confirmação automática.
- **Parcelamento via PIX:** Suporte a pagamento parcelado com geração de parcelas individuais.
- **Pedidos Manuais:** Cadastro de pedidos para clientes externos sem conta no sistema.
- **Acompanhamento de Pedidos:** Histórico completo com status, comprovantes e link compartilhável.
- **Abandono de Carrinho:** Notificações automáticas para carrinhos abandonados e cancelamento automático após 48 horas.

---

### 3.5. Tesouraria (Módulo Financeiro)

**Objetivo:** Gerenciar toda a vida financeira da mocidade, incluindo contribuições, taxas, empréstimos, receitas da loja e relatórios, com transparência e controle de acesso.

**Recursos:**
- **Dashboard Financeiro:** Visão consolidada de receitas, despesas, saldo e gráficos mensais por categoria.
- **Movimentações:** Registro de entradas e saídas com categorização, descrição e comprovantes.
- **Taxas de Membros:** Controle de contribuições obrigatórias (Percapta e UMP) com status de pagamento por membro e ano.
- **Regra do Dia 10:** Controle automático de prazo para pagamento de mensalidades UMP.
- **Antecipação Anual:** Possibilidade de pagamento antecipado de todas as parcelas do ano.
- **Empréstimos:** Registro e acompanhamento de empréstimos com parcelas e lembretes automáticos.
- **Taxas de Eventos:** Cobrança de inscrições em eventos com rastreamento de pagamento.
- **Relatórios:** Geração de relatórios financeiros por período, categoria e tipo.
- **Lembretes Automáticos:** Notificações push para membros com pagamentos pendentes (dia 5 e 5º dia útil de cada mês).
- **Resumo Mensal:** Envio automático de resumo financeiro no primeiro dia de cada mês.
- **Virada de Ano:** Processamento automático de encerramento fiscal no dia 1º de janeiro.

---

### 3.6. Sistema de Eventos e Agenda

**Objetivo:** Organizar, divulgar e gerenciar eventos da mocidade com controle de inscrições, cronograma e notificações.

**Recursos:**
- **Cadastro de Eventos:** Criação com título, descrição, data, local, preço, imagem de capa e limite de vagas.
- **Agenda Pública:** Listagem de eventos futuros e passados acessível a todos os visitantes.
- **Inscrição de Membros:** Registro de participação com possibilidade de cobrança via PIX.
- **Lembretes Automáticos:** Notificações push para eventos próximos (início e prazo de inscrição).
- **Eventos com Lições:** Eventos podem conter lições educativas liberadas dia a dia durante o período do evento.
- **Publicação Automática:** Eventos em rascunho são publicados automaticamente na data de início.

---

### 3.7. Versículo do Dia

**Objetivo:** Fornecer diariamente um versículo bíblico com reflexão teológica, promovendo a meditação diária na Palavra.

**Recursos:**
- **Seleção Automática:** Versículo selecionado diariamente de um banco curado de passagens bíblicas.
- **Reflexão por IA:** Texto reflexivo gerado automaticamente com rotação de 5 estilos:
  1. Pastoral (tom de aconselhamento)
  2. Teológica (referências a teólogos clássicos)
  3. Narrativa-Devocional (abordagem pessoal e narrativa)
  4. Exegética-Bíblica (análise do texto original e referências cruzadas)
  5. Prática-Aplicativa (exemplos do cotidiano e ações concretas)
- **Imagem de Fundo:** Imagem decorativa extraída de banco de imagens.
- **Compartilhamento:** Geração de imagem para compartilhamento em redes sociais.
- **Página Pública:** Visualização do versículo do dia com histórico de versículos anteriores.
- **Notificação Push:** Envio automático às 07:00 para todos os membros.
- **Banner na Página Inicial:** Exibição em destaque até 23:59 do mesmo dia.

---

### 3.8. Devocionais

**Objetivo:** Disponibilizar conteúdos devocionais elaborados pela liderança, com suporte a leitura, áudio e interação comunitária.

**Recursos:**
- **Publicação de Devocionais:** Criação com título, conteúdo em Markdown, imagem de capa e referências bíblicas.
- **Leitura em Áudio:** Suporte a áudio para acessibilidade e praticidade.
- **Comentários:** Seção de comentários para interação entre membros.
- **Notificação Push:** Envio automático ao publicar novo devocional.
- **Destaque na Home:** Devocional mais recente exibido na página inicial.

---

### 3.9. Integração com Instagram

**Objetivo:** Manter o site sincronizado com a presença da mocidade no Instagram e automatizar a publicação de conteúdo nos Stories.

**Recursos:**
- **Sincronização Automática:** Importação periódica (a cada 6 horas) dos posts do Instagram para exibição no site.
- **Feed na Página Inicial:** Carrossel de posts recentes do Instagram na home.
- **Publicação de Stories:** Administradores podem publicar automaticamente nos Stories do Instagram:
  - Versículo do dia (07:10)
  - Reflexão diária (07:15)
  - Felicitações de aniversário (08:05)
- **Geração de Imagens:** Criação automática de imagens otimizadas para Stories via processamento no servidor.
- **Renovação de Token:** Atualização automática diária do token de acesso da API do Instagram.
- **Proxy via Cloudflare:** Roteamento das chamadas à API do Instagram através do próprio domínio para contornar restrições de rede do ambiente de hospedagem.

---

### 3.10. Sistema de Notificações

**Objetivo:** Manter os membros informados sobre novidades, prazos e atividades relevantes de forma proativa.

**Recursos:**
- **Push Notifications (Web):** Notificações nativas do navegador para dispositivos desktop e mobile.
- **Notificações In-App:** Histórico de notificações acessível dentro da plataforma com contador de não-lidas.
- **Tipos de Notificação:**
  - Nova lição liberada
  - Novo devocional publicado
  - Evento próximo ou iniciado
  - Lembrete de pagamento
  - Aniversário de membro
  - Conquista desbloqueada
  - Ofensiva em risco
  - Carrinho abandonado
  - Novo produto na loja
- **Gerenciamento de Assinaturas:** Controle automático de inscrições push por dispositivo.

---

### 3.11. Sistema de Formulários

**Objetivo:** Permitir que administradores criem pesquisas, enquetes e formulários personalizados para coleta de informações dos membros.

**Recursos:**
- **Criação de Formulários:** Editor com campos personalizáveis (texto, múltipla escolha, seleção, etc.).
- **Distribuição:** Formulários enviados aos membros com notificação.
- **Coleta de Respostas:** Painel de visualização de respostas individuais e consolidadas.
- **Análise por IA:** Resumo e insights das respostas gerados por inteligência artificial.
- **Link Público:** Formulários podem ter link acessível sem autenticação.

---

### 3.12. Emaús Vota — Sistema Eleitoral

**Objetivo:** Digitalizar o processo de eleição da diretoria da mocidade com transparência, segurança e agilidade.

**Recursos:**
- **Cadastro de Eleições:** Criação de processos eleitorais com cargos, candidatos e período de votação.
- **Votação Digital:** Interface de votação restrita a membros ativos com controle de voto único.
- **Apuração em Tempo Real:** Contagem de votos via WebSocket com atualização instantânea.
- **Controle de Presença:** Registro de presença dos membros na assembleia.
- **Relatório de Resultados:** Geração de documento PDF com resultados oficiais auditáveis.
- **Página Pública de Resultados:** Exibição dos resultados após encerramento.

---

### 3.13. Painéis Administrativos

**Objetivo:** Fornecer ferramentas de gestão específicas para cada secretaria da mocidade, com acesso controlado por função.

#### 3.13.1. Painel Geral (Administrador)
- Gestão completa de membros (cadastro, edição, exclusão, promoção de usuários Google).
- Visualização de todos os usuários com filtros por tipo (membros locais e usuários Google).
- Atribuição de múltiplas secretarias por membro via checkboxes.
- Gestão do sistema Emaús Vota.
- Configurações gerais do site.

#### 3.13.2. Painel de Espiritualidade
- Gestão de devocionais (criar, editar, publicar, excluir).
- Gestão de pedidos de oração.
- Administração do DeoGlory (revistas, lições, exercícios, eventos especiais).
- Liberação e bloqueio de lições com notificação automática.
- Geração de conteúdo por IA.
- Relatórios de engajamento e progresso dos estudos.

#### 3.13.3. Painel de Marketing
- Gestão de eventos (criar, editar, publicar).
- Gestão da diretoria (membros e cargos exibidos no site).
- Gestão da loja (produtos, categorias, banners, pedidos, cupons).
- Gestão do Instagram (visualização de posts sincronizados, publicação manual de stories).

#### 3.13.4. Painel de Estatística
- Criação e gestão de formulários.
- Visualização e análise de respostas.
- Exportação de dados.

#### 3.13.5. Painel de Tesouraria
- Dashboard financeiro completo.
- Registro e gestão de movimentações.
- Controle de taxas por membro.
- Gestão de empréstimos.
- Relatórios financeiros.
- Envio de lembretes de pagamento.

---

### 3.14. Versículos de Recuperação

**Objetivo:** Oferecer diariamente versículos bíblicos de conforto e encorajamento como recurso espiritual permanente.

**Recursos:**
- **Geração Diária:** 30 versículos temáticos buscados automaticamente da API ABíbliaDigital.
- **Deduplificação:** Sistema inteligente que evita repetição de versículos já cadastrados.
- **Acesso Público:** Disponíveis para consulta na área de estudos.

---

## 4. Considerações Técnicas

| Aspecto | Tecnologia |
|---|---|
| Frontend | React, TailwindCSS, Shadcn/UI |
| Backend | Express.js, Node.js |
| Banco de Dados | PostgreSQL (Drizzle ORM) |
| Autenticação | JWT + Google OAuth |
| Pagamentos | Mercado Pago (PIX) |
| IA | Google Gemini |
| Armazenamento | Cloudflare R2 |
| Notificações | Web Push (VAPID) |
| Redes Sociais | Instagram Graph API |
| Geração de Imagem | Puppeteer, Sharp, node-canvas |
| Tempo Real | WebSocket |
| Hospedagem | Hugging Face Spaces |

---

## 5. Conclusão

O Sistema UMP Emaús representa uma solução abrangente e integrada que atende às necessidades operacionais, educacionais, financeiras e comunicacionais de uma mocidade. Ao combinar gestão administrativa com uma plataforma de estudo gamificada, loja virtual, tesouraria digital e integração com redes sociais, o sistema proporciona uma experiência moderna e completa para membros, líderes e visitantes, promovendo engajamento, transparência e crescimento espiritual contínuo.
