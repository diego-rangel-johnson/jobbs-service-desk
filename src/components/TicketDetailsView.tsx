import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Ticket, TicketUpdate, TicketAttachment, useTickets } from "@/hooks/useTickets";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Clock, User, Send, Loader2, Download, FileText, Image, File } from "lucide-react";

interface TicketDetailsViewProps {
  ticket: Ticket;
}

const TicketDetailsView = ({ ticket }: TicketDetailsViewProps) => {
  const [updates, setUpdates] = useState<TicketUpdate[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);
  const { fetchTicketUpdates, addTicketUpdate, updateTicket, getTicketAttachments, downloadAttachment } = useTickets();
  const { user, isSupport, isAdmin } = useAuth();

  useEffect(() => {
    const loadUpdates = async () => {
      setIsLoadingUpdates(true);
      const result = await fetchTicketUpdates(ticket.id);
      if (!result.error) {
        setUpdates((result.data as any) || []);
      }
      setIsLoadingUpdates(false);
    };

    const loadAttachments = async () => {
      setIsLoadingAttachments(true);
      const result = await getTicketAttachments(ticket.id);
      if (!result.error) {
        setAttachments(result.data);
      }
      setIsLoadingAttachments(false);
    };

    loadUpdates();
    loadAttachments();
  }, [ticket.id]);

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

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-4 w-4" />;
    
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (fileType.includes('pdf') || fileType.includes('document')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Tamanho desconhecido';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadAttachment = async (attachment: TicketAttachment) => {
    await downloadAttachment(attachment);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsLoadingMessage(true);
    const result = await addTicketUpdate(ticket.id, newMessage.trim());
    
    if (!result?.error) {
      setNewMessage("");
      // Reload updates
      const updatesResult = await fetchTicketUpdates(ticket.id);
      if (!updatesResult.error) {
        setUpdates((updatesResult.data as any) || []);
      }
    }
    
    setIsLoadingMessage(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingTicket(true);
    await updateTicket(ticket.id, { status: newStatus as any });
    setIsUpdatingTicket(false);
  };

  const canUpdateTicket = isSupport || isAdmin || ticket.customer_id === user?.id;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{ticket.subject}</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <span className="font-mono text-sm text-muted-foreground">
                {ticket.ticket_number}
              </span>
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(ticket.priority)}`} />
              <span className="text-sm text-muted-foreground">
                {getPriorityLabel(ticket.priority)}
              </span>
            </div>
          </div>
          <Badge variant="secondary" className={getStatusColor(ticket.status)}>
            {getStatusLabel(ticket.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Update for Support/Admin */}
        {(isSupport || isAdmin) && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Atualizar Status</label>
            <Select 
              value={ticket.status} 
              onValueChange={handleStatusChange}
              disabled={isUpdatingTicket}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Ticket Info */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Departamento:</span>
              <p className="text-muted-foreground">{ticket.department}</p>
            </div>
            <div>
              <span className="font-medium">Criado em:</span>
              <p className="text-muted-foreground">
                {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          {ticket.customer && (
            <div>
              <span className="font-medium text-sm">Cliente:</span>
              <p className="text-muted-foreground text-sm">{ticket.customer.name}</p>
            </div>
          )}
          
          {ticket.assignee && (
            <div>
              <span className="font-medium text-sm">Responsável:</span>
              <p className="text-muted-foreground text-sm">{ticket.assignee.name}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Description */}
        <div>
          <h4 className="font-medium text-sm mb-2">Descrição</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>

        {/* Attachments */}
        {(attachments.length > 0 || isLoadingAttachments) && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <h4 className="font-medium text-sm">
                  Anexos {attachments.length > 0 && `(${attachments.length})`}
                </h4>
              </div>

              {isLoadingAttachments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="border rounded-lg p-3 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {getFileIcon(attachment.file_type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.file_size)} • 
                              {new Date(attachment.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="ml-2"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Updates/Messages */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <h4 className="font-medium text-sm">Histórico de Atualizações</h4>
          </div>

          {isLoadingUpdates ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {updates.map((update) => (
                <div key={update.id} className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {update.user?.name || 'Sistema'}
                    </span>
                    <Clock className="h-3 w-3" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm">{update.message}</p>
                </div>
              ))}
              
              {updates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atualização ainda
                </p>
              )}
            </div>
          )}
        </div>

        {/* Add Message Form */}
        {canUpdateTicket && (
          <>
            <Separator />
            <form onSubmit={handleSendMessage} className="space-y-3">
              <Textarea
                placeholder="Adicionar comentário ou atualização..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
              <Button type="submit" size="sm" className="w-full text-white" disabled={isLoadingMessage}>
                {isLoadingMessage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoadingMessage ? "Enviando..." : "Enviar"}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketDetailsView;