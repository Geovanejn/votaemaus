# Como Resetar o Banco de Dados em Produção (Render)

## Passo 1: Acessar o Console PostgreSQL do Render

1. Vá para https://dashboard.render.com
2. Procure pelo seu serviço **PostgreSQL** (não o web service)
3. Clique nele
4. Vá para a aba **Connect**
5. Clique em **PSQL** para abrir um terminal PostgreSQL

## Passo 2: Executar o Script de Reset

Cole os seguintes comandos **EM ORDEM**:

```sql
-- Limpar todos os dados de estudo e lições
DELETE FROM study_quiz_responses;
DELETE FROM study_lesson_progress;
DELETE FROM study_quiz_questions;
DELETE FROM study_lessons;
DELETE FROM study_weeks;

-- Resetar sequences (IDs)
ALTER SEQUENCE study_weeks_id_seq RESTART WITH 1;
ALTER SEQUENCE study_lessons_id_seq RESTART WITH 1;
ALTER SEQUENCE study_quiz_questions_id_seq RESTART WITH 1;
ALTER SEQUENCE study_quiz_responses_id_seq RESTART WITH 1;
ALTER SEQUENCE study_lesson_progress_id_seq RESTART WITH 1;

-- Verificar que tudo foi deletado
SELECT COUNT(*) as study_weeks FROM study_weeks;
SELECT COUNT(*) as study_lessons FROM study_lessons;
SELECT COUNT(*) as study_quiz_questions FROM study_quiz_questions;
SELECT COUNT(*) as study_quiz_responses FROM study_quiz_responses;
SELECT COUNT(*) as study_lesson_progress FROM study_lesson_progress;
```

## Resultado Esperado

Todos os comandos SELECT devem retornar **0**.

## Pronto!

Depois de resetar:
- O dashboard mostrará **0 lições**
- Nenhum dado órfão permanecerá
- Quando o admin criar novas lições via admin panel, elas aparecerão corretamente

## Se Precisar de Ajuda

Copie os comandos acima e execute um por um no console PSQL do Render.
