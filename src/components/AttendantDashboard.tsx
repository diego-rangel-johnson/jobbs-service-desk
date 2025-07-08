import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTickets } from "@/hooks/useTickets";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  Ticket, 
  Building2, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Eye,
  UserCog,
  User,
  ChevronDown,
  Settings,
  BellRing,
  BellOff,
  BarChart3,
  List,
  Headphones,
  Timer,
  Search,
  RefreshCw,
  Edit3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TicketViewDialog from "./TicketViewDialog";
import TicketEditDialog from "./TicketEditDialog";
import DashboardHeader from "./DashboardHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SLADashboard } from '@/components/SLA/SLADashboard';
import { SLAStatusIndicator } from '@/components/SLA/SLAStatusIndicator';
import { supabase } from "@/integrations/supabase/client";

const AttendantDashboard = () => {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Filtros para tickets
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [departmentFilter, setDepartmentFilter] = useState("todos");
  const [companyFilter, setCompanyFilter] = useState("todas");

  const navigate = useNavigate();
  const { user, signOut, attendantCompanies, isAttendant, isAdmin } = useAuth();
  const { tickets, isLoading: ticketsLoading, refreshTickets } = useTickets();
  const { notifications, unreadCount, markAsRead, markAllAsRead, createTestNotification } = useNotifications();
  const { toast } = useToast();

  const userName = user?.user_metadata?.name || user?.email || "Atendente";

  // Estado para usuários disponíveis
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Carregar usuários disponíveis para atribuição
  const loadAvailableUsers = async () => {
    try {
      console.log('📋 Carregando usuários disponíveis...');
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .limit(50);

      if (profilesError) {
        console.error('Erro ao carregar profiles:', profilesError);
        return;
      }

      const formattedUsers = profilesData?.map((profile: any) => ({
        user_id: profile.user_id,
        name: profile.name
      })) || [];

      setAvailableUsers(formattedUsers);
      console.log('✅ Usuários carregados:', formattedUsers.length);
      
    } catch (error) {
      console.error('Erro inesperado ao carregar usuários:', error);
    }
  };

  // Carregar usuários na inicialização
  useEffect(() => {
    loadAvailableUsers();
  }, []);

  // Redirecionar se não for atendente ou admin
  useEffect(() => {
    if (!isAttendant && !isAdmin) {
      console.log('🚫 Acesso negado - Redirecionando usuário para dashboard normal');
      navigate('/dashboard', { replace: true });
    }
  }, [isAttendant, isAdmin, navigate]);

  // Estatísticas dos tickets para o dashboard - usando nomenclatura padronizada
  const ticketStats = {
    total: tickets.length,
    aberto: tickets.filter(t => t.status === 'open').length,
    em_andamento: tickets.filter(t => t.status === 'in_progress').length,
    resolvido: tickets.filter(t => t.status === 'resolved').length,
    urgente: tickets.filter(t => t.priority === 'urgent').length,
    alta: tickets.filter(t => t.priority === 'high').length
  };

  // Estatísticas por empresa
  const companyStats = attendantCompanies.map(company => {
    const companyTickets = tickets.filter(t => t.company?.id === company.id);
    return {
      company,
      total: companyTickets.length,
      aberto: companyTickets.filter(t => t.status === 'open').length,
      urgente: companyTickets.filter(t => t.priority === 'urgent').length
    };
  });

  // Filtrar tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = (ticket.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (ticket.ticket_number?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (ticket.company?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const ticketStatus = ticket.status === 'open' ? 'aberto' : 
                        ticket.status === 'in_progress' ? 'em_andamento' :
                        ticket.status === 'resolved' ? 'resolvido' :
                        ticket.status === 'closed' ? 'fechado' : ticket.status;
    
    const ticketPriority = ticket.priority === 'low' ? 'baixa' :
                          ticket.priority === 'medium' ? 'media' :
                          ticket.priority === 'high' ? 'alta' :
                          ticket.priority === 'urgent' ? 'urgente' : ticket.priority;

    const matchesStatus = statusFilter === "todos" || ticketStatus === statusFilter;
    const matchesPriority = priorityFilter === "todas" || ticketPriority === priorityFilter;
    const matchesDepartment = departmentFilter === "todos" || ticket.department === departmentFilter;
    const matchesCompany = companyFilter === "todas" || ticket.company?.id === companyFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesCompany;
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    console.log("Logout realizado - Até logo!");
  };

  const handleViewTicket = (ticket: any) => {
    console.log('🔍 Visualizando ticket:', ticket);
    setSelectedTicket(ticket);
    setShowViewDialog(true);
  };

  const handleEditTicket = (ticket: any) => {
    console.log('✏️ Editando ticket:', ticket);
    setSelectedTicket(ticket);
    setShowEditDialog(true);
  };

  const handleRefresh = async () => {
    try {
      await refreshTickets();
      toast({
        title: "Lista atualizada",
        description: "Os tickets foram atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Houve um problema ao atualizar a lista de tickets.",
        variant: "destructive"
      });
    }
  };

  // Funções de formatação padronizadas
  const formatStatusBadge = (status: string) => {
    const statusMap = {
      'open': 'aberto',
      'in_progress': 'em_andamento',
      'resolved': 'resolvido',
      'closed': 'fechado'
    };
    
    const statusKey = statusMap[status as keyof typeof statusMap] || status;
    const colors = {
      'aberto': "bg-red-100 text-red-800 border-red-200",
      'em_andamento': "bg-yellow-100 text-yellow-800 border-yellow-200",
      'resolvido': "bg-green-100 text-green-800 border-green-200",
      'fechado': "bg-gray-100 text-gray-800 border-gray-200"
    };

    const labels = {
      'aberto': "Aberto",
      'em_andamento': "Em Andamento",
      'resolvido': "Resolvido",
      'fechado': "Fechado"
    };

    return (
      <Badge className={colors[statusKey as keyof typeof colors] || colors.aberto}>
        {labels[statusKey as keyof typeof labels] || statusKey}
      </Badge>
    );
  };

  const formatPriorityBadge = (priority: string) => {
    const priorityMap = {
      'low': 'baixa',
      'medium': 'media',
      'high': 'alta',
      'urgent': 'urgente'
    };
    
    const priorityKey = priorityMap[priority as keyof typeof priorityMap] || priority;
    const colors = {
      'baixa': "bg-green-100 text-green-800 border-green-200",
      'media': "bg-yellow-100 text-yellow-800 border-yellow-200",
      'alta': "bg-orange-100 text-orange-800 border-orange-200",
      'urgente': "bg-red-100 text-red-800 border-red-200"
    };

    const labels = {
      'baixa': "Baixa",
      'media': "Média",
      'alta': "Alta",
      'urgente': "Urgente"
    };

    return (
      <Badge className={colors[priorityKey as keyof typeof colors] || colors.media}>
        {labels[priorityKey as keyof typeof labels] || priorityKey}
      </Badge>
    );
  };

  const getSLACriticalityLabel = (criticality: string) => {
    const labels = {
      'muito_alta': 'Muito Alta',
      'alta': 'Alta',
      'moderada': 'Moderada', 
      'padrao': 'Padrão',
      'geral': 'Geral'
    };
    return labels[criticality as keyof typeof labels] || criticality;
  };

  if (ticketsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header padrão */}
      <DashboardHeader userName={userName} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header do painel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel de Atendimento</h2>
            <p className="text-gray-600 mt-1">
              Gerencie tickets das suas empresas atendidas ({attendantCompanies.length} {attendantCompanies.length === 1 ? 'empresa' : 'empresas'})
            </p>
          </div>
          
          {/* Notificações */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <Bell className="h-4 w-4 mr-2" />
                  Notificações
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2 font-semibold flex items-center justify-between">
                  <span>Notificações</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      Marcar todas como lidas
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex-col items-start">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{notification.title}</span>
                        {!notification.is_read && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <BellOff className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{notification.message}</span>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={createTestNotification}>
                  <BellRing className="mr-2 h-4 w-4" />
                  Criar Teste
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="sla" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              SLA
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ticketStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    Todas as empresas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{ticketStats.aberto}</div>
                  <p className="text-xs text-muted-foreground">
                    Precisam atenção
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{ticketStats.em_andamento}</div>
                  <p className="text-xs text-muted-foreground">
                    Sendo tratados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-800">{ticketStats.urgente}</div>
                  <p className="text-xs text-muted-foreground">
                    Prioridade máxima
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas por Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Resumo por Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companyStats.map((stat) => (
                    <div key={stat.company.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{stat.company.name}</h3>
                          <p className="text-sm text-muted-foreground">{stat.total} tickets total</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="destructive">{stat.aberto} abertos</Badge>
                        {stat.urgente > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            {stat.urgente} urgente{stat.urgente > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {companyStats.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      Nenhuma empresa vinculada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab - NOVA IMPLEMENTAÇÃO COMPLETA */}
          <TabsContent value="tickets" className="space-y-6">
            {/* Filtros e Controles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Filtros e Busca
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={ticketsLoading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${ticketsLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                      <SelectItem value="todos">Todos os Status</SelectItem>
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
                      <SelectItem value="todas">Todas as Prioridades</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Departamentos</SelectItem>
                      <SelectItem value="TI">TI</SelectItem>
                      <SelectItem value="RH">RH</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Suporte">Suporte</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Empresas</SelectItem>
                      {attendantCompanies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Tickets de Atendimento ({filteredTickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Número</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Criticidade SLA</TableHead>
                        <TableHead>Status SLA</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="w-32">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                            {searchTerm || statusFilter !== "todos" || priorityFilter !== "todas" ? 
                              "Nenhum ticket encontrado com os filtros aplicados" : 
                              "Nenhum ticket encontrado"
                            }
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTickets.map((ticket) => (
                          <TableRow key={ticket.id} className="hover:bg-gray-50">
                            <TableCell className="font-mono text-sm">
                              {ticket.ticket_number}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate font-medium">{ticket.subject}</div>
                              <div className="text-sm text-gray-500 truncate">{ticket.description}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{ticket.company?.name || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatStatusBadge(ticket.status)}
                            </TableCell>
                            <TableCell>
                              {formatPriorityBadge(ticket.priority)}
                            </TableCell>
                            <TableCell>
                              {ticket.sla_criticality ? (
                                <Badge variant="outline" className="text-xs">
                                  {getSLACriticalityLabel(ticket.sla_criticality)}
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {ticket.sla_status ? (
                                <SLAStatusIndicator
                                  status={ticket.sla_status}
                                  responseDeadline={ticket.sla_response_deadline}
                                  solutionDeadline={ticket.sla_solution_deadline}
                                  firstResponseAt={ticket.sla_first_response_at}
                                  solvedAt={ticket.sla_solved_at}
                                  showDetails={false}
                                  className="text-xs"
                                />
                              ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewTicket(ticket)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditTicket(ticket)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Empresas Atendidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {attendantCompanies.map((company) => (
                    <Card key={company.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <h3 className="font-semibold">{company.name}</h3>
                              <p className="text-sm text-muted-foreground">{company.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Tickets</div>
                            <div className="font-semibold">
                              {tickets.filter(t => t.company?.id === company.id).length}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {attendantCompanies.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma empresa vinculada</p>
                      <p className="text-sm">Contacte o administrador para vincular empresas</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SLA Tab */}
          <TabsContent value="sla" className="space-y-6">
            <SLADashboard onRefresh={refreshTickets} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {showViewDialog && selectedTicket && (
        <TicketViewDialog
          ticket={selectedTicket}
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
        />
      )}

      {showEditDialog && selectedTicket && (
        <TicketEditDialog
          ticket={selectedTicket}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          availableUsers={availableUsers}
          onSave={(ticketId, updates) => {
            console.log('Ticket atualizado:', ticketId, updates);
            setShowEditDialog(false);
            refreshTickets();
            toast({
              title: "Sucesso",
              description: "Ticket atualizado com sucesso!",
            });
          }}
        />
      )}
    </div>
  );
};

export default AttendantDashboard; 