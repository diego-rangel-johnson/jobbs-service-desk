// Tipos para o sistema de SLA

export type SLACriticality = 'muito_alta' | 'alta' | 'moderada' | 'padrao' | 'geral';

export type SLAStatus = 
  | 'within_deadline'
  | 'near_response_deadline'
  | 'near_solution_deadline'
  | 'overdue_response'
  | 'overdue_solution'
  | 'completed';

export interface SLAConfig {
  value: SLACriticality;
  label: string;
  responseTime: string;
  solutionTime: string;
  timeType: 'Corrido' | 'Útil' | 'Misto' | 'Custom';
  color: string;
  description: string;
}

export interface SLAData {
  sla_criticality: SLACriticality;
  sla_response_deadline: string;
  sla_solution_deadline: string;
  sla_first_response_at?: string;
  sla_solved_at?: string;
  sla_custom_solution_date?: string;
  sla_status: SLAStatus;
}

export interface TicketWithSLA {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department: string;
  customer_id: string;
  assignee_id?: string;
  estimated_date?: string;
  created_at: string;
  updated_at: string;
  // Campos SLA
  sla_criticality: SLACriticality;
  sla_response_deadline: string;
  sla_solution_deadline: string;
  sla_first_response_at?: string;
  sla_solved_at?: string;
  sla_custom_solution_date?: string;
  sla_status: SLAStatus;
  // Relacionamentos
  customer?: {
    name: string;
    user_id: string;
  } | null;
  assignee?: {
    name: string;
    user_id: string;
  } | null;
  company?: {
    id: string;
    name: string;
  } | null;
}

export interface SLALog {
  id: string;
  ticket_id: string;
  changed_by: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  created_at: string;
  user?: {
    name: string;
  };
}

export interface SLAMetrics {
  within_deadline: number;
  near_deadline: number;
  overdue: number;
  completed: number;
  avg_response_time?: string;
  avg_solution_time?: string;
}

export interface UpdateSLAData {
  sla_criticality?: SLACriticality;
  sla_custom_solution_date?: string;
  change_reason?: string;
}

// Configurações das criticidades
export const SLA_CONFIGS: Record<SLACriticality, SLAConfig> = {
  muito_alta: {
    value: 'muito_alta',
    label: 'Muito Alta',
    responseTime: '1 hora',
    solutionTime: '4 horas',
    timeType: 'Corrido',
    color: 'red',
    description: 'Crítico - Sistema parado, impacto total nos negócios'
  },
  alta: {
    value: 'alta',
    label: 'Alta',
    responseTime: '2 horas',
    solutionTime: '12 horas',
    timeType: 'Misto',
    color: 'orange',
    description: 'Alto impacto - Funcionalidade importante comprometida'
  },
  moderada: {
    value: 'moderada',
    label: 'Moderada',
    responseTime: '2 horas',
    solutionTime: '16 horas',
    timeType: 'Útil',
    color: 'yellow',
    description: 'Impacto moderado - Algumas funcionalidades afetadas'
  },
  padrao: {
    value: 'padrao',
    label: 'Padrão',
    responseTime: '4 horas',
    solutionTime: '30 horas',
    timeType: 'Útil',
    color: 'blue',
    description: 'Solicitação padrão - Baixo impacto nos negócios'
  },
  geral: {
    value: 'geral',
    label: 'Geral',
    responseTime: '4 dias',
    solutionTime: 'Acordo',
    timeType: 'Custom',
    color: 'gray',
    description: 'Prazo definido em comum acordo com cliente'
  }
};

// Status SLA com cores e descrições
export const SLA_STATUS_CONFIG: Record<SLAStatus, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  within_deadline: {
    label: 'Dentro do Prazo',
    color: 'green',
    icon: '✅',
    description: 'Ticket dentro dos prazos de SLA'
  },
  near_response_deadline: {
    label: 'Perto do Prazo de Resposta',
    color: 'yellow',
    icon: '⚠️',
    description: 'Prazo de resposta vencendo em breve'
  },
  near_solution_deadline: {
    label: 'Perto do Prazo de Solução',
    color: 'yellow',
    icon: '⚠️',
    description: 'Prazo de solução vencendo em breve'
  },
  overdue_response: {
    label: 'Resposta em Atraso',
    color: 'red',
    icon: '🚨',
    description: 'Prazo de resposta foi ultrapassado'
  },
  overdue_solution: {
    label: 'Solução em Atraso',
    color: 'red',
    icon: '🚨',
    description: 'Prazo de solução foi ultrapassado'
  },
  completed: {
    label: 'Concluído',
    color: 'green',
    icon: '✅',
    description: 'Ticket resolvido dentro dos prazos'
  }
}; 