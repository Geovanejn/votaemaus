# Análise de Otimização N+1 Query

## Resumo Executivo
Este documento identifica todas as rotas com problemas de N+1 query no sistema UMP Emaús.

## STATUS: IMPLEMENTADO (2026-01-08)
Todas as otimizações de alta e média prioridade foram implementadas.

---

## ALTA PRIORIDADE (Painéis principais)

### 1. /api/treasury/members/tax-status/:year (Linha ~10366)
- **Problema**: Promise.all com getMemberPercaptaPayment + getMemberUmpPayments por membro
- **Impacto**: 2N queries para N membros ativos
- **Solução**: Usar getAllMemberPercaptaPayments + getAllMemberUmpPayments (JÁ EXISTE)
- **Status**: Parcialmente corrigido (precisa completar edição)

### 2. /api/treasury/member-payments (Linha ~10640)
- **Problema**: Promise.all com getMemberPercaptaPayment + getMemberUmpPayments por membro
- **Impacto**: 2N queries para N membros
- **Solução**: Usar funções batch existentes
- **Status**: Pendente

### 3. /api/treasury/notifications/pending-members (Linha ~11208)
- **Problema**: for loop com getMemberPercaptaPayment + getMemberUmpPayments por membro
- **Impacto**: 2N queries para N membros
- **Solução**: Usar funções batch existentes
- **Status**: Pendente

### 4. /api/treasury/loans (Linha ~10542)
- **Problema**: Promise.all com getTreasuryLoanInstallments por empréstimo
- **Impacto**: N queries para N empréstimos
- **Solução**: Criar getTreasuryLoanInstallmentsByLoanIds (novo batch helper)
- **Status**: Pendente

### 5. /api/treasury/shop/orders (Linha ~11668)
- **Problema**: TRIPLE N+1 - items, users, products, installments por pedido
- **Impacto**: 4N+ queries para N pedidos
- **Solução**: Usar batch helpers existentes (getShopOrderItemsByOrderIds, getShopInstallmentsByOrderIds, getUsersByIds)
- **Status**: Pendente

### 6. /api/treasury/events-with-fees (Linha ~11644)
- **Problema**: Promise.all com getEventConfirmationCount por evento
- **Impacto**: N queries para N eventos
- **Solução**: Criar getEventConfirmationCountsByEventIds (novo batch helper)
- **Status**: Pendente

---

## MÉDIA PRIORIDADE (Painéis secundários)

### 7. /api/study/events (Linha ~8126)
- **Problema**: Promise.all com getEventConfirmationCount por evento
- **Impacto**: N queries para N eventos
- **Solução**: Usar getEventConfirmationCountsByEventIds (mesmo helper do item 6)
- **Status**: Pendente

### 8. /api/my-finances (Linha ~10677)
- **Problema**: Promise.all com getShopOrderItems por pedido
- **Impacto**: N queries para N pedidos do usuário
- **Solução**: Usar getShopOrderItemsByOrderIds existente
- **Status**: Pendente

### 9. /api/treasury/member/shop-orders (Linha ~11008)
- **Problema**: Promise.all com getShopInstallments por pedido (dentro de outro Promise.all)
- **Impacto**: N queries para N pedidos
- **Solução**: Usar getShopInstallmentsByOrderIds existente
- **Status**: Pendente

### 10. /api/candidates/batch (Linha ~1335)
- **Problema**: for loop com getUserById + isMemberPresent por candidato
- **Impacto**: 2N queries para N candidatos
- **Solução**: Batch pre-fetch getUsersByIds + getMemberPresenceByUserIds
- **Status**: Pendente

---

## BAIXA PRIORIDADE (Ações pontuais)

### 11. /api/treasury/notifications/send (Linha ~11175)
- **Problema**: for loop com createNotification + sendPushToUser por userId
- **Tipo**: Operações de escrita sequenciais (menos impacto em leitura)
- **Status**: Baixa prioridade

### 12. /api/shop/checkout (Linha ~10003)
- **Problema**: for loop com createShopInstallment por parcela
- **Tipo**: Operações de escrita (checkout é pontual)
- **Status**: Baixa prioridade

---

## FUNÇÕES BATCH NECESSÁRIAS (Storage)

### Já existentes:
- `getAllMemberPercaptaPayments(year)` - Map<userId, payment>
- `getAllMemberUmpPayments(year)` - Map<userId, payments[]>
- `getPushSubscriptionCountsByUserIds(userIds)` - Map<userId, count>
- `getUsersByIds(ids)` - Map<userId, User>
- `getShopOrderItemsByOrderIds(orderIds)` - Map<orderId, items[]>
- `getShopInstallmentsByOrderIds(orderIds)` - Map<orderId, installments[]>
- `getShopItemsByIds(ids)` - ShopItem[]
- `getShopItemImagesByItemIds(ids)` - Map<itemId, images[]>

### Precisam ser criadas:
- `getTreasuryLoanInstallmentsByLoanIds(loanIds)` - Map<loanId, installments[]>
- `getEventConfirmationCountsByEventIds(eventIds)` - Map<eventId, counts>
- `getMemberPresenceByUserIds(electionId, userIds)` - Map<userId, boolean>

---

## ORDEM DE IMPLEMENTAÇÃO

1. Criar funções batch faltantes no storage.ts
2. Otimizar rotas de alta prioridade (treasury panel)
3. Otimizar rotas de média prioridade
4. Testar e validar
