-- 🔍 DIAGNÓSTICO COMPLETO - JOBBS SERVICE DESK
-- Execute este arquivo no Supabase Dashboard > SQL Editor para diagnosticar problemas

-- ========================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================

SELECT '=== 1. VERIFICANDO ESTRUTURA DAS TABELAS ===' as diagnostico;

-- Verificar se as tabelas existem
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'user_roles', 'tickets', 'ticket_updates')
ORDER BY table_name;

-- Verificar colunas da tabela tickets
SELECT '=== ESTRUTURA DA TABELA TICKETS ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

-- Verificar se os ENUMS existem
SELECT '=== VERIFICANDO ENUMS ===' as info;
SELECT 
  t.typname as enum_name,
  CASE 
    WHEN t.typname IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
FROM pg_type t 
WHERE t.typname IN ('app_role', 'ticket_status', 'ticket_priority');

-- ========================================
-- 2. VERIFICAR DADOS BÁSICOS
-- ========================================

SELECT '=== 2. VERIFICANDO DADOS BÁSICOS ===' as diagnostico;

-- Contar usuários
SELECT 
  'auth.users' as tabela,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Tem dados'
    ELSE '❌ Vazia'
  END as status
FROM auth.users;

-- Contar perfis
SELECT 
  'public.profiles' as tabela,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Tem dados'
    ELSE '❌ Vazia'
  END as status
FROM public.profiles;

-- Contar roles
SELECT 
  'public.user_roles' as tabela,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Tem dados'
    ELSE '❌ Vazia'
  END as status
FROM public.user_roles;

-- Contar tickets
SELECT 
  'public.tickets' as tabela,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Tem dados'
    ELSE '❌ Vazia'
  END as status
FROM public.tickets;

-- ========================================
-- 3. VERIFICAR TRIGGERS E FUNÇÕES
-- ========================================

SELECT '=== 3. VERIFICANDO TRIGGERS E FUNÇÕES ===' as diagnostico;

-- Verificar funções
SELECT 
  routine_name as funcao,
  CASE 
    WHEN routine_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('generate_ticket_number', 'set_ticket_number', 'handle_new_ticket', 'create_ticket')
ORDER BY routine_name;

-- Verificar triggers
SELECT 
  trigger_name,
  event_object_table,
  CASE 
    WHEN trigger_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- ========================================
-- 4. VERIFICAR POLÍTICAS RLS
-- ========================================

SELECT '=== 4. VERIFICANDO POLÍTICAS RLS ===' as diagnostico;

-- Status do RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'user_roles', 'tickets', 'ticket_updates');

-- Políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as comando,
  CASE 
    WHEN qual IS NULL THEN 'SEM RESTRIÇÃO'
    ELSE 'COM RESTRIÇÃO'
  END as tipo_restricao
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 5. TESTE DE CRIAÇÃO MANUAL
-- ========================================

SELECT '=== 5. TESTE DE CRIAÇÃO MANUAL ===' as diagnostico;

-- Tentar criar um ticket manualmente
DO $$
DECLARE
  test_user_id UUID;
  new_ticket_id UUID;
BEGIN
  -- Obter primeiro usuário
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '❌ ERRO: Nenhum usuário encontrado na tabela auth.users';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Usuário encontrado: %', test_user_id;
  
  -- Tentar inserir ticket
  BEGIN
    INSERT INTO public.tickets (
      subject,
      description,
      priority,
      department,
      customer_id,
      status
    ) VALUES (
      'TESTE DIAGNÓSTICO',
      'Este é um ticket de teste do diagnóstico',
      'medium',
      'TI',
      test_user_id,
      'open'
    ) RETURNING id INTO new_ticket_id;
    
    RAISE NOTICE '✅ SUCESSO: Ticket criado com ID %', new_ticket_id;
    
    -- Verificar se o número foi gerado
    DECLARE
      ticket_number_generated TEXT;
    BEGIN
      SELECT ticket_number INTO ticket_number_generated 
      FROM public.tickets 
      WHERE id = new_ticket_id;
      
      IF ticket_number_generated IS NOT NULL THEN
        RAISE NOTICE '✅ Número do ticket gerado: %', ticket_number_generated;
      ELSE
        RAISE NOTICE '❌ ERRO: Número do ticket não foi gerado';
      END IF;
    END;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ ERRO ao inserir ticket: %', SQLERRM;
  END;
  
END $$;

-- ========================================
-- 6. VERIFICAR INTEGRIDADE DOS DADOS
-- ========================================

SELECT '=== 6. VERIFICANDO INTEGRIDADE DOS DADOS ===' as diagnostico;

-- Verificar se há usuários sem perfil
SELECT 
  'Usuários sem perfil' as problema,
  COUNT(*) as quantidade
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- Verificar se há perfis sem usuário
SELECT 
  'Perfis sem usuário' as problema,
  COUNT(*) as quantidade
FROM public.profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Verificar se há tickets sem cliente válido
SELECT 
  'Tickets sem cliente válido' as problema,
  COUNT(*) as quantidade
FROM public.tickets t
LEFT JOIN auth.users u ON t.customer_id = u.id
WHERE u.id IS NULL;

-- ========================================
-- 7. MOSTRAR DADOS ATUAIS
-- ========================================

SELECT '=== 7. DADOS ATUAIS ===' as diagnostico;

-- Mostrar usuários
SELECT '--- USUÁRIOS ---' as secao;
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at
LIMIT 5;

-- Mostrar perfis
SELECT '--- PERFIS ---' as secao;
SELECT 
  user_id,
  name,
  created_at
FROM public.profiles
ORDER BY created_at
LIMIT 5;

-- Mostrar roles
SELECT '--- ROLES ---' as secao;
SELECT 
  ur.user_id,
  ur.role,
  u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
ORDER BY ur.created_at
LIMIT 5;

-- Mostrar tickets
SELECT '--- TICKETS ---' as secao;
SELECT 
  id,
  ticket_number,
  subject,
  status,
  priority,
  created_at
FROM public.tickets
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- 8. VERIFICAR LOGS DE ERRO
-- ========================================

SELECT '=== 8. TESTE DE FUNÇÕES ESPECÍFICAS ===' as diagnostico;

-- Testar função de geração de número
DO $$
DECLARE
  numero_gerado TEXT;
BEGIN
  BEGIN
    SELECT generate_ticket_number() INTO numero_gerado;
    RAISE NOTICE '✅ Função generate_ticket_number() funciona: %', numero_gerado;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ ERRO na função generate_ticket_number(): %', SQLERRM;
  END;
END $$;

-- Testar função create_ticket se existir
DO $$
DECLARE
  ticket_id_criado UUID;
  user_test_id UUID;
BEGIN
  -- Obter usuário para teste
  SELECT id INTO user_test_id FROM auth.users LIMIT 1;
  
  IF user_test_id IS NOT NULL THEN
    BEGIN
      SELECT create_ticket(
        'TESTE FUNÇÃO CREATE_TICKET',
        'Testando a função create_ticket',
        'low',
        'TI',
        user_test_id
      ) INTO ticket_id_criado;
      
      RAISE NOTICE '✅ Função create_ticket() funciona: %', ticket_id_criado;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO na função create_ticket(): %', SQLERRM;
    END;
  END IF;
END $$;

-- ========================================
-- 9. RESUMO DO DIAGNÓSTICO
-- ========================================

SELECT '=== 9. RESUMO DO DIAGNÓSTICO ===' as diagnostico;

-- Contagem final
SELECT 
  'Usuários: ' || (SELECT COUNT(*) FROM auth.users)::text ||
  ' | Perfis: ' || (SELECT COUNT(*) FROM public.profiles)::text ||
  ' | Roles: ' || (SELECT COUNT(*) FROM public.user_roles)::text ||
  ' | Tickets: ' || (SELECT COUNT(*) FROM public.tickets)::text as contagem_final;

-- ========================================
-- 10. RECOMENDAÇÕES
-- ========================================

SELECT '=== 10. RECOMENDAÇÕES ===' as diagnostico;

SELECT 'Se não há tickets, execute o próximo arquivo: CORRECAO_DEFINITIVA_TICKETS.sql' as recomendacao1;
SELECT 'Se há erros de RLS, desabilite temporariamente com: ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;' as recomendacao2;
SELECT 'Se não há usuários, crie um usuário no Supabase Auth primeiro' as recomendacao3;
SELECT 'Verifique os logs do Supabase para erros específicos' as recomendacao4; 