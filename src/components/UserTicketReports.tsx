import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  PieChart, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Download,
  Filter,
  Target,
  Zap,
  FileText,
  Sheet,
  File,
  User,
  Activity
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import UserOpenTicketsReport from "./UserOpenTicketsReport";

interface UserTicketReportsProps {
  tickets: any[];
  userName: string;
}

const UserTicketReports: React.FC<UserTicketReportsProps> = ({ tickets, userName }) => {
  const [timeFilter, setTimeFilter] = useState("30"); // dias
  const [departmentFilter, setDepartmentFilter] = useState("todos");

  // Filtrar apenas tickets do usuário
  const userTickets = useMemo(() => {
    return tickets.filter(ticket => ticket.customer === userName);
  }, [tickets, userName]);

  // Filtrar tickets por período
  const filteredTickets = useMemo(() => {
    const now = new Date();
    const daysAgo = parseInt(timeFilter);
    const filterDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return userTickets.filter(ticket => {
      const ticketDate = new Date(ticket.date);
      const matchesTime = ticketDate >= filterDate;
      const matchesDepartment = departmentFilter === "todos" || ticket.department === departmentFilter;
      
      return matchesTime && matchesDepartment;
    });
  }, [userTickets, timeFilter, departmentFilter]);

  // Estatísticas do usuário
  const userStats = useMemo(() => {
    const total = filteredTickets.length;
    const abertos = filteredTickets.filter(t => t.status === "aberto").length;
    const emAndamento = filteredTickets.filter(t => t.status === "em_andamento").length;
    const resolvidos = filteredTickets.filter(t => t.status === "resolvido").length;
    const fechados = filteredTickets.filter(t => t.status === "fechado").length;
    
    const alta = filteredTickets.filter(t => t.priority === "alta").length;
    const media = filteredTickets.filter(t => t.priority === "media").length;
    const baixa = filteredTickets.filter(t => t.priority === "baixa").length;

    // Taxa de resolução
    const taxaResolucao = total > 0 ? ((resolvidos + fechados) / total * 100).toFixed(1) : "0";
    
    // Tempo médio de resolução estimado
    const tempoMedioResolucao = total > 0 ? "2.1" : "0"; // Simulado
    
    // Tickets recentes (últimos 7 dias)
    const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
    const ticketsRecentes = filteredTickets.filter(t => new Date(t.date) >= sevenDaysAgo).length;
    
    return {
      total,
      abertos,
      emAndamento,
      resolvidos,
      fechados,
      alta,
      media,
      baixa,
      taxaResolucao,
      tempoMedioResolucao,
      ticketsAtivos: abertos + emAndamento,
      ticketsRecentes
    };
  }, [filteredTickets]);

  // Dados por departamento (apenas do usuário)
  const userStatsByDepartment = useMemo(() => {
    const departments = [...new Set(filteredTickets.map(t => t.department))];
    return departments.map(dept => {
      const deptTickets = filteredTickets.filter(t => t.department === dept);
      return {
        department: dept,
        total: deptTickets.length,
        abertos: deptTickets.filter(t => t.status === "aberto").length,
        emAndamento: deptTickets.filter(t => t.status === "em_andamento").length,
        resolvidos: deptTickets.filter(t => t.status === "resolvido").length,
        alta: deptTickets.filter(t => t.priority === "alta").length,
        percentage: filteredTickets.length > 0 ? (deptTickets.length / filteredTickets.length * 100) : 0
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  // Histórico mensal dos últimos 6 meses
  const monthlyHistory = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }),
        fullDate: date
      };
    }).reverse();

    return months.map(({ month, fullDate }) => {
      const monthStart = new Date(fullDate.getFullYear(), fullDate.getMonth(), 1);
      const monthEnd = new Date(fullDate.getFullYear(), fullDate.getMonth() + 1, 0);
      
      const monthTickets = userTickets.filter(ticket => {
        const ticketDate = new Date(ticket.date);
        return ticketDate >= monthStart && ticketDate <= monthEnd;
      });

      return {
        month,
        total: monthTickets.length,
        abertos: monthTickets.filter(t => t.status === "aberto").length,
        resolvidos: monthTickets.filter(t => t.status === "resolvido" || t.status === "fechado").length
      };
    });
  }, [userTickets]);

  // Funções de exportação para relatórios do usuário
  const exportUserReportToCSV = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    let csvContent = `Meus Tickets - Relatório Pessoal,${currentDate}\n`;
    csvContent += `Usuário,${userName}\n`;
    csvContent += `Período,${timeFilter} dias\n`;
    csvContent += `Departamento,${departmentFilter}\n\n`;
    
    // Minhas estatísticas
    csvContent += "MINHAS ESTATÍSTICAS\n";
    csvContent += "Métrica,Valor\n";
    csvContent += `Total de Tickets,${userStats.total}\n`;
    csvContent += `Tickets Ativos,${userStats.ticketsAtivos}\n`;
    csvContent += `Tickets Abertos,${userStats.abertos}\n`;
    csvContent += `Tickets em Andamento,${userStats.emAndamento}\n`;
    csvContent += `Tickets Resolvidos,${userStats.resolvidos}\n`;
    csvContent += `Alta Prioridade,${userStats.alta}\n`;
    csvContent += `Taxa de Resolução,${userStats.taxaResolucao}%\n`;
    csvContent += `Tickets Recentes (7 dias),${userStats.ticketsRecentes}\n\n`;
    
    // Meus tickets por departamento
    csvContent += "MEUS TICKETS POR DEPARTAMENTO\n";
    csvContent += "Departamento,Total,Abertos,Em Andamento,Resolvidos,Alta Prioridade,% do Total\n";
    userStatsByDepartment.forEach(dept => {
      csvContent += `${dept.department},${dept.total},${dept.abertos},${dept.emAndamento},${dept.resolvidos},${dept.alta},${dept.percentage.toFixed(1)}%\n`;
    });
    
    csvContent += "\n";
    
    // Lista dos meus tickets
    csvContent += "LISTA DOS MEUS TICKETS\n";
    csvContent += "ID,Assunto,Status,Prioridade,Responsável,Departamento,Data,Previsão\n";
    filteredTickets.forEach(ticket => {
      const date = new Date(ticket.date).toLocaleDateString('pt-BR');
      const estimatedDate = ticket.estimatedDate ? new Date(ticket.estimatedDate).toLocaleDateString('pt-BR') : '-';
      csvContent += `${ticket.id},"${ticket.subject}",${ticket.status},${ticket.priority},"${ticket.assignee}",${ticket.department},${date},${estimatedDate}\n`;
    });
    
    // Baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `meus-tickets-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUserReportToExcel = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    let excelContent = `Meus Tickets - Relatório Pessoal\t${currentDate}\n`;
    excelContent += `Usuário\t${userName}\n`;
    excelContent += `Período\t${timeFilter} dias\n`;
    excelContent += `Departamento\t${departmentFilter}\n\n`;
    
    // Minhas estatísticas
    excelContent += "MINHAS ESTATÍSTICAS\n";
    excelContent += "Métrica\tValor\n";
    excelContent += `Total de Tickets\t${userStats.total}\n`;
    excelContent += `Tickets Ativos\t${userStats.ticketsAtivos}\n`;
    excelContent += `Tickets Abertos\t${userStats.abertos}\n`;
    excelContent += `Tickets em Andamento\t${userStats.emAndamento}\n`;
    excelContent += `Tickets Resolvidos\t${userStats.resolvidos}\n`;
    excelContent += `Alta Prioridade\t${userStats.alta}\n`;
    excelContent += `Taxa de Resolução\t${userStats.taxaResolucao}%\n`;
    excelContent += `Tickets Recentes (7 dias)\t${userStats.ticketsRecentes}\n\n`;
    
    // Meus tickets por departamento
    excelContent += "MEUS TICKETS POR DEPARTAMENTO\n";
    excelContent += "Departamento\tTotal\tAbertos\tEm Andamento\tResolvidos\tAlta Prioridade\t% do Total\n";
    userStatsByDepartment.forEach(dept => {
      excelContent += `${dept.department}\t${dept.total}\t${dept.abertos}\t${dept.emAndamento}\t${dept.resolvidos}\t${dept.alta}\t${dept.percentage.toFixed(1)}%\n`;
    });
    
    excelContent += "\n";
    
    // Lista dos meus tickets
    excelContent += "LISTA DOS MEUS TICKETS\n";
    excelContent += "ID\tAssunto\tStatus\tPrioridade\tResponsável\tDepartamento\tData\tPrevisão\n";
    filteredTickets.forEach(ticket => {
      const date = new Date(ticket.date).toLocaleDateString('pt-BR');
      const estimatedDate = ticket.estimatedDate ? new Date(ticket.estimatedDate).toLocaleDateString('pt-BR') : '-';
      excelContent += `${ticket.id}\t${ticket.subject}\t${ticket.status}\t${ticket.priority}\t${ticket.assignee}\t${ticket.department}\t${date}\t${estimatedDate}\n`;
    });
    
    // Baixar arquivo
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `meus-tickets-${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUserReportToPDF = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Meus Tickets - Relatório Pessoal - ${currentDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #2563eb; }
            .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
            .user-info { background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .section { margin: 20px 0; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
            .stat-card { border: 1px solid #ddd; padding: 10px; border-radius: 5px; background-color: #f9f9f9; }
            .stat-value { font-size: 20px; font-weight: bold; color: #2563eb; }
            .stat-label { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">📊 Meus Tickets - Relatório Pessoal</div>
            <div class="subtitle">Jobbs Service Desk</div>
            <div class="subtitle">Gerado em ${currentDate}</div>
          </div>
          
          <div class="user-info">
            <strong>Usuário:</strong> ${userName}<br>
            <strong>Período:</strong> ${timeFilter} dias<br>
            <strong>Departamento:</strong> ${departmentFilter}
          </div>
          
          <div class="section">
            <div class="section-title">📈 Minhas Estatísticas</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${userStats.total}</div>
                <div class="stat-label">Total de Tickets</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${userStats.ticketsAtivos}</div>
                <div class="stat-label">Tickets Ativos</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${userStats.taxaResolucao}%</div>
                <div class="stat-label">Taxa de Resolução</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${userStats.abertos}</div>
                <div class="stat-label">Tickets Abertos</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${userStats.emAndamento}</div>
                <div class="stat-label">Em Andamento</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${userStats.alta}</div>
                <div class="stat-label">Alta Prioridade</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">🏢 Meus Tickets por Departamento</div>
            <table>
              <tr>
                <th>Departamento</th>
                <th>Total</th>
                <th>Abertos</th>
                <th>Em Andamento</th>
                <th>Resolvidos</th>
                <th>Alta Prioridade</th>
                <th>% do Total</th>
              </tr>
              ${userStatsByDepartment.map(dept => `
                <tr>
                  <td>${dept.department}</td>
                  <td>${dept.total}</td>
                  <td>${dept.abertos}</td>
                  <td>${dept.emAndamento}</td>
                  <td>${dept.resolvidos}</td>
                  <td>${dept.alta}</td>
                  <td>${dept.percentage.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">📋 Lista dos Meus Tickets (${filteredTickets.length} registros)</div>
            <table>
              <tr>
                <th>ID</th>
                <th>Assunto</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Departamento</th>
                <th>Data</th>
              </tr>
              ${filteredTickets.slice(0, 30).map(ticket => `
                <tr>
                  <td>${ticket.id}</td>
                  <td>${ticket.subject}</td>
                  <td>${ticket.status}</td>
                  <td>${ticket.priority}</td>
                  <td>${ticket.assignee}</td>
                  <td>${ticket.department}</td>
                  <td>${new Date(ticket.date).toLocaleDateString('pt-BR')}</td>
                </tr>
              `).join('')}
            </table>
            ${filteredTickets.length > 30 ? `<p><em>Mostrando primeiros 30 de ${filteredTickets.length} tickets</em></p>` : ''}
          </div>
        </body>
      </html>
    `;
    
    // Abrir nova janela para impressão
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

  const exportUserData = () => {
    const data = {
      usuario: userName,
      dataGeracao: new Date().toISOString(),
      periodo: `${timeFilter} dias`,
      estatisticas: userStats,
      departamentos: userStatsByDepartment,
      historicoMensal: monthlyHistory,
      tickets: filteredTickets.map(t => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        department: t.department,
        assignee: t.assignee,
        date: t.date,
        estimatedDate: t.estimatedDate
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meus-tickets-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meus Relatórios</h2>
          <p className="text-gray-600">Análise completa dos seus tickets pessoais</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportUserReportToPDF} variant="outline" className="flex items-center gap-2">
            <File className="h-4 w-4" />
            PDF
          </Button>
          <Button onClick={exportUserReportToExcel} variant="outline" className="flex items-center gap-2">
            <Sheet className="h-4 w-4" />
            Excel
          </Button>
          <Button onClick={exportUserReportToCSV} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={exportUserData} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      {/* Filtros Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros dos Meus Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Departamentos</SelectItem>
                <SelectItem value="TI">TI</SelectItem>
                <SelectItem value="RH">RH</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
                <SelectItem value="Suporte">Suporte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para diferentes tipos de relatórios pessoais */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="my-open-tickets" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Meus Tickets Abertos
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Análise Pessoal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Métricas Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Meus Tickets</p>
                    <p className="text-3xl font-bold text-blue-700">{userStats.total}</p>
                    <p className="text-xs text-blue-500 mt-1">Últimos {timeFilter} dias</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Tickets Ativos</p>
                    <p className="text-3xl font-bold text-orange-700">{userStats.ticketsAtivos}</p>
                    <p className="text-xs text-orange-500 mt-1">
                      {userStats.abertos} abertos, {userStats.emAndamento} em andamento
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Taxa de Resolução</p>
                    <p className="text-3xl font-bold text-green-700">{userStats.taxaResolucao}%</p>
                    <p className="text-xs text-green-500 mt-1">
                      {userStats.resolvidos + userStats.fechados} resolvidos
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Alta Prioridade</p>
                    <p className="text-3xl font-bold text-red-700">{userStats.alta}</p>
                    <p className="text-xs text-red-500 mt-1">
                      {((userStats.alta / userStats.total) * 100 || 0).toFixed(1)}% do meu total
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Pessoais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Status dos Meus Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Abertos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{userStats.abertos}</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {((userStats.abertos / userStats.total) * 100 || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Em Andamento</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{userStats.emAndamento}</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {((userStats.emAndamento / userStats.total) * 100 || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Resolvidos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{userStats.resolvidos + userStats.fechados}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {(((userStats.resolvidos + userStats.fechados) / userStats.total) * 100 || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por Prioridade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Prioridade dos Meus Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Alta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{userStats.alta}</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {((userStats.alta / userStats.total) * 100 || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Média</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{userStats.media}</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {((userStats.media / userStats.total) * 100 || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Baixa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{userStats.baixa}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {((userStats.baixa / userStats.total) * 100 || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="my-open-tickets" className="space-y-6 mt-6">
          <UserOpenTicketsReport tickets={userTickets} userName={userName} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Análise Pessoal por Departamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Meus Tickets por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Departamento</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Abertos</TableHead>
                      <TableHead className="text-center">Em Andamento</TableHead>
                      <TableHead className="text-center">Resolvidos</TableHead>
                      <TableHead className="text-center">Alta Prioridade</TableHead>
                      <TableHead className="text-center">% do Meu Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userStatsByDepartment.map((dept) => (
                      <TableRow key={dept.department}>
                        <TableCell className="font-medium">{dept.department}</TableCell>
                        <TableCell className="text-center font-medium">{dept.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {dept.abertos}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {dept.emAndamento}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {dept.resolvidos}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {dept.alta > 0 && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {dept.alta}
                            </Badge>
                          )}
                          {dept.alta === 0 && <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-600">
                          {dept.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Histórico Mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Meu Histórico Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Abertos</TableHead>
                      <TableHead className="text-center">Resolvidos</TableHead>
                      <TableHead className="text-center">Taxa Resolução</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyHistory.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell className="text-center font-medium">{month.total}</TableCell>
                        <TableCell className="text-center">
                          {month.abertos > 0 && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {month.abertos}
                            </Badge>
                          )}
                          {month.abertos === 0 && <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {month.resolvidos > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {month.resolvidos}
                            </Badge>
                          )}
                          {month.resolvidos === 0 && <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-600">
                          {month.total > 0 ? ((month.resolvidos / month.total) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserTicketReports; 