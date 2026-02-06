-- ============================================================
-- SQL PARA RESET PARCIAL DO BANCO DE DADOS - UMP EMAÚS
-- Compatível com Neon PostgreSQL
-- Gerado em: Fevereiro 2026
-- ============================================================
-- 
-- PRESERVA:
--   ✓ users (membros)
--   ✓ devotionals (devocionais)
--   ✓ devotional_comments (comentários de devocionais)
--   ✓ daily_verse_posts (versículos do dia)
--   ✓ daily_verse_stock (imagens dos versículos)
--   ✓ site_content (quem somos, localização, etc)
--   ✓ banners (imagens de banner/carrossel)
--   ✓ board_members (diretoria)
--   ✓ shop_categories (categorias da loja)
--   ✓ shop_items (produtos)
--   ✓ shop_item_images (imagens dos produtos)
--   ✓ shop_item_sizes (tamanhos)
--   ✓ shop_item_size_charts (tabela de medidas)
--   ✓ shop_item_colors (cores)
--   ✓ shop_item_color_images (imagens por cor)
--   ✓ shop_combo_discounts (combos de desconto)
--   ✓ shop_combo_discount_items (itens dos combos)
--   ✓ promo_codes (códigos promocionais)
--
-- LIMPA TUDO o restante (progresso, pedidos, pagamentos,
-- eleições, estudos, notificações, formulários, etc.)
-- ============================================================
-- Usa DELETE FROM na ordem topológica correta
-- (tabelas filhas antes das tabelas pai).
-- ============================================================

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

-- ==================== LOJA - PEDIDOS (limpa pedidos, mantém produtos) ====================
DELETE FROM shop_installments;
DELETE FROM shop_order_items;
DELETE FROM shop_orders;
DELETE FROM shop_cart_items;

-- ==================== TESOURARIA (pagamentos → entries → loans) ====================
DELETE FROM member_percapta_payments;
DELETE FROM member_ump_payments;
DELETE FROM treasury_entries;
DELETE FROM treasury_receipts;
DELETE FROM treasury_loan_installments;
DELETE FROM treasury_loans;
DELETE FROM treasury_expense_categories;
DELETE FROM treasury_settings;

-- ==================== INTERAÇÃO ENTRE MEMBROS ====================
DELETE FROM member_encouragements;
DELETE FROM achievement_likes;
DELETE FROM user_online_status;

-- ==================== AUDIT ====================
DELETE FROM audit_logs;

-- ==================== PUSH ====================
DELETE FROM anonymous_push_subscriptions;
DELETE FROM push_subscriptions;

-- ==================== MISSÕES DIÁRIAS ====================
DELETE FROM daily_mission_content;
DELETE FROM user_daily_missions;
DELETE FROM daily_missions;

-- ==================== RANKING ====================
DELETE FROM leaderboard_entries;

-- ==================== XP / ATIVIDADES ====================
DELETE FROM daily_activity;
DELETE FROM xp_transactions;
DELETE FROM daily_mission_xp;
DELETE FROM weekly_practice_bonus;
DELETE FROM achievement_xp;

-- ==================== CONQUISTAS (achievements refs → seasons) ====================
DELETE FROM user_achievements;
DELETE FROM achievements;

-- ==================== LEITURAS ====================
DELETE FROM verse_readings;
DELETE FROM devotional_readings;

-- ==================== PROGRESSO DE ESTUDO ====================
DELETE FROM user_unit_progress;
DELETE FROM user_lesson_progress;

-- ==================== PRÁTICA SEMANAL (refs → study_weeks) ====================
DELETE FROM practice_questions;
DELETE FROM weekly_practice;

-- ==================== CONTEÚDO DE ESTUDO ====================
-- study_units → study_lessons → (study_weeks E seasons)
DELETE FROM study_units;
DELETE FROM study_lessons;
DELETE FROM study_weeks;

-- ==================== METAS SEMANAIS ====================
DELETE FROM weekly_goal_progress;

-- ==================== TEMPORADAS - PROGRESSO (refs → seasons) ====================
DELETE FROM season_rankings;
DELETE FROM user_season_progress;
DELETE FROM user_final_challenge_progress;
DELETE FROM season_final_challenges;

-- ==================== TEMPORADAS (após todas as dependências) ====================
DELETE FROM seasons;

-- ==================== MARCOS DE OFENSIVA ====================
DELETE FROM user_streak_milestones;
DELETE FROM streak_milestones;
DELETE FROM streak_freeze_history;
DELETE FROM crystal_transactions;

-- ==================== PERFIS DE ESTUDO ====================
DELETE FROM study_profiles;

-- ==================== CARDS CONQUISTADOS (refs → collectible_cards) ====================
DELETE FROM user_cards;

-- ==================== EVENTOS ESPECIAIS (refs → collectible_cards) ====================
DELETE FROM study_event_participants;
DELETE FROM user_event_progress;
DELETE FROM study_event_lessons;
DELETE FROM study_events;

-- ==================== CARDS COLECIONÁVEIS (após seasons, events, user_cards) ====================
DELETE FROM collectible_cards;

-- ==================== VERSÍCULOS - COMPARTILHAMENTOS ====================
DELETE FROM birthday_share_images;
DELETE FROM daily_verse_shares;
-- daily_verse_posts: PRESERVADO
-- daily_verse_stock: PRESERVADO

-- ==================== SITE - LIMPA SELETIVAMENTE ====================
DELETE FROM prayer_reactions;
DELETE FROM prayer_requests;
DELETE FROM banner_highlights;
DELETE FROM instagram_posts;
DELETE FROM site_events;
-- devotionals: PRESERVADO
-- devotional_comments: PRESERVADO
-- site_content: PRESERVADO
-- banners: PRESERVADO
-- board_members: PRESERVADO

-- ==================== ELEIÇÕES ====================
DELETE FROM pdf_verifications;
DELETE FROM verification_codes;
DELETE FROM votes;
DELETE FROM election_attendance;
DELETE FROM election_winners;
DELETE FROM election_positions;
DELETE FROM candidates;
DELETE FROM elections;
DELETE FROM positions;

-- ==================== DADOS PRESERVADOS ====================
-- users: PRESERVADO
-- devotionals: PRESERVADO
-- devotional_comments: PRESERVADO
-- daily_verse_posts: PRESERVADO
-- daily_verse_stock: PRESERVADO
-- site_content: PRESERVADO
-- banners: PRESERVADO
-- board_members: PRESERVADO
-- shop_categories: PRESERVADO
-- shop_items: PRESERVADO
-- shop_item_images: PRESERVADO
-- shop_item_sizes: PRESERVADO
-- shop_item_size_charts: PRESERVADO
-- shop_item_colors: PRESERVADO
-- shop_item_color_images: PRESERVADO
-- shop_combo_discounts: PRESERVADO
-- shop_combo_discount_items: PRESERVADO
-- promo_codes: PRESERVADO

-- ============================================================
-- RESET PARCIAL CONCLUÍDO
-- ============================================================
