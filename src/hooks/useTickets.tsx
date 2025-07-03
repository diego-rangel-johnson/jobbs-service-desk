import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  } | null;
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
  const { user, isAdmin, isSupport, isSupervisor } = useAuth();

  const fetchTickets = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Buscar tickets com informações da empresa
      let query = (supabase as any)
        .from('tickets')
        .select(`
          *,
          company:companies(id, name)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros baseados nas roles
      if (!isAdmin && !isSupport) {
        if (isSupervisor) {
          // Supervisores veem tickets da empresa onde trabalham
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('user_id', user.id)
            .single();
          
          if (userProfile?.company_id) {
            // Tickets onde: é o cliente OU é da mesma empresa OU está atribuído a ele
            query = query.or(`customer_id.eq.${user.id},company_id.eq.${userProfile.company_id},assignee_id.eq.${user.id}`);
          } else {
            // Se supervisor sem empresa, vê apenas seus próprios tickets
            query = query.eq('customer_id', user.id);
          }
        } else {
          // Usuários normais veem apenas seus próprios tickets
          query = query.eq('customer_id', user.id);
        }
      }
      // Admin e Support veem todos os tickets (sem filtro adicional)

      const { data: ticketsData, error: ticketsError } = await query;

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
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
        console.warn('Error fetching profiles:', profilesError);
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
        company: ticket.company || null // Já vem do join
      }));

      setTickets(enrichedTickets);
      console.log(`✅ ${enrichedTickets.length} tickets carregados`);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, isSupport, isSupervisor]);

  const uploadFile = async (file: File, ticketId: string): Promise<{ success: boolean; fileUrl?: string; error?: string }> => {
    try {
      // Primeiro verificar se o bucket existe
      const storageConfigured = await checkStorageConfiguration();
      if (!storageConfigured) {
        return { success: false, error: 'Storage não configurado' };
      }

      // Gerar nome único para o arquivo
      const timestamp = new Date().getTime();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user!.id}/${ticketId}/${timestamp}_${sanitizedFileName}`;

      console.log('🔄 Fazendo upload do arquivo:', fileName);

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return { success: false, error: uploadError.message };
      }

      console.log('✅ Upload realizado com sucesso:', uploadData.path);

      // Retornar o caminho do arquivo para ser salvo no banco
      return { success: true, fileUrl: fileName };
    } catch (error) {
      console.error('Error in uploadFile:', error);
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
          file_url: fileName, // Salvar apenas o nome do arquivo, não a URL completa
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user!.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket attachment:', error);
        return { error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating ticket attachment:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const createTicket = async (ticketData: {
    subject: string;
    description: string;
    priority: string;
    department: string;
    attachment?: File | null;
  }) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      console.log('🎫 Criando ticket...');
      
      // Buscar informações do perfil do usuário para obter company_id
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return { error: 'Erro ao buscar perfil do usuário' };
      }

      console.log('👤 Perfil do usuário:', userProfile);
      
      // Criar o ticket com company_id vinculado
      const ticketInsertData = {
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority as any,
        department: ticketData.department,
        customer_id: user.id,
        company_id: userProfile?.company_id || null, // Incluir company_id se disponível
        ticket_number: '' // Will be auto-generated by trigger
      };

      console.log('📋 Dados do ticket a ser criado:', ticketInsertData);

      const { data: ticketCreateData, error: ticketError } = await supabase
        .from('tickets')
        .insert(ticketInsertData)
        .select('*')
        .single();

      if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        return { error: ticketError.message };
      }

      console.log('✅ Ticket criado no banco:', ticketCreateData);

      // Criar objeto ticket enriquecido para o estado local
      const enrichedTicket = {
        ...ticketCreateData,
        customer: userProfile || { user_id: user.id, name: 'Usuário' },
        assignee: null,
        company: userProfile?.company_id ? { 
          id: userProfile.company_id, 
          name: 'Empresa' // Será atualizado no refresh 
        } : null
      };

      // Adicionar o ticket diretamente ao estado local (no início da lista)
      setTickets(prevTickets => [enrichedTicket, ...prevTickets]);
      
      console.log('✅ Ticket adicionado ao estado local');

      // Se há anexo, fazer upload e criar registro
      if (ticketData.attachment && ticketCreateData) {
        const uploadResult = await uploadFile(ticketData.attachment, ticketCreateData.id);
        
        if (uploadResult.success && uploadResult.fileUrl) {
          const attachmentResult = await createTicketAttachment(
            ticketCreateData.id,
            ticketData.attachment,
            uploadResult.fileUrl
          );

          if (attachmentResult.error) {
            console.warn('Ticket criado mas falha ao salvar anexo:', attachmentResult.error);
          } else {
            console.log('✅ Ticket criado com anexo');
          }
        } else {
          console.warn('Ticket criado mas falha no upload:', uploadResult.error);
        }
      } else {
        console.log('✅ Ticket criado com sucesso');
      }

      // Refresh para garantir sincronização completa com joins
      setTimeout(() => {
        console.log('🔄 Refresh para sincronização completa...');
        fetchTickets();
      }, 1000);
      
      return { data: ticketCreateData, error: null };
    } catch (error) {
      console.error('Error creating ticket:', error);
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
        console.error('Error fetching ticket attachments:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching ticket attachments:', error);
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

      // Criar URL temporária para download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`📥 Download iniciado: ${attachment.file_name}`);
    } catch (error) {
      console.error('Error in downloadAttachment:', error);
    }
  };

  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      console.log('📝 Atualizando ticket:', ticketId);
      
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating ticket:', error);
        return { error: error.message };
      }

      console.log('✅ Ticket atualizado:', data);

      // Forçar refresh imediato da lista de tickets
      setTimeout(() => {
        fetchTickets();
      }, 100);
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating ticket:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const addTicketUpdate = async (ticketId: string, message: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      console.log('💬 Adicionando comentário ao ticket:', ticketId);
      
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
        console.error('Error adding ticket update:', error);
        return { error: error.message };
      }

      console.log('✅ Comentário adicionado:', data);

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

      // Forçar refresh da lista de tickets para capturar mudanças
      setTimeout(() => {
        fetchTickets();
      }, 100);

      return { data: enrichedData, error: null };
    } catch (error) {
      console.error('Error adding ticket update:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const fetchTicketUpdates = async (ticketId: string) => {
    try {
      const { data: updatesData, error: updatesError } = await supabase
        .from('ticket_updates')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (updatesError) {
        console.error('Error fetching ticket updates:', updatesError);
        return { data: [], error: updatesError.message };
      }

      if (!updatesData || updatesData.length === 0) {
        return { data: [], error: null };
      }

      // Buscar informações dos usuários
      const userIds = [...new Set(updatesData.map(u => u.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles for updates:', profilesError);
      }

      // Criar mapa de profiles
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, { user_id: string; name: string }>);

      // Enriquecer updates com dados dos usuários
      const enrichedUpdates = updatesData.map(update => ({
        ...update,
        user: profilesMap[update.user_id] || null
      }));

      return { data: enrichedUpdates, error: null };
    } catch (error) {
      console.error('Error fetching ticket updates:', error);
      return { data: [], error: 'Erro interno do servidor' };
    }
  };

  const checkStorageConfiguration = async () => {
    try {
      // Testar se o bucket existe tentando listar arquivos
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .list('', { limit: 1 });

      if (error) {
        console.error('Storage bucket não encontrado:', error);
        
        // Tentar criar o bucket automaticamente
        console.log('Tentando criar bucket ticket-attachments...');
        const { data: bucketData, error: bucketError } = await supabase.storage
          .createBucket('ticket-attachments', { public: false });

        if (bucketError) {
          console.error('Erro ao criar bucket:', bucketError);
          return false;
        } else {
          console.log('✅ Bucket criado com sucesso');
          return true;
        }
      }

      console.log('✅ Storage configurado corretamente');
      return true;
    } catch (error) {
      console.error('Erro ao verificar storage:', error);
      return false;
    }
  };

  const refreshTickets = fetchTickets;

  useEffect(() => {
    console.log('🚀 Inicializando useTickets...');
    
    // Buscar tickets inicial
    fetchTickets();

    // Set up real-time subscription apenas se o usuário estiver autenticado
    if (!user) return;

    console.log('📡 Configurando subscriptions...');
    
    const channel = supabase
      .channel('tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          console.log('🔄 Ticket change detected:', payload.eventType);
          // Refresh com delay para garantir consistência
          setTimeout(fetchTickets, 300);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscriptions active');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Real-time subscription error, will retry...');
        }
      });

    return () => {
      console.log('🔌 Cleanup subscriptions');
      supabase.removeChannel(channel);
    };
  }, [fetchTickets, user]);

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
    fetchTicketUpdates,
    checkStorageConfiguration
  };
};

export default useTickets;