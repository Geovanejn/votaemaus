-- =====================================================
-- SQL PARA LIMPAR DADOS - UMP EMAÚS
-- MANTÉM: users, seasons, study_lessons, study_units, study_events
-- APAGA: todos os outros dados
-- =====================================================

-- Desabilitar temporariamente verificação de FK
SET session_replication_role = 'replica';

-- ==================== SCHEDULER / NOTIFICAÇÕES ====================
TRUNCATE TABLE sent_scheduler_reminders CASCADE;
TRUNCATE TABLE sent_event_notifications CASCADE;

-- ==================== LOJA VIRTUAL ====================
TRUNCATE TABLE shop_order_items CASCADE;
TRUNCATE TABLE shop_orders CASCADE;
TRUNCATE TABLE shop_cart_items CASCADE;
TRUNCATE TABLE shop_item_size_charts CASCADE;
TRUNCATE TABLE shop_item_sizes CASCADE;
TRUNCATE TABLE shop_item_images CASCADE;
TRUNCATE TABLE shop_items CASCADE;
TRUNCATE TABLE shop_categories CASCADE;
TRUNCATE TABLE promo_codes CASCADE;

-- ==================== TESOURARIA ====================
TRUNCATE TABLE event_confirmations CASCADE;
TRUNCATE TABLE event_fees CASCADE;
TRUNCATE TABLE treasury_notifications_log CASCADE;
TRUNCATE TABLE member_percapta_payments CASCADE;
TRUNCATE TABLE member_ump_payments CASCADE;
TRUNCATE TABLE treasury_entries CASCADE;
TRUNCATE TABLE treasury_loan_installments CASCADE;
TRUNCATE TABLE treasury_loans CASCADE;
TRUNCATE TABLE treasury_expense_categories CASCADE;
TRUNCATE TABLE treasury_settings CASCADE;

-- ==================== EVENTOS ESPECIAIS - LIMPAR PROGRESSO (manter study_events) ====================
TRUNCATE TABLE user_cards CASCADE;
TRUNCATE TABLE user_event_progress CASCADE;
TRUNCATE TABLE study_event_lessons CASCADE;
TRUNCATE TABLE collectible_cards CASCADE;
-- NÃO truncar study_events

-- ==================== INTERAÇÃO ENTRE MEMBROS ====================
TRUNCATE TABLE member_encouragements CASCADE;
TRUNCATE TABLE achievement_likes CASCADE;
TRUNCATE TABLE user_online_status CASCADE;

-- ==================== PRÁTICA SEMANAL ====================
TRUNCATE TABLE practice_questions CASCADE;
TRUNCATE TABLE weekly_practice CASCADE;

-- ==================== AUDIT LOGS ====================
TRUNCATE TABLE audit_logs CASCADE;

-- ==================== PUSH NOTIFICATIONS ====================
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE anonymous_push_subscriptions CASCADE;
TRUNCATE TABLE push_subscriptions CASCADE;

-- ==================== MISSÕES DIÁRIAS ====================
TRUNCATE TABLE daily_mission_content CASCADE;
TRUNCATE TABLE user_daily_missions CASCADE;
TRUNCATE TABLE daily_missions CASCADE;

-- ==================== CONQUISTAS E LEADERBOARD ====================
TRUNCATE TABLE leaderboard_entries CASCADE;
TRUNCATE TABLE user_achievements CASCADE;
TRUNCATE TABLE achievements CASCADE;

-- ==================== ATIVIDADE E XP ====================
TRUNCATE TABLE daily_activity CASCADE;
TRUNCATE TABLE xp_transactions CASCADE;

-- ==================== VERSÍCULOS ====================
TRUNCATE TABLE verse_readings CASCADE;
TRUNCATE TABLE bible_verses CASCADE;

-- ==================== PROGRESSO DE LIÇÕES (resetar progresso) ====================
TRUNCATE TABLE user_unit_progress CASCADE;
TRUNCATE TABLE user_lesson_progress CASCADE;
-- NÃO truncar study_units
-- NÃO truncar study_lessons

-- ==================== SEMANAS DE ESTUDO (legado) ====================
TRUNCATE TABLE study_weeks CASCADE;

-- ==================== LEITURA DE DEVOCIONAIS ====================
TRUNCATE TABLE devotional_readings CASCADE;

-- ==================== XP IMUTÁVEL ====================
TRUNCATE TABLE daily_mission_xp CASCADE;
TRUNCATE TABLE achievement_xp CASCADE;
TRUNCATE TABLE weekly_practice_bonus CASCADE;

-- ==================== METAS SEMANAIS ====================
TRUNCATE TABLE weekly_goal_progress CASCADE;

-- ==================== RANKINGS E PROGRESSO DE TEMPORADA ====================
TRUNCATE TABLE season_rankings CASCADE;
TRUNCATE TABLE user_season_progress CASCADE;
TRUNCATE TABLE user_final_challenge_progress CASCADE;
TRUNCATE TABLE season_final_challenges CASCADE;
-- NÃO truncar seasons

-- ==================== MILESTONES DE OFENSIVA ====================
TRUNCATE TABLE user_streak_milestones CASCADE;
TRUNCATE TABLE streak_milestones CASCADE;

-- ==================== FREEZE E CRISTAIS ====================
TRUNCATE TABLE streak_freeze_history CASCADE;
TRUNCATE TABLE crystal_transactions CASCADE;

-- ==================== PERFIS DE ESTUDO (resetar XP/streaks) ====================
TRUNCATE TABLE study_profiles CASCADE;

-- ==================== DEVOCIONAIS ====================
TRUNCATE TABLE devotional_comments CASCADE;
TRUNCATE TABLE devotionals CASCADE;

-- ==================== PEDIDOS DE ORAÇÃO ====================
TRUNCATE TABLE prayer_reactions CASCADE;
TRUNCATE TABLE prayer_requests CASCADE;

-- ==================== BANNERS E HIGHLIGHTS ====================
TRUNCATE TABLE banners CASCADE;
TRUNCATE TABLE banner_highlights CASCADE;

-- ==================== DIRETORIA ====================
TRUNCATE TABLE board_members CASCADE;

-- ==================== CONTEÚDO DO SITE ====================
TRUNCATE TABLE site_content CASCADE;

-- ==================== INSTAGRAM ====================
TRUNCATE TABLE instagram_posts CASCADE;

-- ==================== EVENTOS DO SITE (site_events) ====================
TRUNCATE TABLE site_events CASCADE;

-- ==================== ELEIÇÕES ====================
TRUNCATE TABLE pdf_verifications CASCADE;
TRUNCATE TABLE votes CASCADE;
TRUNCATE TABLE candidates CASCADE;
TRUNCATE TABLE election_attendance CASCADE;
TRUNCATE TABLE election_positions CASCADE;
TRUNCATE TABLE election_winners CASCADE;
TRUNCATE TABLE elections CASCADE;
TRUNCATE TABLE positions CASCADE;

-- ==================== CÓDIGOS DE VERIFICAÇÃO ====================
TRUNCATE TABLE verification_codes CASCADE;

-- Reabilitar verificação de FK
SET session_replication_role = 'origin';

-- =====================================================
-- VERIFICAÇÃO: Contagem de registros MANTIDOS
-- =====================================================
SELECT 'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'seasons', COUNT(*) FROM seasons
UNION ALL
SELECT 'study_lessons', COUNT(*) FROM study_lessons
UNION ALL
SELECT 'study_units', COUNT(*) FROM study_units
UNION ALL
SELECT 'study_events', COUNT(*) FROM study_events;

-- =====================================================
-- RESUMO:
-- MANTIDOS COM DADOS:
--   - users (todos os usuários)
--   - seasons (temporadas DeoGlory)
--   - study_lessons (lições das temporadas)
--   - study_units (unidades/perguntas das lições)
--   - study_events (eventos especiais DeoGlory)
--
-- APAGADOS:
--   - Todo o progresso dos usuários (XP, streaks, conquistas)
--   - Toda a tesouraria (pagamentos, taxas, empréstimos)
--   - Toda a loja (produtos, pedidos, carrinho)
--   - Todos os devocionais e comentários
--   - Todos os eventos do site (site_events)
--   - Todas as notificações
--   - Todas as eleições
--   - Todo o resto
-- =====================================================
