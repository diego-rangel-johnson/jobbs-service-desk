import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import NewTicketDialog from "@/components/NewTicketDialog";
import TicketDetails from "@/components/TicketDetails";
import DashboardHeader from "@/components/DashboardHeader";
import TicketsList from "@/components/TicketsList";
import UserDashboardMetrics from "@/components/UserDashboardMetrics";
import UserTicketReports from "@/components/UserTicketReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, List, Plus, FileText, Ticket as TicketIcon, Clock, Eye } from "lucide-react";
import { useTickets } from "@/hooks/useTickets";
import { SLA_CONFIGS } from '@/types/sla';
import { SLAStatusIndicator } from '@/components/SLA/SLAStatusIndicator';

const UserDashboard = () => {
  console.log("UserDashboard rendering...");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [ticketForDialog, setTicketForDialog] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, isAdmin, isSupervisor, isAttendant, isLoading } = useAuth();
  const { tickets, isLoading: ticketsLoading, createTicket } = useTickets();
  
  // Usar dados do Supabase Auth quando disponível, fallback para localStorage
  const userName = user?.user_metadata?.name || user?.email || localStorage.getItem("userName") || "Usuário";

  // Detectar se é mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Redirecionar administradores, supervisores e atendentes para suas respectivas telas
  useEffect(() => {
    if (!isLoading && isAdmin) {
      console.log('👑 Admin detectado no UserDashboard, redirecionando para /admin');
      navigate('/admin', { replace: true });
    } else if (!isLoading && isSupervisor) {
      console.log('👨‍💼 Supervisor detectado no UserDashboard, redirecionando para /supervisor');
      navigate('/supervisor', { replace: true });
    } else if (!isLoading && isAttendant) {
      console.log('🎧 Atendente detectado no UserDashboard, redirecionando para /attendant');
      navigate('/attendant', { replace: true });
    }
  }, [isAdmin, isSupervisor, isAttendant, isLoading, navigate]);

  const handleLogout = async () => {
    try {
      console.log('🚪 Iniciando logout no UserDashboard...');
      
      // Limpar localStorage
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      
      // Usar o signOut do Supabase se disponível
      if (signOut) {
        await signOut();
      }
      
      navigate("/auth");
      toast({ title: "Logout realizado", description: "Até logo!" });
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      // Fazer logout forçado mesmo em caso de erro
      navigate("/auth");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
      case "aberto": return "bg-red-100 text-red-800 border-red-200";
      case "in_progress":
      case "em_andamento": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved":
      case "resolvido": return "bg-green-100 text-green-800 border-green-200";
      case "closed":
      case "fechado": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSLACriticalityLabel = (slaCriticality: string) => {
    return SLA_CONFIGS[slaCriticality as keyof typeof SLA_CONFIGS]?.label || 'Padrão';
  };

  const getSLACriticalityColor = (slaCriticality: string) => {
    const config = SLA_CONFIGS[slaCriticality as keyof typeof SLA_CONFIGS];
    if (!config) return 'border-blue-200 bg-blue-50 text-blue-700';
    
    switch (config.color) {
      case 'red': return 'border-red-200 bg-red-50 text-red-700';
      case 'orange': return 'border-orange-200 bg-orange-50 text-orange-700';
      case 'yellow': return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'blue': return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'gray': return 'border-gray-200 bg-gray-50 text-gray-700';
      default: return 'border-blue-200 bg-blue-50 text-blue-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "alta": return "bg-red-500";
      case "high":
      case "medium":
      case "media": return "bg-yellow-500";
      case "low":
      case "baixa": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-600 text-white";
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent": return "Urgente";
      case "high": return "Alta";
      case "medium": return "Média";
      case "low": return "Baixa";
      default: return priority;
    }
  };

  // Função para visualizar ticket em popup (mobile) ou sidebar (desktop)
  const handleViewTicket = (ticket: any) => {
    if (isMobile) {
      setTicketForDialog(ticket);
      setShowViewDialog(true);
    } else {
      setSelectedTicket(ticket);
    }
  };

  // Filtrar tickets do usuário usando tanto customer_id (Supabase) quanto customer (localStorage)
  const userTickets = tickets.filter(ticket => 
    ticket.customer_id === user?.id || 
    ticket.customer?.user_id === user?.id ||
    ticket.customer === userName
  );
  
  const filteredTickets = userTickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.ticket_number || ticket.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addNewTicket = async (newTicket: any) => {
    try {
      console.log('🎫 Criando novo ticket...');
      const result = await createTicket(newTicket);
      
      if (result.error) {
        console.error('❌ Erro ao criar ticket:', result.error);
        toast({ 
          title: "Erro", 
          description: result.error,
          variant: "destructive"
        });
      } else {
        console.log('✅ Ticket criado com sucesso:', result.data);
        toast({ 
          title: "Ticket criado!", 
          description: `Ticket ${result.data?.ticket_number || 'novo'} foi criado com sucesso.` 
        });
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao criar ticket:', error);
      toast({ 
        title: "Erro", 
        description: "Erro inesperado ao criar o ticket",
        variant: "destructive"
      });
    }
  };

  console.log("About to render UserDashboard JSX");
  
  // Mostrar loading enquanto autenticação ou tickets estão carregando
  if (isLoading || ticketsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se for admin, supervisor ou atendente, não renderizar o dashboard (será redirecionado)
  if (isAdmin || isSupervisor || isAttendant) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} onLogout={handleLogout} />

      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header com Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meu Painel</h1>
            <p className="text-gray-600 mt-1">Gerencie seus tickets e acompanhe o status</p>
          </div>
          <Button 
            onClick={() => setShowNewTicket(true)}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Ticket
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Meus Tickets
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Meus Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <UserDashboardMetrics tickets={tickets} userName={userName} />
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <TicketsList
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filteredTickets={filteredTickets}
                selectedTicket={selectedTicket}
                setSelectedTicket={handleViewTicket}
                setShowNewTicket={setShowNewTicket}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />

              {/* Ticket Details Sidebar - apenas no desktop */}
              <div className="lg:col-span-1 hidden lg:block">
                {selectedTicket ? (
                  <TicketDetails ticket={selectedTicket} />
                ) : (
                  <Card className="mt-4 lg:mt-0">
                    <CardContent className="p-4 sm:p-6 text-center text-muted-foreground text-sm sm:text-base">
                      Selecione um ticket para ver os detalhes
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <UserTicketReports tickets={tickets} userName={userName} />
          </TabsContent>
        </Tabs>
      </div>

      <NewTicketDialog
        open={showNewTicket}
        onOpenChange={setShowNewTicket}
        onSubmit={addNewTicket}
      />

      {/* Dialog para visualização de ticket no mobile */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Detalhes do Ticket
              {ticketForDialog && (
                <Badge variant="outline" className="ml-2">
                  {ticketForDialog.ticket_number || ticketForDialog.id}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {ticketForDialog && (
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-120px)]">
              {/* Header do Ticket */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {ticketForDialog.subject}
                    </h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={getSLACriticalityColor(ticketForDialog.sla_criticality || 'padrao')}>
                        {getSLACriticalityLabel(ticketForDialog.sla_criticality || 'padrao')}
                      </Badge>
                      <Badge variant="secondary" className={getStatusColor(ticketForDialog.status)}>
                        {getStatusLabel(ticketForDialog.status)}
                      </Badge>
                      {ticketForDialog.sla_status && (
                        <SLAStatusIndicator 
                          status={ticketForDialog.sla_status}
                          responseDeadline={ticketForDialog.sla_response_deadline}
                          solutionDeadline={ticketForDialog.sla_solution_deadline}
                          showDetails={false}
                          className="text-xs"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Informações do Ticket */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Cliente:</span>
                    <p className="text-sm text-gray-900">{ticketForDialog.customer?.name || ticketForDialog.customer || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Departamento:</span>
                    <p className="text-sm text-gray-900">{ticketForDialog.department}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Criado em:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(ticketForDialog.created_at || ticketForDialog.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {ticketForDialog.assignee && ticketForDialog.assignee !== 'Não atribuído' && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Responsável:</span>
                      <p className="text-sm text-gray-900">{ticketForDialog.assignee?.name || ticketForDialog.assignee}</p>
                    </div>
                  )}
                  {ticketForDialog.estimated_date && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Previsão:</span>
                      <p className="text-sm text-gray-900">
                        {new Date(ticketForDialog.estimated_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-600">Última atualização:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(ticketForDialog.updated_at || ticketForDialog.created_at || ticketForDialog.date).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Descrição</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {ticketForDialog.description || 'Nenhuma descrição fornecida.'}
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
                          {new Date(ticketForDialog.created_at || ticketForDialog.date).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Ticket criado</p>
                    </div>
                  </div>

                  {/* Eventos de atualização (se houver) */}
                  {ticketForDialog.updates && ticketForDialog.updates.length > 0 && (
                    ticketForDialog.updates.map((update: any, index: number) => (
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
                          {new Date(ticketForDialog.updated_at || ticketForDialog.created_at || ticketForDialog.date).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Status: {getStatusLabel(ticketForDialog.status)} • 
                        Criticidade: {getSLACriticalityLabel(ticketForDialog.sla_criticality || 'padrao')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Visualizando detalhes do ticket
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

export default UserDashboard;