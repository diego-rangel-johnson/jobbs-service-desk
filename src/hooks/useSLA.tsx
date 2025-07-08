import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  SLAMetrics, 
  UpdateSLAData, 
  SLACriticality,
  TicketWithSLA 
} from '@/types/sla';

export const useSLA = () => {
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin, isSupport } = useAuth();

  // Buscar métricas de SLA (placeholder até implementação completa)
  const fetchSLAMetrics = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Por enquanto, retornar métricas simuladas baseadas nos tickets existentes
      const { data, error: metricsError } = await supabase
        .from('tickets')
        .select('status, created_at, priority');

      if (metricsError) {
        console.warn('Erro ao buscar tickets:', metricsError.message);
        return;
      }

      // Calcular métricas básicas baseadas nos tickets existentes
      if (data) {
        const totalTickets = data.length;
        const openTickets = data.filter(t => t.status === 'open').length;
        const inProgressTickets = data.filter(t => t.status === 'in_progress').length;
        const resolvedTickets = data.filter(t => t.status === 'resolved').length;
        const urgentTickets = data.filter(t => t.priority === 'urgent').length;

        setMetrics({
          within_deadline: openTickets + inProgressTickets,
          near_deadline: urgentTickets,
          overdue: Math.floor(urgentTickets * 0.3), // Simulação
          completed: resolvedTickets
        });
      }
    } catch (err) {
      console.error('Erro ao buscar métricas de SLA:', err);
      setError('Sistema de SLA será implementado em breve');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Atualizar SLA de um ticket (placeholder)
  const updateTicketSLA = useCallback(async (
    ticketId: string, 
    updates: UpdateSLAData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || (!isAdmin && !isSupport)) {
      return { success: false, error: 'Sem permissão para alterar SLA' };
    }

    console.log('Atualização de SLA simulada para ticket:', ticketId, updates);
    
    // Por enquanto, simular sucesso
    return { success: true };
  }, [user, isAdmin, isSupport]);

  // Verificar se usuário pode editar SLA
  const canEditSLA = useCallback(() => {
    return isAdmin || isSupport;
  }, [isAdmin, isSupport]);

  // Calcular tempo restante até deadline
  const calculateTimeRemaining = useCallback((deadline: string): {
    isOverdue: boolean;
    isNearDeadline: boolean;
    timeRemaining: string;
    hoursRemaining: number;
  } => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
    const isOverdue = diffMs < 0;
    const isNearDeadline = hoursRemaining <= 4 && hoursRemaining > 0;

    let timeRemaining = '';
    if (isOverdue) {
      const hoursOverdue = Math.abs(hoursRemaining);
      timeRemaining = `${hoursOverdue}h em atraso`;
    } else {
      const days = Math.floor(hoursRemaining / 24);
      const hours = hoursRemaining % 24;
      
      if (days > 0) {
        timeRemaining = `${days}d ${hours}h restantes`;
      } else {
        timeRemaining = `${hours}h restantes`;
      }
    }

    return {
      isOverdue,
      isNearDeadline,
      timeRemaining,
      hoursRemaining: Math.abs(hoursRemaining)
    };
  }, []);

  // Formatar tempo de resposta/solução
  const formatDuration = useCallback((duration: string): string => {
    if (!duration) return 'N/A';
    
    // Parse PostgreSQL interval
    const match = duration.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h ${minutes}m`;
      } else {
        return `${hours}h ${minutes}m`;
      }
    }
    
    return duration;
  }, []);

  // Buscar tickets com problemas de SLA (placeholder)
  const fetchProblematicTickets = useCallback(async () => {
    if (!user) return [];

    try {
      const { data } = await supabase
        .from('tickets')
        .select(`
          *,
          customer:profiles!tickets_customer_id_fkey(name, user_id),
          assignee:profiles!tickets_assignee_id_fkey(name, user_id),
          company:companies(id, name)
        `)
        .eq('priority', 'urgent')
        .order('created_at', { ascending: true });

      return data || [];
    } catch (err) {
      console.error('Erro ao buscar tickets problemáticos:', err);
      return [];
    }
  }, [user]);

  // Carregar métricas na inicialização
  useEffect(() => {
    if (user && (isAdmin || isSupport)) {
      fetchSLAMetrics();
    }
  }, [user, isAdmin, isSupport, fetchSLAMetrics]);

  return {
    metrics,
    isLoading,
    error,
    fetchSLAMetrics,
    updateTicketSLA,
    canEditSLA,
    calculateTimeRemaining,
    formatDuration,
    fetchProblematicTickets
  };
}; 