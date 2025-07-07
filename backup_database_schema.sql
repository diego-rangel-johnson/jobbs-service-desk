-- ========================================================
-- BACKUP COMPLETO - JOBBS SERVICE DESK
-- Data: Janeiro 2025
-- Status: Banco de dados limpo e otimizado
-- ========================================================

-- Este script contém um backup completo da estrutura 
-- do banco de dados após a limpeza e otimização

-- ========================================
-- 1. CRIAR ENUMS
-- ========================================

-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'support', 'user', 'supervisor');

-- Enum para status de tickets  
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Enum para prioridade de tickets
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- ========================================
-- 2. CRIAR TABELAS
-- ========================================

-- Tabela de empresas
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Tabela de tickets
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  department TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  estimated_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de atualizações de tickets
CREATE TABLE public.ticket_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de anexos de tickets
CREATE TABLE public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ========================================
-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. CRIAR FUNÇÕES ESSENCIAIS
-- ========================================

-- Função para verificar se usuário tem um papel específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para gerar número sequencial de ticket
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE PLPGSQL
AS $$
DECLARE
  next_number INTEGER;
  ticket_number TEXT;
BEGIN
  -- Buscar o próximo número sequencial
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(ticket_number FROM 'TK-(\d+)') AS INTEGER)), 0
  ) + 1 INTO next_number
  FROM public.tickets
  WHERE ticket_number ~ '^TK-\d+$';
  
  -- Formatar como TK-XXXX
  ticket_number := 'TK-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN ticket_number;
END;
$$;

-- Função para listar empresas com contagem de usuários
CREATE OR REPLACE FUNCTION public.get_companies_with_user_count()
RETURNS TABLE (
  id UUID,
  name TEXT,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN,
  user_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    c.id,
    c.name,
    c.document,
    c.email,
    c.phone,
    c.address,
    c.is_active,
    COUNT(p.id) as user_count,
    c.created_at,
    c.updated_at
  FROM public.companies c
  LEFT JOIN public.profiles p ON c.id = p.company_id
  GROUP BY c.id, c.name, c.document, c.email, c.phone, c.address, c.is_active, c.created_at, c.updated_at
  ORDER BY c.name;
$$;

-- Função para listar usuários com detalhes
CREATE OR REPLACE FUNCTION public.get_users_with_details()
RETURNS TABLE (
  profile_id UUID,
  user_id UUID,
  name TEXT,
  email TEXT,
  company_id UUID,
  company_name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    p.id as profile_id,
    p.user_id,
    p.name,
    au.email,
    p.company_id,
    c.name as company_name,
    COALESCE(ur.role::TEXT, 'user') as role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  JOIN auth.users au ON p.user_id = au.id
  LEFT JOIN public.companies c ON p.company_id = c.id
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  ORDER BY p.name;
$$;

-- Função para promover usuário a admin
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO target_user_id
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
  END IF;
  
  -- Inserir role admin (ON CONFLICT DO NOTHING para evitar duplicatas)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Usuário % promovido a admin com sucesso', user_email;
END;
$$;

-- Função para promover usuário a supervisor
CREATE OR REPLACE FUNCTION public.promote_user_to_supervisor(user_email TEXT, company_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO target_user_id
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
  END IF;
  
  -- Atualizar company_id no profile
  UPDATE public.profiles 
  SET company_id = promote_user_to_supervisor.company_id
  WHERE user_id = target_user_id;
  
  -- Inserir role supervisor
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'supervisor')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Usuário % promovido a supervisor da empresa % com sucesso', user_email, company_id;
END;
$$;

-- Função para verificar se é supervisor de empresa
CREATE OR REPLACE FUNCTION public.is_supervisor_of_company(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.user_id
    WHERE ur.user_id = _user_id 
      AND ur.role = 'supervisor'
      AND p.company_id = _company_id
  )
$$;

-- Função para verificar acesso ao ticket
CREATE OR REPLACE FUNCTION public.can_view_ticket(
  _user_id UUID,
  _ticket_customer_id UUID,
  _ticket_assignee_id UUID,
  _ticket_company_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT (
    -- É o cliente do ticket
    _ticket_customer_id = _user_id OR
    
    -- É o atribuído do ticket
    _ticket_assignee_id = _user_id OR
    
    -- É admin ou support
    public.has_role(_user_id, 'admin') OR
    public.has_role(_user_id, 'support') OR
    
    -- É supervisor da empresa do ticket
    (_ticket_company_id IS NOT NULL AND public.is_supervisor_of_company(_user_id, _ticket_company_id))
  )
$$;

-- ========================================
-- 5. CRIAR TRIGGERS
-- ========================================

-- Trigger para gerar ticket_number automaticamente
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number = public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ticket_number_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_number();

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 6. CRIAR POLÍTICAS RLS
-- ========================================

-- Políticas para COMPANIES
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (
  id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all companies" ON public.companies FOR SELECT USING (
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Support can view all companies" ON public.companies FOR SELECT USING (
  public.has_role(auth.uid(), 'support')
);

CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can manage companies" ON public.companies FOR ALL USING (
  auth.role() = 'authenticated'
);

-- Políticas para PROFILES
CREATE POLICY "Authenticated users can manage profiles" ON public.profiles FOR ALL USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "Permitir tudo para authenticated - profiles" ON public.profiles FOR ALL USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "Permitir tudo para anon - profiles" ON public.profiles FOR ALL USING (
  auth.role() = 'anon'
);

-- Políticas para USER_ROLES
CREATE POLICY "Authenticated users can manage roles" ON public.user_roles FOR ALL USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "Permitir tudo para authenticated - roles" ON public.user_roles FOR ALL USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "Permitir tudo para anon - roles" ON public.user_roles FOR ALL USING (
  auth.role() = 'anon'
);

-- Políticas para TICKETS
CREATE POLICY "Users can view accessible tickets" ON public.tickets FOR SELECT USING (
  public.can_view_ticket(auth.uid(), customer_id, assignee_id, company_id)
);

CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (
  auth.uid() = customer_id
);

CREATE POLICY "Authorized users can update tickets" ON public.tickets FOR UPDATE USING (
  public.can_view_ticket(auth.uid(), customer_id, assignee_id, company_id)
);

CREATE POLICY "Permitir tudo para authenticated" ON public.tickets FOR ALL USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "Permitir tudo para anon" ON public.tickets FOR ALL USING (
  auth.role() = 'anon'
);

-- Políticas para TICKET_UPDATES
CREATE POLICY "Users can view updates for accessible tickets" ON public.ticket_updates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id AND public.can_view_ticket(auth.uid(), customer_id, assignee_id, company_id)
  )
);

CREATE POLICY "Users can create updates for accessible tickets" ON public.ticket_updates FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id AND public.can_view_ticket(auth.uid(), customer_id, assignee_id, company_id)
  )
);

CREATE POLICY "Permitir tudo para authenticated - updates" ON public.ticket_updates FOR ALL USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "Permitir tudo para anon - updates" ON public.ticket_updates FOR ALL USING (
  auth.role() = 'anon'
);

-- Políticas para TICKET_ATTACHMENTS
CREATE POLICY "Users can view attachments for accessible tickets" ON public.ticket_attachments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id AND public.can_view_ticket(auth.uid(), customer_id, assignee_id, company_id)
  )
);

CREATE POLICY "Users can upload attachments to accessible tickets" ON public.ticket_attachments FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id AND public.can_view_ticket(auth.uid(), customer_id, assignee_id, company_id)
  )
);

-- ========================================
-- 7. COMENTÁRIOS DE DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE public.companies IS 'Tabela de empresas/organizações do sistema';
COMMENT ON TABLE public.profiles IS 'Perfis dos usuários com informações básicas';
COMMENT ON TABLE public.user_roles IS 'Papéis/funções dos usuários no sistema';
COMMENT ON TABLE public.tickets IS 'Tickets de suporte do sistema';
COMMENT ON TABLE public.ticket_updates IS 'Atualizações/comentários dos tickets';
COMMENT ON TABLE public.ticket_attachments IS 'Anexos dos tickets';

COMMENT ON FUNCTION public.generate_ticket_number() IS 'Gera números sequenciais para tickets (TK-0001, TK-0002, etc.)';
COMMENT ON FUNCTION public.has_role(UUID, app_role) IS 'Verifica se um usuário possui um papel específico';
COMMENT ON FUNCTION public.can_view_ticket(UUID, UUID, UUID, UUID) IS 'Verifica se um usuário pode visualizar um ticket específico';

-- ========================================
-- FIM DO BACKUP
-- ========================================

-- Este backup representa o estado otimizado do banco de dados
-- Jobbs Service Desk após a limpeza completa em Janeiro 2025 