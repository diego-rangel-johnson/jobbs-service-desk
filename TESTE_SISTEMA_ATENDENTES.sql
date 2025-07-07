-- ========================================
-- 🧪 TESTE DO SISTEMA DE ATENDENTES  
-- ========================================
-- Execute após aplicar APLICAR_SISTEMA_ATENDENTES_AGORA.sql
-- ========================================

-- 1. Verificar tabelas criadas
SELECT 'TABELAS CRIADAS:' as resultado;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'organization_users', 'attendant_organizations');

-- 2. Verificar funções criadas
SELECT 'FUNÇÕES CRIADAS:' as resultado;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%attendant%';

-- 3. Verificar organizações criadas
SELECT 'ORGANIZAÇÕES CRIADAS:' as resultado;
SELECT name, slug, plan_type FROM public.organizations;

-- 4. Testar função básica
SELECT 'TESTE DE FUNÇÃO:' as resultado;
SELECT public.is_attendant(gen_random_uuid()) as resultado_funcao;

-- 5. Verificar RLS
SELECT 'RLS ATIVADO:' as resultado;
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'organization_users', 'attendant_organizations');

-- 6. Resultado final
SELECT 'RESULTADO FINAL:' as resultado;
SELECT CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('organizations', 'organization_users', 'attendant_organizations')) = 3
    AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%attendant%') >= 6
    AND (SELECT COUNT(*) FROM public.organizations) >= 3
    THEN '✅ SISTEMA IMPLEMENTADO COM SUCESSO!'
    ELSE '❌ Sistema incompleto - reexecute APLICAR_SISTEMA_ATENDENTES_AGORA.sql'
END as status_final;

-- ======================================== 