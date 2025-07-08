import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Save, X, User, Building, Clock } from "lucide-react";

interface TicketEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: any;
  onSave: (ticketId: string, updates: any) => void;
  availableUsers?: any[];
}

const TicketEditDialog = ({ open, onOpenChange, ticket, onSave, availableUsers = [] }: TicketEditDialogProps) => {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [department, setDepartment] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  console.log('✏️ TicketEditDialog recebeu ticket:', ticket);
  console.log('✏️ TicketEditDialog availableUsers:', availableUsers);

  useEffect(() => {
    if (ticket) {
      console.log('✏️ Inicializando formulário com dados do ticket:', ticket);
      
      // Normalizar status para o formato do formulário
      let normalizedStatus = ticket.status;
      if (ticket.status === 'open') normalizedStatus = 'aberto';
      else if (ticket.status === 'in_progress') normalizedStatus = 'em_andamento';
      else if (ticket.status === 'resolved') normalizedStatus = 'resolvido';
      else if (ticket.status === 'closed') normalizedStatus = 'fechado';
      
      // Normalizar prioridade para o formato do formulário
      let normalizedPriority = ticket.priority;
      if (ticket.priority === 'low') normalizedPriority = 'baixa';
      else if (ticket.priority === 'medium') normalizedPriority = 'media';
      else if (ticket.priority === 'high') normalizedPriority = 'alta';
      else if (ticket.priority === 'urgent') normalizedPriority = 'urgente';
      
      setStatus(normalizedStatus || "aberto");
      setPriority(normalizedPriority || "media");
      setAssignee(ticket.assignee || "Não atribuído");
      setDepartment(ticket.department || "");
      setEstimatedDate(ticket.estimatedDate || ticket.estimated_date || "");
      setComment("");
      
      console.log('✏️ Formulário inicializado com:', {
        status: normalizedStatus,
        priority: normalizedPriority,
        assignee: ticket.assignee,
        department: ticket.department,
        estimatedDate: ticket.estimatedDate || ticket.estimated_date
      });
    }
  }, [ticket]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      console.log('💾 Salvando ticket com dados:', {
        status,
        priority,
        assignee,
        department,
        estimatedDate,
        comment
      });

      const updates = {
        status,
        priority,
        assignee,
        department,
        estimatedDate,
        ...(comment && { newComment: comment })
      };
      
      await onSave(ticket.ticket_number || ticket.id, updates);
      console.log(`✅ Ticket ${ticket.ticket_number || ticket.id} salvo com atualizações:`, updates);
      
      onOpenChange(false);
      setComment("");
    } catch (error) {
      console.error('❌ Erro ao salvar ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    // Verificar se houve alterações nos campos
    const currentData = {
      status: ticket.status === 'open' ? 'aberto' : 
              ticket.status === 'in_progress' ? 'em_andamento' : 
              ticket.status === 'resolved' ? 'resolvido' : 
              ticket.status === 'closed' ? 'fechado' : ticket.status,
      priority: ticket.priority === 'low' ? 'baixa' : 
                ticket.priority === 'medium' ? 'media' : 
                ticket.priority === 'high' ? 'alta' : 
                ticket.priority === 'urgent' ? 'urgente' : ticket.priority,
      assignee: ticket.assignee || "Não atribuído",
      department: ticket.department || "",
      estimatedDate: ticket.estimatedDate || ticket.estimated_date || ""
    };

    return (
      status !== currentData.status ||
      priority !== currentData.priority ||
      assignee !== currentData.assignee ||
      department !== currentData.department ||
      estimatedDate !== currentData.estimatedDate ||
      comment.trim() !== ""
    );
  };

  if (!ticket) {
    console.log('❌ Ticket não encontrado no TicketEditDialog');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full mx-auto my-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Ticket className="h-5 w-5" />
            Editar Ticket - Administrador
            <Badge variant="outline" className="ml-2">
              {ticket.ticket_number || ticket.id}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas do ticket (readonly) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Informações do Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-2">
                  <Ticket className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Assunto:</Label>
                    <p className="text-sm text-gray-900 font-medium">{ticket.subject}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Cliente:</Label>
                    <p className="text-sm text-gray-900">{ticket.customer?.name || ticket.customer || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Empresa:</Label>
                    <p className="text-sm text-gray-900">{ticket.company?.name || ticket.company || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Criado em:</Label>
                    <p className="text-sm text-gray-900">
                      {new Date(ticket.created_at || ticket.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                {ticket.description && (
                  <div className="col-span-full">
                    <Label className="text-xs font-medium text-gray-600">Descrição:</Label>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1 max-h-20 overflow-y-auto">
                      {ticket.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campos editáveis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Campos Editáveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">🔴 Aberto</SelectItem>
                      <SelectItem value="em_andamento">🟡 Em Andamento</SelectItem>
                      <SelectItem value="resolvido">🟢 Resolvido</SelectItem>
                      <SelectItem value="fechado">⚫ Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority" className="text-sm font-medium">Prioridade *</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgente">🔥 Urgente</SelectItem>
                      <SelectItem value="alta">🟠 Alta</SelectItem>
                      <SelectItem value="media">🟡 Média</SelectItem>
                      <SelectItem value="baixa">🟢 Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignee" className="text-sm font-medium">Responsável</Label>
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não atribuído">👤 Não atribuído</SelectItem>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.user_id} value={user.name}>
                          👨‍💼 {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableUsers.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">⏳ Carregando usuários...</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="department" className="text-sm font-medium">Departamento</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TI">💻 TI</SelectItem>
                      <SelectItem value="Suporte">🛠️ Suporte</SelectItem>
                      <SelectItem value="Desenvolvimento">⚙️ Desenvolvimento</SelectItem>
                      <SelectItem value="Financeiro">💰 Financeiro</SelectItem>
                      <SelectItem value="RH">👥 RH</SelectItem>
                      <SelectItem value="Comercial">📈 Comercial</SelectItem>
                      <SelectItem value="Administrativo">📋 Administrativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="estimatedDate" className="text-sm font-medium">Data de Previsão</Label>
                <Input
                  id="estimatedDate"
                  type="date"
                  value={estimatedDate}
                  onChange={(e) => setEstimatedDate(e.target.value)}
                  className="h-10 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="comment" className="text-sm font-medium">
                  Comentário sobre as Alterações
                  <span className="text-xs text-gray-500 ml-1">(opcional)</span>
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Descreva as alterações realizadas ou adicione observações..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="text-sm resize-none mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-1">
            {hasChanges() ? "📝 Alterações detectadas" : "✅ Nenhuma alteração"}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges() || isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketEditDialog;