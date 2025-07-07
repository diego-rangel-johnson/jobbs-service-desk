/**
 * Sistema de Monitoramento de Performance - Jobbs Service Desk
 * 
 * Este módulo implementa logging detalhado de performance para
 * monitorar o comportamento da aplicação após a otimização do banco.
 */

interface PerformanceLog {
  timestamp: Date;
  action: string;
  duration: number;
  success: boolean;
  details?: any;
  userId?: string;
  error?: string;
}

interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  successRate: number;
  slowestQuery: PerformanceLog | null;
  fastestQuery: PerformanceLog | null;
  errorCount: number;
}

class PerformanceLogger {
  private logs: PerformanceLog[] = [];
  private activeOperations: Map<string, { startTime: Date; action: string }> = new Map();
  private maxLogSize = 1000; // Máximo 1000 logs na memória

  /**
   * Inicia o tracking de uma operação
   */
  startOperation(operationId: string, action: string): void {
    this.activeOperations.set(operationId, {
      startTime: new Date(),
      action
    });
    
    console.log(`🚀 [${action}] Operação iniciada`, {
      id: operationId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Finaliza o tracking de uma operação
   */
  endOperation(
    operationId: string, 
    success: boolean = true, 
    details?: any, 
    error?: string,
    userId?: string
  ): PerformanceLog | null {
    const operation = this.activeOperations.get(operationId);
    
    if (!operation) {
      console.warn(`⚠️ Operação ${operationId} não encontrada para finalizar`);
      return null;
    }

    const duration = Date.now() - operation.startTime.getTime();
    
    const log: PerformanceLog = {
      timestamp: new Date(),
      action: operation.action,
      duration,
      success,
      details,
      userId,
      error
    };

    this.addLog(log);
    this.activeOperations.delete(operationId);

    // Log detalhado no console
    const status = success ? '✅' : '❌';
    const level = success ? 'log' : 'error';
    
    console[level](`${status} [${operation.action}] Finalizada`, {
      duration: `${duration}ms`,
      success,
      details,
      error,
      userId
    });

    // Alertar se operação for muito lenta
    if (duration > 5000) {
      console.warn(`🐌 [PERFORMANCE] Operação lenta detectada: ${operation.action} (${duration}ms)`);
    }

    return log;
  }

  /**
   * Log rápido para operações síncronas
   */
  logSync(action: string, success: boolean = true, details?: any, error?: string, userId?: string): void {
    const log: PerformanceLog = {
      timestamp: new Date(),
      action,
      duration: 0,
      success,
      details,
      userId,
      error
    };

    this.addLog(log);

    const status = success ? '⚡' : '❌';
    console.log(`${status} [${action}]`, { success, details, error, userId });
  }

  /**
   * Adiciona um log à lista mantendo o limite de tamanho
   */
  private addLog(log: PerformanceLog): void {
    this.logs.push(log);
    
    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift();
    }
  }

  /**
   * Obtém métricas de performance
   */
  getMetrics(): PerformanceMetrics {
    if (this.logs.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        slowestQuery: null,
        fastestQuery: null,
        errorCount: 0
      };
    }

    const completedOperations = this.logs.filter(log => log.duration > 0);
    const successfulOps = this.logs.filter(log => log.success);
    const failedOps = this.logs.filter(log => !log.success);

    const durations = completedOperations.map(log => log.duration);
    const averageResponseTime = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0;

    const slowestQuery = completedOperations.reduce((slowest, current) => 
      !slowest || current.duration > slowest.duration ? current : slowest, null as PerformanceLog | null);

    const fastestQuery = completedOperations.reduce((fastest, current) => 
      !fastest || current.duration < fastest.duration ? current : fastest, null as PerformanceLog | null);

    return {
      totalRequests: this.logs.length,
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round((successfulOps.length / this.logs.length) * 100),
      slowestQuery,
      fastestQuery,
      errorCount: failedOps.length
    };
  }

  /**
   * Obtém logs recentes
   */
  getRecentLogs(limit: number = 50): PerformanceLog[] {
    return this.logs.slice(-limit);
  }

  /**
   * Obtém logs de erro
   */
  getErrorLogs(): PerformanceLog[] {
    return this.logs.filter(log => !log.success);
  }

  /**
   * Limpa todos os logs
   */
  clearLogs(): void {
    this.logs = [];
    this.activeOperations.clear();
    console.log('🧹 Logs de performance limpos');
  }

  /**
   * Gera relatório de performance
   */
  generateReport(): void {
    const metrics = this.getMetrics();
    const errorLogs = this.getErrorLogs();

    console.group('📊 RELATÓRIO DE PERFORMANCE - JOBBS SERVICE DESK');
    
    console.log('📈 Métricas Gerais:', {
      'Total de Requests': metrics.totalRequests,
      'Tempo Médio de Resposta': `${metrics.averageResponseTime}ms`,
      'Taxa de Sucesso': `${metrics.successRate}%`,
      'Total de Erros': metrics.errorCount
    });

    if (metrics.slowestQuery) {
      console.log('🐌 Query Mais Lenta:', {
        action: metrics.slowestQuery.action,
        duration: `${metrics.slowestQuery.duration}ms`,
        timestamp: metrics.slowestQuery.timestamp
      });
    }

    if (metrics.fastestQuery) {
      console.log('⚡ Query Mais Rápida:', {
        action: metrics.fastestQuery.action,
        duration: `${metrics.fastestQuery.duration}ms`,
        timestamp: metrics.fastestQuery.timestamp
      });
    }

    if (errorLogs.length > 0) {
      console.log('❌ Últimos Erros:', errorLogs.slice(-5).map(log => ({
        action: log.action,
        error: log.error,
        timestamp: log.timestamp
      })));
    }

    console.groupEnd();
  }

  /**
   * Monitora automaticamente operações de fetch
   */
  monitorFetch(): void {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const operationId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const url = args[0]?.toString() || 'unknown';
      
      this.startOperation(operationId, `HTTP ${url}`);
      
      try {
        const response = await originalFetch(...args);
        
        this.endOperation(operationId, response.ok, {
          status: response.status,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        }, response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`);
        
        return response;
      } catch (error) {
        this.endOperation(operationId, false, { url }, error instanceof Error ? error.message : 'Network error');
        throw error;
      }
    };

    console.log('🔍 Monitoramento de fetch ativado');
  }
}

// Instância singleton
export const performanceLogger = new PerformanceLogger();

// Tipos para export
export type { PerformanceLog, PerformanceMetrics };

// Utilidades para React Hooks
export const usePerformanceLogger = () => {
  return {
    startOperation: performanceLogger.startOperation.bind(performanceLogger),
    endOperation: performanceLogger.endOperation.bind(performanceLogger),
    logSync: performanceLogger.logSync.bind(performanceLogger),
    getMetrics: performanceLogger.getMetrics.bind(performanceLogger),
    generateReport: performanceLogger.generateReport.bind(performanceLogger)
  };
};

// Auto-inicializar monitoramento de fetch no browser
if (typeof window !== 'undefined') {
  performanceLogger.monitorFetch();
  
  // Gerar relatório a cada 5 minutos
  setInterval(() => {
    const metrics = performanceLogger.getMetrics();
    if (metrics.totalRequests > 0) {
      performanceLogger.generateReport();
    }
  }, 5 * 60 * 1000);
}

export default performanceLogger; 