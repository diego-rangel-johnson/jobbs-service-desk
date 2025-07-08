import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRoles: string[];
  userCompany: string | null;
  attendantCompanies: any[];
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  // Hierarquia de usuários
  isAdmin: boolean;
  isSupport: boolean;
  isSupervisor: boolean;
  isUser: boolean;
  isAttendant: boolean;
  // Funções de empresa e atendente
  getUserCompany: () => Promise<string | null>;
  getAttendantCompanies: () => Promise<any[]>;
  isAttendantOfCompany: (companyId: string) => boolean;
  canViewTickets: (companyId?: string) => boolean;
  // Compatibilidade com sistema antigo
  isMember: boolean;
  isViewer: boolean;
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
  const [userCompany, setUserCompany] = useState<string | null>(null);
  const [attendantCompanies, setAttendantCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar roles do usuário (sistema unificado)
  const fetchUserRoles = async (userId: string, retryCount = 0): Promise<string[]> => {
    try {
      // Buscar roles do sistema original
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Erro ao buscar roles:', rolesError);
        throw rolesError;
      }

      const rolesList = roles?.map(r => r.role) || [];
      setUserRoles(rolesList);
      
      return rolesList;
      
    } catch (error) {
      console.error('Exceção ao buscar roles:', error);
      
      // Retry em caso de exceção
      if (retryCount < 3) {
        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await fetchUserRoles(userId, retryCount + 1);
            resolve(result);
          }, 2000);
        });
      } else {
        setUserRoles(['user']);
        return ['user'];
      }
    }
  };

  // Função para buscar empresa do usuário
  const fetchUserCompany = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_id, companies(id, name)')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar empresa:', error);
        return;
      }

      if (profile?.company_id) {
        setUserCompany(profile.company_id);
      } else {
        setUserCompany(null);
      }
      
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      setUserCompany(null);
    }
  };

  // Função para buscar empresas do atendente (corrigida para usar sistema SQL)
  const fetchAttendantCompanies = async (userId: string, roles?: string[]) => {
    try {
      // Usar roles passadas como parâmetro ou as do estado (com fallback)
      const currentRoles = roles || userRoles;
      
      // Verificar se o usuário tem role 'support' (que indica atendente)
      if (currentRoles.includes('support')) {
        try {
          // Usar função SQL correta se existir (quando implementada)
          const { data: companiesData, error: rpcError } = await (supabase as any).rpc(
            'get_attendant_companies',
            { user_id_param: userId }
          );
          
          if (!rpcError && companiesData && Array.isArray(companiesData)) {
            setAttendantCompanies(companiesData);
            return;
          }
        } catch (sqlError) {
          // Função SQL não disponível, usando fallback
        }
        
        // Fallback: buscar empresas ativas disponíveis (será refinado após aplicar SQL)
        const { data: companies, error } = await supabase
          .from('companies')
          .select('id, name, email')
          .eq('is_active', true)
          .limit(10);

        if (!error && companies) {
          setAttendantCompanies(companies);
        } else {
          setAttendantCompanies([]);
        }
      } else {
        setAttendantCompanies([]);
      }
      
    } catch (error) {
      setAttendantCompanies([]);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Buscar dados do usuário em sequência (roles primeiro, depois empresa e atendimento)
          setTimeout(async () => {
            // 1. Primeiro buscar roles
            const roles = await fetchUserRoles(session.user.id);
            
            // 2. Depois buscar empresa e empresas de atendimento em paralelo
            await Promise.all([
              fetchUserCompany(session.user.id),
              fetchAttendantCompanies(session.user.id, roles)
            ]);
          }, 500);
        } else {
          setUserRoles([]);
          setUserCompany(null);
          setAttendantCompanies([]);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          // 1. Primeiro buscar roles
          const roles = await fetchUserRoles(session.user.id);
          
          // 2. Depois buscar empresa e empresas de atendimento em paralelo
          await Promise.all([
            fetchUserCompany(session.user.id),
            fetchAttendantCompanies(session.user.id, roles)
          ]);
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

  // Helper functions para verificar roles (hierarquia correta)
  const isAdmin = userRoles.includes('admin');
  const isSupport = userRoles.includes('support');
  const isSupervisor = userRoles.includes('supervisor');
  const isUser = userRoles.includes('user') || userRoles.length === 0; // default para user
  const isAttendant = attendantCompanies.length > 0; // Se tem empresas vinculadas, é atendente
  
  // Compatibilidade com sistema antigo
  const isMember = false;
  const isViewer = false;

  // Função para obter empresa do usuário
  const getUserCompany = async (): Promise<string | null> => {
    if (userCompany) return userCompany;
    
    if (!user) return null;
    
    await fetchUserCompany(user.id);
    return userCompany;
  };

  // Função para obter empresas do atendente
  const getAttendantCompanies = async () => {
    if (attendantCompanies.length > 0) return attendantCompanies;
    
    if (!user) return [];
    
    await fetchAttendantCompanies(user.id, userRoles);
    return attendantCompanies;
  };

  // Verificar se atendente está vinculado a empresa específica
  const isAttendantOfCompany = (companyId: string): boolean => {
    return attendantCompanies.some(company => company.id === companyId);
  };

  // Verificar se pode ver tickets (baseado na hierarquia)
  const canViewTickets = (companyId?: string): boolean => {
    // Admin vê todos
    if (isAdmin) return true;
    
    // Support que não é atendente vê todos (compatibilidade)
    if (isSupport && !isAttendant) return true;
    
    // Se não tem companyId, só admin e support podem ver
    if (!companyId) return isAdmin || (isSupport && !isAttendant);
    
    // Supervisor vê da própria empresa
    if (isSupervisor && userCompany === companyId) return true;
    
    // Atendente vê das empresas vinculadas
    if (isAttendant && isAttendantOfCompany(companyId)) return true;
    
    return false;
  };

  // Compatibilidade com sistema antigo
  const canViewOrganization = async (organizationId: string): Promise<boolean> => {
    return canViewTickets(organizationId);
  };

  const getAttendantOrganizations = async () => {
    return await getAttendantCompanies();
  };

  const value = {
    session,
    user,
    userRoles,
    userCompany,
    attendantCompanies,
    isLoading,
    signUp,
    signIn,
    signOut,
    // Hierarquia de usuários
    isAdmin,
    isSupport,
    isSupervisor,
    isUser,
    isAttendant,
    // Funções de empresa e atendente
    getUserCompany,
    getAttendantCompanies,
    isAttendantOfCompany,
    canViewTickets,
    // Compatibilidade com sistema antigo
    isMember,
    isViewer,
    canViewOrganization,
    getAttendantOrganizations
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};