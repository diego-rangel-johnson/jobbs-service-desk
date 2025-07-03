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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Editar Ticket {ticket.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-sm">Assunto</Label>
            <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded text-xs">
              {ticket.subject}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="status" className="text-sm">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8">
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
              <Label htmlFor="priority" className="text-sm">Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-8">
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

          <div>
            <Label htmlFor="assignee" className="text-sm">Responsável</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="h-8">
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
            <Label htmlFor="department" className="text-sm">Departamento</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TI">TI</SelectItem>
                <SelectItem value="Suporte">Suporte</SelectItem>
                <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="estimatedDate" className="text-sm">Data de Previsão</Label>
            <Input
              id="estimatedDate"
              type="date"
              value={estimatedDate}
              onChange={(e) => setEstimatedDate(e.target.value)}
              className="h-8"
            />
          </div>

          <div>
            <Label htmlFor="comment" className="text-sm">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Adicione um comentário..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Cancelar
          </Button>
          <Button onClick={handleSave} size="sm">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketEditDialog;