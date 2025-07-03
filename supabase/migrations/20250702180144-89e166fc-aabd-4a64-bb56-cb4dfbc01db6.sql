-- FASE 2: Corrigir sistema de roles e criar admin padrão
-- Limpar dados inconsistentes e criar funções auxiliares

-- Função para promover usuário a admin baseado no email
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Buscar user_id pelo email diretamente da tabela auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF target_user_id IS NOT NULL THEN
        -- Atualizar role para admin
        UPDATE public.user_roles 
        SET role = 'admin'
        WHERE user_id = target_user_id;
        
        -- Se não existir role, inserir
        IF NOT FOUND THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (target_user_id, 'admin');
        END IF;
        
        RAISE NOTICE 'Usuário % promovido a admin com sucesso', user_email;
    ELSE
        RAISE NOTICE 'Usuário com email % não encontrado', user_email;
    END IF;
END;
$$;

-- Função para verificar e criar admin padrão quando necessário
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
    
    -- Se não há admin, promover admin@exemplo.com se existir
    IF admin_count = 0 THEN
        PERFORM public.promote_user_to_admin('admin@exemplo.com');
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;