-- =====================================================
-- SQL PARA LIMPEZA TOTAL DO BANCO DE DADOS
-- UMP Emaús - Neon PostgreSQL
-- Gerado em: Fevereiro 2026
-- =====================================================
-- 
-- ATENÇÃO: Este script REMOVE TODOS OS DADOS de todas
-- as tabelas. Use com extremo cuidado!
-- A estrutura das tabelas é mantida.
-- =====================================================

-- Desabilitar verificação de FK temporariamente
SET session_replication_role = 'replica';

-- ==================== FORMULÁRIOS ====================
TRUNCATE TABLE form_analyses CASCADE;
TRUNCATE TABLE form_answers CASCADE;
TRUNCATE TABLE form_responses CASCADE;
TRUNCATE TABLE form_options CASCADE;
TRUNCATE TABLE form_questions CASCADE;
TRUNCATE TABLE forms CASCADE;

-- ==================== SCHEDULER / NOTIFICAÇÕES ====================
TRUNCATE TABLE sent_scheduler_reminders CASCADE;
TRUNCATE TABLE sent_event_notifications CASCADE;
TRUNCATE TABLE treasury_notifications_log CASCADE;
TRUNCATE TABLE notifications CASCADE;

-- ==================== EVENTOS COM TAXA ====================
TRUNCATE TABLE event_confirmations CASCADE;
TRUNCATE TABLE event_fees CASCADE;

-- ==================== LOJA - PEDIDOS ====================
TRUNCATE TABLE shop_installments CASCADE;
TRUNCATE TABLE shop_order_items CASCADE;
TRUNCATE TABLE shop_orders CASCADE;
TRUNCATE TABLE shop_cart_items CASCADE;

-- ==================== LOJA - COMBOS ====================
TRUNCATE TABLE shop_combo_discount_items CASCADE;
TRUNCATE TABLE shop_combo_discounts CASCADE;
TRUNCATE TABLE promo_codes CASCADE;

-- ==================== LOJA - PRODUTOS ====================
TRUNCATE TABLE shop_item_color_images CASCADE;
TRUNCATE TABLE shop_item_colors CASCADE;
TRUNCATE TABLE shop_item_size_charts CASCADE;
TRUNCATE TABLE shop_item_sizes CASCADE;
TRUNCATE TABLE shop_item_images CASCADE;
TRUNCATE TABLE shop_items CASCADE;
TRUNCATE TABLE shop_categories CASCADE;

-- ==================== TESOURARIA ====================
TRUNCATE TABLE member_percapta_payments CASCADE;
TRUNCATE TABLE member_ump_payments CASCADE;
TRUNCATE TABLE treasury_entries CASCADE;
TRUNCATE TABLE treasury_receipts CASCADE;
TRUNCATE TABLE treasury_loan_installments CASCADE;
TRUNCATE TABLE treasury_loans CASCADE;
TRUNCATE TABLE treasury_expense_categories CASCADE;
TRUNCATE TABLE treasury_settings CASCADE;

-- ==================== CARDS / EVENTOS ESPECIAIS ====================
TRUNCATE TABLE user_cards CASCADE;
TRUNCATE TABLE study_event_participants CASCADE;
TRUNCATE TABLE user_event_progress CASCADE;
TRUNCATE TABLE study_event_lessons CASCADE;
TRUNCATE TABLE study_events CASCADE;
TRUNCATE TABLE collectible_cards CASCADE;

-- ==================== INTERAÇÃO ENTRE MEMBROS ====================
TRUNCATE TABLE member_encouragements CASCADE;
TRUNCATE TABLE achievement_likes CASCADE;
TRUNCATE TABLE user_online_status CASCADE;

-- ==================== PRÁTICA SEMANAL ====================
TRUNCATE TABLE practice_questions CASCADE;
TRUNCATE TABLE weekly_practice CASCADE;

-- ==================== AUDIT ====================
TRUNCATE TABLE audit_logs CASCADE;

-- ==================== PUSH / NOTIFICAÇÕES ====================
TRUNCATE TABLE anonymous_push_subscriptions CASCADE;
TRUNCATE TABLE push_subscriptions CASCADE;

-- ==================== MISSÕES DIÁRIAS ====================
TRUNCATE TABLE daily_mission_content CASCADE;
TRUNCATE TABLE user_daily_missions CASCADE;
TRUNCATE TABLE daily_missions CASCADE;

-- ==================== RANKING / LEADERBOARD ====================
TRUNCATE TABLE leaderboard_entries CASCADE;

-- ==================== CONQUISTAS ====================
TRUNCATE TABLE user_achievements CASCADE;
TRUNCATE TABLE achievements CASCADE;

-- ==================== ATIVIDADES / XP ====================
TRUNCATE TABLE daily_activity CASCADE;
TRUNCATE TABLE xp_transactions CASCADE;
TRUNCATE TABLE daily_mission_xp CASCADE;
TRUNCATE TABLE achievement_xp CASCADE;
TRUNCATE TABLE weekly_practice_bonus CASCADE;

-- ==================== LEITURAS ====================
TRUNCATE TABLE verse_readings CASCADE;
TRUNCATE TABLE devotional_readings CASCADE;

-- ==================== PROGRESSO DE ESTUDO ====================
TRUNCATE TABLE user_unit_progress CASCADE;
TRUNCATE TABLE user_lesson_progress CASCADE;

-- ==================== CONTEÚDO DE ESTUDO ====================
TRUNCATE TABLE bible_verses CASCADE;
TRUNCATE TABLE study_units CASCADE;
TRUNCATE TABLE study_lessons CASCADE;
TRUNCATE TABLE study_weeks CASCADE;

-- ==================== METAS SEMANAIS ====================
TRUNCATE TABLE weekly_goal_progress CASCADE;

-- ==================== TEMPORADAS ====================
TRUNCATE TABLE season_rankings CASCADE;
TRUNCATE TABLE user_season_progress CASCADE;
TRUNCATE TABLE user_final_challenge_progress CASCADE;
TRUNCATE TABLE season_final_challenges CASCADE;

-- ==================== MARCOS DE OFENSIVA ====================
TRUNCATE TABLE user_streak_milestones CASCADE;
TRUNCATE TABLE streak_milestones CASCADE;
TRUNCATE TABLE streak_freeze_history CASCADE;
TRUNCATE TABLE crystal_transactions CASCADE;

-- ==================== PERFIS DE ESTUDO ====================
TRUNCATE TABLE study_profiles CASCADE;

-- ==================== VERSÍCULOS DO DIA ====================
TRUNCATE TABLE birthday_share_images CASCADE;
TRUNCATE TABLE daily_verse_shares CASCADE;
TRUNCATE TABLE daily_verse_posts CASCADE;
TRUNCATE TABLE daily_verse_stock CASCADE;

-- ==================== SITE ====================
TRUNCATE TABLE site_content CASCADE;
TRUNCATE TABLE board_members CASCADE;
TRUNCATE TABLE banners CASCADE;
TRUNCATE TABLE devotional_comments CASCADE;
TRUNCATE TABLE prayer_reactions CASCADE;
TRUNCATE TABLE prayer_requests CASCADE;
TRUNCATE TABLE banner_highlights CASCADE;
TRUNCATE TABLE instagram_posts CASCADE;
TRUNCATE TABLE site_events CASCADE;
TRUNCATE TABLE devotionals CASCADE;

-- ==================== ELEIÇÕES ====================
TRUNCATE TABLE pdf_verifications CASCADE;
TRUNCATE TABLE verification_codes CASCADE;
TRUNCATE TABLE votes CASCADE;
TRUNCATE TABLE election_attendance CASCADE;
TRUNCATE TABLE election_positions CASCADE;
TRUNCATE TABLE election_winners CASCADE;
TRUNCATE TABLE candidates CASCADE;
TRUNCATE TABLE elections CASCADE;
TRUNCATE TABLE positions CASCADE;

-- ==================== TEMPORADAS (depende de collectible_cards) ====================
TRUNCATE TABLE seasons CASCADE;

-- ==================== USUÁRIOS ====================
TRUNCATE TABLE users CASCADE;

-- Reabilitar verificação de FK
SET session_replication_role = 'origin';

-- =====================================================
-- LIMPEZA TOTAL CONCLUÍDA
-- Todas as tabelas foram esvaziadas.
-- =====================================================
