-- ========================================
-- 🧪 TESTE DO SISTEMA CORRIGIDO
-- ========================================
-- Execute este arquivo para verificar se todas as correções foram aplicadas

-- 1. VERIFICAR USUÁRIOS E ROLES
SELECT 'VERIFICANDO USUÁRIOS E ROLES...' as status;

-- Listar todos os usuários com suas roles
SELECT 
    u.email,
    ur.role,
    u.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at;

-- 2. VERIFICAR FUNÇÕES CRIADAS
SELECT 'VERIFICANDO FUNÇÕES...' as status;

-- Testar função de verificação de admin
SELECT 
    u.email,
    public.is_admin(u.id) as is_admin,
    public.is_supervisor(u.id) as is_supervisor,
    public.user_has_role(u.id, 'admin') as has_admin_role
FROM auth.users u
ORDER BY u.created_at;

-- 3. VERIFICAR POLÍTICAS RLS
SELECT 'VERIFICANDO POLÍTICAS RLS...' as status;

-- Listar políticas ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. VERIFICAR PERMISSÕES
SELECT 'VERIFICANDO PERMISSÕES...' as status;

-- Verificar permissões nas tabelas
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
    AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee;

-- 5. TESTE DE ACESSO PARA ADMIN
SELECT 'TESTANDO ACESSO ADMIN...' as status;

-- Simular acesso como admin (substitua o UUID pelo ID do seu usuário admin)
-- SELECT * FROM public.profiles WHERE public.is_admin('UUID_DO_ADMIN_AQUI');

-- 6. VERIFICAR INTEGRIDADE DO SISTEMA
SELECT 'VERIFICANDO INTEGRIDADE...' as status;

-- Contar registros principais
SELECT 
    'Usuários' as tabela,
    COUNT(*) as quantidade
FROM auth.users
UNION ALL
SELECT 
    'Perfis' as tabela,
    COUNT(*) as quantidade
FROM public.profiles
UNION ALL
SELECT 
    'Roles' as tabela,
    COUNT(*) as quantidade
FROM public.user_roles
UNION ALL
SELECT 
    'Empresas' as tabela,
    COUNT(*) as quantidade
FROM public.companies
UNION ALL
SELECT 
    'Tickets' as tabela,
    COUNT(*) as quantidade
FROM public.tickets;

-- 7. VERIFICAR SISTEMA DE ATENDENTES (se existir)
SELECT 'VERIFICANDO SISTEMA DE ATENDENTES...' as status;

-- Verificar se tabelas de atendentes existem
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('organizations', 'organization_users', 'attendant_organizations');

-- 8. RESULTADO FINAL
SELECT 'RESULTADO FINAL DO TESTE:' as status;

SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) FROM auth.users
        ) > 0 
        AND (
            SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin'
        ) > 0
        AND (
            SELECT COUNT(*) FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'is_admin'
        ) > 0
        THEN '✅ SISTEMA CORRIGIDO COM SUCESSO!'
        ELSE '❌ AINDA HÁ PROBLEMAS - VERIFIQUE OS RESULTADOS ACIMA'
    END as resultado_final;

-- 9. PRÓXIMOS PASSOS
SELECT 'PRÓXIMOS PASSOS:' as info;
SELECT '1. Se o teste passou, reinicie a aplicação React' as passo;
SELECT '2. Faça logout e login novamente' as passo;
SELECT '3. Teste a navegação entre dashboards' as passo;
SELECT '4. Teste a criação de usuários' as passo;
SELECT '5. Verifique se admins conseguem acessar Central de Dados' as passo; 