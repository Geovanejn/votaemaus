-- =====================================================
-- SQL PARA LIMPEZA TOTAL DO BANCO DE DADOS
-- UMP Emaús - Compatível com Neon PostgreSQL
-- Gerado em: Fevereiro 2026
-- =====================================================
-- 
-- ATENÇÃO: Este script REMOVE TODOS OS DADOS de todas
-- as tabelas. Use com extremo cuidado!
-- A estrutura das tabelas é mantida.
-- Ordem de DELETE respeita foreign keys (filhos primeiro).
-- =====================================================

-- ==================== FORMULÁRIOS ====================
DELETE FROM form_analyses;
DELETE FROM form_answers;
DELETE FROM form_responses;
DELETE FROM form_options;
DELETE FROM form_questions;
DELETE FROM forms;

-- ==================== SCHEDULER / NOTIFICAÇÕES ====================
DELETE FROM sent_scheduler_reminders;
DELETE FROM sent_event_notifications;
DELETE FROM treasury_notifications_log;
DELETE FROM notifications;

-- ==================== EVENTOS COM TAXA ====================
DELETE FROM event_confirmations;
DELETE FROM event_fees;

-- ==================== LOJA - PEDIDOS ====================
DELETE FROM shop_installments;
DELETE FROM shop_order_items;
DELETE FROM shop_orders;
DELETE FROM shop_cart_items;

-- ==================== LOJA - COMBOS ====================
DELETE FROM shop_combo_discount_items;
DELETE FROM shop_combo_discounts;
DELETE FROM promo_codes;

-- ==================== LOJA - PRODUTOS ====================
DELETE FROM shop_item_color_images;
DELETE FROM shop_item_colors;
DELETE FROM shop_item_size_charts;
DELETE FROM shop_item_sizes;
DELETE FROM shop_item_images;
DELETE FROM shop_items;
DELETE FROM shop_categories;

-- ==================== TESOURARIA ====================
DELETE FROM member_percapta_payments;
DELETE FROM member_ump_payments;
DELETE FROM treasury_entries;
DELETE FROM treasury_receipts;
DELETE FROM treasury_loan_installments;
DELETE FROM treasury_loans;
DELETE FROM treasury_expense_categories;
DELETE FROM treasury_settings;

-- ==================== CARDS CONQUISTADOS ====================
DELETE FROM user_cards;

-- ==================== EVENTOS ESPECIAIS ====================
DELETE FROM study_event_participants;
DELETE FROM user_event_progress;
DELETE FROM study_event_lessons;
DELETE FROM study_events;

-- ==================== INTERAÇÃO ENTRE MEMBROS ====================
DELETE FROM member_encouragements;
DELETE FROM achievement_likes;
DELETE FROM user_online_status;

-- ==================== PRÁTICA SEMANAL ====================
DELETE FROM practice_questions;
DELETE FROM weekly_practice;

-- ==================== AUDIT ====================
DELETE FROM audit_logs;

-- ==================== PUSH / NOTIFICAÇÕES ====================
DELETE FROM anonymous_push_subscriptions;
DELETE FROM push_subscriptions;

-- ==================== MISSÕES DIÁRIAS ====================
DELETE FROM daily_mission_content;
DELETE FROM user_daily_missions;
DELETE FROM daily_missions;

-- ==================== RANKING / LEADERBOARD ====================
DELETE FROM leaderboard_entries;

-- ==================== CONQUISTAS ====================
DELETE FROM achievement_xp;
DELETE FROM user_achievements;
DELETE FROM achievements;

-- ==================== ATIVIDADES / XP ====================
DELETE FROM daily_activity;
DELETE FROM xp_transactions;
DELETE FROM daily_mission_xp;
DELETE FROM weekly_practice_bonus;

-- ==================== LEITURAS ====================
DELETE FROM verse_readings;
DELETE FROM devotional_readings;

-- ==================== PROGRESSO DE ESTUDO ====================
DELETE FROM user_unit_progress;
DELETE FROM user_lesson_progress;

-- ==================== METAS SEMANAIS ====================
DELETE FROM weekly_goal_progress;

-- ==================== TEMPORADAS - PROGRESSO ====================
DELETE FROM season_rankings;
DELETE FROM user_season_progress;
DELETE FROM user_final_challenge_progress;
DELETE FROM season_final_challenges;

-- ==================== MARCOS DE OFENSIVA ====================
DELETE FROM user_streak_milestones;
DELETE FROM streak_milestones;
DELETE FROM streak_freeze_history;
DELETE FROM crystal_transactions;

-- ==================== PERFIS DE ESTUDO ====================
DELETE FROM study_profiles;

-- ==================== CONTEÚDO DE ESTUDO ====================
DELETE FROM bible_verses;
DELETE FROM study_units;
DELETE FROM study_lessons;
DELETE FROM study_weeks;

-- ==================== VERSÍCULOS DO DIA ====================
DELETE FROM birthday_share_images;
DELETE FROM daily_verse_shares;
DELETE FROM daily_verse_posts;
DELETE FROM daily_verse_stock;

-- ==================== SITE ====================
DELETE FROM devotional_comments;
DELETE FROM prayer_reactions;
DELETE FROM prayer_requests;
DELETE FROM banner_highlights;
DELETE FROM instagram_posts;
DELETE FROM site_events;
DELETE FROM devotionals;
DELETE FROM site_content;
DELETE FROM board_members;
DELETE FROM banners;

-- ==================== ELEIÇÕES ====================
DELETE FROM pdf_verifications;
DELETE FROM verification_codes;
DELETE FROM votes;
DELETE FROM election_attendance;
DELETE FROM election_positions;
DELETE FROM election_winners;
DELETE FROM candidates;
DELETE FROM elections;
DELETE FROM positions;

-- ==================== CARDS COLECIONÁVEIS (após seasons e study_events) ====================
DELETE FROM collectible_cards;

-- ==================== TEMPORADAS (após season_rankings, season_final_challenges, study_lessons) ====================
DELETE FROM seasons;

-- ==================== USUÁRIOS (por último, é referenciado por muitas tabelas) ====================
DELETE FROM users;

-- ==================== RESETAR SEQUENCES ====================
-- Reinicia os contadores de auto-incremento para 1
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE positions_id_seq RESTART WITH 1;
ALTER SEQUENCE elections_id_seq RESTART WITH 1;
ALTER SEQUENCE candidates_id_seq RESTART WITH 1;
ALTER SEQUENCE election_winners_id_seq RESTART WITH 1;
ALTER SEQUENCE election_positions_id_seq RESTART WITH 1;
ALTER SEQUENCE election_attendance_id_seq RESTART WITH 1;
ALTER SEQUENCE votes_id_seq RESTART WITH 1;
ALTER SEQUENCE verification_codes_id_seq RESTART WITH 1;
ALTER SEQUENCE pdf_verifications_id_seq RESTART WITH 1;
ALTER SEQUENCE devotionals_id_seq RESTART WITH 1;
ALTER SEQUENCE site_events_id_seq RESTART WITH 1;
ALTER SEQUENCE instagram_posts_id_seq RESTART WITH 1;
ALTER SEQUENCE banner_highlights_id_seq RESTART WITH 1;
ALTER SEQUENCE prayer_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE prayer_reactions_id_seq RESTART WITH 1;
ALTER SEQUENCE devotional_comments_id_seq RESTART WITH 1;
ALTER SEQUENCE banners_id_seq RESTART WITH 1;
ALTER SEQUENCE board_members_id_seq RESTART WITH 1;
ALTER SEQUENCE site_content_id_seq RESTART WITH 1;
ALTER SEQUENCE daily_verse_stock_id_seq RESTART WITH 1;
ALTER SEQUENCE daily_verse_posts_id_seq RESTART WITH 1;
ALTER SEQUENCE daily_verse_shares_id_seq RESTART WITH 1;
ALTER SEQUENCE birthday_share_images_id_seq RESTART WITH 1;
ALTER SEQUENCE study_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE crystal_transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE streak_freeze_history_id_seq RESTART WITH 1;
ALTER SEQUENCE streak_milestones_id_seq RESTART WITH 1;
ALTER SEQUENCE user_streak_milestones_id_seq RESTART WITH 1;
ALTER SEQUENCE seasons_id_seq RESTART WITH 1;
ALTER SEQUENCE season_final_challenges_id_seq RESTART WITH 1;
ALTER SEQUENCE user_final_challenge_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE user_season_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE season_rankings_id_seq RESTART WITH 1;
ALTER SEQUENCE weekly_goal_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE weekly_practice_bonus_id_seq RESTART WITH 1;
ALTER SEQUENCE achievement_xp_id_seq RESTART WITH 1;
ALTER SEQUENCE daily_mission_xp_id_seq RESTART WITH 1;
ALTER SEQUENCE devotional_readings_id_seq RESTART WITH 1;
ALTER SEQUENCE study_weeks_id_seq RESTART WITH 1;
ALTER SEQUENCE study_lessons_id_seq RESTART WITH 1;
ALTER SEQUENCE study_units_id_seq RESTART WITH 1;
ALTER SEQUENCE bible_verses_id_seq RESTART WITH 1;
ALTER SEQUENCE user_lesson_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE user_unit_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE verse_readings_id_seq RESTART WITH 1;
ALTER SEQUENCE xp_transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE daily_activity_id_seq RESTART WITH 1;
ALTER SEQUENCE achievements_id_seq RESTART WITH 1;
ALTER SEQUENCE user_achievements_id_seq RESTART WITH 1;
ALTER SEQUENCE leaderboard_entries_id_seq RESTART WITH 1;
ALTER SEQUENCE daily_missions_id_seq RESTART WITH 1;
ALTER SEQUENCE user_daily_missions_id_seq RESTART WITH 1;
ALTER SEQUENCE daily_mission_content_id_seq RESTART WITH 1;
ALTER SEQUENCE push_subscriptions_id_seq RESTART WITH 1;
ALTER SEQUENCE anonymous_push_subscriptions_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE weekly_practice_id_seq RESTART WITH 1;
ALTER SEQUENCE practice_questions_id_seq RESTART WITH 1;
ALTER SEQUENCE user_online_status_id_seq RESTART WITH 1;
ALTER SEQUENCE achievement_likes_id_seq RESTART WITH 1;
ALTER SEQUENCE member_encouragements_id_seq RESTART WITH 1;
ALTER SEQUENCE collectible_cards_id_seq RESTART WITH 1;
ALTER SEQUENCE study_events_id_seq RESTART WITH 1;
ALTER SEQUENCE study_event_lessons_id_seq RESTART WITH 1;
ALTER SEQUENCE user_event_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE study_event_participants_id_seq RESTART WITH 1;
ALTER SEQUENCE user_cards_id_seq RESTART WITH 1;
ALTER SEQUENCE treasury_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE treasury_expense_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE treasury_loans_id_seq RESTART WITH 1;
ALTER SEQUENCE treasury_loan_installments_id_seq RESTART WITH 1;
ALTER SEQUENCE treasury_entries_id_seq RESTART WITH 1;
ALTER SEQUENCE member_ump_payments_id_seq RESTART WITH 1;
ALTER SEQUENCE member_percapta_payments_id_seq RESTART WITH 1;
ALTER SEQUENCE treasury_notifications_log_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_items_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_item_images_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_item_sizes_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_item_size_charts_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_cart_items_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_installments_id_seq RESTART WITH 1;
ALTER SEQUENCE promo_codes_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_item_colors_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_item_color_images_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_combo_discounts_id_seq RESTART WITH 1;
ALTER SEQUENCE shop_combo_discount_items_id_seq RESTART WITH 1;
ALTER SEQUENCE event_fees_id_seq RESTART WITH 1;
ALTER SEQUENCE event_confirmations_id_seq RESTART WITH 1;
ALTER SEQUENCE sent_event_notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE sent_scheduler_reminders_id_seq RESTART WITH 1;
ALTER SEQUENCE forms_id_seq RESTART WITH 1;
ALTER SEQUENCE form_questions_id_seq RESTART WITH 1;
ALTER SEQUENCE form_options_id_seq RESTART WITH 1;
ALTER SEQUENCE form_responses_id_seq RESTART WITH 1;
ALTER SEQUENCE form_answers_id_seq RESTART WITH 1;
ALTER SEQUENCE form_analyses_id_seq RESTART WITH 1;

-- =====================================================
-- LIMPEZA TOTAL CONCLUÍDA
-- Todas as tabelas foram esvaziadas.
-- Todos os contadores de ID foram reiniciados.
-- =====================================================
