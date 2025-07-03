import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTickets } from "@/hooks/useTickets";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Search, 
  TicketIcon, 
  Users, 
  Building, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  Eye,
  UserCog,
  User,
  Bell,
  ChevronDown,
  Settings,
  BarChart,
  FileText
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SupervisorReports from "@/components/SupervisorReports";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SupervisorDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [departmentFilter, setDepartmentFilter] = useState("todos");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [teamStats, setTeamStats] = useState<any>({});
  const [activeTab, setActiveTab] = useState("dashboard");

  const navigate = useNavigate();
  const { user, signOut, isAdmin, isSupervisor, isLoading } = useAuth();
  const { tickets, isLoading: ticketsLoading, refreshTickets } = useTickets();
  const { toast } = useToast();

  const userName = user?.user_metadata?.name || user?.email || "Supervisor";

  // Redirecionar se não for supervisor
  useEffect(() => {
    if (!isLoading && !isSupervisor && !isAdmin) {
      console.log('🚫 Acesso negado - Redirecionando usuário para dashboard normal');
      navigate('/dashboard', { replace: true });
    }
  }, [isSupervisor, isAdmin, isLoading, navigate]);

  // Carregar informações da empresa do supervisor
  const loadCompanyInfo = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          company_id,
          companies(id, name, email, phone)
        `)
        .eq('user_id', user.id)
        .single();

      if (profile?.companies) {
        setCompanyInfo(profile.companies);
      }
    } catch (error) {
      console.error('Erro ao carregar informações da empresa:', error);
    }
  };

  // Calcular estatísticas da equipe
  const calculateTeamStats = () => {
    const stats = {
      total: tickets.length,
      abertos: tickets.filter(t => t.status === "open").length,
      emAndamento: tickets.filter(t => t.status === "in_progress").length,
      resolvidos: tickets.filter(t => t.status === "resolved").length,
      fechados: tickets.filter(t => t.status === "closed").length,
      alta: tickets.filter(t => t.priority === "high" || t.priority === "urgent").length,
      meusTickets: tickets.filter(t => t.customer_id === user?.id).length,
      ticketsEquipe: tickets.filter(t => t.customer_id !== user?.id).length
    };
    setTeamStats(stats);
  };

  useEffect(() => {
    if (user) {
      loadCompanyInfo();
    }
  }, [user]);

  useEffect(() => {
    calculateTeamStats();
  }, [tickets, user]);

  // Filtros dos tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = (ticket.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (ticket.ticket_number?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (ticket.customer?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const ticketStatus = ticket.status === 'open' ? 'aberto' : 
                        ticket.status === 'in_progress' ? 'em_andamento' :
                        ticket.status === 'resolved' ? 'resolvido' :
                        ticket.status === 'closed' ? 'fechado' : ticket.status;
    
    const ticketPriority = ticket.priority === 'low' ? 'baixa' :
                          ticket.priority === 'medium' ? 'media' :
                          ticket.priority === 'high' ? 'alta' :
                          ticket.priority === 'urgent' ? 'alta' : ticket.priority;

    const matchesStatus = statusFilter === "todos" || ticketStatus === statusFilter;
    const matchesPriority = priorityFilter === "todas" || ticketPriority === priorityFilter;
    const matchesDepartment = departmentFilter === "todos" || ticket.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  });

  const handleLogout = async () => {
    try {
      console.log('🚪 Iniciando logout supervisor...');
      await signOut();
      console.log('✅ Logout realizado com sucesso');
      navigate("/auth");
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      toast({
        title: "Erro no logout",
        description: "Houve um problema ao fazer logout. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowViewDialog(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-600 text-white";
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return "Aberto";
      case "in_progress": return "Em Andamento";
      case "resolved": return "Resolvido";
      case "closed": return "Fechado";
      default: return status;
    }
  };

  if (isLoading || ticketsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8">
              <img src="/logo.png" alt="Jobbs Desk Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-semibold">Jobbs Desk Supervisor</h1>
              <p className="text-sm text-muted-foreground">
                {companyInfo ? `${companyInfo.name}` : 'Painel de Supervisão'}
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-semibold">Supervisor</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-4">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Bell className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <UserCog className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium hidden xs:block">{userName}</span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56">
                <DropdownMenuItem onClick={() => setActiveTab("reports")}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Relatórios da Equipe
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  <FileText className="mr-2 h-4 w-4" />
                  Análise de Performance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header com informações da empresa */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel de Supervisão</h2>
          <p className="text-gray-600 mt-1">
            {companyInfo ? `Gerencie os tickets da ${companyInfo.name}` : 'Supervisione os tickets da sua equipe'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Dashboard & Tickets
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Relatórios da Equipe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-blue-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total de Tickets</p>
                      <p className="text-2xl font-bold text-blue-700">{teamStats.total}</p>
                      <p className="text-xs text-blue-500 mt-1">
                        {teamStats.meusTickets} meus + {teamStats.ticketsEquipe} da equipe
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TicketIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Em Andamento</p>
                      <p className="text-2xl font-bold text-yellow-700">{teamStats.emAndamento}</p>
                      <p className="text-xs text-yellow-500 mt-1">
                        Tickets sendo processados
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Alta Prioridade</p>
                      <p className="text-2xl font-bold text-red-700">{teamStats.alta}</p>
                      <p className="text-xs text-red-500 mt-1">
                        Requerem atenção urgente
                      </p>
                    </div>
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Resolvidos</p>
                      <p className="text-2xl font-bold text-green-700">{teamStats.resolvidos}</p>
                      <p className="text-xs text-green-500 mt-1">
                        Tickets concluídos
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Filtros e Busca</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                </div>
              </CardContent>
            </Card>

            {/* Lista de Tickets */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Tickets da Equipe ({filteredTickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-4">
                  {filteredTickets.length === 0 ? (
                    <div className="text-center py-8">
                      <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm ? "Nenhum ticket encontrado com os filtros aplicados" : "Nenhum ticket encontrado"}
                      </p>
                    </div>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-medium text-slate-900">
                                {ticket.ticket_number} - {ticket.subject}
                              </h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={getPriorityColor(ticket.priority)}>
                                  {ticket.priority === 'urgent' ? 'Urgente' :
                                   ticket.priority === 'high' ? 'Alta' :
                                   ticket.priority === 'medium' ? 'Média' : 'Baixa'}
                                </Badge>
                                <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                                  {getStatusLabel(ticket.status)}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-2 line-clamp-2">{ticket.description}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-500">
                              <span>Cliente: {ticket.customer?.name || 'N/A'}</span>
                              <span>Departamento: {ticket.department}</span>
                              <span>Criado: {new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
                              {ticket.customer_id === user?.id && (
                                <Badge variant="outline" className="text-green-600 border-green-600 w-fit">
                                  Meu Ticket
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end lg:justify-start lg:ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTicket(ticket);
                              }}
                              className="w-full sm:w-auto"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <SupervisorReports 
              tickets={filteredTickets} 
              companyInfo={companyInfo} 
              userName={userName} 
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog melhorado para visualização de ticket */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Detalhes do Ticket
              {selectedTicket && (
                <Badge variant="outline" className="ml-2">
                  {selectedTicket.ticket_number}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-120px)]">
              {/* Header do Ticket */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedTicket.subject}
                    </h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={getPriorityColor(selectedTicket.priority)}>
                        {selectedTicket.priority === 'urgent' ? 'Urgente' :
                         selectedTicket.priority === 'high' ? 'Alta' :
                         selectedTicket.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                      <Badge variant="secondary" className={getStatusColor(selectedTicket.status)}>
                        {getStatusLabel(selectedTicket.status)}
                      </Badge>
                      {selectedTicket.customer_id === user?.id && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Meu Ticket
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informações do Ticket */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Cliente:</span>
                    <p className="text-sm text-gray-900">{selectedTicket.customer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Departamento:</span>
                    <p className="text-sm text-gray-900">{selectedTicket.department}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Criado em:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedTicket.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {selectedTicket.assignee && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Responsável:</span>
                      <p className="text-sm text-gray-900">{selectedTicket.assignee?.name || selectedTicket.assignee}</p>
                    </div>
                  )}
                  {selectedTicket.estimated_date && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Previsão:</span>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedTicket.estimated_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-600">Última atualização:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedTicket.updated_at || selectedTicket.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Descrição</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedTicket.description || 'Nenhuma descrição fornecida.'}
                  </p>
                </div>
              </div>

              {/* Timeline/Histórico */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Histórico do Ticket
                </h3>
                <div className="space-y-3">
                  {/* Evento de criação */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">Sistema</span>
                        <span className="text-xs text-gray-500">
                          {new Date(selectedTicket.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Ticket criado</p>
                    </div>
                  </div>

                  {/* Eventos de atualização (se houver) */}
                  {selectedTicket.updates && selectedTicket.updates.length > 0 && (
                    selectedTicket.updates.map((update: any, index: number) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {update.user || update.name || 'Sistema'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {update.date || new Date(update.created_at || Date.now()).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{update.message}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Estado atual */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">Estado atual</span>
                        <span className="text-xs text-gray-500">
                          {new Date(selectedTicket.updated_at || selectedTicket.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Status: {getStatusLabel(selectedTicket.status)} • 
                        Prioridade: {selectedTicket.priority === 'urgent' ? 'Urgente' :
                                   selectedTicket.priority === 'high' ? 'Alta' :
                                   selectedTicket.priority === 'medium' ? 'Média' : 'Baixa'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações (apenas para supervisores/admins) */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Visualizando como supervisor
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowViewDialog(false)}
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupervisorDashboard; 