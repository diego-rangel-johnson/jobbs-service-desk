-- 🔧 SCRIPT PARA REMOVER POLÍTICAS RLS - JOBBS SERVICE DESK
-- Execute este arquivo no Supabase Dashboard > SQL Editor

-- ========================================
-- 1. DESABILITAR RLS EM TODAS AS TABELAS
-- ========================================

-- Desabilitar RLS completamente
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ticket_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ticket_attachments DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ========================================

-- Remover políticas da tabela profiles
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can update profiles" ON public.profiles;

-- Remover políticas da tabela user_roles
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Everyone can view user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Everyone can update user_roles" ON public.user_roles;

-- Remover políticas da tabela tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins and support can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Everyone can view tickets" ON public.tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Everyone can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow all operations on tickets" ON public.tickets;

-- Remover políticas da tabela ticket_updates
DROP POLICY IF EXISTS "Users can view ticket updates" ON public.ticket_updates;
DROP POLICY IF EXISTS "Users can create ticket updates" ON public.ticket_updates;
DROP POLICY IF EXISTS "Allow all operations on ticket_updates" ON public.ticket_updates;
DROP POLICY IF EXISTS "Everyone can view ticket_updates" ON public.ticket_updates;
DROP POLICY IF EXISTS "Everyone can update ticket_updates" ON public.ticket_updates;

-- Remover políticas da tabela ticket_attachments
DROP POLICY IF EXISTS "Users can view ticket attachments" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Users can create ticket attachments" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Allow all operations on ticket_attachments" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Everyone can view ticket_attachments" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Everyone can update ticket_attachments" ON public.ticket_attachments;

-- ========================================
-- 3. GARANTIR ACESSO TOTAL (MODO DESENVOLVIMENTO)
-- ========================================

-- Para garantir acesso total durante desenvolvimento, vamos manter RLS desabilitado
-- Isso permite operações sem restrições

-- ========================================
-- 4. VERIFICAR SE DEU CERTO
-- ========================================

-- Verificar status das tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'user_roles', 'tickets', 'ticket_updates', 'ticket_attachments');

-- Verificar se ainda existem políticas
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public';

-- ========================================
-- 5. TESTAR ACESSO
-- ========================================

-- Testar se conseguimos fazer operações básicas
SELECT 'TESTE: Lendo tabela profiles' as teste, COUNT(*) as registros FROM public.profiles;
SELECT 'TESTE: Lendo tabela tickets' as teste, COUNT(*) as registros FROM public.tickets;
SELECT 'TESTE: Lendo tabela user_roles' as teste, COUNT(*) as registros FROM public.user_roles;

-- ========================================
-- RESULTADO
-- ========================================

SELECT '✅ RLS REMOVIDO COM SUCESSO!' as resultado;
SELECT 'Todas as políticas foram removidas' as info1;
SELECT 'RLS está desabilitado em todas as tabelas' as info2;
SELECT 'Agora o MCP pode acessar tudo!' as info3; 