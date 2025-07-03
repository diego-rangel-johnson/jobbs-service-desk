-- 🔧 DAR PERMISSÕES COMPLETAS AO USUÁRIO ANÔNIMO
-- Execute este arquivo no Supabase Dashboard > SQL Editor
-- ⚠️ CUIDADO: Isso dá acesso total ao usuário anônimo (não recomendado para produção)

-- ========================================
-- 1. DAR PERMISSÕES DE ESCRITA AO ANON
-- ========================================

-- Permitir todas as operações para o role anon nas tabelas
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.user_roles TO anon;
GRANT ALL ON public.tickets TO anon;
GRANT ALL ON public.ticket_updates TO anon;
GRANT ALL ON public.ticket_attachments TO anon;

-- Permitir uso das sequences (para auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Dar permissões também para authenticated users
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.tickets TO authenticated;
GRANT ALL ON public.ticket_updates TO authenticated;
GRANT ALL ON public.ticket_attachments TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- 2. VERIFICAR PERMISSÕES
-- ========================================

-- Verificar as permissões concedidas
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- ========================================
-- RESULTADO
-- ========================================

SELECT '✅ PERMISSÕES CONCEDIDAS!' as resultado;
SELECT 'Usuário anônimo agora pode fazer operações completas' as info; 