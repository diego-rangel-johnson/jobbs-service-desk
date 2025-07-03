import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  TrendingUp, 
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
  Building,
  UserCheck,
  Timer,
  Activity,
  TicketIcon
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SupervisorReportsProps {
  tickets: any[];
  companyInfo?: any;
  userName: string;
}

const SupervisorReports: React.FC<SupervisorReportsProps> = ({ tickets, companyInfo, userName }) => {
  const [timeFilter, setTimeFilter] = useState("30");
  const [departmentFilter, setDepartmentFilter] = useState("todos");

  // Filtrar tickets apenas da empresa do supervisor
  const companyTickets = useMemo(() => {
    if (!companyInfo?.id) return tickets;
    return tickets.filter(ticket => 
      ticket.company_id === companyInfo.id || 
      // Fallback para estruturas antigas de dados
      (ticket.customer && ticket.customer.toLowerCase().includes(companyInfo.name?.toLowerCase() || ''))
    );
  }, [tickets, companyInfo]);

  // Filtrar por período de tempo
  const filteredTickets = useMemo(() => {
    const days = parseInt(timeFilter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return companyTickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at || ticket.date);
      const matchesTime = days === 0 || ticketDate >= cutoffDate;
      const matchesDepartment = departmentFilter === "todos" || ticket.department === departmentFilter;
      return matchesTime && matchesDepartment;
    });
  }, [companyTickets, timeFilter, departmentFilter]);

  // Estatísticas da empresa
  const companyStats = useMemo(() => {
    const total = filteredTickets.length;
    const abertos = filteredTickets.filter(t => t.status === "open").length;
    const emAndamento = filteredTickets.filter(t => t.status === "in_progress").length;
    const resolvidos = filteredTickets.filter(t => t.status === "resolved").length;
    const fechados = filteredTickets.filter(t => t.status === "closed").length;
    const alta = filteredTickets.filter(t => t.priority === "high" || t.priority === "urgent").length;
    const media = filteredTickets.filter(t => t.priority === "medium").length;
    const baixa = filteredTickets.filter(t => t.priority === "low").length;
    
    return {
      total,
      abertos,
      emAndamento,
      resolvidos,
      fechados,
      alta,
      media,
      baixa,
      ticketsAtivos: abertos + emAndamento,
      taxaResolucao: total > 0 ? Math.round(((resolvidos + fechados) / total) * 100) : 0
    };
  }, [filteredTickets]);

  // Estatísticas por departamento da empresa
  const departmentStats = useMemo(() => {
    const departments = [...new Set(filteredTickets.map(t => t.department))];
    return departments.map(dept => {
      const deptTickets = filteredTickets.filter(t => t.department === dept);
      const total = deptTickets.length;
      const abertos = deptTickets.filter(t => t.status === "open").length;
      const emAndamento = deptTickets.filter(t => t.status === "in_progress").length;
      const resolvidos = deptTickets.filter(t => t.status === "resolved").length;
      const fechados = deptTickets.filter(t => t.status === "closed").length;
      const alta = deptTickets.filter(t => t.priority === "high" || t.priority === "urgent").length;
      
      return {
        department: dept,
        total,
        abertos,
        emAndamento,
        resolvidos,
        fechados,
        alta,
        percentage: filteredTickets.length > 0 ? (total / filteredTickets.length) * 100 : 0,
        percentualAlta: total > 0 ? (alta / total) * 100 : 0
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  // Estatísticas por responsável (membros da equipe)
  const teamMemberStats = useMemo(() => {
    const assignees = [...new Set(filteredTickets
      .filter(t => t.assignee && t.assignee !== "Não atribuído")
      .map(t => t.assignee?.name || t.assignee))];
    
    return assignees.map(assignee => {
      const assigneeTickets = filteredTickets.filter(t => 
        (t.assignee?.name || t.assignee) === assignee
      );
      const total = assigneeTickets.length;
      const resolvidos = assigneeTickets.filter(t => 
        t.status === "resolved" || t.status === "closed"
      ).length;
      const abertos = assigneeTickets.filter(t => t.status === "open").length;
      const emAndamento = assigneeTickets.filter(t => t.status === "in_progress").length;
      
      return {
        name: assignee,
        total,
        abertos,
        emAndamento,
        resolvidos,
        taxaResolucao: total > 0 ? Math.round((resolvidos / total) * 100) : 0
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  // Histórico mensal
  const monthlyHistory = useMemo(() => {
    const months = {};
    filteredTickets.forEach(ticket => {
      const date = new Date(ticket.created_at || ticket.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = {
          month: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          total: 0,
          abertos: 0,
          resolvidos: 0,
          taxaResolucao: 0
        };
      }
      
      months[monthKey].total++;
      if (ticket.status === "open") months[monthKey].abertos++;
      if (ticket.status === "resolved" || ticket.status === "closed") {
        months[monthKey].resolvidos++;
      }
    });
    
    return Object.values(months).map((month: any) => ({
      ...month,
      taxaResolucao: month.total > 0 ? Math.round((month.resolvidos / month.total) * 100) : 0
    })).slice(-6); // Últimos 6 meses
  }, [filteredTickets]);

  const exportCompanyReportToPDF = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const companyName = companyInfo?.name || 'Empresa';
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório da Empresa - ${companyName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 2em; font-weight: bold; color: #333; }
            .stat-label { color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .section { margin: 30px 0; }
            .section-title { font-size: 1.2em; font-weight: bold; margin-bottom: 15px; color: #333; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Relatório da Empresa</h1>
            <h2>${companyName}</h2>
            <p>Período: ${timeFilter === "0" ? "Todo o período" : `Últimos ${timeFilter} dias`}</p>
            <p>Gerado em: ${currentDate}</p>
            <p>Supervisor: ${userName}</p>
          </div>
          
          <div class="section">
            <div class="section-title">📈 Estatísticas Gerais</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${companyStats.total}</div>
                <div class="stat-label">Total de Tickets</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${companyStats.ticketsAtivos}</div>
                <div class="stat-label">Tickets Ativos</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${companyStats.taxaResolucao}%</div>
                <div class="stat-label">Taxa de Resolução</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${companyStats.alta}</div>
                <div class="stat-label">Alta Prioridade</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">🏢 Tickets por Departamento</div>
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
              ${departmentStats.map(dept => `
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
            <div class="section-title">👥 Performance da Equipe</div>
            <table>
              <tr>
                <th>Membro da Equipe</th>
                <th>Total</th>
                <th>Abertos</th>
                <th>Em Andamento</th>
                <th>Resolvidos</th>
                <th>Taxa de Resolução</th>
              </tr>
              ${teamMemberStats.map(member => `
                <tr>
                  <td>${member.name}</td>
                  <td>${member.total}</td>
                  <td>${member.abertos}</td>
                  <td>${member.emAndamento}</td>
                  <td>${member.resolvidos}</td>
                  <td>${member.taxaResolucao}%</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Relatórios da Empresa
            {companyInfo && (
              <Badge variant="outline" className="ml-2">
                {companyInfo.name}
              </Badge>
            )}
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
                <SelectItem value="0">Todo o período</SelectItem>
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

            <Button onClick={exportCompanyReportToPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Estatísticas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total de Tickets</p>
                    <p className="text-3xl font-bold text-blue-700">{companyStats.total}</p>
                    <p className="text-xs text-blue-500 mt-1">
                      {timeFilter === "0" ? "Todo o período" : `Últimos ${timeFilter} dias`}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <TicketIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Tickets Ativos</p>
                    <p className="text-3xl font-bold text-orange-700">{companyStats.ticketsAtivos}</p>
                    <p className="text-xs text-orange-500 mt-1">
                      {companyStats.abertos} abertos, {companyStats.emAndamento} em andamento
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Taxa de Resolução</p>
                    <p className="text-3xl font-bold text-green-700">{companyStats.taxaResolucao}%</p>
                    <p className="text-xs text-green-500 mt-1">
                      {companyStats.resolvidos + companyStats.fechados} resolvidos
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
                    <p className="text-3xl font-bold text-red-700">{companyStats.alta}</p>
                    <p className="text-xs text-red-500 mt-1">
                      {companyStats.total > 0 ? ((companyStats.alta / companyStats.total) * 100).toFixed(1) : 0}% do total
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição por Status e Prioridade */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Status dos Tickets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">Abertos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{companyStats.abertos}</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {companyStats.total > 0 ? ((companyStats.abertos / companyStats.total) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={companyStats.total > 0 ? (companyStats.abertos / companyStats.total) * 100 : 0} 
                    className="h-2" 
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">Em Andamento</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{companyStats.emAndamento}</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {companyStats.total > 0 ? ((companyStats.emAndamento / companyStats.total) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={companyStats.total > 0 ? (companyStats.emAndamento / companyStats.total) * 100 : 0} 
                    className="h-2" 
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Resolvidos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{companyStats.resolvidos + companyStats.fechados}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {companyStats.total > 0 ? (((companyStats.resolvidos + companyStats.fechados) / companyStats.total) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={companyStats.total > 0 ? ((companyStats.resolvidos + companyStats.fechados) / companyStats.total) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Prioridade dos Tickets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">Alta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{companyStats.alta}</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {companyStats.total > 0 ? ((companyStats.alta / companyStats.total) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={companyStats.total > 0 ? (companyStats.alta / companyStats.total) * 100 : 0} 
                    className="h-2" 
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">Média</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{companyStats.media}</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {companyStats.total > 0 ? ((companyStats.media / companyStats.total) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={companyStats.total > 0 ? (companyStats.media / companyStats.total) * 100 : 0} 
                    className="h-2" 
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Baixa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{companyStats.baixa}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {companyStats.total > 0 ? ((companyStats.baixa / companyStats.total) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={companyStats.total > 0 ? (companyStats.baixa / companyStats.total) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Performance por Departamento
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
                    {departmentStats.map((dept) => (
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
        </TabsContent>

        <TabsContent value="team" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Performance da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro da Equipe</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Abertos</TableHead>
                      <TableHead className="text-center">Em Andamento</TableHead>
                      <TableHead className="text-center">Resolvidos</TableHead>
                      <TableHead className="text-center">Taxa de Resolução</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMemberStats.map((member) => (
                      <TableRow key={member.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-500" />
                            {member.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{member.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {member.abertos}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {member.emAndamento}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {member.resolvidos}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-medium ${
                              member.taxaResolucao >= 80 ? 'text-green-600' :
                              member.taxaResolucao >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {member.taxaResolucao}%
                            </span>
                            {member.taxaResolucao >= 80 && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {member.taxaResolucao < 60 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Histórico Mensal
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
                    {monthlyHistory.map((month, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell className="text-center font-medium">{month.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {month.abertos}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {month.resolvidos}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-medium ${
                              month.taxaResolucao >= 80 ? 'text-green-600' :
                              month.taxaResolucao >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {month.taxaResolucao}%
                            </span>
                            <Progress value={month.taxaResolucao} className="w-16 h-2" />
                          </div>
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

export default SupervisorReports; 