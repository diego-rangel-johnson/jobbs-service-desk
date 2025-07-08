import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SLACriticality, SLAStatus } from '@/types/sla';

export interface Ticket {
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
  sla_criticality?: SLACriticality;
  sla_response_deadline?: string;
  sla_solution_deadline?: string;
  sla_first_response_at?: string;
  sla_solved_at?: string;
  sla_custom_solution_date?: string;
  sla_status?: SLAStatus;
  // Relacionamentos
  customer?: {
    name: string;
    user_id: string;
  } | null;
  assignee?: {
    name: string;
    user_id: string;
  } | null;
  updates?: TicketUpdate[];
  attachments?: TicketAttachment[];
  company?: {
    id: string;
    name: string;
  } | null;
}

export interface TicketUpdate {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    name: string;
  };
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  uploaded_by: string;
  created_at: string;
}

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin, isSupport, isSupervisor, isAttendant, userCompany, attendantCompanies } = useAuth();

  const fetchTickets = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Buscar tickets com informações da empresa e campos SLA (se existirem)
      const { data: ticketsData, error: ticketsError } = await (supabase as any)
        .from('tickets')
        .select(`
          *,
          company:companies(id, name)
        `)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Erro ao buscar tickets:', ticketsError);
        return;
      }

      if (!ticketsData || ticketsData.length === 0) {
        setTickets([]);
        return;
      }

      // Buscar informações dos profiles para enriquecer os tickets
      const userIds = [
        ...new Set([
          ...ticketsData.map(t => t.customer_id),
          ...ticketsData.map(t => t.assignee_id).filter(Boolean)
        ])
      ];

      const { data: profilesData, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select('user_id, name, company_id')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Erro ao buscar perfis:', profilesError);
      }

      // Criar mapa de profiles para lookup rápido
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, { user_id: string; name: string; company_id?: string }>);

      // Enriquecer tickets com dados dos profiles e empresa
      const enrichedTickets = ticketsData.map(ticket => ({
        ...ticket,
        customer: profilesMap[ticket.customer_id] || null,
        assignee: ticket.assignee_id ? profilesMap[ticket.assignee_id] || null : null,
        company: ticket.company || null,
        // Adicionar campos SLA com valores padrão se não existirem
        sla_criticality: ticket.sla_criticality || 'padrao' as SLACriticality,
        sla_status: ticket.sla_status || 'within_deadline' as SLAStatus
      }));

      setTickets(enrichedTickets);
    } catch (error) {
      console.error('Erro inesperado ao buscar tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, isSupport, isSupervisor, isAttendant, userCompany, attendantCompanies]);

  const uploadFile = async (file: File, ticketId: string): Promise<{ success: boolean; fileUrl?: string; error?: string }> => {
    try {
      const storageConfigured = await checkStorageConfiguration();
      if (!storageConfigured) {
        return { success: false, error: 'Storage não configurado' };
      }

      const timestamp = new Date().getTime();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user!.id}/${ticketId}/${timestamp}_${sanitizedFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      return { success: true, fileUrl: fileName };
    } catch (error) {
      return { success: false, error: 'Erro interno no upload' };
    }
  };

  const createTicketAttachment = async (ticketId: string, file: File, fileName: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .insert({
          ticket_id: ticketId,
          file_name: file.name,
          file_url: fileName,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user!.id
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { error: 'Erro interno do servidor' };
    }
  };

  const createTicket = async (ticketData: {
    subject: string;
    description: string;
    priority: string;
    department: string;
    attachment?: File | null;
    sla_criticality?: SLACriticality; // Novo campo SLA
  }) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Buscar informações do perfil do usuário para obter company_id
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        return { error: 'Erro ao buscar perfil do usuário' };
      }
      
      // Criar o ticket com campos SLA
      const ticketInsertData = {
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority as any,
        department: ticketData.department,
        customer_id: user.id,
        company_id: userProfile?.company_id || null,
        ticket_number: '',
        // Campos SLA (com valores padrão se não fornecidos)
        sla_criticality: ticketData.sla_criticality || 'padrao'
      };

      let ticketCreateData: any = null;

      const { data: initialTicketData, error: ticketError } = await supabase
        .from('tickets')
        .insert(ticketInsertData)
        .select('*')
        .single();

      if (ticketError) {
        console.warn('Campos SLA podem não estar implementados ainda:', ticketError.message);
        
        // Tentar criar sem campos SLA se houver erro
        const basicTicketData = {
          subject: ticketData.subject,
          description: ticketData.description,
          priority: ticketData.priority as any,
          department: ticketData.department,
          customer_id: user.id,
          company_id: userProfile?.company_id || null,
          ticket_number: ''
        };

        const { data: basicTicketCreateData, error: basicTicketError } = await supabase
          .from('tickets')
          .insert(basicTicketData)
          .select('*')
          .single();

        if (basicTicketError) {
          return { error: basicTicketError.message };
        }

        // Usar dados do ticket básico
        ticketCreateData = basicTicketCreateData;
      } else {
        ticketCreateData = initialTicketData;
      }

      // Criar objeto ticket enriquecido para o estado local
      const enrichedTicket: Ticket = {
        ...ticketCreateData,
        customer: userProfile || { user_id: user.id, name: 'Usuário' },
        assignee: null,
        company: userProfile?.company_id ? { 
          id: userProfile.company_id, 
          name: 'Empresa'
        } : null,
        // Adicionar campos SLA padrão
        sla_criticality: (ticketData.sla_criticality || 'padrao') as SLACriticality,
        sla_status: 'within_deadline' as SLAStatus
      };

      // Adicionar o ticket ao estado local
      setTickets(prevTickets => [enrichedTicket, ...prevTickets]);

      // Se há anexo, fazer upload e criar registro
      if (ticketData.attachment && ticketCreateData) {
        const uploadResult = await uploadFile(ticketData.attachment, ticketCreateData.id);
        
        if (uploadResult.success && uploadResult.fileUrl) {
          await createTicketAttachment(
            ticketCreateData.id,
            ticketData.attachment,
            uploadResult.fileUrl
          );
        }
      }
      
      return { data: ticketCreateData, error: null };
    } catch (error) {
      return { error: 'Erro interno do servidor' };
    }
  };

  const getTicketAttachments = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: 'Erro interno do servidor' };
    }
  };

  const downloadAttachment = async (attachment: TicketAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .download(attachment.file_url);

      if (error) {
        console.error('Error downloading file:', error);
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error in downloadAttachment:', error);
    }
  };

  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId)
        .select('*')
        .single();

      if (error) {
        return { error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return { error: 'Erro interno do servidor' };
    }
  };

  const addTicketUpdate = async (ticketId: string, message: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('ticket_updates')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message
        })
        .select('*')
        .single();

      if (error) {
        return { error: error.message };
      }

      // Buscar informações do usuário separadamente
      let enrichedData: any = data;
      if (data) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', data.user_id)
          .single();

        if (!profileError && profileData) {
          enrichedData = {
            ...data,
            user: profileData
          };
        }
      }

      return { data: enrichedData, error: null };
    } catch (error) {
      return { error: 'Erro interno do servidor' };
    }
  };

  const checkStorageConfiguration = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.storage.getBucket('ticket-attachments');
      return !error && data !== null;
    } catch (error) {
      console.warn('Storage bucket não configurado:', error);
      return false;
    }
  };

  const refreshTickets = useCallback(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Carregar tickets inicial
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Recarregar quando dados de autenticação mudarem
  useEffect(() => {
    if (user && userCompany) {
      fetchTickets();
    }
  }, [user, userCompany]);

  return {
    tickets,
    isLoading,
    createTicket,
    refreshTickets,
    fetchTickets,
    getTicketAttachments,
    downloadAttachment,
    updateTicket,
    addTicketUpdate,
    uploadFile,
    createTicketAttachment,
    checkStorageConfiguration
  };
};

export default useTickets;