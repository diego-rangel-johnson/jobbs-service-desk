import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, AlertTriangle, CheckCircle, XCircle, Timer, Shield } from 'lucide-react';
import { SLAStatus, SLA_STATUS_CONFIG } from '@/types/sla';
import { useSLA } from '@/hooks/useSLA';

interface SLAStatusIndicatorProps {
  status: SLAStatus;
  responseDeadline?: string;
  solutionDeadline?: string;
  firstResponseAt?: string;
  solvedAt?: string;
  className?: string;
  showDetails?: boolean;
}

export const SLAStatusIndicator: React.FC<SLAStatusIndicatorProps> = ({ 
  status,
  responseDeadline,
  solutionDeadline,
  firstResponseAt,
  solvedAt,
  className = "",
  showDetails = true
}) => {
  const { calculateTimeRemaining, formatDuration } = useSLA();
  const statusConfig = SLA_STATUS_CONFIG[status];

  // Determinar qual deadline é mais relevante
  const currentDeadline = !firstResponseAt && responseDeadline ? responseDeadline : solutionDeadline;
  
  // Calcular tempo restante
  const timeInfo = currentDeadline ? calculateTimeRemaining(currentDeadline) : null;

  // Ícone baseado no status com design melhorado
  const getStatusIcon = () => {
    switch (status) {
      case 'within_deadline':
        return <CheckCircle className="h-4 w-4" />;
      case 'near_response_deadline':
      case 'near_solution_deadline':
        return <AlertTriangle className="h-4 w-4" />;
      case 'overdue_response':
      case 'overdue_solution':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Classes de cor mais consistentes
  const getStatusColor = () => {
    switch (statusConfig.color) {
      case 'green':
        return 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100';
      case 'yellow':
        return 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100';
      case 'red':
        return 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100';
    }
  };

  const formatDeadlineDate = (deadline: string) => {
    try {
      const date = new Date(deadline);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return deadline;
    }
  };

  // Versão compacta
  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="outline" 
              className={`flex items-center gap-2 px-3 py-1 text-xs font-medium ${getStatusColor()} ${className}`}
            >
              {getStatusIcon()}
              <span>{statusConfig.label}</span>
              {timeInfo && !timeInfo.isOverdue && (
                <Timer className="h-3 w-3 opacity-70" />
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-64">
            <div className="space-y-2">
              <p className="font-medium text-sm">{statusConfig.description}</p>
              {timeInfo && (
                <div className="text-xs space-y-1">
                  <p className={timeInfo.isOverdue ? 'text-red-300' : 'text-gray-300'}>
                    {timeInfo.isOverdue ? '⚠️ Atrasado' : '⏱️ Tempo restante'}: {timeInfo.timeRemaining}
                  </p>
                  {currentDeadline && (
                    <p className="text-gray-400">
                      Prazo: {formatDeadlineDate(currentDeadline)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Versão detalhada
  return (
    <Card className={`border-l-4 ${
      statusConfig.color === 'green' ? 'border-l-green-500' :
      statusConfig.color === 'yellow' ? 'border-l-yellow-500' :
      statusConfig.color === 'red' ? 'border-l-red-500' :
      'border-l-gray-500'
    } ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header do status */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={`flex items-center gap-2 px-3 py-1 font-medium ${getStatusColor()}`}
            >
              {getStatusIcon()}
              <span>{statusConfig.label}</span>
            </Badge>
            
            {timeInfo && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  timeInfo.isOverdue 
                    ? 'bg-red-100 text-red-700 border-red-200' 
                    : timeInfo.isNearDeadline
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : 'bg-green-100 text-green-700 border-green-200'
                }`}
              >
                {timeInfo.isOverdue ? '🚨 ATRASADO' : `⏱️ ${timeInfo.timeRemaining}`}
              </Badge>
            )}
          </div>
          
          {/* Descrição */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {statusConfig.description}
          </p>

          {/* Grid de prazos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {responseDeadline && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Prazo de Resposta</span>
                </div>
                <div className="text-sm font-semibold text-green-800 mb-1">
                  {formatDeadlineDate(responseDeadline)}
                </div>
                {firstResponseAt ? (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Respondido em {formatDeadlineDate(firstResponseAt)}</span>
                  </div>
                ) : (
                  <div className="text-xs text-green-600">Aguardando primeira resposta</div>
                )}
              </div>
            )}
            
            {solutionDeadline && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Prazo de Solução</span>
                </div>
                <div className="text-sm font-semibold text-blue-800 mb-1">
                  {formatDeadlineDate(solutionDeadline)}
                </div>
                {solvedAt ? (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Resolvido em {formatDeadlineDate(solvedAt)}</span>
                  </div>
                ) : (
                  <div className="text-xs text-blue-600">Aguardando solução</div>
                )}
              </div>
            )}
          </div>

          {/* Barra de progresso visual */}
          {timeInfo && !solvedAt && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">Progresso do SLA</span>
                <span className={`font-semibold ${
                  timeInfo.isOverdue 
                    ? 'text-red-600' 
                    : timeInfo.isNearDeadline
                      ? 'text-yellow-600'
                      : 'text-green-600'
                }`}>
                  {timeInfo.isOverdue ? 'ATRASADO' : timeInfo.timeRemaining}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    timeInfo.isOverdue 
                      ? 'bg-gradient-to-r from-red-500 to-red-600' 
                      : timeInfo.isNearDeadline 
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                        : 'bg-gradient-to-r from-green-400 to-green-500'
                  }`}
                  style={{ 
                    width: timeInfo.isOverdue 
                      ? '100%' 
                      : `${Math.max(5, Math.min(100, (timeInfo.hoursRemaining / 48) * 100))}%` 
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>Ticket criado</span>
                <span>Prazo limite</span>
              </div>
            </div>
          )}

          {/* Indicador de performance */}
          {(firstResponseAt || solvedAt) && (
            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Performance</span>
              </div>
              <div className="space-y-1 text-xs">
                {firstResponseAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tempo de resposta:</span>
                    <span className="font-medium text-green-600">✅ Dentro do prazo</span>
                  </div>
                )}
                {solvedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tempo de solução:</span>
                    <span className="font-medium text-green-600">✅ Resolvido</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 