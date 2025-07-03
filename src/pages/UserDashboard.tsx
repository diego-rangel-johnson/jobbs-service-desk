import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { BarChart, List, Plus, FileText } from "lucide-react";
import { useTickets } from "@/hooks/useTickets";

const UserDashboard = () => {
  console.log("UserDashboard rendering...");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, isAdmin, isSupervisor, isLoading } = useAuth();
  const { tickets, isLoading: ticketsLoading, createTicket } = useTickets();
  
  // Usar dados do Supabase Auth quando disponível, fallback para localStorage
  const userName = user?.user_metadata?.name || user?.email || localStorage.getItem("userName") || "Usuário";

  // Redirecionar administradores e supervisores para suas respectivas telas
  useEffect(() => {
    if (!isLoading && isAdmin) {
      console.log('👑 Admin detectado no UserDashboard, redirecionando para /admin');
      navigate('/admin', { replace: true });
    } else if (!isLoading && isSupervisor) {
      console.log('👨‍💼 Supervisor detectado no UserDashboard, redirecionando para /supervisor');
      navigate('/supervisor', { replace: true });
    }
  }, [isAdmin, isSupervisor, isLoading, navigate]);

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

  // Se for admin ou supervisor, não renderizar o dashboard (será redirecionado)
  if (isAdmin || isSupervisor) {
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
                setSelectedTicket={setSelectedTicket}
                setShowNewTicket={setShowNewTicket}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />

              {/* Ticket Details Sidebar */}
              <div className="lg:col-span-1">
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
    </div>
  );
};

export default UserDashboard;