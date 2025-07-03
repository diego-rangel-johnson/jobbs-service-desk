-- FASE 2: Corrigir sistema de roles e criar admin padrão
-- Limpar dados inconsistentes e criar admin funcional

-- Primeiro, remover dados temporários se existirem
DELETE FROM public.user_roles WHERE user_id = 'admin-temp-id';
DELETE FROM public.profiles WHERE user_id = 'admin-temp-id';

-- Função para promover usuário a admin baseado no email
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Buscar user_id pelo email no auth.users (via profiles)
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
    
    -- Se não há admin, promover o primeiro usuário com nome "Administrador"
    IF admin_count = 0 THEN
        PERFORM public.promote_user_to_admin('admin@exemplo.com');
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;