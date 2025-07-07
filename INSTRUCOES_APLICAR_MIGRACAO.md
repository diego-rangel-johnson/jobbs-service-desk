# 🚀 Instruções para Aplicar Migração do Sistema de Atendentes

## 📋 Resumo
Este documento contém as instruções para aplicar manualmente a migração do sistema de atendentes no projeto Supabase.

## 🎯 Projeto
- **ID**: `tjjpwsjrmoisowewebcs`
- **URL**: [https://app.supabase.com/project/tjjpwsjrmoisowewebcs](https://app.supabase.com/project/tjjpwsjrmoisowewebcs)

## 📂 Arquivo de Migração
- **Caminho**: `supabase/migrations/20250707183611_implement_attendant_system.sql`
- **Conteúdo**: Sistema completo de atendentes com tabelas, funções e políticas RLS

## 🔧 Passo a Passo

### **1. Acessar o Dashboard do Supabase**
1. Abrir: [https://app.supabase.com/project/tjjpwsjrmoisowewebcs](https://app.supabase.com/project/tjjpwsjrmoisowewebcs)
2. Fazer login na sua conta
3. Navegar para o projeto correto

### **2. Acessar o SQL Editor**
1. No menu lateral, clicar em **"SQL Editor"**
2. Criar uma nova query
3. Dar o nome: "Sistema de Atendentes"

### **3. Copiar o Código SQL**
Copiar todo o conteúdo do arquivo `supabase/migrations/20250707183611_implement_attendant_system.sql`:

```sql
-- ========================================
-- IMPLEMENTAR SISTEMA DE ATENDENTES
-- ========================================

-- 1. Criar tabela organizations se não existir
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    plan_type TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Criar tabela organization_users se não existir
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

-- 6. Funções do sistema de atendentes

-- Função para verificar se usuário é atendente
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

-- Função para verificar se atendente pode acessar organização
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

-- Função para promover usuário a atendente
CREATE OR REPLACE FUNCTION public.promote_user_to_attendant(user_id UUID, organization_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Adicionar role de atendente na organização
    INSERT INTO public.organization_users (organization_id, user_id, role)
    VALUES (organization_id, user_id, 'atendente')
    ON CONFLICT (organization_id, user_id) 
    DO UPDATE SET role = 'atendente';
    
    -- Adicionar na tabela de atendentes
    INSERT INTO public.attendant_organizations (attendant_id, organization_id)
    VALUES (user_id, organization_id)
    ON CONFLICT (attendant_id, organization_id) DO NOTHING;
END;
$$;

-- Função para definir organizações do atendente
CREATE OR REPLACE FUNCTION public.set_attendant_organizations(attendant_id UUID, organization_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Remover associações existentes
    DELETE FROM public.attendant_organizations 
    WHERE attendant_id = set_attendant_organizations.attendant_id;
    
    -- Adicionar novas associações
    FOREACH org_id IN ARRAY organization_ids
    LOOP
        INSERT INTO public.attendant_organizations (attendant_id, organization_id)
        VALUES (set_attendant_organizations.attendant_id, org_id)
        ON CONFLICT (attendant_id, organization_id) DO NOTHING;
        
        -- Atualizar role na organização
        INSERT INTO public.organization_users (organization_id, user_id, role)
        VALUES (org_id, set_attendant_organizations.attendant_id, 'atendente')
        ON CONFLICT (organization_id, user_id) 
        DO UPDATE SET role = 'atendente';
    END LOOP;
END;
$$;

-- Função para obter organizações do atendente
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
    SELECT 
        o.id,
        o.name,
        o.slug
    FROM attendant_organizations ao
    JOIN organizations o ON ao.organization_id = o.id
    WHERE ao.attendant_id = get_attendant_organizations.attendant_id;
$$;

-- Função para listar todos os atendentes
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

-- Função para verificar se pode ver interações da organização
CREATE OR REPLACE FUNCTION public.can_view_organization_interactions(user_id UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT 
        -- Admin pode ver tudo
        EXISTS (SELECT 1 FROM organization_users WHERE user_id = can_view_organization_interactions.user_id AND role = 'admin')
        OR
        -- Membro da organização pode ver
        EXISTS (SELECT 1 FROM organization_users WHERE user_id = can_view_organization_interactions.user_id AND organization_id = org_id)
        OR
        -- Atendente pode ver organizações que atende
        EXISTS (SELECT 1 FROM attendant_organizations WHERE attendant_id = can_view_organization_interactions.user_id AND organization_id = org_id);
$$;

-- 7. Políticas RLS

-- Políticas para organizations
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations 
FOR SELECT 
USING (
    (SELECT auth.uid()) IN (
        SELECT user_id FROM organization_users WHERE organization_id = id
    )
    OR
    (SELECT auth.uid()) IN (
        SELECT attendant_id FROM attendant_organizations WHERE organization_id = id
    )
);

-- Políticas para organization_users
DROP POLICY IF EXISTS "Users can view their organization memberships" ON public.organization_users;
CREATE POLICY "Users can view their organization memberships" 
ON public.organization_users 
FOR SELECT 
USING (
    (SELECT auth.uid()) = user_id
    OR
    (SELECT auth.uid()) IN (
        SELECT user_id FROM organization_users WHERE role = 'admin' AND organization_id = organization_users.organization_id
    )
);

-- Políticas para attendant_organizations
DROP POLICY IF EXISTS "Attendants can view their assignments" ON public.attendant_organizations;
CREATE POLICY "Attendants can view their assignments" 
ON public.attendant_organizations 
FOR SELECT 
USING (
    (SELECT auth.uid()) = attendant_id
    OR
    (SELECT auth.uid()) IN (
        SELECT user_id FROM organization_users WHERE role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admins can manage attendant assignments" ON public.attendant_organizations;
CREATE POLICY "Admins can manage attendant assignments" 
ON public.attendant_organizations 
FOR ALL 
USING (
    (SELECT auth.uid()) IN (
        SELECT user_id FROM organization_users WHERE role = 'admin'
    )
);

-- 8. Dados de teste (opcional)

-- Criar organizações de exemplo se não existirem
INSERT INTO public.organizations (name, slug, description, plan_type)
VALUES 
    ('Empresa Tech', 'empresa-tech', 'Empresa de tecnologia', 'professional'),
    ('Consultoria Digital', 'consultoria-digital', 'Consultoria em transformação digital', 'professional'),
    ('Suporte 24h', 'suporte-24h', 'Suporte técnico 24 horas', 'enterprise')
ON CONFLICT (slug) DO NOTHING;
```

### **4. Executar a Migração**
1. Colar o código SQL no editor
2. Clicar em **"Run"** para executar
3. Aguardar confirmação de sucesso

### **5. Verificar Resultados**
Após a execução, execute as seguintes queries para verificar se tudo foi criado corretamente:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'organization_users', 'attendant_organizations');

-- Verificar funções criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%attendant%';

-- Verificar dados de teste
SELECT * FROM public.organizations;
```

## ✅ Validação

### **Testes Básicos**
```sql
-- 1. Testar função básica
SELECT public.is_attendant(gen_random_uuid());

-- 2. Verificar organizações
SELECT COUNT(*) FROM public.organizations;

-- 3. Testar estrutura da tabela
\d public.attendant_organizations;
```

### **Sinais de Sucesso**
- ✅ 3 tabelas criadas: `organizations`, `organization_users`, `attendant_organizations`
- ✅ 6 funções criadas relacionadas a atendentes
- ✅ Políticas RLS aplicadas
- ✅ 3 organizações de exemplo criadas
- ✅ Índices criados para performance

## 🚨 Resolução de Problemas

### **Erro: Tabela já existe**
- **Solução**: Normal, o código usa `IF NOT EXISTS`
- **Ação**: Continuar a execução

### **Erro: Função já existe**
- **Solução**: Normal, o código usa `CREATE OR REPLACE`
- **Ação**: Continuar a execução

### **Erro: Política já existe**
- **Solução**: Normal, o código usa `DROP POLICY IF EXISTS`
- **Ação**: Continuar a execução

### **Erro de Permissão**
- **Verificar**: Se você tem permissões de admin no projeto
- **Solução**: Usar conta de proprietário do projeto

## 🎉 Conclusão

Após executar esta migração, o sistema de atendentes estará **100% funcional** no seu projeto Supabase!

---

*Instruções para o projeto: tjjpwsjrmoisowewebcs*
*Data: 07/07/2025* 