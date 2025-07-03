import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Clock, User, Building, AlertCircle, Download } from "lucide-react";

interface TicketViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: any;
}

const TicketViewDialog = ({ open, onOpenChange, ticket }: TicketViewDialogProps) => {
  if (!ticket) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-md lg:max-w-lg max-h-[85vh] overflow-y-auto mx-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-left">
            <span className="text-base sm:text-lg">Ticket {ticket.id}</span>
            <Badge variant="secondary" className={`text-xs w-fit ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Informações Básicas */}
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium">Informações do Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              <div>
                <h4 className="font-medium text-foreground text-sm">Assunto</h4>
                <p className="text-muted-foreground text-sm">{ticket.subject}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <h4 className="font-medium text-foreground flex items-center space-x-1 text-sm">
                    <User className="h-3 w-3" />
                    <span>Cliente</span>
                  </h4>
                  <p className="text-muted-foreground text-sm">{ticket.customer}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground flex items-center space-x-1 text-sm">
                    <Clock className="h-3 w-3" />
                    <span>Data</span>
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {new Date(ticket.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h4 className="font-medium text-foreground flex items-center space-x-1 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    <span>Prioridade</span>
                  </h4>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                    <span className="capitalize text-muted-foreground text-sm">{ticket.priority}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground flex items-center space-x-1 text-sm">
                    <Building className="h-3 w-3" />
                    <span>Depto</span>
                  </h4>
                  <p className="text-muted-foreground text-sm">{ticket.department}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-foreground text-sm">Responsável</h4>
                <p className="text-muted-foreground text-sm">{ticket.assignee}</p>
              </div>
            </CardContent>
          </Card>

          {/* Descrição */}
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium">Descrição</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <p className="text-muted-foreground text-sm whitespace-pre-wrap max-h-24 overflow-y-auto">
                {ticket.description || "Nenhuma descrição fornecida."}
              </p>
            </CardContent>
          </Card>

          {/* Histórico Resumido */}
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium">Histórico</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium">Sistema</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ticket.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ticket criado</p>
                  </div>
                </div>
                
                {ticket.assignee !== 'Não atribuído' && (
                  <div className="flex space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">{ticket.assignee}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(ticket.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Ticket atribuído</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketViewDialog;