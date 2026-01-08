-- ============================================================
-- SQL PARA RESET DO BANCO DE DADOS - UMP EMAÚS
-- Data: Janeiro 2026
-- ============================================================
-- 
-- PRESERVA:
--   - Membros (users)
--   - Temporadas (seasons)
--   - Revistas/Semanas de estudo (study_weeks)
--   - Lições (study_lessons)
--   - Unidades das lições (study_units)
--   - Eventos de estudo (study_events)
--   - Lições de eventos (study_event_lessons)
--   - Cards colecionáveis (collectible_cards)
--   - Categorias da loja (shop_categories)
--   - Produtos (shop_items)
--   - Imagens dos produtos (shop_item_images)
--   - Tamanhos (shop_item_sizes)
--   - Tabela de medidas (shop_item_size_charts)
--
-- LIMPA:
--   - Eleições, votos, candidatos
--   - Devocionais e comentários
--   - Eventos do site
--   - Tesouraria (pagamentos, empréstimos)
--   - Pedidos da loja e carrinho
--   - Progresso de usuários no estudo
--   - Rankings e XP
--   - Notificações e logs
--
-- ============================================================

-- DESABILITA VERIFICAÇÃO DE FK TEMPORARIAMENTE
SET session_replication_role = replica;

-- ============================================================
-- PARTE 1: LIMPAR TABELAS (ordem correta por dependências)
-- ============================================================

-- Scheduler e notificações
TRUNCATE TABLE sent_scheduler_reminders CASCADE;
TRUNCATE TABLE sent_event_notifications CASCADE;
TRUNCATE TABLE treasury_notifications_log CASCADE;
TRUNCATE TABLE push_subscriptions CASCADE;
TRUNCATE TABLE notifications CASCADE;

-- Loja - pedidos e carrinho (mantém produtos)
TRUNCATE TABLE shop_installments CASCADE;
TRUNCATE TABLE shop_order_items CASCADE;
TRUNCATE TABLE shop_orders CASCADE;
TRUNCATE TABLE shop_cart_items CASCADE;
TRUNCATE TABLE promo_codes CASCADE;

-- Tesouraria
TRUNCATE TABLE member_ump_payments CASCADE;
TRUNCATE TABLE member_percapta_payments CASCADE;
TRUNCATE TABLE treasury_loan_installments CASCADE;
TRUNCATE TABLE treasury_loans CASCADE;
TRUNCATE TABLE treasury_entries CASCADE;
TRUNCATE TABLE treasury_receipts CASCADE;
TRUNCATE TABLE treasury_settings CASCADE;
TRUNCATE TABLE treasury_expense_categories CASCADE;

-- Eventos do site
TRUNCATE TABLE event_confirmations CASCADE;
TRUNCATE TABLE event_fees CASCADE;

-- Progresso de usuário em estudo (mantém estrutura das lições)
TRUNCATE TABLE user_event_progress CASCADE;
TRUNCATE TABLE user_cards CASCADE;
TRUNCATE TABLE user_unit_progress CASCADE;
TRUNCATE TABLE user_lesson_progress CASCADE;
TRUNCATE TABLE user_season_progress CASCADE;
TRUNCATE TABLE user_final_challenge_progress CASCADE;
TRUNCATE TABLE season_rankings CASCADE;

-- Atividade e progresso
TRUNCATE TABLE weekly_goal_progress CASCADE;
TRUNCATE TABLE weekly_practice_bonus CASCADE;
TRUNCATE TABLE achievement_xp CASCADE;
TRUNCATE TABLE daily_mission_xp CASCADE;
TRUNCATE TABLE user_achievements CASCADE;
TRUNCATE TABLE user_daily_missions CASCADE;
TRUNCATE TABLE daily_activity CASCADE;
TRUNCATE TABLE xp_transactions CASCADE;
TRUNCATE TABLE leaderboard_entries CASCADE;
TRUNCATE TABLE verse_readings CASCADE;
TRUNCATE TABLE devotional_readings CASCADE;

-- Sistema social
TRUNCATE TABLE member_encouragements CASCADE;
TRUNCATE TABLE achievement_likes CASCADE;
TRUNCATE TABLE user_online_status CASCADE;

-- Perfil de estudo (resetar mas manter usuário)
TRUNCATE TABLE study_profiles CASCADE;

-- Conquistas (definições ficam, progresso limpa)
TRUNCATE TABLE achievements CASCADE;

-- Missões diárias (definições)
TRUNCATE TABLE daily_mission_content CASCADE;
TRUNCATE TABLE daily_missions CASCADE;

-- Versículos
TRUNCATE TABLE bible_verses CASCADE;

-- Devocionais
TRUNCATE TABLE devotional_comments CASCADE;
TRUNCATE TABLE devotionals CASCADE;

-- Eventos do site
TRUNCATE TABLE site_events CASCADE;

-- Instagram e banners
TRUNCATE TABLE banner_highlights CASCADE;
TRUNCATE TABLE banners CASCADE;
TRUNCATE TABLE instagram_posts CASCADE;

-- Pedidos de oração
TRUNCATE TABLE prayer_reactions CASCADE;
TRUNCATE TABLE prayer_requests CASCADE;

-- Eleições
TRUNCATE TABLE votes CASCADE;
TRUNCATE TABLE election_winners CASCADE;
TRUNCATE TABLE election_attendance CASCADE;
TRUNCATE TABLE candidates CASCADE;
TRUNCATE TABLE election_positions CASCADE;
TRUNCATE TABLE elections CASCADE;
TRUNCATE TABLE positions CASCADE;

-- Verificação
TRUNCATE TABLE pdf_verifications CASCADE;
TRUNCATE TABLE verification_codes CASCADE;

-- REABILITA VERIFICAÇÃO DE FK
SET session_replication_role = DEFAULT;

-- ============================================================
-- PARTE 2: RESETAR SEQUENCES (IDs começam do 1 novamente)
-- ============================================================

-- Scheduler e notificações
ALTER SEQUENCE IF EXISTS sent_scheduler_reminders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS sent_event_notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS treasury_notifications_log_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS push_subscriptions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;

-- Loja - pedidos
ALTER SEQUENCE IF EXISTS shop_installments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS shop_order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS shop_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS shop_cart_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS promo_codes_id_seq RESTART WITH 1;

-- Tesouraria
ALTER SEQUENCE IF EXISTS member_ump_payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS member_percapta_payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS treasury_loan_installments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS treasury_loans_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS treasury_entries_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS treasury_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS treasury_expense_categories_id_seq RESTART WITH 1;

-- Eventos
ALTER SEQUENCE IF EXISTS event_confirmations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS event_fees_id_seq RESTART WITH 1;

-- Progresso de estudo
ALTER SEQUENCE IF EXISTS user_event_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_cards_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_unit_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_lesson_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_season_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_final_challenge_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS season_rankings_id_seq RESTART WITH 1;

-- Atividade
ALTER SEQUENCE IF EXISTS weekly_goal_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS weekly_practice_bonus_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS achievement_xp_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS daily_mission_xp_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_achievements_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_daily_missions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS daily_activity_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS xp_transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS leaderboard_entries_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS verse_readings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS devotional_readings_id_seq RESTART WITH 1;

-- Social
ALTER SEQUENCE IF EXISTS member_encouragements_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS achievement_likes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_online_status_id_seq RESTART WITH 1;

-- Perfil de estudo
ALTER SEQUENCE IF EXISTS study_profiles_id_seq RESTART WITH 1;

-- Conquistas e missões
ALTER SEQUENCE IF EXISTS achievements_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS daily_mission_content_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS daily_missions_id_seq RESTART WITH 1;

-- Versículos
ALTER SEQUENCE IF EXISTS bible_verses_id_seq RESTART WITH 1;

-- Devocionais
ALTER SEQUENCE IF EXISTS devotional_comments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS devotionals_id_seq RESTART WITH 1;

-- Site events
ALTER SEQUENCE IF EXISTS site_events_id_seq RESTART WITH 1;

-- Banners e Instagram
ALTER SEQUENCE IF EXISTS banner_highlights_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS banners_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS instagram_posts_id_seq RESTART WITH 1;

-- Orações
ALTER SEQUENCE IF EXISTS prayer_reactions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS prayer_requests_id_seq RESTART WITH 1;

-- Eleições
ALTER SEQUENCE IF EXISTS votes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS election_winners_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS election_attendance_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS candidates_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS election_positions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS elections_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS positions_id_seq RESTART WITH 1;

-- Verificação
ALTER SEQUENCE IF EXISTS pdf_verifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS verification_codes_id_seq RESTART WITH 1;

-- ============================================================
-- PARTE 3: CRIAR CATEGORIAS PADRÃO DE DESPESAS
-- ============================================================

INSERT INTO treasury_expense_categories (name, is_default) VALUES
  ('Percapta', true),
  ('Empréstimo', true),
  ('Eventos', true),
  ('Marketing', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PARTE 4: CRIAR POSIÇÕES PADRÃO PARA ELEIÇÕES
-- ============================================================

INSERT INTO positions (name) VALUES
  ('Presidente'),
  ('Vice-Presidente'),
  ('Primeiro Secretário'),
  ('Segundo Secretário'),
  ('Primeiro Tesoureiro'),
  ('Segundo Tesoureiro')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

SELECT 'Dados preservados:' as status;
SELECT 'Membros:', COUNT(*) FROM users;
SELECT 'Temporadas:', COUNT(*) FROM seasons;
SELECT 'Semanas de estudo:', COUNT(*) FROM study_weeks;
SELECT 'Lições:', COUNT(*) FROM study_lessons;
SELECT 'Unidades:', COUNT(*) FROM study_units;
SELECT 'Eventos de estudo:', COUNT(*) FROM study_events;
SELECT 'Lições de eventos:', COUNT(*) FROM study_event_lessons;
SELECT 'Cards colecionáveis:', COUNT(*) FROM collectible_cards;
SELECT 'Categorias da loja:', COUNT(*) FROM shop_categories;
SELECT 'Produtos:', COUNT(*) FROM shop_items;
SELECT 'Imagens de produtos:', COUNT(*) FROM shop_item_images;
SELECT 'Tamanhos:', COUNT(*) FROM shop_item_sizes;

SELECT 'Reset concluído com sucesso!' as resultado;
