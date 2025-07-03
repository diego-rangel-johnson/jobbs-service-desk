import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, X, Loader2 } from "lucide-react";
import { useTickets } from "@/hooks/useTickets";

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (ticketData: any) => void;
}

const NewTicketDialog = ({ open, onOpenChange, onSubmit }: NewTicketDialogProps) => {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [department, setDepartment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createTicket } = useTickets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim() || !department) {
      console.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Verificar tamanho do arquivo (máx 10MB)
    if (attachment && attachment.size > 10 * 1024 * 1024) {
      console.error("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createTicket({
        subject,
        description,
        priority,
        department,
        attachment
      });

      if (result.error) {
        console.error("Erro ao criar ticket:", result.error);
      } else {
        console.log("Ticket criado com sucesso!");
        
        // Resetar formulário
        setSubject("");
        setDescription("");
        setPriority("medium");
        setDepartment("");
        setAttachment(null);
        
        onOpenChange(false);
        
        // Chamar callback do parent se existir
        if (onSubmit) {
          onSubmit(result.data);
        }
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tamanho do arquivo
      if (file.size > 10 * 1024 * 1024) {
        console.error("O arquivo deve ter no máximo 10MB.");
        return;
      }
      
      setAttachment(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    // Reset file input
    const fileInput = document.getElementById('attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Paperclip className="h-4 w-4" />;
    } else if (file.type.includes('pdf') || file.type.includes('document')) {
      return <Paperclip className="h-4 w-4" />;
    } else {
      return <Paperclip className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Ticket</DialogTitle>
          <DialogFooter>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  placeholder="Descreva brevemente o problema..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departamento *</Label>
                <Select value={department} onValueChange={setDepartment} required disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TI">TI</SelectItem>
                    <SelectItem value="Suporte">Suporte</SelectItem>
                    <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="RH">Recursos Humanos</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={setPriority} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente o problema ou solicitação..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachment">Anexar Evidência</Label>
                {!attachment ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 transition-colors">
                    <input
                      type="file"
                      id="attachment"
                      accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="attachment"
                      className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                    >
                      <Paperclip className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground text-center">
                        Clique para anexar arquivo
                      </span>
                      <span className="text-xs text-muted-foreground text-center">
                        Imagens, PDF, DOC, TXT, XLS (máx. 10MB)
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {getFileIcon(attachment)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAttachment}
                        disabled={isSubmitting}
                        className="ml-2 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Ticket"}
                </Button>
              </div>
            </form>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketDialog;