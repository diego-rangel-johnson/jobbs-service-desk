import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MessageSquare, User, Download, FileText, Image, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTickets, TicketAttachment } from "@/hooks/useTickets";

interface TicketDetailsProps {
  ticket: any;
}

const TicketDetails = ({ ticket }: TicketDetailsProps) => {
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const { toast } = useToast();
  const { getTicketAttachments, downloadAttachment } = useTickets();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
      case "open":
        return "bg-red-100 text-red-800 border-red-200";
      case "em_andamento":
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolvido":
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
      case "high":
      case "urgent":
        return "bg-red-500";
      case "media":
      case "medium":
        return "bg-yellow-500";
      case "baixa":
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
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

  const loadAttachments = async () => {
    if (!ticket?.id) return;
    
    setLoadingAttachments(true);
    try {
      const result = await getTicketAttachments(ticket.id);
      if (result && !result.error) {
        setAttachments(result.data);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleDownloadAttachment = async (attachment: TicketAttachment) => {
    await downloadAttachment(attachment);
  };

  useEffect(() => {
    loadAttachments();
  }, [ticket?.id]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    toast({
      title: "Comentário adicionado",
      description: "Seu comentário foi adicionado ao ticket.",
    });
    
    setNewComment("");
  };

  if (!ticket) return null;

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{ticket.id || ticket.ticket_number}</CardTitle>
          <Badge variant="secondary" className={getStatusColor(ticket.status)}>
            {ticket.status === 'aberto' ? 'Aberto' : 
             ticket.status === 'em_andamento' ? 'Em Andamento' : 
             ticket.status === 'resolvido' ? 'Resolvido' :
             ticket.status?.replace('_', ' ') || ticket.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(ticket.priority)}`} />
          <span className="text-sm text-muted-foreground capitalize">
            Prioridade {ticket.priority === 'alta' ? 'Alta' : 
                     ticket.priority === 'media' ? 'Média' : 
                     ticket.priority === 'baixa' ? 'Baixa' : 
                     ticket.priority}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">{ticket.subject}</h3>
          <p className="text-sm text-muted-foreground">{ticket.description}</p>
        </div>

        <Separator />

        {/* Informações Adicionais */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Departamento:</span>
            <p className="text-muted-foreground">{ticket.department}</p>
          </div>
          <div>
            <span className="font-medium">Cliente:</span>
            <p className="text-muted-foreground">
              {ticket.customer?.name || ticket.customer || 'N/A'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Anexos */}
        {attachments.length > 0 && (
          <>
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Anexos ({attachments.length})
              </h4>
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
            </div>
            <Separator />
          </>
        )}

        {loadingAttachments && (
          <>
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Carregando anexos...</p>
            </div>
            <Separator />
          </>
        )}

        {/* Timeline */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Timeline</span>
          </div>
          
          <div className="space-y-3">
            {ticket.updates && ticket.updates.length > 0 ? (
              ticket.updates.map((update: any, index: number) => (
                <div key={index} className="flex space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">{update.user || update.name || 'Sistema'}</span>
                      <span className="text-xs text-muted-foreground">
                        {update.date || new Date(update.created_at || Date.now()).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{update.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium">Sistema</span>
                    <span className="text-xs text-muted-foreground">
                      {ticket.date ? new Date(ticket.date).toLocaleString('pt-BR') : 
                       ticket.created_at ? new Date(ticket.created_at).toLocaleString('pt-BR') : 
                       'Data não disponível'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Ticket criado</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Adicionar Comentário</span>
          </div>
          
          <div className="space-y-3">
            <Textarea
              placeholder="Digite seu comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              size="sm"
              className="w-full"
            >
              Adicionar Comentário
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketDetails;