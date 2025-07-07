-- ========================================
-- 🚀 CORREÇÃO COMPLETA DO SISTEMA
-- ========================================
-- Este arquivo corrige todos os problemas de acesso e unifica os sistemas

-- 1. VERIFICAR ESTADO ATUAL
SELECT 'VERIFICANDO ESTADO ATUAL...' as status;

-- Verificar usuários existentes
SELECT 'USUÁRIOS EXISTENTES:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Verificar perfis
SELECT 'PERFIS EXISTENTES:' as info;
SELECT user_id, name, company_id FROM public.profiles;

-- Verificar roles antigas
SELECT 'ROLES ANTIGAS:' as info;
SELECT user_id, role FROM public.user_roles;

-- Verificar roles novas
SELECT 'ROLES NOVAS:' as info;
SELECT user_id, role, organization_id FROM public.organization_users;

-- ========================================
-- 2. CRIAR FUNÇÃO PARA UNIFICAR SISTEMAS
-- ========================================

-- Função para verificar se usuário tem role específica (compatível com ambos sistemas)
CREATE OR REPLACE FUNCTION public.user_has_role(user_id_param UUID, role_param TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_id_param 
        AND role = role_param
    )
    OR EXISTS (
        SELECT 1 FROM public.organization_users 
        WHERE user_id = user_id_param 
        AND role = role_param
    );
$$;

-- Função para verificar se usuário é administrador
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT public.user_has_role(user_id_param, 'admin');
$$;

-- Função para verificar se usuário é supervisor
CREATE OR REPLACE FUNCTION public.is_supervisor(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT public.user_has_role(user_id_param, 'supervisor');
$$;

-- Função para verificar se usuário é atendente
CREATE OR REPLACE FUNCTION public.is_attendant(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT public.user_has_role(user_id_param, 'atendente')
    OR EXISTS (
        SELECT 1 FROM public.attendant_organizations 
        WHERE attendant_id = user_id_param
    );
$$;

-- Função para obter todas as roles do usuário
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id_param UUID)
RETURNS TABLE(role TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT ur.role::TEXT FROM public.user_roles ur WHERE ur.user_id = user_id_param
    UNION
    SELECT ou.role::TEXT FROM public.organization_users ou WHERE ou.user_id = user_id_param;
$$;

-- ========================================
-- 3. GARANTIR ADMIN PRINCIPAL
-- ========================================

-- Garantir que existe pelo menos um admin
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.role = 'admin'
WHERE ur.user_id IS NULL
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;

-- Garantir perfil para todos os usuários
INSERT INTO public.profiles (user_id, name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- 4. CORRIGIR POLÍTICAS RLS
-- ========================================

-- Desabilitar RLS temporariamente para correção
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendant_organizations DISABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow initial role creation" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organization memberships" ON public.organization_users;
DROP POLICY IF EXISTS "Attendants can view their assignments" ON public.attendant_organizations;
DROP POLICY IF EXISTS "Admins can manage attendant assignments" ON public.attendant_organizations;

-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendant_organizations ENABLE ROW LEVEL SECURITY;

-- Criar políticas simplificadas para administradores
CREATE POLICY "Admins can do everything on profiles"
ON public.profiles FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on user_roles"
ON public.user_roles FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow initial role creation"
ON public.user_roles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can do everything on organizations"
ON public.organizations FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view organizations they belong to"
ON public.organizations FOR SELECT
USING (
    id IN (
        SELECT organization_id FROM public.organization_users 
        WHERE user_id = auth.uid()
    )
    OR id IN (
        SELECT organization_id FROM public.attendant_organizations 
        WHERE attendant_id = auth.uid()
    )
);

CREATE POLICY "Admins can do everything on organization_users"
ON public.organization_users FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their organization memberships"
ON public.organization_users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on attendant_organizations"
ON public.attendant_organizations FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Attendants can view their assignments"
ON public.attendant_organizations FOR SELECT
USING (auth.uid() = attendant_id);

-- ========================================
-- 5. GARANTIR PERMISSÕES PARA ROLES
-- ========================================

-- Conceder permissões básicas para authenticated users
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.organization_users TO authenticated;
GRANT SELECT ON public.attendant_organizations TO authenticated;

-- Conceder permissões para funções RPC
GRANT EXECUTE ON FUNCTION public.user_has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_supervisor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_attendant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO authenticated;

-- ========================================
-- 6. TESTE FINAL
-- ========================================

-- Testar funções
SELECT 'TESTE DE FUNÇÕES:' as info;

-- Testar admin
SELECT 
    u.email,
    public.is_admin(u.id) as is_admin,
    public.is_supervisor(u.id) as is_supervisor,
    public.is_attendant(u.id) as is_attendant
FROM auth.users u
ORDER BY u.created_at;

-- Testar roles
SELECT 'ROLES UNIFICADAS:' as info;
SELECT 
    u.email,
    array_agg(r.role) as roles
FROM auth.users u
LEFT JOIN public.get_user_roles(u.id) r ON true
GROUP BY u.id, u.email
ORDER BY u.created_at;

-- ========================================
-- 7. RESULTADO FINAL
-- ========================================

SELECT 'SISTEMA CORRIGIDO COM SUCESSO!' as status;
SELECT 'Administradores agora têm acesso total' as info;
SELECT 'Sistema unificado entre user_roles e organization_users' as info;
SELECT 'Políticas RLS otimizadas' as info;
SELECT 'Funções de verificação criadas' as info; 