import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Search, User, Bell, LogOut, BarChart, Clock, AlertTriangle, CheckCircle, ChevronDown, Settings, UserPlus, Eye, Edit3, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TicketViewDialog from "@/components/TicketViewDialog";
import TicketEditDialog from "@/components/TicketEditDialog";
import AddUserDialog from "@/components/AddUserDialog";
import SettingsDialog from "@/components/SettingsDialog";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [departmentFilter, setDepartmentFilter] = useState("todos");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const userName = user?.user_metadata?.name || user?.email || "Administrador";

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Carregar tickets do Supabase
  const loadTicketsFromSupabase = async () => {
    try {
      setLoading(true);
      
      // Primeiro, buscar os tickets
      const { data: ticketsData, error: ticketsError } = await supabase
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
          estimated_date,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Erro ao carregar tickets:', ticketsError);
        return;
      }

      // Depois, buscar os perfis dos usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name');

      if (profilesError) {
        console.error('Erro ao carregar perfis:', profilesError);
      }

      // Criar um mapa de user_id -> nome de forma simples
      const profilesMap: { [key: string]: string } = {};
      if (profilesData) {
        for (const profile of profilesData) {
          profilesMap[profile.user_id] = profile.name;
        }
      }

      // Transformar dados para formato esperado pela aplicação
      const formattedTickets = ticketsData?.map(ticket => ({
        id: ticket.ticket_number || ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status === 'open' ? 'aberto' : 
                ticket.status === 'in_progress' ? 'em_andamento' : 
                ticket.status === 'resolved' ? 'resolvido' : 
                ticket.status === 'closed' ? 'fechado' : ticket.status,
        priority: ticket.priority === 'low' ? 'baixa' : 
                 ticket.priority === 'medium' ? 'media' : 
                 ticket.priority === 'high' ? 'alta' : 
                 ticket.priority === 'urgent' ? 'alta' : ticket.priority,
        department: ticket.department,
        customer: profilesMap[ticket.customer_id] || 'Cliente desconhecido',
        assignee: ticket.assignee_id ? (profilesMap[ticket.assignee_id] || 'Atribuído') : 'Não atribuído',
        date: ticket.created_at,
        estimatedDate: ticket.estimated_date,
        rawData: ticket // Manter dados originais para edição
      })) || [];

      setTickets(formattedTickets);
      console.log(`✅ ${formattedTickets.length} tickets carregados do Supabase`);
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar usuários disponíveis para atribuição
  const loadAvailableUsers = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('user_id, name, role')
        .in('role', ['admin', 'agent']);

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        return;
      }

      setAvailableUsers(profilesData || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar usuários:', error);
    }
  };

  // Carregar tickets na inicialização
  useEffect(() => {
    loadTicketsFromSupabase();
    loadAvailableUsers();
  }, []);

  // Recarregar tickets a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadTicketsFromSupabase();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      console.log('🚪 Iniciando logout admin...');
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error('❌ Erro no logout:', error);
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

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "todas" || ticket.priority === priorityFilter;
    const matchesDepartment = departmentFilter === "todos" || ticket.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  });

  const stats = {
    total: tickets.length,
    abertos: tickets.filter(t => t.status === "aberto").length,
    emAndamento: tickets.filter(t => t.status === "em_andamento").length,
    resolvidos: tickets.filter(t => t.status === "resolvido").length,
    alta: tickets.filter(t => t.priority === "alta").length
  };

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowViewDialog(true);
  };

  const handleEditTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowEditDialog(true);
  };

  const handleSaveTicket = async (ticketId: string, updates: any) => {
    try {
      // Encontrar o ticket atual para obter os dados originais
      const currentTicket = tickets.find(t => t.id === ticketId);
      if (!currentTicket || !currentTicket.rawData) {
        console.error('Ticket não encontrado:', ticketId);
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
          updates.priority === 'alta' ? 'high' : updates.priority;
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

      // Atualizar o ticket no banco de dados
      const { error } = await supabase
        .from('tickets')
        .update(dbUpdates)
        .eq('id', currentTicket.rawData.id);

      if (error) {
        console.error('Erro ao atualizar ticket:', error);
        return;
      }

      // Se houver um comentário, adicionar ao histórico (isso seria implementado em uma tabela separada)
      if (updates.newComment) {
        console.log('Comentário adicionado:', updates.newComment);
      }

      console.log(`✅ Ticket ${ticketId} atualizado com sucesso`);

      // Recarregar os tickets para refletir as mudanças
      await loadTicketsFromSupabase();

    } catch (error) {
      console.error('Erro inesperado ao salvar ticket:', error);
    }
  };

  const handleDeleteTicket = async (ticket: any) => {
    try {
      // Confirmar se o usuário realmente deseja deletar
      const confirmDelete = window.confirm(
        `Tem certeza de que deseja deletar o ticket ${ticket.id}?\n\nAssunto: ${ticket.subject}\n\nEsta ação não pode ser desfeita.`
      );

      if (!confirmDelete) {
        return;
      }

      console.log('🗑️ Deletando ticket:', ticket.id);

      // Deletar o ticket do banco de dados
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticket.rawData.id);

      if (error) {
        console.error('Erro ao deletar ticket:', error);
        alert('Erro ao deletar o ticket. Tente novamente.');
        return;
      }

      console.log(`✅ Ticket ${ticket.id} deletado com sucesso`);
      
      // Recarregar os tickets para refletir as mudanças
      await loadTicketsFromSupabase();
      
      alert('Ticket deletado com sucesso!');

    } catch (error) {
      console.error('Erro inesperado ao deletar ticket:', error);
      alert('Erro inesperado ao deletar o ticket. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8">
              <img src="/logo.png" alt="Jobbs Desk Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-lg sm:text-xl font-semibold hidden sm:block">Jobbs Desk</h1>
            <h1 className="text-lg font-semibold sm:hidden">Jobbs Desk</h1>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-4">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Bell className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium hidden xs:block">{userName}</span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56">
                <DropdownMenuItem onClick={() => setShowAddUserDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar Usuário
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
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
        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-slate-600">Total</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <BarChart className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-red-600">Abertos</p>
                  <p className="text-2xl font-bold text-red-700">{stats.abertos}</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-orange-600">Em Andamento</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.emAndamento}</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-green-600">Resolvidos</p>
                  <p className="text-2xl font-bold text-green-700">{stats.resolvidos}</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-purple-600">Alta Prioridade</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.alta}</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
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
                  <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                Exportar Dados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Lista de Tickets ({filteredTickets.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead className="min-w-32">Assunto</TableHead>
                    <TableHead className="hidden md:table-cell w-24">Cliente</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="w-20">Prioridade</TableHead>
                    <TableHead className="hidden lg:table-cell w-24">Responsável</TableHead>
                    <TableHead className="hidden xl:table-cell w-20">Depto</TableHead>
                    <TableHead className="hidden lg:table-cell w-20">Data</TableHead>
                    <TableHead className="hidden xl:table-cell w-20">Previsão</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{ticket.id}</TableCell>
                      <TableCell className="max-w-32 truncate text-xs">{ticket.subject}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs whitespace-nowrap">{ticket.customer}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                          <span className="capitalize text-xs">{ticket.priority}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs whitespace-nowrap">{ticket.assignee}</TableCell>
                      <TableCell className="hidden xl:table-cell text-xs whitespace-nowrap">{ticket.department}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs whitespace-nowrap">{new Date(ticket.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="hidden xl:table-cell text-blue-600 font-medium text-xs whitespace-nowrap">
                        {ticket.estimatedDate ? new Date(ticket.estimatedDate).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="sticky right-0 bg-background">
                        <div className="flex flex-row space-x-1 min-w-fit">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditTicket(ticket)}
                            className="text-xs h-6 px-1 min-w-fit"
                            title="Editar ticket"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1">Editar</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                            className="text-xs h-6 px-1 min-w-fit"
                            title="Visualizar ticket"
                          >
                            <Eye className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1">Ver</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteTicket(ticket)}
                            className="text-xs h-6 px-1 min-w-fit text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Deletar ticket"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1">Deletar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <TicketViewDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        ticket={selectedTicket}
      />
      
      <TicketEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        ticket={selectedTicket}
        onSave={handleSaveTicket}
        availableUsers={availableUsers}
      />

      <AddUserDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
      />

      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />
    </div>
  );
};

export default AdminDashboard;