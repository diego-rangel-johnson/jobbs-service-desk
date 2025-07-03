import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Target,
  Activity,
  Zap,
  Timer,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UserDashboardMetricsProps {
  tickets: any[];
  userName: string;
}

const UserDashboardMetrics: React.FC<UserDashboardMetricsProps> = ({ tickets, userName }) => {
  // Obter user ID para filtragem correta
  const { user } = useAuth();

  // Filtrar tickets do usuário usando customer_id (Supabase) ou customer (localStorage)
  const userTickets = useMemo(() => {
    if (!user && !userName) return [];
    
    return tickets.filter(ticket => {
      // Suporte para dados do Supabase
      if (user && (ticket.customer_id === user.id || ticket.customer?.user_id === user.id)) {
        return true;
      }
      
      // Suporte para dados do localStorage (fallback)
      if (ticket.customer === userName) {
        return true;
      }
      
      return false;
    });
  }, [tickets, user, userName]);

  // Estatísticas do usuário (com normalização de status e prioridade)
  const userStats = useMemo(() => {
    const total = userTickets.length;
    
    // Normalizar status para suportar ambos os formatos
    const abertos = userTickets.filter(t => t.status === "aberto" || t.status === "open").length;
    const emAndamento = userTickets.filter(t => t.status === "em_andamento" || t.status === "in_progress").length;
    const resolvidos = userTickets.filter(t => t.status === "resolvido" || t.status === "resolved").length;
    const fechados = userTickets.filter(t => t.status === "fechado" || t.status === "closed").length;
    
    // Normalizar prioridade para suportar ambos os formatos
    const alta = userTickets.filter(t => t.priority === "alta" || t.priority === "high" || t.priority === "urgent").length;
    const media = userTickets.filter(t => t.priority === "media" || t.priority === "medium").length;
    const baixa = userTickets.filter(t => t.priority === "baixa" || t.priority === "low").length;

    // Tickets ativos (abertos + em andamento)
    const ativos = abertos + emAndamento;
    
    // Taxa de resolução
    const taxaResolucao = total > 0 ? ((resolvidos + fechados) / total * 100) : 0;
    
    // Tickets criados nos últimos 30 dias - usar created_at ou date
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentTickets = userTickets.filter(t => {
      const ticketDate = new Date(t.created_at || t.date);
      return ticketDate >= thirtyDaysAgo;
    });
    
    // Tickets criados esta semana - usar created_at ou date
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekTickets = userTickets.filter(t => {
      const ticketDate = new Date(t.created_at || t.date);
      return ticketDate >= sevenDaysAgo;
    });
    
    return {
      total,
      abertos,
      emAndamento,
      resolvidos,
      fechados,
      alta,
      media,
      baixa,
      ativos,
      taxaResolucao,
      recentTickets: recentTickets.length,
      weekTickets: weekTickets.length
    };
  }, [userTickets]);

  // Distribuição por departamento
  const departmentStats = useMemo(() => {
    const departments = [...new Set(userTickets.map(t => t.department))];
    return departments.map(dept => {
      const deptTickets = userTickets.filter(t => t.department === dept);
      return {
        department: dept,
        count: deptTickets.length,
        percentage: userTickets.length > 0 ? (deptTickets.length / userTickets.length * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);
  }, [userTickets]);

  // Últimos tickets (com normalização de data)
  const recentTickets = useMemo(() => {
    return userTickets
      .sort((a, b) => {
        const aDate = new Date(a.created_at || a.date).getTime();
        const bDate = new Date(b.created_at || b.date).getTime();
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [userTickets]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto": return "bg-red-100 text-red-800 border-red-200";
      case "em_andamento": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolvido": return "bg-green-100 text-green-800 border-green-200";
      case "fechado": return "bg-gray-100 text-gray-800 border-gray-200";
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

  if (userTickets.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum ticket encontrado</h3>
          <p className="text-gray-500">Você ainda não possui tickets criados. Clique em "Novo Ticket" para começar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total de Tickets</p>
                <p className="text-2xl font-bold text-blue-700">{userStats.total}</p>
                <p className="text-xs text-blue-500 mt-1">
                  {userStats.weekTickets} esta semana
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Tickets Ativos</p>
                <p className="text-2xl font-bold text-orange-700">{userStats.ativos}</p>
                <p className="text-xs text-orange-500 mt-1">
                  {userStats.abertos} abertos, {userStats.emAndamento} em andamento
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Taxa de Resolução</p>
                <p className="text-2xl font-bold text-green-700">{userStats.taxaResolucao.toFixed(1)}%</p>
                <p className="text-xs text-green-500 mt-1">
                  {userStats.resolvidos + userStats.fechados} resolvidos
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Alta Prioridade</p>
                <p className="text-2xl font-bold text-red-700">{userStats.alta}</p>
                <p className="text-xs text-red-500 mt-1">
                  {userStats.total > 0 ? ((userStats.alta / userStats.total) * 100).toFixed(1) : 0}% do total
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
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
                  <span className="text-sm font-bold">{userStats.abertos}</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {userStats.total > 0 ? ((userStats.abertos / userStats.total) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={userStats.total > 0 ? (userStats.abertos / userStats.total) * 100 : 0} 
                className="h-2" 
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Em Andamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{userStats.emAndamento}</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {userStats.total > 0 ? ((userStats.emAndamento / userStats.total) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={userStats.total > 0 ? (userStats.emAndamento / userStats.total) * 100 : 0} 
                className="h-2" 
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Resolvidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{userStats.resolvidos + userStats.fechados}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {userStats.total > 0 ? (((userStats.resolvidos + userStats.fechados) / userStats.total) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={userStats.total > 0 ? ((userStats.resolvidos + userStats.fechados) / userStats.total) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Departamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Tickets por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentStats.map((dept, index) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dept.department}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{dept.count}</span>
                      <Badge variant="outline" className="text-xs">
                        {dept.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={dept.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimos Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Últimos Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(ticket.priority)}
                    <span className="font-mono text-xs text-gray-600">{ticket.id}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(ticket.created_at || ticket.date).toLocaleDateString('pt-BR')} • {ticket.department}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-xs ${getStatusColor(ticket.status)}`}>
                    {ticket.status === "aberto" ? "Aberto" :
                     ticket.status === "em_andamento" ? "Em Andamento" :
                     ticket.status === "resolvido" ? "Resolvido" : "Fechado"}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`}></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboardMetrics; 