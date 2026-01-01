-- ================================================================
-- RESET COMPLETO DO DEOGLORY (Sistema de Estudo)
-- ================================================================
-- Este script apaga TODOS os dados de progresso dos jogadores,
-- permitindo que comecem do zero. NÃO apaga o conteúdo das lições,
-- temporadas, eventos ou conquistas - apenas o progresso dos usuários.
--
-- ATENÇÃO: Esta ação é IRREVERSÍVEL!
-- Execute apenas após confirmar com a administração.
--
-- Como usar:
-- 1. Acesse o console SQL do Neon (https://console.neon.tech)
-- 2. Selecione o banco de dados de produção
-- 3. Cole e execute este script completo
-- ================================================================

-- 1. PROGRESSO DE LIÇÕES E UNIDADES
-- Apaga o progresso de cada lição e unidade concluída
DELETE FROM user_lesson_progress;
DELETE FROM user_unit_progress;

-- 2. PROGRESSO DE TEMPORADAS (REVISTAS)
-- Apaga o progresso de cada temporada/revista
DELETE FROM user_season_progress;

-- 3. PROGRESSO DE DESAFIOS FINAIS
-- Apaga o progresso dos desafios finais das temporadas
DELETE FROM user_final_challenge_progress;

-- 4. PROGRESSO DE EVENTOS ESPECIAIS
-- Apaga o progresso dos eventos especiais
DELETE FROM user_event_progress;

-- 5. CARTAS COLECIONÁVEIS DOS USUÁRIOS
-- Apaga as cartas ganhas pelos usuários em eventos
DELETE FROM user_cards;

-- 6. TRANSAÇÕES DE XP
-- Apaga TODO o histórico de XP ganho (CRÍTICO para zerar XP)
DELETE FROM xp_transactions;

-- 7. CONQUISTAS DOS USUÁRIOS
-- Apaga as conquistas desbloqueadas (inclui xp_earned de cada conquista)
DELETE FROM user_achievements;

-- 8. CURTIDAS EM CONQUISTAS
-- Apaga as curtidas dadas em conquistas
DELETE FROM achievement_likes;

-- 9. XP BÔNUS DE CONQUISTAS
-- Apaga registros de XP bônus de conquistas
DELETE FROM achievement_xp;

-- 10. MISSÕES DIÁRIAS
-- Apaga as missões diárias atribuídas/completadas
DELETE FROM user_daily_missions;

-- 11. TRANSAÇÕES DE CRISTAIS
-- Apaga histórico de cristais ganhos
DELETE FROM crystal_transactions;

-- 12. HISTÓRICO DE STREAK FREEZE
-- Apaga o histórico de uso de streak freeze
DELETE FROM streak_freeze_history;

-- 13. MARCOS DE STREAK ATINGIDOS
-- Apaga os marcos de streak desbloqueados
DELETE FROM user_streak_milestones;

-- 14. RESET COMPLETO DOS PERFIS DE ESTUDO
-- Reseta TODOS os contadores nos perfis para valores iniciais
-- Isso inclui XP, cristais, streaks, níveis, corações, etc.
UPDATE study_profiles SET
  total_xp = 0,
  current_level = 1,
  current_streak = 0,
  longest_streak = 0,
  hearts = 5,
  hearts_max = 5,
  hearts_refill_at = NULL,
  last_activity_date = NULL,
  verses_read_for_recovery = 0,
  crystals = 0,
  streak_freezes_available = 0,
  last_lesson_completed_at = NULL,
  streak_warning_day = 0,
  total_streak_freeze_used = 0,
  consecutive_perfect_lessons = 0,
  consecutive_lessons = 0,
  total_lessons_completed_today = 0,
  last_lesson_date = NULL,
  weekly_lessons_streak = 0,
  daily_verse_read_date = NULL,
  updated_at = NOW();

-- ================================================================
-- RESULTADO ESPERADO:
-- - Todos os usuários terão 0 XP total
-- - Todos os usuários voltam ao nível 1
-- - 0 cristais, 0 streak, 5 corações
-- - Nenhuma lição/unidade estará marcada como concluída
-- - Nenhuma conquista estará desbloqueada
-- - Nenhuma carta colecionável estará atribuída
-- - O conteúdo (lições, eventos, temporadas) permanece intacto
-- ================================================================

-- ================================================================
-- TABELAS AFETADAS (resumo):
-- ================================================================
-- | Tabela                       | Ação   | Descrição                    |
-- |------------------------------|--------|------------------------------|
-- | user_lesson_progress         | DELETE | Progresso das lições         |
-- | user_unit_progress           | DELETE | Progresso das unidades       |
-- | user_season_progress         | DELETE | Progresso das temporadas     |
-- | user_final_challenge_progress| DELETE | Desafios finais              |
-- | user_event_progress          | DELETE | Progresso em eventos         |
-- | user_cards                   | DELETE | Cartas colecionáveis ganhas  |
-- | xp_transactions              | DELETE | Histórico de XP (CRÍTICO)    |
-- | user_achievements            | DELETE | Conquistas desbloqueadas     |
-- | achievement_likes            | DELETE | Curtidas em conquistas       |
-- | achievement_xp               | DELETE | XP bônus de conquistas       |
-- | user_daily_missions          | DELETE | Missões diárias              |
-- | crystal_transactions         | DELETE | Histórico de cristais        |
-- | streak_freeze_history        | DELETE | Uso de streak freeze         |
-- | user_streak_milestones       | DELETE | Marcos de streak             |
-- | study_profiles               | UPDATE | Reset COMPLETO dos campos    |
-- ================================================================

-- ================================================================
-- CAMPOS RESETADOS EM study_profiles:
-- ================================================================
-- | Campo                        | Valor Resetado | Descrição              |
-- |------------------------------|----------------|------------------------|
-- | total_xp                     | 0              | XP total acumulado     |
-- | current_level                | 1              | Nível do jogador       |
-- | current_streak               | 0              | Streak atual           |
-- | longest_streak               | 0              | Maior streak           |
-- | hearts                       | 5              | Corações disponíveis   |
-- | hearts_max                   | 5              | Máximo de corações     |
-- | hearts_refill_at             | NULL           | Timer de recarga       |
-- | last_activity_date           | NULL           | Última atividade       |
-- | verses_read_for_recovery     | 0              | Versículos lidos       |
-- | crystals                     | 0              | Cristais               |
-- | streak_freezes_available     | 0              | Freezes disponíveis    |
-- | last_lesson_completed_at     | NULL           | Última lição           |
-- | streak_warning_day           | 0              | Aviso de streak        |
-- | total_streak_freeze_used     | 0              | Total freezes usados   |
-- | consecutive_perfect_lessons  | 0              | Lições perfeitas seq.  |
-- | consecutive_lessons          | 0              | Lições consecutivas    |
-- | total_lessons_completed_today| 0              | Lições hoje            |
-- | last_lesson_date             | NULL           | Data última lição      |
-- | weekly_lessons_streak        | 0              | Streak semanal         |
-- | daily_verse_read_date        | NULL           | Data versículo diário  |
-- ================================================================

-- ================================================================
-- TABELAS NÃO AFETADAS (conteúdo preservado):
-- ================================================================
-- | Tabela                | Descrição                              |
-- |-----------------------|----------------------------------------|
-- | users                 | Contas dos usuários                    |
-- | study_seasons         | Temporadas/revistas disponíveis        |
-- | study_weeks           | Semanas de estudo                      |
-- | study_lessons         | Lições criadas                         |
-- | study_units           | Unidades das lições                    |
-- | achievements          | Definições de conquistas               |
-- | streak_milestones     | Definições de marcos de streak         |
-- | study_events          | Eventos especiais                      |
-- | study_event_lessons   | Lições dos eventos                     |
-- | collectible_cards     | Cartas disponíveis nos eventos         |
-- ================================================================
