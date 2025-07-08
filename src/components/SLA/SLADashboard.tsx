import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useSLA } from '@/hooks/useSLA';

interface SLADashboardProps {
  className?: string;
  onRefresh?: () => void;
}

export const SLADashboard: React.FC<SLADashboardProps> = ({ 
  className = "",
  onRefresh
}) => {
  const { metrics, isLoading, error, fetchSLAMetrics, formatDuration } = useSLA();

  useEffect(() => {
    fetchSLAMetrics();
  }, [fetchSLAMetrics]);

  const handleRefresh = () => {
    fetchSLAMetrics();
    onRefresh?.();
  };

  const totalTickets = metrics ? 
    metrics.within_deadline + metrics.near_deadline + metrics.overdue + metrics.completed : 0;

  const calculatePercentage = (value: number) => {
    return totalTickets > 0 ? Math.round((value / totalTickets) * 100) : 0;
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dashboard de SLA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com título e botão de refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Dashboard de SLA</h2>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Grid de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dentro do Prazo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Dentro do Prazo
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics?.within_deadline || 0}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700">
                {calculatePercentage(metrics?.within_deadline || 0)}%
              </Badge>
              <p className="text-xs text-gray-600">do total</p>
            </div>
          </CardContent>
        </Card>

        {/* Perto do Vencimento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Perto do Vencimento
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics?.near_deadline || 0}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs border-yellow-200 bg-yellow-50 text-yellow-700">
                {calculatePercentage(metrics?.near_deadline || 0)}%
              </Badge>
              <p className="text-xs text-gray-600">do total</p>
            </div>
          </CardContent>
        </Card>

        {/* Fora do Prazo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Fora do Prazo
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.overdue || 0}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs border-red-200 bg-red-50 text-red-700">
                {calculatePercentage(metrics?.overdue || 0)}%
              </Badge>
              <p className="text-xs text-gray-600">do total</p>
            </div>
          </CardContent>
        </Card>

        {/* Concluídos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Concluídos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.completed || 0}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">
                {calculatePercentage(metrics?.completed || 0)}%
              </Badge>
              <p className="text-xs text-gray-600">do total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tempos médios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tempos Médios de Resposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tempo de Primeira Resposta:</span>
              <div className="text-right">
                <span className="font-semibold">
                  {metrics?.avg_response_time ? formatDuration(metrics.avg_response_time) : 'N/A'}
                </span>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>Dentro da meta</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tempo de Solução:</span>
              <div className="text-right">
                <span className="font-semibold">
                  {metrics?.avg_solution_time ? formatDuration(metrics.avg_solution_time) : 'N/A'}
                </span>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>Melhorando</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo visual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Resumo de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Barra de progresso geral */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Conformidade SLA</span>
                  <span className="font-medium">
                    {totalTickets > 0 
                      ? Math.round(((metrics?.within_deadline || 0) + (metrics?.completed || 0)) / totalTickets * 100)
                      : 0
                    }%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                    style={{ 
                      width: totalTickets > 0 
                        ? `${Math.round(((metrics?.within_deadline || 0) + (metrics?.completed || 0)) / totalTickets * 100)}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>

              {/* Estatísticas rápidas */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {totalTickets > 0 
                      ? Math.round(((metrics?.within_deadline || 0) + (metrics?.completed || 0)) / totalTickets * 100)
                      : 0
                    }%
                  </div>
                  <div className="text-xs text-gray-600">Taxa de Sucesso</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalTickets}</div>
                  <div className="text-xs text-gray-600">Total de Tickets</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status indicator */}
      {!isLoading && (
        <div className="text-center text-sm text-gray-500">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
}; 