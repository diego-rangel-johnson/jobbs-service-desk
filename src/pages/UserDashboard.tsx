import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NewTicketDialog from "@/components/NewTicketDialog";
import TicketDetails from "@/components/TicketDetails";
import DashboardHeader from "@/components/DashboardHeader";
import TicketsList from "@/components/TicketsList";

const UserDashboard = () => {
  console.log("UserDashboard rendering...");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const userName = localStorage.getItem("userName") || "Usuário";

  const initialTickets = [
    {
      id: "TK-001",
      subject: "Problema no sistema de login",
      status: "aberto",
      priority: "alta",
      date: "2024-01-15",
      customer: userName,
      assignee: "João Silva",
      department: "TI",
      description: "Não consigo fazer login no sistema",
      estimatedDate: "2024-01-20",
      updates: [
        { date: "2024-01-15 10:30", user: "Sistema", message: "Ticket criado" },
        { date: "2024-01-15 11:00", user: "Suporte", message: "Ticket recebido, analisando..." }
      ]
    },
    {
      id: "TK-002", 
      subject: "Solicitação de nova funcionalidade",
      status: "em_andamento",
      priority: "media",
      date: "2024-01-10",
      customer: userName,
      assignee: "Ana Costa",
      department: "Desenvolvimento",
      description: "Gostaria de solicitar uma nova funcionalidade",
      estimatedDate: "2024-01-25",
      updates: [
        { date: "2024-01-10 14:20", user: "Sistema", message: "Ticket criado" },
        { date: "2024-01-11 09:15", user: "Desenvolvimento", message: "Funcionalidade em análise" }
      ]
    },
    {
      id: "TK-003",
      subject: "Dúvida sobre relatórios",
      status: "resolvido",
      priority: "baixa", 
      date: "2024-01-05",
      customer: userName,
      assignee: "Carlos Lima",
      department: "Suporte",
      description: "Como gerar relatórios mensais?",
      estimatedDate: "2024-01-06",
      updates: [
        { date: "2024-01-05 16:45", user: "Sistema", message: "Ticket criado" },
        { date: "2024-01-06 08:30", user: "Suporte", message: "Documentação enviada por email" },
        { date: "2024-01-06 10:00", user: "Sistema", message: "Ticket resolvido" }
      ]
    }
  ];

  const loadTickets = () => {
    const stored = localStorage.getItem("allTickets");
    if (stored) {
      return JSON.parse(stored);
    } else {
      localStorage.setItem("allTickets", JSON.stringify(initialTickets));
      return initialTickets;
    }
  };

  const [tickets, setTickets] = useState(loadTickets);

  // Atualizar tickets quando localStorage muda
  useEffect(() => {
    const handleStorageChange = () => {
      setTickets(loadTickets());
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Também verificar periodicamente para atualizações dentro da mesma aba
    const interval = setInterval(() => {
      const currentTickets = loadTickets();
      setTickets(currentTickets);
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);


  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    navigate("/");
    toast({ title: "Logout realizado", description: "Até logo!" });
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

  const userTickets = tickets.filter(ticket => ticket.customer === userName);
  
  const filteredTickets = userTickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addNewTicket = (newTicket: any) => {
    const allTickets = JSON.parse(localStorage.getItem("allTickets") || "[]");
    const nextId = Math.max(...allTickets.map((t: any) => parseInt(t.id.split('-')[1])), 0) + 1;
    
    const ticket = {
      ...newTicket,
      id: `TK-${String(nextId).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: "aberto",
      customer: userName,
      assignee: "Não atribuído",
      estimatedDate: null,
      updates: [
        { date: new Date().toLocaleString('pt-BR'), user: "Sistema", message: "Ticket criado" }
      ]
    };
    
    const updatedTickets = [ticket, ...allTickets];
    localStorage.setItem("allTickets", JSON.stringify(updatedTickets));
    setTickets(updatedTickets);
    toast({ title: "Ticket criado!", description: `Ticket ${ticket.id} foi criado com sucesso.` });
  };

  console.log("About to render UserDashboard JSX");
  
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} onLogout={handleLogout} />

      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
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