import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  related_ticket_id?: string;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAttendant, isAdmin } = useAuth();

  // Buscar notificações do usuário (placeholder até implementar SQL)
  const fetchNotifications = useCallback(async () => {
    if (!user || (!isAttendant && !isAdmin)) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔔 Sistema de notificações aguardando implementação do banco...');
      
      // Por enquanto, criar algumas notificações de exemplo para atendentes
      if (isAttendant) {
        const mockNotifications: Notification[] = [
          {
            id: '1',
            user_id: user.id,
            title: 'Sistema de Notificações',
            message: 'O sistema de notificações em tempo real está sendo configurado!',
            type: 'info',
            is_read: false,
            created_at: new Date().toISOString()
          }
        ];
        
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAttendant, isAdmin]);

  // Marcar notificação como lida (local por enquanto)
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      console.log('✅ Marcando notificação como lida (local):', notificationId);
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true }
            : n
        )
      );

      // Atualizar contador
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Marcar todas como lidas (local por enquanto)
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      console.log('✅ Marcando todas as notificações como lidas (local)');
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, [user]);

  // Criar notificação (placeholder)
  const createTestNotification = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🧪 Criando notificação de teste (local)');
      
      const newNotification: Notification = {
        id: Date.now().toString(),
        user_id: user.id,
        title: 'Notificação de Teste',
        message: `Teste enviado em ${new Date().toLocaleTimeString()}`,
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      console.log('✅ Notificação de teste criada (local)');
      
    } catch (error) {
      console.error('Erro ao criar notificação de teste:', error);
    }
  }, [user]);

  // Inicializar notificações
  useEffect(() => {
    if (!user || (!isAttendant && !isAdmin)) {
      return;
    }

    console.log('🔔 Inicializando sistema de notificações...');
    fetchNotifications();
  }, [user, isAttendant, isAdmin, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createTestNotification
  };
}; 