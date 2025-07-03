import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface TicketCardProps {
  ticket: any;
  isSelected: boolean;
  onClick: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const TicketCard = ({ ticket, isSelected, onClick, getStatusColor, getPriorityColor }: TicketCardProps) => {
  // Função para obter a label de status em português
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
      case "aberto": return "Aberto";
      case "in_progress":
      case "em_andamento": return "Em Andamento";
      case "resolved":
      case "resolvido": return "Resolvido";
      case "closed":
      case "fechado": return "Fechado";
      default: return status;
    }
  };

  // Função para obter a label de prioridade em português
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "alta": return "Urgente";
      case "high": return "Alta";
      case "medium":
      case "media": return "Média";
      case "low":
      case "baixa": return "Baixa";
      default: return priority;
    }
  };

  // Função para cores de prioridade no badge
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "alta": return "bg-red-600 text-white";
      case "high": return "bg-red-500 text-white";
      case "medium":
      case "media": return "bg-yellow-500 text-white";
      case "low":
      case "baixa": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:bg-slate-50 ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h3 className="font-medium text-slate-900">
                {ticket.ticket_number || ticket.id} - {ticket.subject}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getPriorityBadgeColor(ticket.priority)}>
                  {getPriorityLabel(ticket.priority)}
                </Badge>
                <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                  {getStatusLabel(ticket.status)}
                </Badge>
              </div>
            </div>
            
            {ticket.description && (
              <p className="text-sm text-slate-600 mb-2 line-clamp-2">{ticket.description}</p>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-500">
              {ticket.customer && (
                <span>Cliente: {ticket.customer?.name || ticket.customer}</span>
              )}
              {ticket.department && (
                <span>Departamento: {ticket.department}</span>
              )}
              <span>Criado: {new Date(ticket.created_at || ticket.date).toLocaleDateString('pt-BR')}</span>
              {ticket.estimatedDate && (
                <span className="text-blue-600 font-medium">
                  Previsão: {new Date(ticket.estimatedDate).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-end lg:justify-start lg:ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="w-full sm:w-auto"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketCard;