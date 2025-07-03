-- 🎯 CRIAÇÃO DE TICKETS DE TESTE - JOBBS SERVICE DESK
-- Execute este arquivo no Supabase Dashboard > SQL Editor

-- ========================================
-- 1. VERIFICAR USUÁRIOS DISPONÍVEIS
-- ========================================

SELECT '=== USUÁRIOS CADASTRADOS ===' as info;
SELECT id, email FROM auth.users;

-- ========================================
-- 2. CRIAR TICKETS DE TESTE
-- ========================================

-- Limpar tickets existentes (opcional)
-- DELETE FROM public.tickets;

-- Inserir 4 tickets de teste com diferentes características
INSERT INTO public.tickets (
  ticket_number,
  subject,
  description,
  status,
  priority,
  department,
  customer_id,
  estimated_date
) VALUES 
-- Ticket 1 - TI - Urgente - Aberto
(
  'TICK-001',
  '🔥 Sistema de Email Inoperante',
  'O sistema de email corporativo está completamente fora do ar desde as 08:00. Todos os colaboradores estão sem acesso aos emails. Impacto crítico nos negócios. Necessário resolução imediata para restabelecer a comunicação interna e externa.',
  'open',
  'urgent',
  'TI',
  (SELECT id FROM auth.users LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day'
),
-- Ticket 2 - RH - Média - Em progresso
(
  'TICK-002',
  '📋 Atualização de Política de Férias',
  'Solicito a atualização da política de férias conforme as novas diretrizes trabalhistas. É necessário revisar os procedimentos de solicitação e aprovação de férias no sistema RH. Incluir também as novas regras para férias coletivas.',
  'in_progress',
  'medium',
  'RH',
  (SELECT id FROM auth.users LIMIT 1),
  CURRENT_DATE + INTERVAL '7 days'
),
-- Ticket 3 - Financeiro - Alta - Resolvido
(
  'TICK-003',
  '💰 Divergência na Folha de Pagamento',
  'Identificada divergência nos cálculos da folha de pagamento do mês de dezembro. Alguns colaboradores tiveram desconto incorreto do INSS. Necessário correção urgente e reprocessamento da folha. Afeta aproximadamente 15 funcionários.',
  'resolved',
  'high',
  'Financeiro',
  (SELECT id FROM auth.users LIMIT 1),
  CURRENT_DATE + INTERVAL '2 days'
),
-- Ticket 4 - Comercial - Baixa - Aberto
(
  'TICK-004',
  '📊 Relatório de Vendas Mensais',
  'Solicito a criação de relatório automatizado de vendas mensais para a equipe comercial. O relatório deve incluir dados de conversão, pipeline, metas atingidas e análise comparativa com meses anteriores. Formato de saída em Excel e PDF.',
  'open',
  'low',
  'Comercial',
  (SELECT id FROM auth.users LIMIT 1),
  CURRENT_DATE + INTERVAL '14 days'
),
-- Ticket 5 - TI - Alta - Em progresso (adicional)
(
  'TICK-005',
  '🔒 Implementação de Backup Automático',
  'Configurar sistema de backup automático para todos os servidores críticos. O backup deve incluir dados de aplicação, configurações do sistema e banco de dados. Frequência diária com retenção de 30 dias. Testes de restauração quinzenais.',
  'in_progress',
  'high',
  'TI',
  (SELECT id FROM auth.users LIMIT 1),
  CURRENT_DATE + INTERVAL '5 days'
);

-- ========================================
-- 3. CRIAR COMENTÁRIOS NOS TICKETS
-- ========================================

-- Adicionar comentários de exemplo
INSERT INTO public.ticket_updates (ticket_id, user_id, message)
SELECT 
  t.id,
  (SELECT id FROM auth.users LIMIT 1),
  CASE 
    WHEN t.ticket_number = 'TICK-001' THEN '🔍 Iniciando investigação do problema. Verificando logs do servidor de email...'
    WHEN t.ticket_number = 'TICK-002' THEN '📝 Reunião agendada com RH para revisar as novas diretrizes. Documento em análise.'
    WHEN t.ticket_number = 'TICK-003' THEN '✅ Problema identificado e corrigido. Folha reprocessada com sucesso!'
    WHEN t.ticket_number = 'TICK-004' THEN '📋 Coletando requisitos detalhados com a equipe comercial.'
    WHEN t.ticket_number = 'TICK-005' THEN '⚙️ Configuração do sistema de backup em andamento. 60% concluído.'
  END
FROM public.tickets t
WHERE t.ticket_number IN ('TICK-001', 'TICK-002', 'TICK-003', 'TICK-004', 'TICK-005');

-- Adicionar segundo comentário para alguns tickets
INSERT INTO public.ticket_updates (ticket_id, user_id, message)
SELECT 
  t.id,
  (SELECT id FROM auth.users LIMIT 1),
  CASE 
    WHEN t.ticket_number = 'TICK-001' THEN '⚠️ Problema mais complexo que o esperado. Escalando para especialista externo.'
    WHEN t.ticket_number = 'TICK-003' THEN '📧 Comunicado enviado para todos os funcionários afetados sobre as correções.'
    WHEN t.ticket_number = 'TICK-005' THEN '🧪 Primeira bateria de testes de backup concluída com sucesso.'
  END
FROM public.tickets t
WHERE t.ticket_number IN ('TICK-001', 'TICK-003', 'TICK-005');

-- ========================================
-- 4. VERIFICAÇÃO DOS RESULTADOS
-- ========================================

SELECT '=== TICKETS CRIADOS COM SUCESSO ===' as resultado;

-- Listar todos os tickets criados
SELECT 
  ticket_number,
  subject,
  status,
  priority,
  department,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as criado_em,
  TO_CHAR(estimated_date, 'DD/MM/YYYY') as data_estimada
FROM public.tickets 
ORDER BY created_at DESC;

-- Listar comentários por ticket
SELECT '=== COMENTÁRIOS DOS TICKETS ===' as info;

SELECT 
  t.ticket_number,
  tu.message,
  TO_CHAR(tu.created_at, 'DD/MM/YYYY HH24:MI') as comentario_em
FROM public.ticket_updates tu
JOIN public.tickets t ON tu.ticket_id = t.id
ORDER BY t.ticket_number, tu.created_at;

-- Estatísticas gerais
SELECT '=== ESTATÍSTICAS ===' as estatisticas;

SELECT 
  status,
  COUNT(*) as quantidade
FROM public.tickets 
GROUP BY status
ORDER BY quantidade DESC;

SELECT 
  priority,
  COUNT(*) as quantidade
FROM public.tickets 
GROUP BY priority
ORDER BY 
  CASE priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    WHEN 'low' THEN 4 
  END;

SELECT 
  department,
  COUNT(*) as quantidade
FROM public.tickets 
GROUP BY department
ORDER BY quantidade DESC;

-- ========================================
-- RESULTADO FINAL
-- ========================================

SELECT '🎉 CRIAÇÃO DE TICKETS CONCLUÍDA! 🎉' as sucesso;
SELECT '✅ 5 tickets criados com diferentes prioridades e status' as info1;
SELECT '✅ Comentários adicionados aos tickets' as info2;
SELECT '✅ Sistema pronto para testes!' as info3; 