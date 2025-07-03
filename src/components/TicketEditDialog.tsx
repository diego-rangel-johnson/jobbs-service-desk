import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status || "");
      setPriority(ticket.priority || "");
      setAssignee(ticket.assignee || "");
      setDepartment(ticket.department || "");
      setEstimatedDate(ticket.estimatedDate || "");
      setComment("");
    }
  }, [ticket]);

  const handleSave = () => {
    const updates = {
      status,
      priority,
      assignee,
      department,
      estimatedDate,
      ...(comment && { newComment: comment })
    };
    
    onSave(ticket.id, updates);
    console.log(`Ticket ${ticket.id} salvo com atualizações:`, updates);
    onOpenChange(false);
    setComment("");
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full mx-auto my-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-center">Editar Ticket #{ticket.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Assunto</Label>
            <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
              {ticket.subject}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority" className="text-sm font-medium">Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-10 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
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
                  <SelectItem value="Não atribuído">Não atribuído</SelectItem>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.user_id} value={user.name}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="department" className="text-sm font-medium">Departamento</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-10 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TI">TI</SelectItem>
                  <SelectItem value="Suporte">Suporte</SelectItem>
                  <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
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
            <Label htmlFor="comment" className="text-sm font-medium">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Adicione um comentário sobre as alterações..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="text-sm resize-none mt-1"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketEditDialog;