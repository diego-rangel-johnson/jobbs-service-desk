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
  Building2,
  TrendingUp,
  Timer,
  Target,
  Zap,
  Download,
  File,
  Sheet,
  FileText
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OpenTicketsReportProps {
  tickets: any[];
  companies?: any[];
}

const OpenTicketsReport: React.FC<OpenTicketsReportProps> = ({ tickets, companies = [] }) => {
  // Filtrar apenas tickets abertos
  const openTickets = useMemo(() => {
    return tickets.filter(ticket => ticket.status === "aberto");
  }, [tickets]);

  // Estatísticas de tickets abertos
  const openTicketsStats = useMemo(() => {
    const total = openTickets.length;
    const alta = openTickets.filter(t => t.priority === "alta").length;
    const media = openTickets.filter(t => t.priority === "media").length;
    const baixa = openTickets.filter(t => t.priority === "baixa").length;

    // Tickets sem responsável
    const semResponsavel = openTickets.filter(t => 
      t.assignee === "Não atribuído" || !t.assignee
    ).length;

    // Tickets antigos (mais de 7 dias)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ticketsAntigos = openTickets.filter(t => 
      new Date(t.date) < sevenDaysAgo
    ).length;

    // Tickets muito antigos (mais de 30 dias)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ticketsMuitoAntigos = openTickets.filter(t => 
      new Date(t.date) < thirtyDaysAgo
    ).length;

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
  }, [openTickets]);

  // Tickets por departamento (apenas abertos)
  const openTicketsByDepartment = useMemo(() => {
    const departments = [...new Set(openTickets.map(t => t.department))];
    return departments.map(dept => {
      const deptTickets = openTickets.filter(t => t.department === dept);
      const alta = deptTickets.filter(t => t.priority === "alta").length;
      
      return {
        department: dept,
        count: deptTickets.length,
        alta,
        percentage: openTickets.length > 0 ? (deptTickets.length / openTickets.length * 100) : 0,
        percentualAlta: deptTickets.length > 0 ? (alta / deptTickets.length * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);
  }, [openTickets]);

  // Tickets por responsável (apenas abertos)
  const openTicketsByAssignee = useMemo(() => {
    const assignees = [...new Set(openTickets.map(t => t.assignee))];
    return assignees.map(assignee => {
      const assigneeTickets = openTickets.filter(t => t.assignee === assignee);
      const alta = assigneeTickets.filter(t => t.priority === "alta").length;
      
      return {
        assignee,
        count: assigneeTickets.length,
        alta,
        percentage: openTickets.length > 0 ? (assigneeTickets.length / openTickets.length * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);
  }, [openTickets]);

  // Tickets críticos (alta prioridade + antigos)
  const criticalTickets = useMemo(() => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    return openTickets.filter(ticket => 
      ticket.priority === "alta" || 
      new Date(ticket.date) < threeDaysAgo
    ).sort((a, b) => {
      // Ordenar por prioridade (alta primeiro) e depois por data (mais antigo primeiro)
      if (a.priority === "alta" && b.priority !== "alta") return -1;
      if (a.priority !== "alta" && b.priority === "alta") return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [openTickets]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto": return "bg-red-100 text-red-800 border-red-200";
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "alta": return <Zap className="h-4 w-4 text-red-500" />;
      case "media": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "baixa": return <Clock className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculateDaysOpen = (date: string) => {
    const now = new Date();
    const ticketDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - ticketDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyLevel = (ticket: any) => {
    const daysOpen = calculateDaysOpen(ticket.date);
    const isHighPriority = ticket.priority === "alta";
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

  // Funções de exportação específicas para chamados abertos
  const exportOpenTicketsToCSV = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    let csvContent = `Relatório de Chamados Abertos - ${currentDate}\n\n`;
    
    // Estatísticas de alerta
    csvContent += "ESTATÍSTICAS DE CHAMADOS ABERTOS\n";
    csvContent += "Métrica,Valor\n";
    csvContent += `Total de Tickets Abertos,${openTicketsStats.total}\n`;
    csvContent += `Alta Prioridade,${openTicketsStats.alta}\n`;
    csvContent += `Sem Responsável,${openTicketsStats.semResponsavel}\n`;
    csvContent += `Tickets Antigos (>7 dias),${openTicketsStats.ticketsAntigos}\n`;
    csvContent += `% Alta Prioridade,${openTicketsStats.percentualAlta.toFixed(1)}%\n`;
    csvContent += `% Sem Responsável,${openTicketsStats.percentualSemResponsavel.toFixed(1)}%\n\n`;
    
    // Departamentos
    csvContent += "TICKETS ABERTOS POR DEPARTAMENTO\n";
    csvContent += "Departamento,Total,Alta Prioridade,% do Total\n";
    openTicketsByDepartment.forEach(dept => {
      csvContent += `${dept.department},${dept.count},${dept.alta},${dept.percentage.toFixed(1)}%\n`;
    });
    
    csvContent += "\n";
    
    // Tickets críticos
    csvContent += "TICKETS CRÍTICOS\n";
    csvContent += "Urgência,ID,Assunto,Prioridade,Responsável,Departamento,Dias Aberto\n";
    criticalTickets.forEach(ticket => {
      const urgency = getUrgencyLevel(ticket);
      const daysOpen = calculateDaysOpen(ticket.date);
      csvContent += `${urgency},${ticket.id},"${ticket.subject}",${ticket.priority},"${ticket.assignee}",${ticket.department},${daysOpen}\n`;
    });
    
    // Baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `chamados-abertos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportOpenTicketsToExcel = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    let excelContent = `Relatório de Chamados Abertos\t${currentDate}\n\n`;
    
    // Estatísticas de alerta
    excelContent += "ESTATÍSTICAS DE CHAMADOS ABERTOS\n";
    excelContent += "Métrica\tValor\n";
    excelContent += `Total de Tickets Abertos\t${openTicketsStats.total}\n`;
    excelContent += `Alta Prioridade\t${openTicketsStats.alta}\n`;
    excelContent += `Sem Responsável\t${openTicketsStats.semResponsavel}\n`;
    excelContent += `Tickets Antigos (>7 dias)\t${openTicketsStats.ticketsAntigos}\n`;
    excelContent += `% Alta Prioridade\t${openTicketsStats.percentualAlta.toFixed(1)}%\n`;
    excelContent += `% Sem Responsável\t${openTicketsStats.percentualSemResponsavel.toFixed(1)}%\n\n`;
    
    // Departamentos
    excelContent += "TICKETS ABERTOS POR DEPARTAMENTO\n";
    excelContent += "Departamento\tTotal\tAlta Prioridade\t% do Total\n";
    openTicketsByDepartment.forEach(dept => {
      excelContent += `${dept.department}\t${dept.count}\t${dept.alta}\t${dept.percentage.toFixed(1)}%\n`;
    });
    
    excelContent += "\n";
    
    // Tickets críticos
    excelContent += "TICKETS CRÍTICOS\n";
    excelContent += "Urgência\tID\tAssunto\tPrioridade\tResponsável\tDepartamento\tDias Aberto\n";
    criticalTickets.forEach(ticket => {
      const urgency = getUrgencyLevel(ticket);
      const daysOpen = calculateDaysOpen(ticket.date);
      excelContent += `${urgency}\t${ticket.id}\t${ticket.subject}\t${ticket.priority}\t${ticket.assignee}\t${ticket.department}\t${daysOpen}\n`;
    });
    
    // Baixar arquivo
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `chamados-abertos-${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportOpenTicketsToPDF = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Chamados Abertos - ${currentDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #dc2626; }
            .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
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
            <div class="title">🚨 Relatório de Chamados Abertos</div>
            <div class="subtitle">Situação Crítica de Atendimento</div>
            <div class="subtitle">Gerado em ${currentDate}</div>
          </div>
          
          <div class="section">
            <div class="section-title">⚠️ Estatísticas de Alerta</div>
            <div class="alert-stats">
              <div class="alert-card">
                <div class="alert-value">${openTicketsStats.total}</div>
                <div class="alert-label">Tickets Abertos</div>
              </div>
              <div class="alert-card">
                <div class="alert-value">${openTicketsStats.alta}</div>
                <div class="alert-label">Alta Prioridade (${openTicketsStats.percentualAlta.toFixed(1)}%)</div>
              </div>
              <div class="alert-card">
                <div class="alert-value">${openTicketsStats.semResponsavel}</div>
                <div class="alert-label">Sem Responsável (${openTicketsStats.percentualSemResponsavel.toFixed(1)}%)</div>
              </div>
              <div class="alert-card">
                <div class="alert-value">${openTicketsStats.ticketsAntigos}</div>
                <div class="alert-label">Tickets Antigos (>7 dias)</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">📊 Tickets Abertos por Departamento</div>
            <table>
              <tr>
                <th>Departamento</th>
                <th>Total</th>
                <th>Alta Prioridade</th>
                <th>% do Total</th>
              </tr>
              ${openTicketsByDepartment.map(dept => `
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
            <div class="section-title">🎯 Tickets Críticos e Urgentes</div>
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
              ${criticalTickets.slice(0, 30).map(ticket => {
                const urgency = getUrgencyLevel(ticket);
                const daysOpen = calculateDaysOpen(ticket.date);
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
            ${criticalTickets.length > 30 ? `<p><em>Mostrando primeiros 30 de ${criticalTickets.length} tickets críticos</em></p>` : ''}
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

  const exportReport = () => {
    const reportData = {
      dataGeracao: new Date().toISOString(),
      resumo: openTicketsStats,
      ticketsCriticos: criticalTickets.map(t => ({
        id: t.id,
        subject: t.subject,
        priority: t.priority,
        assignee: t.assignee,
        department: t.department,
        daysOpen: calculateDaysOpen(t.date),
        urgencyLevel: getUrgencyLevel(t)
      })),
      departamentos: openTicketsByDepartment,
      responsaveis: openTicketsByAssignee
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-chamados-abertos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (openTickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-green-600 mb-2">🎉 Parabéns!</h3>
          <p className="text-gray-600">Não há tickets abertos no momento. Todos os chamados foram atendidos!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatório de Chamados Abertos</h2>
          <p className="text-gray-600">Análise detalhada dos tickets em aberto</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportOpenTicketsToPDF} variant="outline" className="flex items-center gap-2">
            <File className="h-4 w-4" />
            PDF
          </Button>
          <Button onClick={exportOpenTicketsToExcel} variant="outline" className="flex items-center gap-2">
            <Sheet className="h-4 w-4" />
            Excel
          </Button>
          <Button onClick={exportOpenTicketsToCSV} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={exportReport} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      {/* Métricas de Alerta */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Tickets Abertos</p>
                <p className="text-3xl font-bold text-red-700">{openTicketsStats.total}</p>
                <p className="text-xs text-red-500 mt-1">Requer atenção imediata</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Alta Prioridade</p>
                <p className="text-3xl font-bold text-orange-700">{openTicketsStats.alta}</p>
                <p className="text-xs text-orange-500 mt-1">
                  {openTicketsStats.percentualAlta.toFixed(1)}% do total
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
                <p className="text-3xl font-bold text-yellow-700">{openTicketsStats.semResponsavel}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {openTicketsStats.percentualSemResponsavel.toFixed(1)}% não atribuídos
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <User className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Tickets Antigos</p>
                <p className="text-3xl font-bold text-purple-700">{openTicketsStats.ticketsAntigos}</p>
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
            <Building2 className="h-5 w-5" />
            Tickets Abertos por Departamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {openTicketsByDepartment.map((dept) => (
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
                    {dept.percentualAlta.toFixed(1)}% são de alta prioridade - requer atenção
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tickets Críticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Tickets Críticos e Urgentes
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
                {criticalTickets.slice(0, 20).map((ticket) => {
                  const urgency = getUrgencyLevel(ticket);
                  const daysOpen = calculateDaysOpen(ticket.date);
                  
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
          {criticalTickets.length > 20 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Mostrando 20 de {criticalTickets.length} tickets críticos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Distribuição por Responsável */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tickets Abertos por Responsável
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Alta Prioridade</TableHead>
                  <TableHead className="text-center">% do Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openTicketsByAssignee.map((assignee) => (
                  <TableRow key={assignee.assignee}>
                    <TableCell className="font-medium">
                      {assignee.assignee === "Não atribuído" ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Não atribuído
                        </Badge>
                      ) : (
                        assignee.assignee
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{assignee.count}</TableCell>
                    <TableCell className="text-center">
                      {assignee.alta > 0 ? (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          {assignee.alta}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      {assignee.percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenTicketsReport; 