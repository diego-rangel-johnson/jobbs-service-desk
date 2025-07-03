import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import TicketCard from "@/components/TicketCard";

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

const TicketsList = ({ 
  searchTerm, 
  setSearchTerm, 
  filteredTickets, 
  selectedTicket, 
  setSelectedTicket, 
  setShowNewTicket,
  getStatusColor,
  getPriorityColor 
}: TicketsListProps) => {
  return (
    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
      {/* New Ticket Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold">Meus Tickets</h2>
        <Button onClick={() => setShowNewTicket(true)} className="shadow-lg text-white w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por número ou assunto do ticket..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            isSelected={selectedTicket?.id === ticket.id}
            onClick={() => setSelectedTicket(ticket)}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
          />
        ))}
      </div>
    </div>
  );
};

export default TicketsList;