import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Search, User, Bell, LogOut, BarChart, Clock, AlertTriangle, CheckCircle, ChevronDown, Settings, UserPlus, Eye, Edit3, Trash2, List, RotateCcw, Building2, Briefcase, UserCheck, Calendar, Users, FileText, TrendingUp, Menu } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ResponsiveTable } from "@/components/ui/table";
import TicketViewDialog from "@/components/TicketViewDialog";
import TicketEditDialog from "@/components/TicketEditDialog";
import AddUserDialog from "@/components/AddUserDialog";
import SettingsDialog from "@/components/SettingsDialog";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import UserManagementDialog from "@/components/UserManagementDialog";
import ManagementCenterDialog from "@/components/ManagementCenterDialog";
import TicketReports from "@/components/TicketReports";
import { SLADashboard } from '@/components/SLA/SLADashboard';
import { SLAStatusIndicator } from '@/components/SLA/SLAStatusIndicator';

interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  totalTickets: number;
  pendingUsers: number;
}

interface CompanyWithUserCount {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  user_count: number;
  created_at: string;
  updated_at: string;
}

interface UserWithDetails {
  profile_id: string;
  user_id: string;
  name: string;
  email: string;
  company_id: string;
  company_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [departmentFilter, setDepartmentFilter] = useState("todos");
  const [companyFilter, setCompanyFilter] = useState("todas");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showUserManagementDialog, setShowUserManagementDialog] = useState(false);
  const [showManagementCenter, setShowManagementCenter] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const userName = user?.user_metadata?.name || user?.email || "Administrador";

  const [tickets, setTickets] = useState<any[]>([]);
  const [companies, setCompanies] = useState<CompanyWithUserCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalTickets: 0,
    pendingUsers: 0
  });
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar empresas para o filtro
  const loadCompanies = async () => {
    try {
      console.log('📊 Carregando empresas...');
      const { data: companiesData, error } = await (supabase as any)
        .from('companies')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Erro ao carregar empresas:', error);
        return;
      }

      setCompanies(companiesData || []);
      console.log('✅ Empresas carregadas:', companiesData?.length || 0);
    } catch (error) {
      console.error('Erro inesperado ao carregar empresas:', error);
    }
  };

  // Carregar tickets do Supabase
  const loadTicketsFromSupabase = async () => {
    try {
      console.log('🎫 Carregando tickets do Supabase...');
      setLoading(true);
      
      // Buscar os tickets com informações da empresa e campos SLA
      const { data: ticketsData, error: ticketsError } = await (supabase as any)
        .from('tickets')
        .select(`
          id,
          ticket_number,
          subject,
          description,
          status,
          priority,
          department,
          customer_id,
          assignee_id,
          company_id,
          estimated_date,
          created_at,
          updated_at,
          sla_criticality,
          sla_response_deadline,
          sla_solution_deadline,
          sla_first_response_at,
          sla_solved_at,
          sla_custom_solution_date,
          sla_status
        `)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('❌ Erro ao carregar tickets:', ticketsError);
        setTickets([]);
        return;
      }

      if (!ticketsData || ticketsData.length === 0) {
        console.log('⚠️ Nenhum ticket encontrado no banco');
        setTickets([]);
        return;
      }

      console.log('✅ Tickets brutos carregados:', ticketsData.length);

      // Buscar perfis dos usuários em paralelo
      const [profilesResponse, companiesResponse] = await Promise.all([
        (supabase as any).from('profiles').select('user_id, name, company_id'),
        (supabase as any).from('companies').select('id, name')
      ]);

      const { data: profilesData, error: profilesError } = profilesResponse;
      const { data: companiesData, error: companiesErr } = companiesResponse;

      if (profilesError) {
        console.error('⚠️ Erro ao carregar perfis:', profilesError);
      }

      if (companiesErr) {
        console.error('⚠️ Erro ao carregar empresas:', companiesErr);
      }

      // Criar mapas para lookup rápido
      const profilesMap: { [key: string]: string } = {};
      const companiesMap: { [key: string]: string } = {};
      
      if (profilesData) {
        profilesData.forEach((profile: any) => {
          profilesMap[profile.user_id] = profile.name;
        });
      }

      if (companiesData) {
        companiesData.forEach((company: any) => {
          companiesMap[company.id] = company.name;
        });
      }

      // Transformar dados para formato esperado pela aplicação
      const formattedTickets = ticketsData.map(ticket => ({
        id: ticket.ticket_number || ticket.id,
        subject: ticket.subject || 'Sem assunto',
        description: ticket.description || 'Sem descrição',
        status: ticket.status === 'open' ? 'aberto' : 
                ticket.status === 'in_progress' ? 'em_andamento' : 
                ticket.status === 'resolved' ? 'resolvido' : 
                ticket.status === 'closed' ? 'fechado' : ticket.status,
        priority: ticket.priority === 'low' ? 'baixa' : 
                 ticket.priority === 'medium' ? 'media' : 
                 ticket.priority === 'high' ? 'alta' : 
                 ticket.priority === 'urgent' ? 'alta' : ticket.priority,
        department: ticket.department || 'N/A',
        customer: profilesMap[ticket.customer_id] || 'Cliente desconhecido',
        assignee: ticket.assignee_id ? (profilesMap[ticket.assignee_id] || 'Atribuído') : 'Não atribuído',
        company: companiesMap[ticket.company_id] || 'Empresa não definida',
        companyId: ticket.company_id,
        date: ticket.created_at,
        estimatedDate: ticket.estimated_date,
        // Campos SLA
        sla_criticality: ticket.sla_criticality,
        sla_response_deadline: ticket.sla_response_deadline,
        sla_solution_deadline: ticket.sla_solution_deadline,
        sla_first_response_at: ticket.sla_first_response_at,
        sla_solved_at: ticket.sla_solved_at,
        sla_custom_solution_date: ticket.sla_custom_solution_date,
        sla_status: ticket.sla_status,
        rawData: ticket
      }));

      setTickets(formattedTickets);
      console.log(`✅ ${formattedTickets.length} tickets formatados e carregados`);
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar usuários disponíveis para atribuição
  const loadAvailableUsers = async () => {
    try {
      console.log('👥 Carregando usuários disponíveis...');
      
      // Primeira abordagem: buscar todos os profiles com roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          profiles!inner(user_id, name)
        `)
        .in('role', ['admin', 'support', 'supervisor']);

      if (rolesError) {
        console.error('Erro ao carregar usuários com roles:', rolesError);
        
        // Fallback: buscar apenas profiles (sem filtro de role)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name');

        if (profilesError) {
          console.error('Erro ao carregar profiles:', profilesError);
          return;
        }

        // Transformar dados do fallback
        const fallbackUsers = profilesData?.map((profile: any) => ({
          user_id: profile.user_id,
          name: profile.name,
          role: 'user'
        })) || [];

        setAvailableUsers(fallbackUsers);
        console.log('✅ Usuários carregados (fallback):', fallbackUsers.length);
        return;
      }

      // Transformar os dados da consulta principal
      const formattedUsers = rolesData?.map((userRole: any) => ({
        user_id: userRole.user_id,
        name: userRole.profiles?.name || 'Usuário',
        role: userRole.role || 'user'
      })) || [];

      setAvailableUsers(formattedUsers);
      console.log('✅ Usuários disponíveis carregados:', formattedUsers.length);
      
    } catch (error) {
      console.error('Erro inesperado ao carregar usuários:', error);
    }
  };

  // Carregar dados administrativos (estatísticas, usuários, empresas)
  const fetchAdminData = async () => {
    try {
      console.log('📊 Carregando dados administrativos...');
      setIsLoading(true);

      // Buscar empresas com contagem de usuários
      const { data: companiesData, error: companiesError } = await supabase.rpc('get_companies_with_user_count');
      if (companiesError) {
        console.error('Erro ao buscar empresas:', companiesError);
      } else {
        setCompanies(companiesData || []);
        console.log('✅ Empresas com contagem carregadas:', companiesData?.length || 0);
      }

      // Buscar usuários com detalhes
      const { data: usersData, error: usersError } = await supabase.rpc('get_users_with_details');
      if (usersError) {
        console.error('Erro ao buscar usuários:', usersError);
      } else {
        setUsers(usersData || []);
        console.log('✅ Usuários com detalhes carregados:', usersData?.length || 0);
      }

      // Buscar contagem de tickets
      const { count: ticketsCount, error: ticketsError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact' });

      if (ticketsError) {
        console.error('Erro ao buscar tickets:', ticketsError);
      } else {
        console.log('✅ Contagem de tickets:', ticketsCount);
      }

      // Calcular estatísticas
      const totalUsers = usersData?.length || 0;
      const totalCompanies = companiesData?.length || 0;
      const pendingUsers = 0; // Não temos mais o campo approved

      setStats({
        totalUsers,
        totalCompanies,
        totalTickets: ticketsCount || 0,
        pendingUsers
      });

      console.log('✅ Estatísticas calculadas:', {
        totalUsers,
        totalCompanies,
        totalTickets: ticketsCount || 0,
        pendingUsers
      });

    } catch (error) {
      console.error('Erro ao buscar dados administrativos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para carregar todos os dados
  const loadAllData = async () => {
    console.log('🔄 Iniciando carregamento completo dos dados...');
    setLoading(true);
    setIsLoading(true);
    
    try {
      await Promise.all([
        loadTicketsFromSupabase(),
        loadAvailableUsers(),
        loadCompanies(),
        fetchAdminData()
      ]);
      console.log('✅ Carregamento completo finalizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no carregamento completo:', error);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    console.log('🚀 AdminDashboard montado, iniciando carregamento...');
    if (user) {
      console.log('🔑 Usuário encontrado:', user.email);
      loadAllData();
    } else {
      console.log('⚠️ Usuário não encontrado, aguardando...');
    }
  }, [user]);

  // Garantir que os dados sejam carregados mesmo se o user ainda não estiver definido
  useEffect(() => {
    console.log('🔄 Efeito secundário executando...');
    const timer = setTimeout(() => {
      if (!loading && tickets.length === 0) {
        console.log('🔄 Tentando recarregar dados após timeout...');
        loadAllData();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Recarregar tickets a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Recarregamento automático...');
      loadTicketsFromSupabase();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      console.log('🚪 Iniciando logout admin...');
      console.log('📊 Estado atual do usuário:', user);
      console.log('🔧 Função signOut disponível:', typeof signOut);
      
      if (!signOut) {
        console.error('❌ signOut function not available');
        alert('Erro: função de logout não disponível');
        return;
      }
      
      await signOut();
      console.log('✅ signOut executado com sucesso');
      
      console.log('🔄 Redirecionando para /auth...');
      navigate("/auth");
      console.log('✅ Redirecionamento iniciado');
      
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      alert('Erro ao fazer logout: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto": return "bg-red-100 text-red-800 border-red-200";
      case "em_andamento": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolvido": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-red-500";
      case "media": return "bg-yellow-500";
      case "baixa": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberto": return "Aberto";
      case "em_andamento": return "Em Andamento";
      case "resolvido": return "Resolvido";
      case "fechado": return "Fechado";
      default: return status;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "todas" || ticket.priority === priorityFilter;
    const matchesDepartment = departmentFilter === "todos" || ticket.department === departmentFilter;
    const matchesCompany = companyFilter === "todas" || ticket.companyId === companyFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesCompany;
  });

  const handleApproveUser = async (userId: string) => {
    try {
      // Atualizar o perfil do usuário
      const { error } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        alert('Erro ao atualizar usuário');
      } else {
        alert('Usuário atualizado com sucesso!');
        fetchAdminData(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('promote_user_to_admin', { user_email: userId });

      if (error) {
        console.error('Erro ao promover usuário:', error);
        alert('Erro ao promover usuário');
      } else {
        alert('Usuário promovido a administrador com sucesso!');
        fetchAdminData(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      alert('Erro ao promover usuário');
    }
  };

  const handlePromoteToSupervisor = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('promote_user_to_supervisor', { user_email: userId, company_id: 'default' });

      if (error) {
        console.error('Erro ao promover usuário:', error);
        alert('Erro ao promover usuário');
      } else {
        alert('Usuário promovido a supervisor com sucesso!');
        fetchAdminData(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      alert('Erro ao promover usuário');
    }
  };

  const handleViewTicket = (ticket: any) => {
    console.log('🔍 AdminDashboard: Visualizando ticket:', ticket);
    setSelectedTicket(ticket);
    setShowViewDialog(true);
  };

  const handleEditTicket = (ticket: any) => {
    console.log('✏️ AdminDashboard: Editando ticket:', ticket);
    setSelectedTicket(ticket);
    setShowEditDialog(true);
  };

  const handleSaveTicket = async (ticketId: string, updates: any) => {
    console.log('💾 AdminDashboard: Salvando ticket:', ticketId, updates);
    try {
      // Encontrar o ticket atual para obter os dados originais
      const currentTicket = tickets.find(t => t.id === ticketId);
      if (!currentTicket || !currentTicket.rawData) {
        console.error('❌ Ticket não encontrado:', ticketId);
        alert('❌ Erro: Ticket não encontrado');
        return;
      }

      // Converter valores do formato da interface para o formato do banco
      const dbUpdates: any = {};
      
      if (updates.status) {
        dbUpdates.status = 
          updates.status === 'aberto' ? 'open' :
          updates.status === 'em_andamento' ? 'in_progress' :
          updates.status === 'resolvido' ? 'resolved' :
          updates.status === 'fechado' ? 'closed' : updates.status;
      }
      
      if (updates.priority) {
        dbUpdates.priority = 
          updates.priority === 'baixa' ? 'low' :
          updates.priority === 'media' ? 'medium' :
          updates.priority === 'alta' ? 'high' :
          updates.priority === 'urgente' ? 'urgent' : updates.priority;
      }

      if (updates.department) {
        dbUpdates.department = updates.department;
      }

      if (updates.estimatedDate) {
        dbUpdates.estimated_date = updates.estimatedDate;
      }

      // Se houver um responsável selecionado, encontrar o user_id
      if (updates.assignee && updates.assignee !== 'Não atribuído') {
        const assignedUser = availableUsers.find(user => user.name === updates.assignee);
        if (assignedUser) {
          dbUpdates.assignee_id = assignedUser.user_id;
        }
      } else if (updates.assignee === 'Não atribuído') {
        dbUpdates.assignee_id = null;
      }

      console.log('💾 Atualizando ticket no banco:', dbUpdates);

      // Atualizar o ticket no banco de dados
      const { error } = await supabase
        .from('tickets')
        .update(dbUpdates)
        .eq('id', currentTicket.rawData.id);

      if (error) {
        console.error('❌ Erro ao atualizar ticket:', error);
        alert('❌ Erro ao atualizar ticket: ' + error.message);
        return;
      }

      // Se houver um comentário, adicionar ao histórico (isso seria implementado em uma tabela separada)
      if (updates.newComment) {
        console.log('📝 Comentário adicionado:', updates.newComment);
        // TODO: Implementar sistema de comentários/histórico
      }

      console.log(`✅ Ticket ${ticketId} atualizado com sucesso`);
      alert('✅ Ticket atualizado com sucesso!');

      // Recarregar os tickets para refletir as mudanças
      await loadTicketsFromSupabase();

    } catch (error) {
      console.error('❌ Erro inesperado ao salvar ticket:', error);
      alert('❌ Erro inesperado ao salvar ticket. Tente novamente.');
    }
  };

  const handleDeleteTicket = async (ticket: any) => {
    try {
      // Confirmar se o usuário realmente deseja deletar
      const confirmDelete = window.confirm(
        `🗑️ ATENÇÃO: Deletar Ticket\n\n` +
        `Ticket: ${ticket.id}\n` +
        `Assunto: ${ticket.subject}\n` +
        `Cliente: ${ticket.customer}\n\n` +
        `Esta ação é IRREVERSÍVEL e deletará permanentemente:\n` +
        `• O ticket e todos os seus dados\n` +
        `• Histórico de atualizações\n` +
        `• Anexos relacionados\n\n` +
        `Tem certeza de que deseja continuar?`
      );

      if (!confirmDelete) {
        console.log('❌ Usuário cancelou a exclusão do ticket');
        return;
      }

      console.log('🗑️ Deletando ticket:', ticket.id);

      // Deletar o ticket do banco de dados
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticket.rawData.id);

      if (error) {
        console.error('❌ Erro ao deletar ticket:', error);
        alert('❌ Erro ao deletar o ticket: ' + error.message);
        return;
      }

      console.log(`✅ Ticket ${ticket.id} deletado com sucesso`);
      alert('✅ Ticket deletado com sucesso!');
      
      // Recarregar os tickets para refletir as mudanças
      await loadTicketsFromSupabase();

    } catch (error) {
      console.error('❌ Erro inesperado ao deletar ticket:', error);
      alert('❌ Erro inesperado ao deletar o ticket. Tente novamente.');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'support':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'supervisor':
        return 'Supervisor';
      case 'support':
        return 'Suporte';
      default:
        return 'Usuário';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} onLogout={handleLogout} />
      
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
        {/* Header responsivo */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              Painel Administrativo
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Gerencie tickets, usuários e configurações do sistema
            </p>
          </div>
          
          {/* Botões de ação - layout responsivo */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => setShowAddUserDialog(true)}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Adicionar Usuário</span>
            </Button>
            <Button 
              onClick={() => setShowManagementCenter(true)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="sm:inline">Configurações</span>
            </Button>
          </div>
        </div>

        {/* Tabs responsivas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs sm:text-sm">
                <BarChart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Dash</span>
              </TabsTrigger>
              <TabsTrigger value="tickets" className="flex items-center gap-1 text-xs sm:text-sm">
                <List className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Tickets</span>
                <span className="sm:hidden">Tickets</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Usuários</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="companies" className="flex items-center gap-1 text-xs sm:text-sm">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Empresas</span>
                <span className="sm:hidden">Emp</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-1 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Relatórios</span>
                <span className="sm:hidden">Rel</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Cards de estatísticas responsivos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <List className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTickets}</div>
                  <p className="text-xs text-muted-foreground">
                    Todos os tickets
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Usuários cadastrados
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                  <p className="text-xs text-muted-foreground">
                    Empresas ativas
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Pendentes</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {tickets.filter(t => t.status === 'aberto').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando atendimento
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* SLA Dashboard */}
            <SLADashboard />
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            {/* Filtros responsivos */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Filtros de Tickets
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="sm:hidden"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="TI">TI</SelectItem>
                      <SelectItem value="Suporte">Suporte</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="RH">RH</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("todos");
                      setPriorityFilter("todas");
                      setDepartmentFilter("todos");
                      setCompanyFilter("todas");
                    }}
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de tickets responsiva */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Tickets ({filteredTickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ResponsiveTable
                  headers={["ID", "Assunto", "Status", "Prioridade", "Cliente", "Empresa", "Data", "Ações"]}
                  data={filteredTickets}
                  renderRow={(ticket, index) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        #{ticket.id}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                          <span className="text-sm">
                            {ticket.priority === "alta" ? "Alta" : 
                             ticket.priority === "media" ? "Média" : 
                             ticket.priority === "baixa" ? "Baixa" : ticket.priority}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {ticket.customer}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {ticket.company}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(ticket.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditTicket(ticket)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteTicket(ticket)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  renderCard={(ticket, index) => (
                    <Card key={ticket.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header do card */}
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-sm text-muted-foreground">
                                #{ticket.id}
                              </h3>
                              <h4 className="font-semibold text-base line-clamp-2">
                                {ticket.subject}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                              <Badge className={getStatusColor(ticket.status)}>
                                {getStatusLabel(ticket.status)}
                              </Badge>
                            </div>
                          </div>

                          {/* Informações do ticket */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Cliente:</span>
                              <p className="font-medium truncate">{ticket.customer}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Empresa:</span>
                              <p className="font-medium truncate">{ticket.company}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Departamento:</span>
                              <p className="font-medium">{ticket.department}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Data:</span>
                              <p className="font-medium">
                                {new Date(ticket.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>

                          {/* SLA Status */}
                          {ticket.sla_status && (
                            <div className="border-t pt-3">
                              <SLAStatusIndicator 
                                status={ticket.sla_status}
                                responseDeadline={ticket.sla_response_deadline}
                                solutionDeadline={ticket.sla_solution_deadline}
                                showDetails={true}
                              />
                            </div>
                          )}

                          {/* Ações */}
                          <div className="flex justify-end items-center gap-2 pt-3 border-t">
                            <span className="text-xs text-muted-foreground">
                              Prioridade: {ticket.priority === "alta" ? "Alta" : 
                                           ticket.priority === "media" ? "Média" : 
                                           ticket.priority === "baixa" ? "Baixa" : ticket.priority}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewTicket(ticket)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditTicket(ticket)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteTicket(ticket)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuários ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ResponsiveTable
                  headers={["Nome", "Email", "Empresa", "Função", "Data", "Ações"]}
                  data={users}
                  renderRow={(user, index) => (
                    <TableRow key={user.profile_id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.company_name}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handlePromoteToAdmin(user.user_id)}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handlePromoteToSupervisor(user.user_id)}
                          >
                            <Briefcase className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  renderCard={(user, index) => (
                    <Card key={user.profile_id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{user.name}</h4>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <Badge className={getRoleColor(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Empresa:</span>
                              <p className="font-medium">{user.company_name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cadastro:</span>
                              <p className="font-medium">
                                {new Date(user.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-end items-center gap-2 pt-3 border-t">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePromoteToAdmin(user.user_id)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Admin
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePromoteToSupervisor(user.user_id)}
                            >
                              <Briefcase className="h-4 w-4 mr-1" />
                              Supervisor
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Empresas ({companies.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ResponsiveTable
                  headers={["Nome", "Documento", "Email", "Usuários", "Status", "Ações"]}
                  data={companies}
                  renderRow={(company, index) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.document}</TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>{company.user_count}</TableCell>
                      <TableCell>
                        <Badge variant={company.is_active ? "default" : "secondary"}>
                          {company.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                  renderCard={(company, index) => (
                    <Card key={company.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{company.name}</h4>
                              <p className="text-sm text-muted-foreground">{company.email}</p>
                            </div>
                            <Badge variant={company.is_active ? "default" : "secondary"}>
                              {company.is_active ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Documento:</span>
                              <p className="font-medium">{company.document}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Usuários:</span>
                              <p className="font-medium">{company.user_count}</p>
                            </div>
                          </div>

                          <div className="flex justify-end pt-3 border-t">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <TicketReports />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <TicketViewDialog 
        ticket={selectedTicket} 
        open={showViewDialog} 
        onOpenChange={setShowViewDialog}
      />
      <TicketEditDialog 
        ticket={selectedTicket} 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog}
        onSave={handleSaveTicket}
        availableUsers={availableUsers}
      />
      <AddUserDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        onSuccess={fetchAdminData}
      />
      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />
      <UserManagementDialog
        open={showUserManagementDialog}
        onOpenChange={setShowUserManagementDialog}
        onUserUpdate={fetchAdminData}
      />
      <ManagementCenterDialog
        open={showManagementCenter}
        onOpenChange={setShowManagementCenter}
      />
    </div>
  );
};

export default AdminDashboard;