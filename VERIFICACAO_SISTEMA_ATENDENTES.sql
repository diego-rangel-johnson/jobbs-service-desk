-- ========================================
-- VERIFICAÇÃO COMPLETA DO SISTEMA DE ATENDENTES
-- Execute este script no SQL Editor do Supabase para verificar se tudo foi implementado corretamente
-- ========================================

-- 1. VERIFICAR TABELAS CRIADAS
SELECT 
    '🔍 VERIFICANDO TABELAS...' as status,
    '' as detalhes;

SELECT 
    table_name as tabela,
    CASE 
        WHEN table_name = 'organizations' THEN '✅ Tabela de organizações'
        WHEN table_name = 'organization_users' THEN '✅ Tabela de usuários das organizações'
        WHEN table_name = 'attendant_organizations' THEN '✅ Tabela principal de atendentes'
        ELSE '❓ Outra tabela'
    END as descricao
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'organization_users', 'attendant_organizations')
ORDER BY table_name;

-- 2. VERIFICAR FUNÇÕES CRIADAS
SELECT 
    '🔍 VERIFICANDO FUNÇÕES...' as status,
    '' as detalhes;

SELECT 
    routine_name as funcao,
    CASE 
        WHEN routine_name = 'is_attendant' THEN '✅ Verifica se usuário é atendente'
        WHEN routine_name = 'is_attendant_of_organization' THEN '✅ Verifica permissão específica'
        WHEN routine_name = 'promote_user_to_attendant' THEN '✅ Promove usuário a atendente'
        WHEN routine_name = 'set_attendant_organizations' THEN '✅ Define organizações do atendente'
        WHEN routine_name = 'get_attendant_organizations' THEN '✅ Lista organizações do atendente'
        WHEN routine_name = 'get_attendants_with_organizations' THEN '✅ Lista todos os atendentes'
        WHEN routine_name = 'can_view_organization_interactions' THEN '✅ Controle de acesso'
        ELSE '❓ Outra função'
    END as descricao
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%attendant%'
ORDER BY routine_name;

-- 3. VERIFICAR CONSTRAINT DE ROLES
SELECT 
    '🔍 VERIFICANDO CONSTRAINT DE ROLES...' as status,
    '' as detalhes;

SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'organization_users'
AND constraint_name = 'valid_roles';

-- 4. VERIFICAR ÍNDICES
SELECT 
    '🔍 VERIFICANDO ÍNDICES...' as status,
    '' as detalhes;

SELECT 
    indexname as indice,
    tablename as tabela,
    indexdef as definicao
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname = 'idx_attendant_organizations_organization_id';

-- 5. VERIFICAR POLÍTICAS RLS
SELECT 
    '🔍 VERIFICANDO POLÍTICAS RLS...' as status,
    '' as detalhes;

SELECT 
    tablename as tabela,
    policyname as politica,
    cmd as operacao,
    qual as condicao
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'organization_users', 'attendant_organizations')
ORDER BY tablename, policyname;

-- 6. VERIFICAR ORGANIZAÇÕES DE EXEMPLO
SELECT 
    '🔍 VERIFICANDO DADOS DE TESTE...' as status,
    '' as detalhes;

SELECT 
    name as organizacao,
    slug,
    plan_type,
    created_at
FROM public.organizations
ORDER BY name;

-- 7. TESTAR FUNÇÕES BÁSICAS
SELECT 
    '🔍 TESTANDO FUNÇÕES...' as status,
    '' as detalhes;

-- Testar função is_attendant (deve retornar false para UUID aleatório)
SELECT 
    'is_attendant' as funcao,
    public.is_attendant(gen_random_uuid()) as resultado,
    'Deve retornar FALSE para UUID aleatório' as esperado;

-- 8. VERIFICAR ESTRUTURA DAS TABELAS
SELECT 
    '🔍 VERIFICANDO ESTRUTURA...' as status,
    '' as detalhes;

-- Estrutura da tabela attendant_organizations
SELECT 
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'attendant_organizations'
ORDER BY ordinal_position;

-- 9. VERIFICAR RLS ATIVADO
SELECT 
    '🔍 VERIFICANDO RLS ATIVADO...' as status,
    '' as detalhes;

SELECT 
    tablename as tabela,
    rowsecurity as rls_ativado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'organization_users', 'attendant_organizations')
ORDER BY tablename;

-- 10. RESUMO FINAL
SELECT 
    '🎉 VERIFICAÇÃO CONCLUÍDA!' as status,
    '' as detalhes;

-- Contar elementos criados
SELECT 
    'RESUMO' as categoria,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('organizations', 'organization_users', 'attendant_organizations')) as tabelas_criadas,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'public' 
     AND routine_name LIKE '%attendant%') as funcoes_criadas,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' 
     AND tablename IN ('organizations', 'organization_users', 'attendant_organizations')) as politicas_rls,
    (SELECT COUNT(*) FROM public.organizations) as organizacoes_exemplo;

-- ========================================
-- INTERPRETAÇÃO DOS RESULTADOS
-- ========================================

/*
✅ SINAIS DE SUCESSO:
- 3 tabelas criadas: organizations, organization_users, attendant_organizations
- 6+ funções com "attendant" no nome
- Constraint "valid_roles" na tabela organization_users
- Índice "idx_attendant_organizations_organization_id"
- Políticas RLS ativas em todas as tabelas
- 3 organizações de exemplo criadas
- RLS = true para todas as tabelas

❌ SINAIS DE PROBLEMA:
- Tabelas ausentes
- Funções não encontradas
- Políticas RLS não criadas
- RLS = false

🔧 SE ALGO ESTIVER FALTANDO:
- Execute novamente o conteúdo do arquivo: supabase/migrations/20250707183611_implement_attendant_system.sql
*/ 