# Análise de Otimização N+1 Query

## Resumo Executivo
Este documento identifica todas as rotas com problemas de N+1 query no sistema UMP Emaús.

## STATUS: IMPLEMENTADO (2026-01-08)
Todas as otimizações de alta e média prioridade foram implementadas e verificadas.

---

## ALTA PRIORIDADE (Painéis principais)

### 1. /api/treasury/members/tax-status/:year
- **Problema**: Promise.all com getMemberPercaptaPayment + getMemberUmpPayments por membro
- **Impacto**: 2N queries para N membros ativos
- **Solução**: Usar getAllMemberPercaptaPayments + getAllMemberUmpPayments
- **Status**: ✅ IMPLEMENTADO

### 2. /api/treasury/member-payments
- **Problema**: Promise.all com getMemberPercaptaPayment + getMemberUmpPayments por membro
- **Impacto**: 2N queries para N membros
- **Solução**: Usar funções batch existentes
- **Status**: ✅ IMPLEMENTADO

### 3. /api/treasury/notifications/pending-members
- **Problema**: for loop com getMemberPercaptaPayment + getMemberUmpPayments por membro
- **Impacto**: 2N queries para N membros
- **Solução**: Usar funções batch existentes
- **Status**: ✅ IMPLEMENTADO

### 4. /api/treasury/loans
- **Problema**: Promise.all com getTreasuryLoanInstallments por empréstimo
- **Impacto**: N queries para N empréstimos
- **Solução**: Criar getTreasuryLoanInstallmentsByLoanIds (batch helper)
- **Status**: ✅ IMPLEMENTADO

### 5. /api/treasury/shop/orders
- **Problema**: TRIPLE N+1 - items, users, products, installments por pedido
- **Impacto**: 4N+ queries para N pedidos
- **Solução**: Usar batch helpers (getShopOrderItemsByOrderIds, getShopInstallmentsByOrderIds, getUsersByIds)
- **Status**: ✅ IMPLEMENTADO

### 6. /api/treasury/events-with-fees
- **Problema**: Promise.all com getEventConfirmationCount por evento
- **Impacto**: N queries para N eventos
- **Solução**: Criar getEventConfirmationCountsByEventIds (batch helper)
- **Status**: ✅ IMPLEMENTADO

---

## MÉDIA PRIORIDADE (Painéis secundários)

### 7. /api/study/events
- **Problema**: Promise.all com getEventConfirmationCount por evento
- **Impacto**: N queries para N eventos
- **Solução**: Usar getEventConfirmationCountsByEventIds
- **Status**: ✅ IMPLEMENTADO

### 8. /api/my-finances
- **Problema**: Promise.all com getShopOrderItems por pedido
- **Impacto**: N queries para N pedidos do usuário
- **Solução**: Usar getShopOrderItemsByOrderIds existente
- **Status**: ✅ IMPLEMENTADO

### 9. /api/treasury/member/shop-orders
- **Problema**: Promise.all com getShopInstallments por pedido
- **Impacto**: N queries para N pedidos
- **Solução**: Usar getShopInstallmentsByOrderIds existente
- **Status**: ✅ IMPLEMENTADO

### 10. /api/candidates/batch
- **Problema**: for loop com getUserById + isMemberPresent por candidato
- **Impacto**: 2N queries para N candidatos
- **Solução**: Batch pre-fetch getUsersByIds + getMemberPresenceByUserIds
- **Status**: ✅ IMPLEMENTADO

---

## BAIXA PRIORIDADE (Ações pontuais)

### 11. /api/treasury/notifications/send
- **Problema**: for loop com createNotification + sendPushToUser por userId
- **Tipo**: Operações de escrita sequenciais (menos impacto em leitura)
- **Status**: Baixa prioridade (não implementado)

### 12. /api/shop/checkout
- **Problema**: for loop com createShopInstallment por parcela
- **Tipo**: Operações de escrita (checkout é pontual)
- **Status**: Baixa prioridade (não implementado)

---

## FUNÇÕES BATCH IMPLEMENTADAS (Storage)

### Todas implementadas:
- `getAllMemberPercaptaPayments(year)` - Map<userId, payment>
- `getAllMemberUmpPayments(year)` - Map<userId, payments[]>
- `getPushSubscriptionCountsByUserIds(userIds)` - Map<userId, count>
- `getUsersByIds(ids)` - Map<userId, User>
- `getShopOrderItemsByOrderIds(orderIds)` - Map<orderId, items[]>
- `getShopInstallmentsByOrderIds(orderIds)` - Map<orderId, installments[]>
- `getShopItemsByIds(ids)` - ShopItem[]
- `getShopItemImagesByItemIds(ids)` - Map<itemId, images[]>
- `getTreasuryLoanInstallmentsByLoanIds(loanIds)` - Map<loanId, installments[]>
- `getEventConfirmationCountsByEventIds(eventIds)` - Map<eventId, counts>
- `getMemberPresenceByUserIds(electionId, userIds)` - Map<userId, boolean>

---

## VERIFICAÇÃO FINAL

Todas as 10 rotas de alta e média prioridade foram verificadas e estão usando as funções batch corretamente, eliminando os problemas de N+1 query.
