import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Clock, Calendar, User, Zap, AlertTriangle, Shield, Settings } from "lucide-react";
import { SLAStatusIndicator } from '@/components/SLA/SLAStatusIndicator';
import { SLA_CONFIGS } from '@/types/sla';

interface TicketsListProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredTickets: any[];
  selectedTicket: any;
  setSelectedTicket: (ticket: any) => void;
  setShowNewTicket: (show: boolean) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
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

const TicketsList: React.FC<TicketsListProps> = ({
  searchTerm,
  setSearchTerm,
  filteredTickets,
  selectedTicket,
  setSelectedTicket,
  setShowNewTicket,
  getStatusColor,
  getPriorityColor
}) => {

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

  return (
    <div className="lg:col-span-2 space-y-4">
      {/* Header com busca e botão de novo ticket */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={() => setShowNewTicket(true)}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {/* Lista de tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Meus Tickets ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum ticket encontrado</p>
                {searchTerm && (
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
                  onClick={() => setSelectedTicket(ticket)}
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
                            <Badge variant="outline" className={getStatusColor(ticket.status)}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                            {ticket.sla_status && (
                              <SLAStatusIndicator 
                                status={ticket.sla_status}
                                responseDeadline={ticket.sla_response_deadline}
                                solutionDeadline={ticket.sla_solution_deadline}
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
                        variant="outline" 
                        className={`flex items-center gap-2 px-3 py-1 font-medium ${getSLACriticalityColor(ticket.sla_criticality || 'padrao')}`}
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
                        <span>{ticket.customer?.name || ticket.customer || 'Você'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketsList;