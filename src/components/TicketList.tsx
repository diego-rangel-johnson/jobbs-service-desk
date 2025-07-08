import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, AlertTriangle, User, Calendar, Zap, Shield, Settings } from "lucide-react";
import { Ticket } from "@/hooks/useTickets";
import { useState } from "react";
import { SLAStatusIndicator } from '@/components/SLA/SLAStatusIndicator';
import { SLA_CONFIGS } from '@/types/sla';

interface TicketListProps {
  tickets: Ticket[];
  onTicketSelect: (ticket: Ticket) => void;
  selectedTicket?: Ticket | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

// Mapear ícones para cada criticidade SLA
const getSLAIcon = (slaCriticality: string) => {
  switch (slaCriticality) {
    case 'muito_alta': return <Zap className="h-3 w-3" />;
    case 'alta': return <AlertTriangle className="h-3 w-3" />;
    case 'moderada': return <Clock className="h-3 w-3" />;
    case 'padrao': return <Shield className="h-3 w-3" />;
    case 'geral': return <Settings className="h-3 w-3" />;
    default: return <Shield className="h-3 w-3" />;
  }
};

const TicketList = ({ tickets, onTicketSelect, selectedTicket, searchTerm, onSearchChange }: TicketListProps) => {
  const [searchTermLocal, setSearchTermLocal] = useState("");

  const getSLACriticalityLabel = (slaCriticality: string) => {
    return SLA_CONFIGS[slaCriticality as keyof typeof SLA_CONFIGS]?.label || 'Padrão';
  };

  const getSLACriticalityColor = (slaCriticality: string) => {
    const config = SLA_CONFIGS[slaCriticality as keyof typeof SLA_CONFIGS];
    if (!config) return 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100';
    
    switch (config.color) {
      case 'red': return 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100';
      case 'orange': return 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100';
      case 'yellow': return 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100';
      case 'blue': return 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100';
      case 'gray': return 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100';
      default: return 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "border-red-200 bg-red-50 text-red-700";
      case "in_progress": return "border-yellow-200 bg-yellow-50 text-yellow-700";
      case "resolved": return "border-green-200 bg-green-50 text-green-700";
      case "closed": return "border-gray-200 bg-gray-50 text-gray-700";
      default: return "border-gray-200 bg-gray-50 text-gray-700";
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTermLocal.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchTermLocal.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTermLocal.toLowerCase())
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Tickets ({tickets.length})
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tickets..."
            value={searchTermLocal}
            onChange={(e) => {
              setSearchTermLocal(e.target.value);
              onSearchChange(e.target.value);
            }}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2 max-h-[600px] overflow-y-auto px-4 pb-4">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum ticket encontrado</p>
              {searchTermLocal && (
                <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
              )}
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 ${
                  selectedTicket?.id === ticket.id ? 'ring-2 ring-primary bg-primary/5 border-primary' : 'hover:bg-muted/30'
                }`}
                onClick={() => onTicketSelect(ticket)}
              >
                <div className="space-y-3">
                  {/* Header com número e badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-muted-foreground font-medium">
                          #{ticket.ticket_number || ticket.id}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge className={getStatusColor(ticket.status)} variant="outline">
                            {getStatusLabel(ticket.status)}
                          </Badge>
                          {ticket.sla_status && (
                            <SLAStatusIndicator 
                              status={ticket.sla_status}
                              showDetails={false}
                              className="text-xs"
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* Assunto */}
                      <h4 className="font-semibold text-sm leading-relaxed line-clamp-2 text-gray-900 mb-2">
                        {ticket.subject}
                      </h4>
                    </div>
                  </div>

                  {/* Criticidade SLA destacada */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={`flex items-center gap-2 px-3 py-1 font-medium ${getSLACriticalityColor(ticket.sla_criticality || 'padrao')}`}
                      variant="outline"
                    >
                      {getSLAIcon(ticket.sla_criticality || 'padrao')}
                      <span>{getSLACriticalityLabel(ticket.sla_criticality || 'padrao')}</span>
                    </Badge>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>

                  {/* Informações adicionais */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground bg-gray-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-600">Departamento:</span>
                      <span>{ticket.department}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{ticket.customer?.name || 'Cliente não identificado'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketList;