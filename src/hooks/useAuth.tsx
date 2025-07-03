import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSupport: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Função para buscar roles do usuário com retry mais robusto
  const fetchUserRoles = async (userId: string, retryCount = 0) => {
    try {
      console.log(`🔍 Buscando roles para usuário: ${userId} (tentativa ${retryCount + 1})`);
      
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ Erro ao buscar roles:', error);
        
        // Retry com backoff exponencial
        if (retryCount < 5) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
          console.log(`⏳ Tentando novamente em ${delay}ms...`);
          setTimeout(() => fetchUserRoles(userId, retryCount + 1), delay);
          return;
        }
        
        console.error('💥 Falha definitiva ao buscar roles após 5 tentativas');
        setUserRoles([]);
      } else {
        console.log('✅ Roles encontrados:', roles);
        const rolesList = roles?.map(r => r.role) || [];
        setUserRoles(rolesList);
        
        // Log detalhado das roles
        console.log('👑 Roles do usuário:', {
          roles: rolesList,
          isAdmin: rolesList.includes('admin'),
          isSupport: rolesList.includes('support'),
          isUser: rolesList.includes('user')
        });
        
        // Se não tem roles, garantir que admin padrão exista
        if (roles.length === 0 && retryCount < 2) {
          console.log('🔧 Verificando se admin padrão precisa ser criado...');
          supabase.rpc('ensure_admin_exists').then(({ data, error }) => {
            if (!error && data) {
              console.log('👑 Admin padrão criado, refazendo busca de roles...');
              setTimeout(() => fetchUserRoles(userId, retryCount + 1), 2000);
            }
          });
        }
      }
    } catch (error) {
      console.error('💥 Exceção ao buscar roles:', error);
      
      // Retry mesmo em caso de exceção
      if (retryCount < 3) {
        setTimeout(() => fetchUserRoles(userId, retryCount + 1), 2000);
      } else {
        setUserRoles([]);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Delay maior para evitar problemas de timing
          setTimeout(() => {
            console.log('🚀 Iniciando busca de roles após auth change...');
            fetchUserRoles(session.user.id);
          }, 500);
        } else {
          console.log('🚪 Usuário saiu, limpando roles...');
          setUserRoles([]);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🏁 Verificação inicial de sessão:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          console.log('🚀 Iniciando busca de roles após verificação inicial...');
          fetchUserRoles(session.user.id);
        }, 500);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    console.log('🚪 Fazendo logout...');
    setUserRoles([]);
    await supabase.auth.signOut();
  };

  const isAdmin = userRoles.includes('admin');
  const isSupport = userRoles.includes('support') || isAdmin;

  // Log detalhado das roles sempre que mudarem
  useEffect(() => {
    if (user) {
      console.log('🎭 Status de autenticação atualizado:', {
        email: user.email,
        roles: userRoles,
        isAdmin,
        isSupport,
        isLoading
      });
    }
  }, [user, userRoles, isAdmin, isSupport, isLoading]);

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isSupport
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};