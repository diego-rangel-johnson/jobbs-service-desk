# 🎯 CONFIGURAÇÃO SUPABASE - PASSO A PASSO DETALHADO

## ⚡ INSTRUÇÕES RÁPIDAS

**Copie e cole cada bloco SQL no seu dashboard do Supabase na ordem apresentada.**

---

## 📋 ETAPA 1: ACESSAR O SUPABASE

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto **Jobbs Service Desk**
4. Vá para **SQL Editor** (ícone no menu lateral)

---

## 🔧 ETAPA 2: EXECUTAR SQL - CRIAR ENUMS

Copie e cole este SQL primeiro:

```sql
-- CRIAR ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'support', 'user');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
```

**➤ Clique RUN ▶️**

---

## 🗄️ ETAPA 3: EXECUTAR SQL - CRIAR TABELAS

Copie e cole este SQL:

```sql
-- CRIAR TABELAS
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

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

CREATE TABLE public.ticket_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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
```

**➤ Clique RUN ▶️**

---

## 🔒 ETAPA 4: EXECUTAR SQL - HABILITAR RLS

Copie e cole este SQL:

```sql
-- HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
```

**➤ Clique RUN ▶️**

---

## ⚙️ ETAPA 5: EXECUTAR SQL - CRIAR FUNÇÕES

Copie e cole este SQL:

```sql
-- FUNÇÕES DO SISTEMA
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

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE PLPGSQL
AS $$
DECLARE
  next_number INTEGER;
  ticket_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.tickets
  WHERE ticket_number ~ '^TK-[0-9]+$';
  
  ticket_number := 'TK-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN ticket_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT p.user_id INTO target_user_id
    FROM public.profiles p
    INNER JOIN auth.users u ON u.id = p.user_id
    WHERE u.email = user_email;
    
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Usuário % promovido a admin com sucesso', user_email;
    ELSE
        RAISE NOTICE 'Usuário com email % não encontrado', user_email;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_admin_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';
    
    IF admin_count = 0 THEN
        PERFORM public.promote_user_to_admin('admin@exemplo.com');
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

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
```

**➤ Clique RUN ▶️**

---

## 🎯 ETAPA 6: EXECUTAR SQL - CRIAR TRIGGERS

Copie e cole este SQL:

```sql
-- CRIAR TRIGGERS
CREATE TRIGGER set_ticket_number_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_ticket_number();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_ticket_created
  AFTER INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_ticket();
```

**➤ Clique RUN ▶️**

---

## 🛡️ ETAPA 7: EXECUTAR SQL - POLÍTICAS RLS (PROFILES)

Copie e cole este SQL:

```sql
-- POLÍTICAS PARA PROFILES
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**➤ Clique RUN ▶️**

---

## 🛡️ ETAPA 8: EXECUTAR SQL - POLÍTICAS RLS (USER_ROLES)

Copie e cole este SQL:

```sql
-- POLÍTICAS PARA USER_ROLES
CREATE POLICY "Allow initial role creation" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

**➤ Clique RUN ▶️**

---

## 🛡️ ETAPA 9: EXECUTAR SQL - POLÍTICAS RLS (TICKETS)

Copie e cole este SQL:

```sql
-- POLÍTICAS PARA TICKETS
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
```

**➤ Clique RUN ▶️**

---

## 🛡️ ETAPA 10: EXECUTAR SQL - POLÍTICAS RLS (TICKET_UPDATES)

Copie e cole este SQL:

```sql
-- POLÍTICAS PARA TICKET_UPDATES
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
```

**➤ Clique RUN ▶️**

---

## 🛡️ ETAPA 11: EXECUTAR SQL - POLÍTICAS RLS (TICKET_ATTACHMENTS)

Copie e cole este SQL:

```sql
-- POLÍTICAS PARA TICKET_ATTACHMENTS
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
```

**➤ Clique RUN ▶️**

---

## 📁 ETAPA 12: CONFIGURAR STORAGE

1. No dashboard do Supabase, vá para **Storage** (no menu lateral)
2. Clique em **Create bucket**
3. Configure:
   - **Name**: `ticket-attachments`
   - **Public**: ❌ **DESMARCAR** (deixar privado)
4. Clique **Create bucket**

---

## 🛡️ ETAPA 13: POLÍTICAS DE STORAGE

Após criar o bucket, volte ao **SQL Editor** e execute:

```sql
-- POLÍTICAS PARA STORAGE
CREATE POLICY "Users can view attachments for their tickets" ON storage.objects FOR SELECT USING (
  bucket_id = 'ticket-attachments' AND
  EXISTS (
    SELECT 1 FROM public.ticket_attachments ta
    JOIN public.tickets t ON ta.ticket_id = t.id
    WHERE ta.file_url = name AND (
      t.customer_id = auth.uid() OR 
      t.assignee_id = auth.uid() OR
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'support')
    )
  )
);

CREATE POLICY "Users can upload attachments" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**➤ Clique RUN ▶️**

---

## 🔐 ETAPA 14: CONFIGURAR CREDENCIAIS

1. Vá para **Settings** → **API** no dashboard
2. Copie:
   - **Project URL**
   - **anon public key**

3. Abra o arquivo `src/integrations/supabase/client.ts`
4. Substitua as credenciais:

```typescript
const SUPABASE_URL = "SUA_PROJECT_URL_AQUI";
const SUPABASE_PUBLISHABLE_KEY = "SUA_ANON_KEY_AQUI";
```

---

## ✅ ETAPA 15: VERIFICAR INSTALAÇÃO

1. Vá para **Table Editor** no dashboard
2. Confirme que as seguintes tabelas existem:
   - ✅ `profiles`
   - ✅ `user_roles`
   - ✅ `tickets`
   - ✅ `ticket_updates`
   - ✅ `ticket_attachments`

---

## 🚀 ETAPA 16: CRIAR PRIMEIRO ADMIN

1. Execute o projeto: `npm run dev`
2. Acesse: `http://localhost:8080`
3. **Registre uma conta** com seu email
4. No **SQL Editor** do Supabase, execute:

```sql
SELECT public.promote_user_to_admin('SEU-EMAIL@EXEMPLO.COM');
```

*🔄 Substitua pelo seu email real!*

5. **Faça logout e login novamente** para aplicar as permissões

---

## 🎉 SUCESSO! 

Seu sistema está configurado e funcionando! 🚀

### **Teste final:**
1. ✅ Acesse http://localhost:8080
2. ✅ Faça login como admin
3. ✅ Crie um ticket de teste
4. ✅ Verifique se funciona

---

## 🆘 TROUBLESHOOTING

### **Erro "relation does not exist"**
→ Volte e execute todas as etapas SQL na ordem

### **Erro "permission denied"**
→ Verifique se está logado no Supabase corretamente

### **Login não funciona**
→ Verifique se as credenciais foram atualizadas em `client.ts`

### **Não consegue criar tickets**
→ Execute novamente o comando `promote_user_to_admin`

---

**📧 Qualquer dúvida, verifique os logs no console do navegador e no dashboard do Supabase!** 