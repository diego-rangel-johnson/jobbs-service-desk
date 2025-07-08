import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, X, Loader2 } from "lucide-react";
import { useTickets } from "@/hooks/useTickets";
import { SLASelector } from '@/components/SLA/SLASelector';
import { SLACriticality } from '@/types/sla';

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (ticketData: any) => void;
}

const NewTicketDialog = ({ open, onOpenChange, onSubmit }: NewTicketDialogProps) => {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [slaCriticality, setSlaCriticality] = useState<SLACriticality>('padrao');
  const [department, setDepartment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createTicket } = useTickets();

  // Mapear criticidade SLA para prioridade para compatibilidade
  const mapSLAToPriority = (slaCriticality: SLACriticality): string => {
    switch (slaCriticality) {
      case 'muito_alta': return 'urgent';
      case 'alta': return 'high';
      case 'moderada': return 'medium';
      case 'padrao': return 'medium';
      case 'geral': return 'low';
      default: return 'medium';
    }
  };

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
        priority: mapSLAToPriority(slaCriticality), // Mapear SLA para prioridade
        department,
        attachment,
        sla_criticality: slaCriticality
      });

      if (result.error) {
        console.error("Erro ao criar ticket:", result.error);
      } else {
        console.log("Ticket criado com sucesso!");
        
        // Resetar formulário
        setSubject("");
        setDescription("");
        setSlaCriticality('padrao');
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
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full mx-auto my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 py-4">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-center">
            Novo Ticket
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-4 sm:px-6 pb-4 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Assunto e Departamento - responsivo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                  Assunto *
                </Label>
                <Input
                  id="subject"
                  placeholder="Descreva brevemente o problema..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">
                  Departamento *
                </Label>
                <Select value={department} onValueChange={setDepartment} required disabled={isSubmitting}>
                  <SelectTrigger className="w-full">
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
            </div>

            {/* Criticidade SLA */}
            <div className="space-y-2">
              <Label htmlFor="slaCriticality" className="text-sm font-medium">
                Criticidade SLA *
              </Label>
              <SLASelector 
                value={slaCriticality} 
                onChange={setSlaCriticality}
                canEdit={true}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Selecione a criticidade baseada no impacto do problema no seu negócio
              </p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição *
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva detalhadamente o problema ou solicitação..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                disabled={isSubmitting}
                className="w-full resize-none min-h-[100px]"
              />
            </div>

            {/* Anexo - otimizado para mobile */}
            <div className="space-y-2">
              <Label htmlFor="attachment" className="text-sm font-medium">
                Anexar Evidência
              </Label>
              {!attachment ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 hover:border-muted-foreground/50 transition-colors">
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
                    <Paperclip className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground text-center font-medium">
                      Toque para anexar arquivo
                    </span>
                    <span className="text-xs text-muted-foreground text-center px-2">
                      Imagens, PDF, DOC, TXT, XLS (máx. 10MB)
                    </span>
                  </label>
                </div>
              ) : (
                <div className="border rounded-lg p-3 sm:p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
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
                      className="ml-2 h-8 w-8 p-0 hover:bg-destructive/10 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer com botões responsivos */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:flex-1 order-2 sm:order-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            className="w-full sm:flex-1 order-1 sm:order-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Ticket"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketDialog;