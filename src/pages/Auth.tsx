import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';

const Auth = () => {
  const { user, isAdmin, isSupervisor, isAttendant, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      // Redirecionar para a tela apropriada baseado na hierarquia de usuários
      if (isAdmin) {
        console.log('👑 Admin detectado, redirecionando para /admin');
        navigate('/admin');
      } else if (isAttendant) {
        console.log('🎧 Atendente detectado, redirecionando para /attendant');
        navigate('/attendant');
      } else if (isSupervisor) {
        console.log('👨‍💼 Supervisor detectado, redirecionando para /supervisor');
        navigate('/supervisor');
      } else {
        console.log('👤 Usuário comum, redirecionando para /dashboard');
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, isSupervisor, isAttendant, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-3 sm:px-4 py-4 sm:py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <img 
                src="/auth-bg.png" 
                alt="Jobbs Desk Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                onError={(e) => {
                  // Fallback se a imagem não carregar
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">J</div>';
                  }
                }}
              />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
            Jobbs Desk
          </CardTitle>
          <CardDescription className="text-sm sm:text-base px-2">
            Sistema de gerenciamento de tickets
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
              <TabsTrigger value="login" className="text-sm sm:text-base">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-sm sm:text-base">
                Cadastrar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-4 sm:mt-6">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="signup" className="mt-4 sm:mt-6">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;