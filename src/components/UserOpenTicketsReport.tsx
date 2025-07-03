import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Clock, 
  Calendar,
  User,
  TrendingUp,
  Timer,
  Target,
  Zap,
  Download,
  File,
  Sheet,
  FileText,
  CheckCircle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";

interface UserOpenTicketsReportProps {
  tickets: any[];
  userName: string;
}

const UserOpenTicketsReport: React.FC<UserOpenTicketsReportProps> = ({ tickets, userName }) => {
  // Obter user ID para filtragem correta
  const { user } = useAuth();

  // Filtrar apenas tickets abertos do usuário usando customer_id (Supabase) ou customer (localStorage)
  const userOpenTickets = useMemo(() => {
    if (!user && !userName) return [];
    
    return tickets.filter(ticket => {
      // Verificar se é ticket do usuário
      const isUserTicket = (user && (ticket.customer_id === user.id || ticket.customer?.user_id === user.id)) ||
                          ticket.customer === userName;
      
      // Verificar se está aberto (normalizar diferentes formatos)
      const isOpen = ticket.status === "open" || ticket.status === "aberto";
      
      return isUserTicket && isOpen;
    });
  }, [tickets, user, userName]);

  // Estatísticas dos tickets abertos do usuário (com normalização de prioridade)
  const userOpenStats = useMemo(() => {
    const total = userOpenTickets.length;
    
    // Normalizar prioridade para suportar ambos os formatos
    const alta = userOpenTickets.filter(t => t.priority === "alta" || t.priority === "high" || t.priority === "urgent").length;
    const media = userOpenTickets.filter(t => t.priority === "media" || t.priority === "medium").length;
    const baixa = userOpenTickets.filter(t => t.priority === "baixa" || t.priority === "low").length;

    // Tickets sem responsável
    const semResponsavel = userOpenTickets.filter(t => 
      t.assignee === "Não atribuído" || !t.assignee
    ).length;

    // Tickets antigos (mais de 7 dias) - usar created_at ou date
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ticketsAntigos = userOpenTickets.filter(t => {
      const ticketDate = new Date(t.created_at || t.date);
      return ticketDate < sevenDaysAgo;
    }).length;

    // Tickets muito antigos (mais de 30 dias)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ticketsMuitoAntigos = userOpenTickets.filter(t => {
      const ticketDate = new Date(t.created_at || t.date);
      return ticketDate < thirtyDaysAgo;
    }).length;

    return {
      total,
      alta,
      media,
      baixa,
      semResponsavel,
      ticketsAntigos,
      ticketsMuitoAntigos,
      percentualAlta: total > 0 ? (alta / total * 100) : 0,
      percentualSemResponsavel: total > 0 ? (semResponsavel / total * 100) : 0
    };
  }, [userOpenTickets]);

  // Tickets por departamento (apenas abertos do usuário)
  const userOpenTicketsByDepartment = useMemo(() => {
    const departments = [...new Set(userOpenTickets.map(t => t.department))];
    return departments.map(dept => {
      const deptTickets = userOpenTickets.filter(t => t.department === dept);
      const alta = deptTickets.filter(t => t.priority === "alta").length;
      
      return {
        department: dept,
        count: deptTickets.length,
        alta,
        percentage: userOpenTickets.length > 0 ? (deptTickets.length / userOpenTickets.length * 100) : 0,
        percentualAlta: deptTickets.length > 0 ? (alta / deptTickets.length * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);
  }, [userOpenTickets]);

  // Tickets críticos do usuário (alta prioridade + antigos) - com normalização
  const userCriticalTickets = useMemo(() => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    return userOpenTickets.filter(ticket => {
      const isHighPriority = ticket.priority === "alta" || ticket.priority === "high" || ticket.priority === "urgent";
      const ticketDate = new Date(ticket.created_at || ticket.date);
      const isOld = ticketDate < threeDaysAgo;
      
      return isHighPriority || isOld;
    }).sort((a, b) => {
      // Ordenar por prioridade (alta primeiro) e depois por data (mais antigo primeiro)
      const aIsHigh = a.priority === "alta" || a.priority === "high" || a.priority === "urgent";
      const bIsHigh = b.priority === "alta" || b.priority === "high" || b.priority === "urgent";
      
      if (aIsHigh && !bIsHigh) return -1;
      if (!aIsHigh && bIsHigh) return 1;
      
      const aDate = new Date(a.created_at || a.date).getTime();
      const bDate = new Date(b.created_at || b.date).getTime();
      return aDate - bDate;
    });
  }, [userOpenTickets]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-red-500";
      case "media": return "bg-yellow-500";
      case "baixa": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "alta": return <Zap className="h-4 w-4 text-red-500" />;
      case "media": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "baixa": return <Clock className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculateDaysOpen = (ticket: any) => {
    const now = new Date();
    const ticketDate = new Date(ticket.created_at || ticket.date);
    const diffTime = Math.abs(now.getTime() - ticketDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyLevel = (ticket: any) => {
    const daysOpen = calculateDaysOpen(ticket);
    const isHighPriority = ticket.priority === "alta" || ticket.priority === "high" || ticket.priority === "urgent";
    const hasNoAssignee = ticket.assignee === "Não atribuído" || !ticket.assignee;

    if (isHighPriority && daysOpen > 1) return "CRÍTICO";
    if (isHighPriority || daysOpen > 7) return "URGENTE";
    if (daysOpen > 3 || hasNoAssignee) return "ATENÇÃO";
    return "NORMAL";
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "CRÍTICO": return "bg-red-600 text-white";
      case "URGENTE": return "bg-orange-500 text-white";
      case "ATENÇÃO": return "bg-yellow-500 text-black";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  // Funções de exportação específicas para os tickets abertos do usuário
  const exportUserOpenTicketsToCSV = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    let csvContent = `Meus Tickets Abertos - ${userName},${currentDate}\n\n`;
    
    // Estatísticas pessoais de tickets abertos
    csvContent += "ESTATÍSTICAS DOS MEUS TICKETS ABERTOS\n";
    csvContent += "Métrica,Valor\n";
    csvContent += `Total de Tickets Abertos,${userOpenStats.total}\n`;
    csvContent += `Alta Prioridade,${userOpenStats.alta}\n`;
    csvContent += `Sem Responsável,${userOpenStats.semResponsavel}\n`;
    csvContent += `Tickets Antigos (>7 dias),${userOpenStats.ticketsAntigos}\n`;
    csvContent += `% Alta Prioridade,${userOpenStats.percentualAlta.toFixed(1)}%\n`;
    csvContent += `% Sem Responsável,${userOpenStats.percentualSemResponsavel.toFixed(1)}%\n\n`;
    
    // Meus tickets abertos por departamento
    csvContent += "MEUS TICKETS ABERTOS POR DEPARTAMENTO\n";
    csvContent += "Departamento,Total,Alta Prioridade,% do Total\n";
    userOpenTicketsByDepartment.forEach(dept => {
      csvContent += `${dept.department},${dept.count},${dept.alta},${dept.percentage.toFixed(1)}%\n`;
    });
    
    csvContent += "\n";
    
    // Meus tickets críticos
    csvContent += "MEUS TICKETS CRÍTICOS\n";
    csvContent += "Urgência,ID,Assunto,Prioridade,Responsável,Departamento,Dias Aberto\n";
    userCriticalTickets.forEach(ticket => {
      const urgency = getUrgencyLevel(ticket);
      const daysOpen = calculateDaysOpen(ticket);
      csvContent += `${urgency},${ticket.id},"${ticket.subject}",${ticket.priority},"${ticket.assignee}",${ticket.department},${daysOpen}\n`;
    });
    
    // Baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `meus-tickets-abertos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUserOpenTicketsToExcel = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    let excelContent = `Meus Tickets Abertos - ${userName}\t${currentDate}\n\n`;
    
    // Estatísticas pessoais de tickets abertos
    excelContent += "ESTATÍSTICAS DOS MEUS TICKETS ABERTOS\n";
    excelContent += "Métrica\tValor\n";
    excelContent += `Total de Tickets Abertos\t${userOpenStats.total}\n`;
    excelContent += `Alta Prioridade\t${userOpenStats.alta}\n`;
    excelContent += `Sem Responsável\t${userOpenStats.semResponsavel}\n`;
    excelContent += `Tickets Antigos (>7 dias)\t${userOpenStats.ticketsAntigos}\n`;
    excelContent += `% Alta Prioridade\t${userOpenStats.percentualAlta.toFixed(1)}%\n`;
    excelContent += `% Sem Responsável\t${userOpenStats.percentualSemResponsavel.toFixed(1)}%\n\n`;
    
    // Meus tickets abertos por departamento
    excelContent += "MEUS TICKETS ABERTOS POR DEPARTAMENTO\n";
    excelContent += "Departamento\tTotal\tAlta Prioridade\t% do Total\n";
    userOpenTicketsByDepartment.forEach(dept => {
      excelContent += `${dept.department}\t${dept.count}\t${dept.alta}\t${dept.percentage.toFixed(1)}%\n`;
    });
    
    excelContent += "\n";
    
    // Meus tickets críticos
    excelContent += "MEUS TICKETS CRÍTICOS\n";
    excelContent += "Urgência\tID\tAssunto\tPrioridade\tResponsável\tDepartamento\tDias Aberto\n";
    userCriticalTickets.forEach(ticket => {
      const urgency = getUrgencyLevel(ticket);
      const daysOpen = calculateDaysOpen(ticket);
      excelContent += `${urgency}\t${ticket.id}\t${ticket.subject}\t${ticket.priority}\t${ticket.assignee}\t${ticket.department}\t${daysOpen}\n`;
    });
    
    // Baixar arquivo
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `meus-tickets-abertos-${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUserOpenTicketsToPDF = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Meus Tickets Abertos - ${userName} - ${currentDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #dc2626; }
            .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
            .user-info { background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; border: 2px solid #dc2626; }
            .section { margin: 20px 0; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; border-bottom: 2px solid #dc2626; padding-bottom: 5px; }
            .alert-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0; }
            .alert-card { border: 2px solid #dc2626; padding: 10px; border-radius: 5px; background-color: #fef2f2; }
            .alert-value { font-size: 20px; font-weight: bold; color: #dc2626; }
            .alert-label { font-size: 12px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .urgent { background-color: #fee2e2; }
            .critical { background-color: #fecaca; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">🚨 Meus Tickets Abertos</div>
            <div class="subtitle">Relatório Pessoal de Chamados Pendentes</div>
            <div class="subtitle">Gerado em ${currentDate}</div>
          </div>
          
          <div class="user-info">
            <strong>👤 Usuário:</strong> ${userName}<br>
            <strong>📊 Total de Tickets Abertos:</strong> ${userOpenStats.total}<br>
            <strong>🔥 Tickets de Alta Prioridade:</strong> ${userOpenStats.alta}
          </div>
          
          <div class="section">
            <div class="section-title">⚠️ Minhas Estatísticas de Tickets Abertos</div>
            <div class="alert-stats">
              <div class="alert-card">
                <div class="alert-value">${userOpenStats.total}</div>
                <div class="alert-label">Total Abertos</div>
              </div>
              <div class="alert-card">
                <div class="alert-value">${userOpenStats.alta}</div>
                <div class="alert-label">Alta Prioridade (${userOpenStats.percentualAlta.toFixed(1)}%)</div>
              </div>
              <div class="alert-card">
                <div class="alert-value">${userOpenStats.semResponsavel}</div>
                <div class="alert-label">Sem Responsável (${userOpenStats.percentualSemResponsavel.toFixed(1)}%)</div>
              </div>
              <div class="alert-card">
                <div class="alert-value">${userOpenStats.ticketsAntigos}</div>
                <div class="alert-label">Tickets Antigos (>7 dias)</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">🏢 Meus Tickets Abertos por Departamento</div>
            <table>
              <tr>
                <th>Departamento</th>
                <th>Total</th>
                <th>Alta Prioridade</th>
                <th>% do Total</th>
              </tr>
              ${userOpenTicketsByDepartment.map(dept => `
                <tr ${dept.percentualAlta > 50 ? 'class="urgent"' : ''}>
                  <td>${dept.department}</td>
                  <td>${dept.count}</td>
                  <td>${dept.alta}</td>
                  <td>${dept.percentage.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">🎯 Meus Tickets Críticos e Urgentes</div>
            <table>
              <tr>
                <th>Urgência</th>
                <th>ID</th>
                <th>Assunto</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Departamento</th>
                <th>Dias Aberto</th>
              </tr>
              ${userCriticalTickets.slice(0, 20).map(ticket => {
                const urgency = getUrgencyLevel(ticket);
                const daysOpen = calculateDaysOpen(ticket);
                const rowClass = urgency === 'CRÍTICO' ? 'critical' : urgency === 'URGENTE' ? 'urgent' : '';
                
                return `
                  <tr class="${rowClass}">
                    <td>${urgency}</td>
                    <td>${ticket.id}</td>
                    <td>${ticket.subject}</td>
                    <td>${ticket.priority}</td>
                    <td>${ticket.assignee}</td>
                    <td>${ticket.department}</td>
                    <td>${daysOpen} dias</td>
                  </tr>
                `;
              }).join('')}
            </table>
            ${userCriticalTickets.length > 20 ? `<p><em>Mostrando primeiros 20 de ${userCriticalTickets.length} tickets críticos</em></p>` : ''}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const exportUserReport = () => {
    const reportData = {
      usuario: userName,
      dataGeracao: new Date().toISOString(),
      resumo: userOpenStats,
      ticketsCriticos: userCriticalTickets.map(t => ({
        id: t.id,
        subject: t.subject,
        priority: t.priority,
        assignee: t.assignee,
        department: t.department,
        daysOpen: calculateDaysOpen(t),
        urgencyLevel: getUrgencyLevel(t)
      })),
      departamentos: userOpenTicketsByDepartment
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meus-tickets-abertos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (userOpenTickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-green-600 mb-2">🎉 Excelente!</h3>
          <p className="text-gray-600">Você não possui tickets abertos no momento. Todos os seus chamados foram atendidos!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meus Tickets Abertos</h2>
          <p className="text-gray-600">Análise detalhada dos seus tickets pendentes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportUserOpenTicketsToPDF} variant="outline" className="flex items-center gap-2">
            <File className="h-4 w-4" />
            PDF
          </Button>
          <Button onClick={exportUserOpenTicketsToExcel} variant="outline" className="flex items-center gap-2">
            <Sheet className="h-4 w-4" />
            Excel
          </Button>
          <Button onClick={exportUserOpenTicketsToCSV} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={exportUserReport} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      {/* Métricas Pessoais de Alerta */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Meus Tickets Abertos</p>
                <p className="text-3xl font-bold text-red-700">{userOpenStats.total}</p>
                <p className="text-xs text-red-500 mt-1">Requer sua atenção</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <User className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Alta Prioridade</p>
                <p className="text-3xl font-bold text-orange-700">{userOpenStats.alta}</p>
                <p className="text-xs text-orange-500 mt-1">
                  {userOpenStats.percentualAlta.toFixed(1)}% dos meus tickets
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Sem Responsável</p>
                <p className="text-3xl font-bold text-yellow-700">{userOpenStats.semResponsavel}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {userOpenStats.percentualSemResponsavel.toFixed(1)}% não atribuídos
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Tickets Antigos</p>
                <p className="text-3xl font-bold text-purple-700">{userOpenStats.ticketsAntigos}</p>
                <p className="text-xs text-purple-500 mt-1">Mais de 7 dias</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Timer className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Departamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Meus Tickets Abertos por Departamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userOpenTicketsByDepartment.map((dept) => (
              <div key={dept.department} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dept.department}</span>
                    {dept.alta > 0 && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {dept.alta} alta prioridade
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{dept.count} tickets</span>
                    <Badge variant="outline">
                      {dept.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={dept.percentage} className="h-2" />
                {dept.percentualAlta > 50 && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {dept.percentualAlta.toFixed(1)}% são de alta prioridade - necessita acompanhamento
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meus Tickets Críticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Meus Tickets Críticos e Urgentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urgência</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Dias Aberto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userCriticalTickets.slice(0, 10).map((ticket) => {
                  const urgency = getUrgencyLevel(ticket);
                  const daysOpen = calculateDaysOpen(ticket);
                  
                  return (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Badge className={getUrgencyColor(urgency)}>
                          {urgency}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{ticket.id}</TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(ticket.priority)}
                          <span className="capitalize text-sm">{ticket.priority}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {ticket.assignee === "Não atribuído" ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Não atribuído
                          </Badge>
                        ) : (
                          ticket.assignee
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{ticket.department}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            daysOpen > 7 ? "bg-red-100 text-red-800" :
                            daysOpen > 3 ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {daysOpen} dias
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {userCriticalTickets.length > 10 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Mostrando 10 de {userCriticalTickets.length} tickets críticos
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOpenTicketsReport; 