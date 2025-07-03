-- 🔧 SOLUÇÃO COMPLETA - JOBBS SERVICE DESK
-- Execute este arquivo no Supabase Dashboard > SQL Editor para resolver todos os problemas

-- ========================================
-- 1. DESABILITAR RLS TEMPORARIAMENTE (para setup)
-- ========================================

-- Desabilitar RLS temporariamente para permitir inserções via MCP
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. VERIFICAÇÃO DO SISTEMA
-- ========================================

-- Verificar status atual
SELECT 
  'USUÁRIOS' as tipo, 
  COUNT(*) as quantidade 
FROM auth.users
UNION ALL
SELECT 
  'PERFIS' as tipo, 
  COUNT(*) as quantidade 
FROM public.profiles
UNION ALL
SELECT 
  'ROLES' as tipo, 
  COUNT(*) as quantidade 
FROM public.user_roles
UNION ALL
SELECT 
  'TICKETS' as tipo, 
  COUNT(*) as quantidade 
FROM public.tickets;

-- ========================================
-- 3. FORÇAR CRIAÇÃO DE PERFIL (se necessário)
-- ========================================

-- Verificar se perfil existe para todos os usuários
INSERT INTO public.profiles (user_id, name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', 'Admin Sistema')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- ========================================
-- 4. GARANTIR ROLE ADMIN
-- ========================================

-- Garantir que o primeiro usuário seja admin
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  'admin'::app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.role = 'admin'
WHERE ur.user_id IS NULL
ORDER BY u.created_at
LIMIT 1;

-- ========================================
-- 5. CRIAR FUNÇÃO PARA GERAR TICKETS DE TESTE
-- ========================================

-- Função para criar tickets de teste de forma robusta
CREATE OR REPLACE FUNCTION create_test_tickets()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
  counter INTEGER := 1;
  test_subjects TEXT[] := ARRAY[
    'Sistema de Email Inoperante',
    'Atualização de Política de Férias', 
    'Divergência na Folha de Pagamento',
    'Relatório de Vendas Mensais',
    'Implementação de Backup Automático',
    'Configuração de VPN',
    'Atualização do Sistema ERP',
    'Treinamento de Segurança',
    'Manutenção de Servidor',
    'Instalação de Software'
  ];
  test_descriptions TEXT[] := ARRAY[
    'O sistema de email corporativo está completamente fora do ar desde as 08:00.',
    'Solicito a atualização da política de férias conforme as novas diretrizes trabalhistas.',
    'Identificada divergência nos cálculos da folha de pagamento do mês de dezembro.',
    'Solicito a criação de relatório automatizado de vendas mensais para a equipe comercial.',
    'Configurar sistema de backup automático para todos os servidores críticos.',
    'Necessário configurar acesso VPN para trabalho remoto dos funcionários.',
    'Atualização do sistema ERP para nova versão com melhorias de segurança.',
    'Organizar treinamento de segurança da informação para todos os colaboradores.',
    'Manutenção preventiva nos servidores principais do datacenter.',
    'Instalar novo software de gestão de projetos para equipe de desenvolvimento.'
  ];
  priorities ticket_priority[] := ARRAY['low', 'medium', 'high', 'urgent'];
  departments TEXT[] := ARRAY['TI', 'RH', 'Financeiro', 'Comercial', 'Administrativo'];
  statuses ticket_status[] := ARRAY['open', 'in_progress', 'resolved'];
BEGIN
  -- Criar tickets apenas se não existirem
  IF NOT EXISTS (SELECT 1 FROM public.tickets) THEN
    FOR user_record IN SELECT id FROM auth.users LOOP
      FOR i IN 1..5 LOOP
        INSERT INTO public.tickets (
          subject, 
          description, 
          priority, 
          department, 
          customer_id, 
          status
        ) VALUES (
          test_subjects[counter],
          test_descriptions[counter],
          priorities[((counter - 1) % 4) + 1],
          departments[((counter - 1) % 5) + 1],
          user_record.id,
          statuses[((counter - 1) % 3) + 1]
        );
        
        counter := counter + 1;
        IF counter > array_length(test_subjects, 1) THEN
          EXIT;
        END IF;
      END LOOP;
      
      IF counter > array_length(test_subjects, 1) THEN
        EXIT;
      END IF;
    END LOOP;
  END IF;
END;
$$;

-- ========================================
-- 6. EXECUTAR CRIAÇÃO DE TICKETS
-- ========================================

-- Executar a função de criação de tickets
SELECT create_test_tickets();

-- ========================================
-- 7. CRIAR COMENTÁRIOS DE TESTE
-- ========================================

-- Função para criar comentários de teste
CREATE OR REPLACE FUNCTION create_test_comments()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_record RECORD;
  user_record RECORD;
  comments TEXT[] := ARRAY[
    'Investigando o problema relatado...',
    'Solução identificada, aguardando aprovação.',
    'Problema resolvido com sucesso!',
    'Aguardando retorno do cliente.',
    'Escalando para nível 2 de suporte.',
    'Realizando testes da solução proposta.',
    'Documentação atualizada.',
    'Implementação em andamento.',
    'Aguardando agendamento com o cliente.',
    'Verificação final concluída.'
  ];
BEGIN
  -- Criar comentários apenas se não existirem
  IF NOT EXISTS (SELECT 1 FROM public.ticket_updates) THEN
    FOR ticket_record IN SELECT id FROM public.tickets LOOP
      FOR user_record IN SELECT id FROM auth.users LIMIT 1 LOOP
        -- Adicionar 1-3 comentários por ticket
        FOR i IN 1..(1 + floor(random() * 3)::integer) LOOP
          INSERT INTO public.ticket_updates (ticket_id, user_id, message)
          VALUES (
            ticket_record.id,
            user_record.id,
            comments[floor(random() * array_length(comments, 1)) + 1]
          );
        END LOOP;
      END LOOP;
    END LOOP;
  END IF;
END;
$$;

-- Executar a função de criação de comentários
SELECT create_test_comments();

-- ========================================
-- 8. RECONFIGURAR POLÍTICAS RLS PARA MCP
-- ========================================

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins and support can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Everyone can view tickets" ON public.tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Everyone can update tickets" ON public.tickets;

-- Remover políticas de outras tabelas
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Reabilitar RLS com políticas permissivas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 9. CRIAR POLÍTICAS PERMISSIVAS PARA MCP
-- ========================================

-- Políticas para PROFILES
CREATE POLICY "Allow all operations on profiles" ON public.profiles 
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para USER_ROLES
CREATE POLICY "Allow all operations on user_roles" ON public.user_roles 
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para TICKETS
CREATE POLICY "Allow all operations on tickets" ON public.tickets 
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para TICKET_UPDATES
CREATE POLICY "Allow all operations on ticket_updates" ON public.ticket_updates 
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 10. CRIAR FUNÇÃO PARA BYPASS DE RLS (opcional)
-- ========================================

-- Função que pode ser usada para operações administrativas
CREATE OR REPLACE FUNCTION bypass_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta função roda com privilégios elevados
  -- Pode ser usada para operações que precisam de acesso total
  NULL;
END;
$$;

-- ========================================
-- 11. CRIAR FUNÇÃO PARA CRIAÇÃO MANUAL DE TICKETS
-- ========================================

-- Função para criar tickets manualmente com validação
CREATE OR REPLACE FUNCTION create_ticket(
  p_subject TEXT,
  p_description TEXT,
  p_priority ticket_priority DEFAULT 'medium',
  p_department TEXT DEFAULT 'TI',
  p_customer_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_ticket_id UUID;
  customer_uuid UUID;
BEGIN
  -- Se customer_id não foi fornecido, usar o primeiro usuário
  IF p_customer_id IS NULL THEN
    SELECT id INTO customer_uuid FROM auth.users LIMIT 1;
  ELSE
    customer_uuid := p_customer_id;
  END IF;
  
  -- Inserir o ticket
  INSERT INTO public.tickets (
    subject,
    description,
    priority,
    department,
    customer_id,
    status
  ) VALUES (
    p_subject,
    p_description,
    p_priority,
    p_department,
    customer_uuid,
    'open'
  ) RETURNING id INTO new_ticket_id;
  
  RETURN new_ticket_id;
END;
$$;

-- ========================================
-- 12. VERIFICAÇÃO FINAL
-- ========================================

-- Mostrar status final
SELECT '=== VERIFICAÇÃO FINAL ===' as status;

-- Verificar usuários e perfis
SELECT 
  u.email,
  p.name,
  string_agg(ur.role::text, ', ' ORDER BY ur.role) as roles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
GROUP BY u.email, p.name;

-- Verificar tickets criados
SELECT 
  '=== TICKETS CRIADOS ===' as info,
  COUNT(*) as total_tickets
FROM public.tickets;

-- Mostrar tickets com detalhes
SELECT 
  t.ticket_number,
  t.subject,
  t.status,
  t.priority,
  t.department,
  p.name as cliente,
  TO_CHAR(t.created_at, 'DD/MM/YYYY HH24:MI') as criado_em
FROM public.tickets t
LEFT JOIN public.profiles p ON t.customer_id = p.user_id
ORDER BY t.created_at DESC;

-- Verificar comentários
SELECT 
  '=== COMENTÁRIOS CRIADOS ===' as info,
  COUNT(*) as total_comentarios
FROM public.ticket_updates;

-- Verificar se políticas foram criadas
SELECT 
  '=== POLÍTICAS RLS ===' as info,
  COUNT(*) as total_politicas
FROM pg_policies 
WHERE schemaname = 'public';

-- ========================================
-- 13. LIMPAR FUNÇÕES TEMPORÁRIAS
-- ========================================

-- Remover funções temporárias de teste
DROP FUNCTION IF EXISTS create_test_tickets();
DROP FUNCTION IF EXISTS create_test_comments();

-- ========================================
-- INSTRUÇÕES FINAIS
-- ========================================

SELECT '🎉 CONFIGURAÇÃO PARA MCP CONCLUÍDA! 🎉' as resultado;
SELECT 'RLS configurado com políticas permissivas para MCP' as info_rls;
SELECT 'Agora o MCP pode inserir dados em todas as tabelas!' as instrucao_mcp;
SELECT 'Função create_ticket() disponível para criação manual' as funcao_extra;
SELECT 'Para produção, considere políticas mais restritivas!' as aviso_seguranca; 