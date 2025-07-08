import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, X, FileText, Image, File } from "lucide-react";
import { SLASelector } from '@/components/SLA/SLASelector';
import { useSLA } from '@/hooks/useSLA';
import { SLACriticality } from '@/types/sla';

interface NewTicketFormProps {
  createTicket: (ticketData: any) => Promise<{ data?: any; error?: string }>;
  onSuccess: () => void;
}

const NewTicketForm = ({ createTicket, onSuccess }: NewTicketFormProps) => {
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    department: "",
    sla_criticality: 'padrao' as SLACriticality
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { canEditSLA } = useSLA();

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
    
    console.log('🔄 Iniciando criação de ticket...');
    console.log('📋 Dados do formulário:', formData);
    console.log('📎 Anexo:', attachment?.name || 'Nenhum');
    
    if (!formData.subject.trim() || !formData.description.trim() || !formData.department) {
      console.log('❌ Campos obrigatórios não preenchidos');
      return;
    }

    // Verificar tamanho do arquivo (máx 10MB)
    if (attachment && attachment.size > 10 * 1024 * 1024) {
      console.log('❌ Arquivo muito grande:', attachment.size);
      return;
    }

    setIsLoading(true);

    try {
      console.log('📤 Enviando dados para createTicket...');
      const result = await createTicket({
        ...formData,
        priority: mapSLAToPriority(formData.sla_criticality), // Mapear SLA para prioridade
        attachment: attachment
      });

      if (result.error) {
        console.error('❌ Erro retornado pelo createTicket:', result.error);
      } else {
        console.log('✅ Ticket criado com sucesso:', result.data);
        setFormData({
          subject: "",
          description: "",
          department: "",
          sla_criticality: 'padrao'
        });
        setAttachment(null);
        onSuccess();
      }
    } catch (error) {
      console.error('❌ Erro inesperado no NewTicketForm:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tamanho do arquivo
      if (file.size > 10 * 1024 * 1024) {
        console.log('❌ Arquivo muito grande:', file.size);
        return;
      }
      
      setAttachment(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    // Reset file input
    const fileInput = document.getElementById('new-ticket-attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (file.type.includes('pdf') || file.type.includes('document')) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Criar Novo Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              placeholder="Descreva brevemente o problema..."
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Departamento *</Label>
            <Select 
              value={formData.department} 
              onValueChange={(value) => setFormData({ ...formData, department: value })}
              required
              disabled={isLoading}
            >
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
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descreva detalhadamente o problema ou solicitação..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Criticidade SLA *</Label>
            <SLASelector
              value={formData.sla_criticality}
              onChange={(value) => setFormData({ ...formData, sla_criticality: value })}
              canEdit={true}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Selecione a criticidade baseada no impacto do problema no seu negócio
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-ticket-attachment">Anexar Evidência</Label>
            {!attachment ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 transition-colors">
                <input
                  type="file"
                  id="new-ticket-attachment"
                  accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
                <label
                  htmlFor="new-ticket-attachment"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
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
                    disabled={isLoading}
                    className="ml-2 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full text-white" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Criando Ticket..." : "Criar Ticket"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewTicketForm;