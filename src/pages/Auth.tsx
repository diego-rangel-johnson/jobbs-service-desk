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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-3 sm:px-4 py-4 sm:py-8">
      <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4 sm:space-y-6 pb-4 sm:pb-6 pt-6 sm:pt-8">
          <div className="flex justify-center mb-2">
            <img 
              src="/logo.png" 
              alt="Jobbs Desk Logo" 
              className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-xl flex items-center justify-center shadow-lg"><span class="text-white font-bold text-2xl sm:text-3xl">J</span></div>';
                }
              }}
            />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              Jobbs Desk
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              Sistema de gerenciamento de tickets
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11 sm:h-12 bg-gray-100 rounded-xl p-1 mb-6">
              <TabsTrigger 
                value="login" 
                className="text-sm sm:text-base font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="text-sm sm:text-base font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;