import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const DemoAccountManager = () => {
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const { toast } = useToast();

  const createDemoAccounts = async () => {
    setIsCreatingDemo(true);
    
    try {
      console.log('🚀 Iniciando criação das contas de demonstração...');
      
      // Verificar se email provider está habilitado tentando criar admin
      console.log('📧 Criando admin@exemplo.com...');
      const { data: adminData, error: adminError } = await supabase.auth.signUp({
        email: 'admin@exemplo.com',
        password: 'admin123',
        options: {
          data: { name: 'Administrador' },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (adminError) {
        if (adminError.message.includes('Email logins are disabled') || 
            adminError.message.includes('Signup is disabled')) {
          toast({
            title: '⚠️ Provedor de Email Desabilitado',
            description: 'Vá para Authentication > Providers no Supabase e habilite o provedor "Email"',
            variant: 'destructive',
            duration: 8000
          });
          setIsCreatingDemo(false);
          return;
        }
        
        if (adminError.message.includes('already registered')) {
          console.log('👤 Admin já existe, promovendo a admin...');
          await supabase.rpc('promote_user_to_admin', { user_email: 'admin@exemplo.com' });
        } else {
          throw adminError;
        }
      } else {
        console.log('✅ Admin criado:', adminData.user?.email);
        
        // Promover a admin após criação
        setTimeout(async () => {
          await supabase.rpc('promote_user_to_admin', { user_email: 'admin@exemplo.com' });
          console.log('👑 Admin promovido com sucesso');
        }, 2000);
      }

      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Criar usuário normal
      console.log('📧 Criando usuario@exemplo.com...');
      const { error: userError } = await supabase.auth.signUp({
        email: 'usuario@exemplo.com',
        password: 'user123',
        options: {
          data: { name: 'Usuário Teste' },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (userError && !userError.message.includes('already registered')) {
        console.error('❌ Erro ao criar usuário:', userError);
      } else {
        console.log('✅ Usuário normal criado/confirmado');
      }

      toast({
        title: '🎉 Contas de Demonstração Prontas!',
        description: 'Admin: admin@exemplo.com / admin123\nUsuário: usuario@exemplo.com / user123',
        duration: 6000
      });

    } catch (error) {
      console.error('💥 Erro na criação das contas:', error);
      toast({
        title: 'Erro na Criação das Contas',
        description: `${error.message}\n\nVerifique: Authentication > Providers > Email (habilitado) e Settings > Confirm email (desabilitado)`,
        variant: 'destructive',
        duration: 10000
      });
    }
    
    setIsCreatingDemo(false);
  };

  return (
    <div>
      <Button 
        variant="outline" 
        onClick={createDemoAccounts}
        disabled={isCreatingDemo}
        className="w-full"
      >
        {isCreatingDemo ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Users className="mr-2 h-4 w-4" />
        )}
        Criar Contas de Demonstração
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Só funcionará após habilitar o provedor de email
      </p>
    </div>
  );
};

export default DemoAccountManager;