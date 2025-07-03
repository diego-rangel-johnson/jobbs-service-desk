-- 🔧 SCRIPT SIMPLES DE PERMISSÕES - SUPABASE
-- Copie e cole EXATAMENTE este código no SQL Editor

-- 1. Dar permissão total para anon
GRANT ALL PRIVILEGES ON TABLE public.profiles TO anon;
GRANT ALL PRIVILEGES ON TABLE public.user_roles TO anon;
GRANT ALL PRIVILEGES ON TABLE public.tickets TO anon;
GRANT ALL PRIVILEGES ON TABLE public.ticket_updates TO anon;
GRANT ALL PRIVILEGES ON TABLE public.ticket_attachments TO anon;

-- 2. Dar permissão total para authenticated
GRANT ALL PRIVILEGES ON TABLE public.profiles TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.user_roles TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.tickets TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.ticket_updates TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.ticket_attachments TO authenticated;

-- 3. Permitir uso de sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Teste simples
SELECT 'SCRIPT EXECUTADO!' as status; 