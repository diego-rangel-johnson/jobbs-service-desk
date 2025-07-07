import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRoles: string[];
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  isAdmin: boolean;
  isSupport: boolean;
  isSupervisor: boolean;
  isUser: boolean;
  isMember: boolean;
  isViewer: boolean;
  isAttendant: boolean;
  canViewOrganization: (organizationId: string) => Promise<boolean>;
  getAttendantOrganizations: () => Promise<any[]>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar roles do usuário (sistema original)
  const fetchUserRoles = async (userId: string, retryCount = 0) => {
    try {
      console.log('🔍 Buscando roles para usuário:', userId);
      
      // Buscar roles do sistema original
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao buscar roles:', error);
        throw error;
      }

      if (roles && roles.length > 0) {
        const rolesList = roles.map(r => r.role);
        setUserRoles(rolesList);
        
        // Log detalhado das roles
        console.log('👑 Roles do usuário:', {
          roles: rolesList,
          isAdmin: rolesList.includes('admin'),
          isSupport: rolesList.includes('support'),
          isSupervisor: rolesList.includes('supervisor'),
          isUser: rolesList.includes('user')
        });
      } else {
        console.log('⚠️ Nenhuma role encontrada para o usuário');
        setUserRoles([]);
      }
    } catch (error) {
      console.error('💥 Exceção ao buscar roles:', error);
      
      // Retry em caso de exceção
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
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Helper functions para verificar roles (sistema original)
  const isAdmin = userRoles.includes('admin');
  const isSupport = userRoles.includes('support');
  const isSupervisor = userRoles.includes('supervisor');
  const isUser = userRoles.includes('user');
  const isMember = false; // Placeholder para compatibilidade
  const isViewer = false; // Placeholder para compatibilidade
  const isAttendant = false; // Placeholder para compatibilidade

  // Função para verificar se pode ver dados de uma organização
  const canViewOrganization = async (organizationId: string): Promise<boolean> => {
    if (!user) return false;
    
    // Admins podem ver tudo
    if (isAdmin) return true;
    
    // Por enquanto, supervisores podem ver dados de suas empresas
    if (isSupervisor) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .single();
        
        return profile?.company_id === organizationId;
      } catch (error) {
        console.error('Erro ao verificar empresa do supervisor:', error);
        return false;
      }
    }
    
    return false;
  };

  // Função para obter organizações do atendente
  const getAttendantOrganizations = async () => {
    if (!user || !isAttendant) return [];
    
    // Por enquanto, retornar array vazio até implementar o sistema de atendentes
    return [];
  };

  const value = {
    session,
    user,
    userRoles,
    isLoading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isSupport,
    isSupervisor,
    isUser,
    isMember,
    isViewer,
    isAttendant,
    canViewOrganization,
    getAttendantOrganizations
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};