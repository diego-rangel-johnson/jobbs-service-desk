import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Clock, User, Building, AlertCircle, Download, Calendar, FileText, Ticket, Edit, Copy } from "lucide-react";
import { SLAStatusIndicator } from '@/components/SLA/SLAStatusIndicator';

interface TicketViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: any;
  onEdit?: (ticket: any) => void;
}

const TicketViewDialog = ({ open, onOpenChange, ticket, onEdit }: TicketViewDialogProps) => {
  console.log('🔍 TicketViewDialog recebeu ticket:', ticket);
  
  if (!ticket) {
    console.log('❌ Ticket não encontrado no TicketViewDialog');
    return null;
  }

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
      case "urgente": return "bg-red-500 text-white";
      case "high":
      case "alta": return "bg-orange-500 text-white";
      case "medium":
      case "media": return "bg-yellow-500 text-white";
      case "low":
      case "baixa": return "bg-green-500 text-white";
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

  const handleCopyTicketId = () => {
    const ticketId = ticket.ticket_number || ticket.id;
    navigator.clipboard.writeText(ticketId);
    console.log('✅ ID do ticket copiado:', ticketId);
  };

  const handleEditTicket = () => {
    if (onEdit) {
      onEdit(ticket);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Detalhes do Ticket
            <Badge 
              variant="outline" 
              className="ml-2 cursor-pointer hover:bg-gray-100" 
              onClick={handleCopyTicketId}
              title="Clique para copiar"
            >
              <Copy className="h-3 w-3 mr-1" />
              {ticket.ticket_number || ticket.id}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Header do Ticket */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {ticket.subject}
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {getPriorityLabel(ticket.priority)}
                  </Badge>
                  <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                    {getStatusLabel(ticket.status)}
                  </Badge>
                  {ticket.sla_criticality && (
                    <Badge variant="outline" className="text-xs">
                      SLA: {getSLACriticalityLabel(ticket.sla_criticality)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Informações do Ticket */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-600">Número:</span>
                <p className="text-sm text-gray-900 font-mono">{ticket.ticket_number || ticket.id}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Cliente:</span>
                <p className="text-sm text-gray-900">{ticket.customer?.name || ticket.customer || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Empresa:</span>
                <p className="text-sm text-gray-900">{ticket.company?.name || ticket.company || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Departamento:</span>
                <p className="text-sm text-gray-900">{ticket.department || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Criado em:</span>
                <p className="text-sm text-gray-900">
                  {new Date(ticket.created_at || ticket.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {ticket.assignee && ticket.assignee !== 'Não atribuído' && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Responsável:</span>
                  <p className="text-sm text-gray-900">{ticket.assignee?.name || ticket.assignee}</p>
                </div>
              )}
              {ticket.estimated_date && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Previsão:</span>
                  <p className="text-sm text-gray-900">
                    {new Date(ticket.estimated_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-600">Última atualização:</span>
                <p className="text-sm text-gray-900">
                  {new Date(ticket.updated_at || ticket.created_at || ticket.date).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* SLA Information */}
          {ticket.sla_status && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Informações SLA</h3>
              <SLAStatusIndicator
                status={ticket.sla_status}
                responseDeadline={ticket.sla_response_deadline}
                solutionDeadline={ticket.sla_solution_deadline}
                firstResponseAt={ticket.sla_first_response_at}
                solvedAt={ticket.sla_solved_at}
                showDetails={true}
              />
            </div>
          )}

          {/* Descrição */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Descrição</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {ticket.description || 'Nenhuma descrição fornecida.'}
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Administrador - Acesso completo
              </div>
              <div className="flex gap-2">
                {onEdit && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleEditTicket}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar Ticket
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketViewDialog;