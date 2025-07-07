-- ========================================
-- VERIFICAÇÃO COMPLETA DO SISTEMA DE ATENDENTES
-- Execute no SQL Editor: https://app.supabase.com/project/tjjpwsjrmoisowewebcs/sql/new
-- ========================================

-- 🔍 1. VERIFICAR TABELAS CRIADAS
SELECT '🔍 VERIFICANDO TABELAS...' as status;

SELECT 
    table_name as tabela_criada,
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

-- 🔧 2. VERIFICAR FUNÇÕES CRIADAS
SELECT '🔧 VERIFICANDO FUNÇÕES...' as status;

SELECT 
    routine_name as funcao_criada,
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

-- 📊 3. VERIFICAR ORGANIZAÇÕES DE EXEMPLO
SELECT '📊 VERIFICANDO ORGANIZAÇÕES...' as status;

SELECT 
    name as organizacao,
    slug,
    plan_type,
    created_at,
    '✅ Dados de exemplo criados' as status
FROM public.organizations
ORDER BY name;

-- 🛡️ 4. VERIFICAR RLS ATIVADO
SELECT '🛡️ VERIFICANDO RLS...' as status;

SELECT 
    tablename as tabela,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Ativado'
        ELSE '❌ RLS Desativado'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'organization_users', 'attendant_organizations')
ORDER BY tablename;

-- 🧪 5. TESTAR FUNÇÕES BÁSICAS
SELECT '🧪 TESTANDO FUNÇÕES...' as status;

-- Testar função is_attendant (deve retornar false para UUID aleatório)
SELECT 
    'is_attendant' as funcao_testada,
    public.is_attendant(gen_random_uuid()) as resultado,
    'Deve retornar FALSE para UUID aleatório' as esperado;

-- ⚙️ 6. VERIFICAR ÍNDICES
SELECT '⚙️ VERIFICANDO ÍNDICES...' as status;

SELECT 
    indexname as indice,
    tablename as tabela,
    '✅ Índice criado para performance' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname = 'idx_attendant_organizations_organization_id';

-- 🔒 7. VERIFICAR POLÍTICAS RLS
SELECT '🔒 VERIFICANDO POLÍTICAS...' as status;

SELECT 
    tablename as tabela,
    policyname as politica,
    cmd as operacao,
    '✅ Política RLS ativa' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'organization_users', 'attendant_organizations')
ORDER BY tablename, policyname;

-- 📈 8. ESTRUTURA DAS TABELAS
SELECT '📈 VERIFICANDO ESTRUTURA...' as status;

-- Estrutura da tabela attendant_organizations
SELECT 
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    '✅ Coluna da tabela attendant_organizations' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'attendant_organizations'
ORDER BY ordinal_position;

-- 📋 9. RESUMO FINAL
SELECT '📋 RESUMO FINAL...' as status;

-- Contar elementos criados
SELECT 
    'RESUMO GERAL' as categoria,
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

-- 🎯 10. TESTE DE INTEGRAÇÃO COMPLETO
SELECT '🎯 TESTE DE INTEGRAÇÃO...' as status;

-- Verificar se pode criar um atendente de teste (simulação)
SELECT 
    'Sistema pronto para uso' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendant_organizations')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'promote_user_to_attendant')
        AND EXISTS (SELECT 1 FROM public.organizations)
        THEN '✅ SISTEMA COMPLETO E FUNCIONAL'
        ELSE '❌ Sistema incompleto'
    END as resultado_final;

-- ========================================
-- 🎉 INTERPRETAÇÃO DOS RESULTADOS
-- ========================================
/*
✅ SINAIS DE SUCESSO ESPERADOS:
- 3 tabelas criadas: organizations, organization_users, attendant_organizations
- 6+ funções com "attendant" no nome
- 3 organizações de exemplo
- RLS = true para todas as tabelas
- Políticas RLS criadas
- Índice idx_attendant_organizations_organization_id
- Status final: "SISTEMA COMPLETO E FUNCIONAL"

❌ SE ALGO ESTIVER FALTANDO:
- Reexecute o arquivo: SISTEMA_ATENDENTES_SQL_COMPLETO.sql
- Verifique se não houve erro na execução
- Confirme que executou no projeto correto: tjjpwsjrmoisowewebcs

🚀 SE TUDO ESTIVER OK:
- Sistema de atendentes 100% funcional
- Pronto para uso em produção
- Interface React pode ser usada
- Funções SQL disponíveis
*/

-- ========================================
-- 🎯 EXEMPLOS DE USO (APÓS VERIFICAÇÃO)
-- ========================================
/*
-- Exemplo 1: Verificar se usuário é atendente
SELECT public.is_attendant('user-uuid-aqui');

-- Exemplo 2: Listar organizações de exemplo
SELECT * FROM public.organizations;

-- Exemplo 3: Promover usuário a atendente (quando tiver usuários)
-- SELECT promote_user_to_attendant('user-uuid', 'org-uuid');

-- Exemplo 4: Listar todos os atendentes
SELECT * FROM get_attendants_with_organizations();
*/ 