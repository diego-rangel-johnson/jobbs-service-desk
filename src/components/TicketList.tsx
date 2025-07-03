import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Ticket } from "@/hooks/useTickets";
import { useState } from "react";

interface TicketListProps {
  tickets: Ticket[];
  onTicketSelect: (ticket: Ticket) => void;
  selectedTicket?: Ticket | null;
}

const TicketList = ({ tickets, onTicketSelect, selectedTicket }: TicketListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800 border-red-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
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

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar tickets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filteredTickets.map((ticket) => (
          <Card 
            key={ticket.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onTicketSelect(ticket)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm text-muted-foreground">
                    {ticket.ticket_number}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(ticket.priority)}`} />
                </div>
                <Badge variant="secondary" className={`text-xs ${getStatusColor(ticket.status)}`}>
                  {getStatusLabel(ticket.status)}
                </Badge>
              </div>
              
              <h3 className="font-medium text-foreground mb-1 line-clamp-2">
                {ticket.subject}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {ticket.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                </span>
                <span className="capitalize">
                  {getPriorityLabel(ticket.priority)}
                </span>
              </div>
              
              {ticket.customer && (
                <div className="text-xs text-muted-foreground mt-1">
                  Cliente: {ticket.customer.name}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {filteredTickets.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'Nenhum ticket encontrado' : 'Nenhum ticket ainda'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;