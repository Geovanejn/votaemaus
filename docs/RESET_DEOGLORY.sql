-- ================================================================
-- RESET TOTAL DO DEOGLORY - SQL COMPLETO PARA NEON
-- ================================================================
-- MANTÉM: users, seasons, season_final_challenges, study_weeks, 
--         study_lessons, study_units, study_events, 
--         study_event_lessons, collectible_cards, achievements,
--         streak_milestones, daily_mission_content, bible_verses
-- APAGA: Todo o resto (progresso, XP, conquistas, etc.)
--
-- Como usar:
-- 1. Acesse o console SQL do Neon (https://console.neon.tech)
-- 2. Selecione o banco de dados de produção
-- 3. Cole e execute este script completo
--
-- ATENÇÃO: IRREVERSÍVEL! Faça backup antes de executar.
-- ================================================================

-- 1. NOTIFICAÇÕES
DELETE FROM notifications;

-- 2. ENCORAJAMENTOS E LIKES
DELETE FROM member_encouragements;
DELETE FROM achievement_likes;

-- 3. PRÁTICA SEMANAL
DELETE FROM practice_questions;
DELETE FROM weekly_practice;
DELETE FROM weekly_practice_bonus;
DELETE FROM weekly_goal_progress;

-- 4. LEITURAS
DELETE FROM verse_readings;
DELETE FROM devotional_readings;

-- 5. ATIVIDADES E RANKINGS
DELETE FROM daily_activity;
DELETE FROM leaderboard_entries;
DELETE FROM season_rankings;

-- 6. MISSÕES DIÁRIAS
DELETE FROM user_daily_missions;
DELETE FROM daily_missions;

-- 7. XP E CRISTAIS
DELETE FROM achievement_xp;
DELETE FROM daily_mission_xp;
DELETE FROM xp_transactions;
DELETE FROM crystal_transactions;

-- 8. CONQUISTAS DOS USUÁRIOS
DELETE FROM user_achievements;

-- 9. STREAK
DELETE FROM streak_freeze_history;
DELETE FROM user_streak_milestones;

-- 10. PROGRESSO DE UNIDADES E LIÇÕES
DELETE FROM user_unit_progress;
DELETE FROM user_lesson_progress;

-- 11. PROGRESSO DE TEMPORADAS
DELETE FROM user_final_challenge_progress;
DELETE FROM user_season_progress;

-- 12. CARTAS E EVENTOS (PROGRESSO)
DELETE FROM user_cards;
DELETE FROM user_event_progress;

-- 13. STATUS ONLINE
DELETE FROM user_online_status;

-- 14. PERFIS DE ESTUDO
DELETE FROM study_profiles;

-- 15. RECRIAR PERFIS ZERADOS PARA TODOS OS USUÁRIOS
INSERT INTO study_profiles (
  user_id, total_xp, current_level, current_streak, longest_streak,
  hearts, hearts_max, crystals, streak_freezes_available,
  daily_goal_minutes, timezone, weekly_lessons_goal, weekly_verses_goal,
  weekly_missions_goal, weekly_devotionals_goal, verses_read_for_recovery,
  streak_warning_day, total_streak_freeze_used, consecutive_perfect_lessons,
  consecutive_lessons, total_lessons_completed_today, weekly_lessons_streak,
  created_at, updated_at
)
SELECT 
  id,
  0, 1, 0, 0,
  5, 5, 0, 0,
  10, 'America/Sao_Paulo', 1, 7,
  3, 1, 0,
  0, 0, 0,
  0, 0, 0,
  NOW(), NOW()
FROM users;

-- ================================================================
-- VERIFICAÇÃO (execute separadamente após o reset)
-- ================================================================
-- SELECT 'xp_transactions' as tabela, COUNT(*) FROM xp_transactions
-- UNION ALL SELECT 'user_lesson_progress', COUNT(*) FROM user_lesson_progress
-- UNION ALL SELECT 'user_achievements', COUNT(*) FROM user_achievements
-- UNION ALL SELECT 'study_profiles', COUNT(*) FROM study_profiles
-- UNION ALL SELECT 'crystal_transactions', COUNT(*) FROM crystal_transactions
-- UNION ALL SELECT 'user_unit_progress', COUNT(*) FROM user_unit_progress
-- UNION ALL SELECT 'user_cards', COUNT(*) FROM user_cards
-- UNION ALL SELECT 'notifications', COUNT(*) FROM notifications;

-- ================================================================
-- TABELAS PRESERVADAS:
-- ================================================================
-- | Tabela                  | Descrição                          |
-- |-------------------------|-------------------------------------|
-- | users                   | Cadastro dos usuários               |
-- | seasons                 | Temporadas/revistas                 |
-- | season_final_challenges | Desafios finais (definições)        |
-- | study_weeks             | Semanas de estudo                   |
-- | study_lessons           | Lições                              |
-- | study_units             | Unidades das lições                 |
-- | study_events            | Eventos especiais                   |
-- | study_event_lessons     | Lições dos eventos                  |
-- | collectible_cards       | Cartas disponíveis                  |
-- | achievements            | Definições de conquistas            |
-- | streak_milestones       | Definições de marcos                |
-- | daily_mission_content   | Conteúdo das missões                |
-- | bible_verses            | Versículos bíblicos                 |
-- | push_subscriptions      | Assinaturas push                    |
-- ================================================================

-- ================================================================
-- TABELAS DELETADAS (progresso zerado):
-- ================================================================
-- | Tabela                       | Descrição                      |
-- |------------------------------|--------------------------------|
-- | notifications                | Todas as notificações          |
-- | member_encouragements        | Encorajamentos entre membros   |
-- | achievement_likes            | Curtidas em conquistas         |
-- | practice_questions           | Questões de prática            |
-- | weekly_practice              | Prática semanal                |
-- | weekly_practice_bonus        | Bônus de prática               |
-- | weekly_goal_progress         | Progresso de metas semanais    |
-- | verse_readings               | Leituras de versículos         |
-- | devotional_readings          | Leituras de devocionais        |
-- | daily_activity               | Atividades diárias             |
-- | leaderboard_entries          | Entradas do ranking            |
-- | season_rankings              | Rankings de temporada          |
-- | user_daily_missions          | Missões diárias do usuário     |
-- | daily_missions               | Missões diárias                |
-- | achievement_xp               | XP de conquistas               |
-- | daily_mission_xp             | XP de missões                  |
-- | xp_transactions              | Transações de XP               |
-- | crystal_transactions         | Transações de cristais         |
-- | user_achievements            | Conquistas desbloqueadas       |
-- | streak_freeze_history        | Histórico de streak freeze     |
-- | user_streak_milestones       | Marcos de streak atingidos     |
-- | user_unit_progress           | Progresso de unidades          |
-- | user_lesson_progress         | Progresso de lições            |
-- | user_final_challenge_progress| Progresso de desafios finais   |
-- | user_season_progress         | Progresso de temporadas        |
-- | user_cards                   | Cartas ganhas                  |
-- | user_event_progress          | Progresso em eventos           |
-- | user_online_status           | Status online                  |
-- | study_profiles               | Perfis (recriados zerados)     |
-- ================================================================
