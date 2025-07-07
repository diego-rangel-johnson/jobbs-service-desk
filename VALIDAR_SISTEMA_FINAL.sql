-- ========================================
-- VALIDAÇÃO FINAL - Execute no SQL Editor após aplicar o sistema
-- ========================================

-- 1. Verificar tabelas criadas
SELECT 'TABELAS CRIADAS:' as status;
SELECT table_name, 'Criada com sucesso' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'organization_users', 'attendant_organizations');

-- 2. Verificar funções criadas  
SELECT 'FUNÇÕES CRIADAS:' as status;
SELECT routine_name, 'Função disponível' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%attendant%';

-- 3. Verificar organizações de exemplo
SELECT 'ORGANIZAÇÕES DE EXEMPLO:' as status;
SELECT name, slug, plan_type 
FROM public.organizations;

-- 4. Testar função básica
SELECT 'TESTE DE FUNÇÃO:' as status;
SELECT public.is_attendant(gen_random_uuid()) as resultado, 
       'Deve retornar FALSE' as esperado;

-- 5. Verificar RLS ativado
SELECT 'RLS ATIVADO:' as status;
SELECT tablename, rowsecurity as rls_ativo
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'organization_users', 'attendant_organizations');

-- ========================================
-- SE TUDO MOSTRAR DADOS, O SISTEMA FUNCIONOU!
-- ======================================== 