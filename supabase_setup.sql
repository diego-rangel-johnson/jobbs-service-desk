-- JOBBS SERVICE DESK - SETUP COMPLETO DO SUPABASE
-- Execute este arquivo SQL no editor SQL do seu projeto Supabase

-- ========================================
-- 1. CRIAR ENUMS
-- ========================================

-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'support', 'user');

-- Enum para status de tickets  
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Enum para prioridade de tickets
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- ========================================
-- 2. CRIAR TABELAS
-- ========================================

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. CRIAR FUNÇÕES
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
  -- Obter o próximo número sequencial
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.tickets
  WHERE ticket_number ~ '^TK-[0-9]+$';
  
  -- Formatar o número com zeros à esquerda
  ticket_number := 'TK-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN ticket_number;
END;
$$;

-- Função para promover usuário a admin
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Buscar user_id pelo email
    SELECT p.user_id INTO target_user_id
    FROM public.profiles p
    INNER JOIN auth.users u ON u.id = p.user_id
    WHERE u.email = user_email;
    
    IF target_user_id IS NOT NULL THEN
        -- Atualizar role para admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Usuário % promovido a admin com sucesso', user_email;
    ELSE
        RAISE NOTICE 'Usuário com email % não encontrado', user_email;
    END IF;
END;
$$;

-- Função para verificar e criar admin padrão
CREATE OR REPLACE FUNCTION public.ensure_admin_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_count INTEGER;
BEGIN
    -- Contar quantos admins existem
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';
    
    -- Se não há admin, promover o primeiro usuário
    IF admin_count = 0 THEN
        PERFORM public.promote_user_to_admin('admin@exemplo.com');
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  
  -- Atribuir role padrão de user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Função para criar update automático quando ticket é criado
CREATE OR REPLACE FUNCTION public.handle_new_ticket()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  INSERT INTO public.ticket_updates (ticket_id, user_id, message)
  VALUES (NEW.id, NEW.customer_id, 'Ticket criado');
  
  RETURN NEW;
END;
$$;

-- Função para auto-gerar número de ticket
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

-- ========================================
-- 5. CRIAR TRIGGERS
-- ========================================

-- Trigger para gerar número de ticket automaticamente
CREATE TRIGGER set_ticket_number_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_ticket_number();

-- Triggers para atualizar timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para criar update automaticamente quando ticket é criado
CREATE TRIGGER on_ticket_created
  AFTER INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_ticket();

-- ========================================
-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ========================================

-- Políticas para PROFILES
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para USER_ROLES
CREATE POLICY "Allow initial role creation" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para TICKETS
CREATE POLICY "Users can view their own tickets" ON public.tickets FOR SELECT USING (
  auth.uid() = customer_id OR 
  auth.uid() = assignee_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'support')
);

CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins and support can update tickets" ON public.tickets FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'support') OR
  auth.uid() = assignee_id
);

-- Políticas para TICKET_UPDATES
CREATE POLICY "Users can view updates for their tickets" ON public.ticket_updates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id AND (
      customer_id = auth.uid() OR 
      assignee_id = auth.uid() OR
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'support')
    )
  )
);

CREATE POLICY "Users can create updates for accessible tickets" ON public.ticket_updates FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id AND (
      customer_id = auth.uid() OR 
      assignee_id = auth.uid() OR
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'support')
    )
  )
);

-- Políticas para TICKET_ATTACHMENTS
CREATE POLICY "Users can view attachments for their tickets" ON public.ticket_attachments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id AND (
      customer_id = auth.uid() OR 
      assignee_id = auth.uid() OR
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'support')
    )
  )
);

CREATE POLICY "Users can upload attachments to accessible tickets" ON public.ticket_attachments FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id AND (
      customer_id = auth.uid() OR 
      assignee_id = auth.uid() OR
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'support')
    )
  )
);

-- ========================================
-- 7. CONFIGURAR STORAGE
-- ========================================

-- Criar bucket para anexos de tickets (execute no Dashboard do Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', false);

-- Políticas para storage (aplicar depois de criar o bucket)
-- CREATE POLICY "Users can view attachments for their tickets" ON storage.objects FOR SELECT USING (
--   bucket_id = 'ticket-attachments' AND
--   EXISTS (
--     SELECT 1 FROM public.ticket_attachments ta
--     JOIN public.tickets t ON ta.ticket_id = t.id
--     WHERE ta.file_url = name AND (
--       t.customer_id = auth.uid() OR 
--       t.assignee_id = auth.uid() OR
--       public.has_role(auth.uid(), 'admin') OR 
--       public.has_role(auth.uid(), 'support')
--     )
--   )
-- );

-- CREATE POLICY "Users can upload attachments" ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'ticket-attachments' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- ========================================
-- 8. SETUP FINALIZADO
-- ========================================

-- Para criar seu primeiro admin, após criar uma conta, execute:
-- SELECT public.promote_user_to_admin('seu-email@exemplo.com');

-- INSTRUÇÕES FINAIS:
-- 1. Execute este SQL completo no Editor SQL do Supabase
-- 2. Vá para Storage > Create bucket > nome: 'ticket-attachments', public: false
-- 3. Aplique as políticas de storage comentadas acima
-- 4. Crie sua primeira conta de usuário
-- 5. Promova sua conta para admin usando a função promote_user_to_admin 