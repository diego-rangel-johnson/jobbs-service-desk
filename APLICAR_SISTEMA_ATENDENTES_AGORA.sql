-- ========================================
-- 🚀 APLICAR SISTEMA DE ATENDENTES - FINAL
-- ========================================
-- 📍 Execute este arquivo no SQL Editor do Supabase:
-- 🔗 https://app.supabase.com/project/tjjpwsjrmoisowewebcs/sql/new
-- ========================================

-- 1. Criar tabela organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    plan_type TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Criar tabela organization_users
CREATE TABLE IF NOT EXISTS public.organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(organization_id, user_id),
    CONSTRAINT valid_roles CHECK (role IN ('admin', 'member', 'viewer', 'atendente'))
);

-- 3. Criar tabela attendant_organizations
CREATE TABLE IF NOT EXISTS public.attendant_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(attendant_id, organization_id)
);

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_attendant_organizations_organization_id 
ON public.attendant_organizations(organization_id);

-- 5. Habilitar RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendant_organizations ENABLE ROW LEVEL SECURITY;

-- 6. Função: Verificar se é atendente
CREATE OR REPLACE FUNCTION public.is_attendant(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM attendant_organizations 
        WHERE attendant_id = user_id
    );
$$;

-- 7. Função: Verificar permissão em organização
CREATE OR REPLACE FUNCTION public.is_attendant_of_organization(user_id UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM attendant_organizations 
        WHERE attendant_id = user_id 
        AND organization_id = org_id
    );
$$;

-- 8. Função: Promover usuário a atendente
CREATE OR REPLACE FUNCTION public.promote_user_to_attendant(user_id UUID, organization_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.organization_users (organization_id, user_id, role)
    VALUES (organization_id, user_id, 'atendente')
    ON CONFLICT (organization_id, user_id) 
    DO UPDATE SET role = 'atendente';
    
    INSERT INTO public.attendant_organizations (attendant_id, organization_id)
    VALUES (user_id, organization_id)
    ON CONFLICT (attendant_id, organization_id) DO NOTHING;
END;
$$;

-- 9. Função: Definir organizações do atendente
CREATE OR REPLACE FUNCTION public.set_attendant_organizations(attendant_id UUID, organization_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    org_id UUID;
BEGIN
    DELETE FROM public.attendant_organizations 
    WHERE attendant_id = set_attendant_organizations.attendant_id;
    
    FOREACH org_id IN ARRAY organization_ids
    LOOP
        INSERT INTO public.attendant_organizations (attendant_id, organization_id)
        VALUES (set_attendant_organizations.attendant_id, org_id)
        ON CONFLICT (attendant_id, organization_id) DO NOTHING;
        
        INSERT INTO public.organization_users (organization_id, user_id, role)
        VALUES (org_id, set_attendant_organizations.attendant_id, 'atendente')
        ON CONFLICT (organization_id, user_id) 
        DO UPDATE SET role = 'atendente';
    END LOOP;
END;
$$;

-- 10. Função: Obter organizações do atendente
CREATE OR REPLACE FUNCTION public.get_attendant_organizations(attendant_id UUID)
RETURNS TABLE(
    organization_id UUID,
    organization_name TEXT,
    organization_slug TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT o.id, o.name, o.slug
    FROM attendant_organizations ao
    JOIN organizations o ON ao.organization_id = o.id
    WHERE ao.attendant_id = get_attendant_organizations.attendant_id;
$$;

-- 11. Função: Listar atendentes
CREATE OR REPLACE FUNCTION public.get_attendants_with_organizations()
RETURNS TABLE(
    attendant_id UUID,
    attendant_email TEXT,
    organization_count BIGINT,
    organizations TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT DISTINCT
        ao.attendant_id,
        au.email,
        COUNT(ao.organization_id) as organization_count,
        ARRAY_AGG(o.name) as organizations
    FROM attendant_organizations ao
    JOIN auth.users au ON ao.attendant_id = au.id
    JOIN organizations o ON ao.organization_id = o.id
    GROUP BY ao.attendant_id, au.email;
$$;

-- 12. Função: Controle de acesso
CREATE OR REPLACE FUNCTION public.can_view_organization_interactions(user_id UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT 
        EXISTS (SELECT 1 FROM organization_users WHERE user_id = can_view_organization_interactions.user_id AND role = 'admin')
        OR
        EXISTS (SELECT 1 FROM organization_users WHERE user_id = can_view_organization_interactions.user_id AND organization_id = org_id)
        OR
        EXISTS (SELECT 1 FROM attendant_organizations WHERE attendant_id = can_view_organization_interactions.user_id AND organization_id = org_id);
$$;

-- 13. Políticas RLS
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations FOR SELECT 
USING (
    (SELECT auth.uid()) IN (
        SELECT user_id FROM organization_users WHERE organization_id = id
        UNION
        SELECT attendant_id FROM attendant_organizations WHERE organization_id = id
    )
);

DROP POLICY IF EXISTS "Users can view their organization memberships" ON public.organization_users;
CREATE POLICY "Users can view their organization memberships" 
ON public.organization_users FOR SELECT 
USING (
    (SELECT auth.uid()) = user_id
    OR
    (SELECT auth.uid()) IN (
        SELECT user_id FROM organization_users WHERE role = 'admin' AND organization_id = organization_users.organization_id
    )
);

DROP POLICY IF EXISTS "Attendants can view their assignments" ON public.attendant_organizations;
CREATE POLICY "Attendants can view their assignments" 
ON public.attendant_organizations FOR SELECT 
USING (
    (SELECT auth.uid()) = attendant_id
    OR
    (SELECT auth.uid()) IN (
        SELECT user_id FROM organization_users WHERE role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admins can manage attendant assignments" ON public.attendant_organizations;
CREATE POLICY "Admins can manage attendant assignments" 
ON public.attendant_organizations FOR ALL 
USING (
    (SELECT auth.uid()) IN (
        SELECT user_id FROM organization_users WHERE role = 'admin'
    )
);

-- 14. Dados de exemplo
INSERT INTO public.organizations (name, slug, description, plan_type)
VALUES 
    ('Empresa Tech', 'empresa-tech', 'Empresa de tecnologia', 'professional'),
    ('Consultoria Digital', 'consultoria-digital', 'Consultoria digital', 'professional'),
    ('Suporte 24h', 'suporte-24h', 'Suporte técnico 24h', 'enterprise')
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- 🎉 IMPLEMENTAÇÃO COMPLETA!
-- ========================================
-- ✅ 3 Tabelas criadas
-- ✅ 7 Funções implementadas  
-- ✅ Políticas RLS configuradas
-- ✅ 3 Organizações de exemplo
-- ✅ Sistema pronto para uso
-- ======================================== 