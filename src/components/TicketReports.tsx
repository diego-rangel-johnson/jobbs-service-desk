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
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Calendar,
  Download,
  Filter,
  Target,
  Zap,
  FileText,
  Sheet,
  File
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import OpenTicketsReport from "./OpenTicketsReport";

interface TicketReportsProps {
  tickets: any[];
  companies?: any[];
}

const TicketReports: React.FC<TicketReportsProps> = ({ tickets, companies = [] }) => {
  const [timeFilter, setTimeFilter] = useState("30"); // dias
  const [departmentFilter, setDepartmentFilter] = useState("todos");
  const [companyFilter, setCompanyFilter] = useState("todas");

  // Filtrar tickets por período
  const filteredTickets = useMemo(() => {
    const now = new Date();
    const daysAgo = parseInt(timeFilter);
    const filterDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.date);
      const matchesTime = ticketDate >= filterDate;
      const matchesDepartment = departmentFilter === "todos" || ticket.department === departmentFilter;
      const matchesCompany = companyFilter === "todas" || ticket.companyId === companyFilter;
      
      return matchesTime && matchesDepartment && matchesCompany;
    });
  }, [tickets, timeFilter, departmentFilter, companyFilter]);

  // Estatísticas gerais
  const stats = useMemo(() => {
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
    
    // Tempo médio de resolução (aproximação)
    const ticketsResolvidos = filteredTickets.filter(t => t.status === "resolvido" || t.status === "fechado");
    const tempoMedioResolucao = ticketsResolvidos.length > 0 ? "2.3" : "0"; // Simulado
    
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
      ticketsAtivos: abertos + emAndamento
    };
  }, [filteredTickets]);

  // Dados por departamento
  const statsByDepartment = useMemo(() => {
    const departments = [...new Set(filteredTickets.map(t => t.department))];
    return departments.map(dept => {
      const deptTickets = filteredTickets.filter(t => t.department === dept);
      return {
        department: dept,
        total: deptTickets.length,
        abertos: deptTickets.filter(t => t.status === "aberto").length,
        emAndamento: deptTickets.filter(t => t.status === "em_andamento").length,
        resolvidos: deptTickets.filter(t => t.status === "resolvido").length,
        alta: deptTickets.filter(t => t.priority === "alta").length
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  // Tickets por empresa
  const statsByCompany = useMemo(() => {
    const companiesList = [...new Set(filteredTickets.map(t => t.company))];
    return companiesList.map(company => {
      const companyTickets = filteredTickets.filter(t => t.company === company);
      return {
        company,
        total: companyTickets.length,
        abertos: companyTickets.filter(t => t.status === "aberto").length,
        emAndamento: companyTickets.filter(t => t.status === "em_andamento").length,
        resolvidos: companyTickets.filter(t => t.status === "resolvido").length
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  // Tendência dos últimos 7 dias
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTickets = tickets.filter(ticket => 
        ticket.date.startsWith(date)
      );
      return {
        date,
        total: dayTickets.length,
        abertos: dayTickets.filter(t => t.status === "aberto").length,
        resolvidos: dayTickets.filter(t => t.status === "resolvido").length
      };
    });
  }, [tickets]);

  // Função para exportar em CSV
  const exportToCSV = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    // Criar cabeçalho do CSV
    let csvContent = `Relatório de Tickets - ${currentDate}\n\n`;
    csvContent += `Período: ${timeFilter} dias\n`;
    csvContent += `Departamento: ${departmentFilter}\n`;
    csvContent += `Empresa: ${companyFilter}\n\n`;
    
    // Estatísticas gerais
    csvContent += "ESTATÍSTICAS GERAIS\n";
    csvContent += "Métrica,Valor\n";
    csvContent += `Total de Tickets,${stats.total}\n`;
    csvContent += `Tickets Abertos,${stats.abertos}\n`;
    csvContent += `Tickets em Andamento,${stats.emAndamento}\n`;
    csvContent += `Tickets Resolvidos,${stats.resolvidos}\n`;
    csvContent += `Alta Prioridade,${stats.alta}\n`;
    csvContent += `Taxa de Resolução,${stats.taxaResolucao}%\n\n`;
    
    // Dados por departamento
    csvContent += "ESTATÍSTICAS POR DEPARTAMENTO\n";
    csvContent += "Departamento,Total,Abertos,Em Andamento,Resolvidos,Alta Prioridade,% do Total\n";
    statsByDepartment.forEach(dept => {
      const percentage = ((dept.total / stats.total) * 100 || 0).toFixed(1);
      csvContent += `${dept.department},${dept.total},${dept.abertos},${dept.emAndamento},${dept.resolvidos},${dept.alta},${percentage}%\n`;
    });
    
    csvContent += "\n";
    
    // Lista de tickets
    csvContent += "LISTA DE TICKETS\n";
    csvContent += "ID,Assunto,Status,Prioridade,Cliente,Responsável,Departamento,Data,Previsão\n";
    filteredTickets.forEach(ticket => {
      const date = new Date(ticket.date).toLocaleDateString('pt-BR');
      const estimatedDate = ticket.estimatedDate ? new Date(ticket.estimatedDate).toLocaleDateString('pt-BR') : '-';
      csvContent += `${ticket.id},"${ticket.subject}",${ticket.status},${ticket.priority},"${ticket.customer}","${ticket.assignee}",${ticket.department},${date},${estimatedDate}\n`;
    });
    
    // Baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-tickets-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para exportar em Excel (usando CSV otimizado para Excel)
  const exportToExcel = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    // Criar dados para Excel em formato TSV (Tab-separated values)
    let excelContent = `Relatório de Tickets\t${currentDate}\n\n`;
    excelContent += `Período:\t${timeFilter} dias\n`;
    excelContent += `Departamento:\t${departmentFilter}\n`;
    excelContent += `Empresa:\t${companyFilter}\n\n`;
    
    // Estatísticas gerais
    excelContent += "ESTATÍSTICAS GERAIS\n";
    excelContent += "Métrica\tValor\n";
    excelContent += `Total de Tickets\t${stats.total}\n`;
    excelContent += `Tickets Abertos\t${stats.abertos}\n`;
    excelContent += `Tickets em Andamento\t${stats.emAndamento}\n`;
    excelContent += `Tickets Resolvidos\t${stats.resolvidos}\n`;
    excelContent += `Alta Prioridade\t${stats.alta}\n`;
    excelContent += `Taxa de Resolução\t${stats.taxaResolucao}%\n\n`;
    
    // Dados por departamento
    excelContent += "ESTATÍSTICAS POR DEPARTAMENTO\n";
    excelContent += "Departamento\tTotal\tAbertos\tEm Andamento\tResolvidos\tAlta Prioridade\t% do Total\n";
    statsByDepartment.forEach(dept => {
      const percentage = ((dept.total / stats.total) * 100 || 0).toFixed(1);
      excelContent += `${dept.department}\t${dept.total}\t${dept.abertos}\t${dept.emAndamento}\t${dept.resolvidos}\t${dept.alta}\t${percentage}%\n`;
    });
    
    excelContent += "\n";
    
    // Lista de tickets
    excelContent += "LISTA DE TICKETS\n";
    excelContent += "ID\tAssunto\tStatus\tPrioridade\tCliente\tResponsável\tDepartamento\tData\tPrevisão\n";
    filteredTickets.forEach(ticket => {
      const date = new Date(ticket.date).toLocaleDateString('pt-BR');
      const estimatedDate = ticket.estimatedDate ? new Date(ticket.estimatedDate).toLocaleDateString('pt-BR') : '-';
      excelContent += `${ticket.id}\t${ticket.subject}\t${ticket.status}\t${ticket.priority}\t${ticket.customer}\t${ticket.assignee}\t${ticket.department}\t${date}\t${estimatedDate}\n`;
    });
    
    // Baixar arquivo
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-tickets-${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para exportar em PDF (usando print nativo do browser)
  const exportToPDF = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    // Criar conteúdo HTML para impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Tickets - ${currentDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
            .section { margin: 20px 0; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
            .stat-card { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
            .stat-value { font-size: 20px; font-weight: bold; color: #2563eb; }
            .stat-label { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .filter-info { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin: 15px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Jobbs Service Desk</div>
            <div class="title">Relatório de Tickets</div>
            <div class="subtitle">Gerado em ${currentDate}</div>
          </div>
          
          <div class="filter-info">
            <strong>Filtros Aplicados:</strong><br>
            Período: ${timeFilter} dias | Departamento: ${departmentFilter} | Empresa: ${companyFilter}
          </div>
          
          <div class="section">
            <div class="section-title">Estatísticas Gerais</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total de Tickets</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.abertos}</div>
                <div class="stat-label">Tickets Abertos</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.emAndamento}</div>
                <div class="stat-label">Em Andamento</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.resolvidos}</div>
                <div class="stat-label">Resolvidos</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.alta}</div>
                <div class="stat-label">Alta Prioridade</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.taxaResolucao}%</div>
                <div class="stat-label">Taxa de Resolução</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Estatísticas por Departamento</div>
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
              ${statsByDepartment.map(dept => `
                <tr>
                  <td>${dept.department}</td>
                  <td>${dept.total}</td>
                  <td>${dept.abertos}</td>
                  <td>${dept.emAndamento}</td>
                  <td>${dept.resolvidos}</td>
                  <td>${dept.alta}</td>
                  <td>${((dept.total / stats.total) * 100 || 0).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Lista de Tickets (${filteredTickets.length} registros)</div>
            <table>
              <tr>
                <th>ID</th>
                <th>Assunto</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Cliente</th>
                <th>Responsável</th>
                <th>Departamento</th>
                <th>Data</th>
              </tr>
              ${filteredTickets.slice(0, 50).map(ticket => `
                <tr>
                  <td>${ticket.id}</td>
                  <td>${ticket.subject}</td>
                  <td>${ticket.status}</td>
                  <td>${ticket.priority}</td>
                  <td>${ticket.customer}</td>
                  <td>${ticket.assignee}</td>
                  <td>${ticket.department}</td>
                  <td>${new Date(ticket.date).toLocaleDateString('pt-BR')}</td>
                </tr>
              `).join('')}
            </table>
            ${filteredTickets.length > 50 ? `<p><em>Mostrando primeiros 50 de ${filteredTickets.length} tickets</em></p>` : ''}
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

  const exportData = () => {
    const data = {
      periodo: `${timeFilter} dias`,
      estatisticas: stats,
      departamentos: statsByDepartment,
      empresas: statsByCompany,
      tendencia: trendData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-tickets-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios Detalhados</h2>
          <p className="text-gray-600">Análise completa dos tickets do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
            <File className="h-4 w-4" />
            PDF
          </Button>
          <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
            <Sheet className="h-4 w-4" />
            Excel
          </Button>
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      {/* Filtros Globais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para diferentes tipos de relatórios */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="open-tickets" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Chamados Abertos
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Análises
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total de Tickets</p>
                    <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                    <p className="text-xs text-blue-500 mt-1">Últimos {timeFilter} dias</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <BarChart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Tickets Ativos</p>
                    <p className="text-3xl font-bold text-orange-700">{stats.ticketsAtivos}</p>
                    <p className="text-xs text-orange-500 mt-1">
                      {stats.abertos} abertos, {stats.emAndamento} em andamento
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
                    <p className="text-3xl font-bold text-green-700">{stats.taxaResolucao}%</p>
                    <p className="text-xs text-green-500 mt-1">
                      {stats.resolvidos + stats.fechados} resolvidos
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
                    <p className="text-3xl font-bold text-red-700">{stats.alta}</p>
                    <p className="text-xs text-red-500 mt-1">
                      {((stats.alta / stats.total) * 100 || 0).toFixed(1)}% do total
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição por Status
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
                      <span className="text-sm font-medium">{stats.abertos}</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {((stats.abertos / stats.total) * 100 || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Em Andamento</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.emAndamento}</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {((stats.emAndamento / stats.total) * 100 || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Resolvidos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.resolvidos}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {((stats.resolvidos / stats.total) * 100 || 0).toFixed(1)}%
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
                  Distribuição por Prioridade
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
                      <span className="text-sm font-medium">{stats.alta}</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {((stats.alta / stats.total) * 100 || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Média</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.media}</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {((stats.media / stats.total) * 100 || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Baixa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.baixa}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {((stats.baixa / stats.total) * 100 || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="open-tickets" className="space-y-6 mt-6">
          <OpenTicketsReport tickets={tickets} companies={companies} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Relatórios por Departamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estatísticas por Departamento
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
                      <TableHead className="text-center">% do Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statsByDepartment.map((dept) => (
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
                          {((dept.total / stats.total) * 100 || 0).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Relatórios por Empresa */}
          {statsByCompany.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Estatísticas por Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Abertos</TableHead>
                        <TableHead className="text-center">Em Andamento</TableHead>
                        <TableHead className="text-center">Resolvidos</TableHead>
                        <TableHead className="text-center">% do Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statsByCompany.slice(0, 10).map((company) => (
                        <TableRow key={company.company}>
                          <TableCell className="font-medium">{company.company}</TableCell>
                          <TableCell className="text-center font-medium">{company.total}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {company.abertos}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {company.emAndamento}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {company.resolvidos}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm text-gray-600">
                            {((company.total / stats.total) * 100 || 0).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TicketReports; 