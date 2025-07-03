-- 🧪 TESTE DE CRIAÇÃO DE TICKETS - JOBBS SERVICE DESK
-- Execute este arquivo no Supabase Dashboard > SQL Editor para testar a criação de tickets

-- ========================================
-- 1. VERIFICAR PRÉ-REQUISITOS
-- ========================================

SELECT '=== VERIFICANDO PRÉ-REQUISITOS ===' as teste;

-- Verificar se há usuários cadastrados
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Usuários encontrados: ' || COUNT(*)::text
    ELSE '❌ Nenhum usuário encontrado!'
  END as status_usuarios
FROM auth.users;

-- Verificar se há perfis
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Perfis encontrados: ' || COUNT(*)::text
    ELSE '❌ Nenhum perfil encontrado!'
  END as status_perfis
FROM public.profiles;

-- Verificar se há roles
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Roles encontradas: ' || COUNT(*)::text
    ELSE '❌ Nenhuma role encontrada!'
  END as status_roles
FROM public.user_roles;

-- ========================================
-- 2. TESTE 1 - CRIAÇÃO BÁSICA DE TICKET
-- ========================================

SELECT '=== TESTE 1: CRIAÇÃO BÁSICA ===' as teste;

-- Criar um ticket básico usando a função personalizada
DO $$
DECLARE
  new_ticket_id UUID;
  user_id UUID;
BEGIN
  -- Obter um usuário para teste
  SELECT id INTO user_id FROM auth.users LIMIT 1;
  
  IF user_id IS NOT NULL THEN
    -- Criar ticket usando a função
    SELECT create_ticket(
      'Ticket de Teste Básico',
      'Este é um teste de criação básica de ticket usando a função personalizada.',
      'medium',
      'TI',
      user_id
    ) INTO new_ticket_id;
    
    RAISE NOTICE '✅ Ticket criado com ID: %', new_ticket_id;
  ELSE
    RAISE NOTICE '❌ Nenhum usuário disponível para teste';
  END IF;
END $$;

-- ========================================
-- 3. TESTE 2 - CRIAÇÃO DIRETA NA TABELA
-- ========================================

SELECT '=== TESTE 2: CRIAÇÃO DIRETA ===' as teste;

-- Inserir ticket diretamente na tabela
INSERT INTO public.tickets (
  subject,
  description,
  priority,
  department,
  customer_id,
  status
) 
SELECT 
  'Ticket de Teste Direto',
  'Este ticket foi criado diretamente na tabela para testar a inserção manual.',
  'high'::ticket_priority,
  'Suporte',
  u.id,
  'open'::ticket_status
FROM auth.users u 
LIMIT 1;

-- ========================================
-- 4. TESTE 3 - MÚLTIPLOS TICKETS
-- ========================================

SELECT '=== TESTE 3: MÚLTIPLOS TICKETS ===' as teste;

-- Criar vários tickets de uma vez
INSERT INTO public.tickets (
  subject,
  description,
  priority,
  department,
  customer_id,
  status
)
SELECT 
  'Ticket ' || i || ' - ' || 
  (ARRAY['Problema de Rede', 'Erro no Sistema', 'Solicitação de Acesso', 'Backup Falhando', 'Atualização Necessária'])[i],
  'Descrição detalhada do ticket número ' || i || '. Este ticket foi criado automaticamente para teste.',
  (ARRAY['low', 'medium', 'high', 'urgent'])[((i-1) % 4) + 1]::ticket_priority,
  (ARRAY['TI', 'RH', 'Financeiro', 'Comercial'])[((i-1) % 4) + 1],
  u.id,
  (ARRAY['open', 'in_progress'])[((i-1) % 2) + 1]::ticket_status
FROM auth.users u, generate_series(1, 5) i
LIMIT 5;

-- ========================================
-- 5. TESTE 4 - TICKETS COM DATAS ESPECÍFICAS
-- ========================================

SELECT '=== TESTE 4: TICKETS COM DATAS ===' as teste;

-- Criar ticket com data estimada
INSERT INTO public.tickets (
  subject,
  description,
  priority,
  department,
  customer_id,
  status,
  estimated_date
)
SELECT 
  'Ticket com Prazo Definido',
  'Este ticket possui uma data estimada de conclusão definida.',
  'urgent'::ticket_priority,
  'TI',
  u.id,
  'open'::ticket_status,
  CURRENT_DATE + INTERVAL '7 days'
FROM auth.users u 
LIMIT 1;

-- ========================================
-- 6. VERIFICAR RESULTADOS DOS TESTES
-- ========================================

SELECT '=== RESULTADOS DOS TESTES ===' as resultado;

-- Contar tickets criados
SELECT 
  'Total de tickets: ' || COUNT(*)::text as total_tickets
FROM public.tickets;

-- Mostrar tickets por status
SELECT 
  status,
  COUNT(*) as quantidade
FROM public.tickets
GROUP BY status
ORDER BY quantidade DESC;

-- Mostrar tickets por prioridade
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

-- Mostrar últimos 10 tickets criados
SELECT 
  ticket_number,
  subject,
  status,
  priority,
  department,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as criado_em
FROM public.tickets
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- 7. TESTE DE COMENTÁRIOS AUTOMÁTICOS
-- ========================================

SELECT '=== TESTE: COMENTÁRIOS AUTOMÁTICOS ===' as teste;

-- Verificar se comentários foram criados automaticamente pelo trigger
SELECT 
  'Comentários automáticos: ' || COUNT(*)::text as total_comentarios
FROM public.ticket_updates
WHERE message = 'Ticket criado';

-- ========================================
-- 8. TESTE DE NUMERAÇÃO AUTOMÁTICA
-- ========================================

SELECT '=== TESTE: NUMERAÇÃO AUTOMÁTICA ===' as teste;

-- Verificar se números de tickets foram gerados corretamente
SELECT 
  ticket_number,
  subject
FROM public.tickets
WHERE ticket_number IS NOT NULL
ORDER BY ticket_number;

-- Verificar padrão de numeração
SELECT 
  CASE 
    WHEN COUNT(*) = COUNT(CASE WHEN ticket_number ~ '^TK-[0-9]{3}$' THEN 1 END) 
    THEN '✅ Todos os tickets seguem o padrão TK-XXX'
    ELSE '❌ Alguns tickets não seguem o padrão correto'
  END as padrao_numeracao
FROM public.tickets
WHERE ticket_number IS NOT NULL;

-- ========================================
-- 9. TESTE DE PERFORMANCE
-- ========================================

SELECT '=== TESTE: PERFORMANCE ===' as teste;

-- Medir tempo de criação de ticket
\timing on

-- Criar 1 ticket para teste de performance
SELECT create_ticket(
  'Teste de Performance',
  'Este ticket foi criado para testar a performance da função de criação.',
  'low',
  'TI'
);

\timing off

-- ========================================
-- 10. LIMPEZA DE TESTE (OPCIONAL)
-- ========================================

-- DESCOMENTE AS LINHAS ABAIXO SE QUISER LIMPAR OS DADOS DE TESTE

-- DELETE FROM public.ticket_updates WHERE ticket_id IN (
--   SELECT id FROM public.tickets WHERE subject LIKE '%Teste%'
-- );

-- DELETE FROM public.tickets WHERE subject LIKE '%Teste%';

-- ========================================
-- RESULTADO FINAL
-- ========================================

SELECT '🎉 TESTES DE CRIAÇÃO CONCLUÍDOS! 🎉' as resultado_final;

-- Estatísticas finais
SELECT 
  'Tickets totais: ' || (SELECT COUNT(*) FROM public.tickets)::text ||
  ' | Comentários: ' || (SELECT COUNT(*) FROM public.ticket_updates)::text ||
  ' | Usuários: ' || (SELECT COUNT(*) FROM auth.users)::text as estatisticas;

-- Verificar integridade dos dados
SELECT 
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM public.tickets t 
      LEFT JOIN auth.users u ON t.customer_id = u.id 
      WHERE u.id IS NULL
    ) 
    THEN '✅ Todos os tickets têm clientes válidos'
    ELSE '❌ Existem tickets com clientes inválidos'
  END as integridade_clientes;

SELECT 
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE ticket_number IS NULL OR ticket_number = ''
    ) 
    THEN '✅ Todos os tickets têm números gerados'
    ELSE '❌ Existem tickets sem número'
  END as integridade_numeracao;

-- ========================================
-- INSTRUÇÕES DE USO
-- ========================================

SELECT '📋 INSTRUÇÕES DE USO' as instrucoes;
SELECT 'Para criar um novo ticket via função:' as exemplo1;
SELECT 'SELECT create_ticket(''Assunto'', ''Descrição'', ''medium'', ''TI'');' as exemplo2;
SELECT 'Para inserir diretamente na tabela, use a estrutura mostrada acima.' as exemplo3; 