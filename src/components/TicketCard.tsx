import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TicketCardProps {
  ticket: any;
  isSelected: boolean;
  onClick: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const TicketCard = ({ ticket, isSelected, onClick, getStatusColor, getPriorityColor }: TicketCardProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
              <span className="font-mono text-xs sm:text-sm text-muted-foreground">{ticket.id}</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getPriorityColor(ticket.priority)}`} />
                <Badge variant="secondary" className={`text-xs ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <h3 className="font-medium text-foreground mb-1 text-sm sm:text-base line-clamp-2">{ticket.subject}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Criado em {new Date(ticket.date).toLocaleDateString('pt-BR')}
            </p>
            {ticket.estimatedDate && (
              <p className="text-xs sm:text-sm text-blue-600 font-medium">
                Previsão: {new Date(ticket.estimatedDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketCard;