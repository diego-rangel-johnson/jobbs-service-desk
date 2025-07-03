import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTickets } from "@/hooks/useTickets";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import NewTicketForm from "@/components/NewTicketForm";
import TicketList from "@/components/TicketList";
import TicketDetailsView from "@/components/TicketDetailsView";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

const Dashboard = () => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const { user, signOut, isAdmin, isLoading } = useAuth();
  const { tickets, isLoading: ticketsLoading, createTicket, refreshTickets } = useTickets();
  const navigate = useNavigate();

  // Redirecionar administradores para a tela de admin
  useEffect(() => {
    if (!isLoading && isAdmin) {
      console.log('👑 Admin detectado no Dashboard, redirecionando para /admin');
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    console.log("Logout realizado - Até logo!");
  };

  const handleTicketCreated = () => {
    setShowNewTicketDialog(false);
    // O refresh já é feito automaticamente pela nova implementação
    console.log('🎫 Ticket criado, dialog fechado');
  };

  const userName = user?.user_metadata?.name || user?.email || "Usuário";

  if (isLoading || ticketsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se for admin, não renderizar o dashboard (será redirecionado)
  if (isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} onLogout={handleLogout} />

      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold">Meus Tickets</h2>
              <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Ticket</DialogTitle>
                    <DialogDescription>
                      Preencha as informações para criar um novo ticket de suporte.
                    </DialogDescription>
                  </DialogHeader>
                  <NewTicketForm 
                    createTicket={createTicket}
                    onSuccess={handleTicketCreated}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <TicketList
              tickets={tickets}
              onTicketSelect={setSelectedTicket}
              selectedTicket={selectedTicket}
            />
          </div>

          {/* Ticket Details */}
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <TicketDetailsView ticket={selectedTicket} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Selecione um ticket para ver os detalhes
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;