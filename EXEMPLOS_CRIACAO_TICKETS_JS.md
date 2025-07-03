# 📋 Exemplos de Criação de Tickets via JavaScript/TypeScript

Este arquivo contém exemplos práticos de como usar a lógica de criação de tickets no frontend React.

## 🔧 Configuração do Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

## 📝 Exemplo 1: Criação Básica de Ticket

```typescript
import { supabase } from './supabaseClient'

interface CreateTicketData {
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department: string
}

export const createTicket = async (ticketData: CreateTicketData) => {
  try {
    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado')
    }

    // Criar ticket
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        department: ticketData.department,
        customer_id: user.id,
        status: 'open'
        // ticket_number será gerado automaticamente pelo trigger
      })
      .select(`
        *,
        customer:profiles!tickets_customer_id_fkey(name, user_id)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar ticket:', error)
      throw error
    }

    console.log('✅ Ticket criado:', data)
    return { data, error: null }
    
  } catch (error) {
    console.error('Erro na criação do ticket:', error)
    return { data: null, error: error.message }
  }
}
```

## 🎯 Exemplo 2: Hook React para Criação de Tickets

```typescript
import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useToast } from './hooks/use-toast'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  priority: string
  department: string
  status: string
  created_at: string
  customer?: { name: string; user_id: string }
}

export const useCreateTicket = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const createTicket = async (ticketData: {
    subject: string
    description: string
    priority: string
    department: string
  }) => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          subject: ticketData.subject,
          description: ticketData.description,
          priority: ticketData.priority,
          department: ticketData.department,
          customer_id: user.id,
          status: 'open'
        })
        .select(`
          *,
          customer:profiles!tickets_customer_id_fkey(name, user_id)
        `)
        .single()

      if (error) throw error

      toast({
        title: 'Ticket criado!',
        description: `Ticket ${data.ticket_number} foi criado com sucesso.`,
        variant: 'default'
      })

      return { data, error: null }

    } catch (error) {
      console.error('Erro ao criar ticket:', error)
      
      toast({
        title: 'Erro ao criar ticket',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      })

      return { data: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return { createTicket, loading }
}
```

## 📋 Exemplo 3: Formulário de Criação de Ticket

```tsx
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useCreateTicket } from './hooks/useCreateTicket'

interface TicketFormData {
  subject: string
  description: string
  priority: string
  department: string
}

const CreateTicketForm: React.FC = () => {
  const { createTicket, loading } = useCreateTicket()
  const [formData, setFormData] = useState<TicketFormData>({
    subject: '',
    description: '',
    priority: 'medium',
    department: 'TI'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.subject.trim() || !formData.description.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const result = await createTicket(formData)
    
    if (result.data) {
      // Limpar formulário após sucesso
      setFormData({
        subject: '',
        description: '',
        priority: 'medium',
        department: 'TI'
      })
    }
  }

  const handleInputChange = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-1">
          Assunto *
        </label>
        <Input
          id="subject"
          type="text"
          value={formData.subject}
          onChange={(e) => handleInputChange('subject', e.target.value)}
          placeholder="Digite o assunto do ticket"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Descrição *
        </label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Descreva detalhadamente o problema ou solicitação"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            Prioridade
          </label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => handleInputChange('priority', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium mb-1">
            Departamento
          </label>
          <Select 
            value={formData.department} 
            onValueChange={(value) => handleInputChange('department', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TI">TI</SelectItem>
              <SelectItem value="RH">RH</SelectItem>
              <SelectItem value="Financeiro">Financeiro</SelectItem>
              <SelectItem value="Comercial">Comercial</SelectItem>
              <SelectItem value="Administrativo">Administrativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Criando...' : 'Criar Ticket'}
      </Button>
    </form>
  )
}

export default CreateTicketForm
```

## 🔄 Exemplo 4: Criação de Ticket com RPC (Função Personalizada)

```typescript
// Usando a função SQL personalizada create_ticket()
export const createTicketWithRPC = async (
  subject: string,
  description: string,
  priority: string = 'medium',
  department: string = 'TI'
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    // Chamar função SQL personalizada
    const { data, error } = await supabase.rpc('create_ticket', {
      p_subject: subject,
      p_description: description,
      p_priority: priority,
      p_department: department,
      p_customer_id: user.id
    })

    if (error) throw error

    console.log('✅ Ticket criado via RPC:', data)
    return { ticketId: data, error: null }

  } catch (error) {
    console.error('Erro ao criar ticket via RPC:', error)
    return { ticketId: null, error: error.message }
  }
}
```

## 📊 Exemplo 5: Buscar Tickets do Usuário

```typescript
export const fetchUserTickets = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:profiles!tickets_customer_id_fkey(name, user_id),
        assignee:profiles!tickets_assignee_id_fkey(name, user_id),
        ticket_updates(*)
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }

  } catch (error) {
    console.error('Erro ao buscar tickets:', error)
    return { data: null, error: error.message }
  }
}
```

## 🎯 Exemplo 6: Hook Completo para Gerenciamento de Tickets

```typescript
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  customer?: { name: string; user_id: string }
  assignee?: { name: string; user_id: string }
}

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar tickets
  const fetchTickets = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customer:profiles!tickets_customer_id_fkey(name, user_id),
          assignee:profiles!tickets_assignee_id_fkey(name, user_id)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTickets(data || [])

    } catch (err) {
      setError(err.message)
      console.error('Erro ao buscar tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  // Criar ticket
  const createTicket = async (ticketData: {
    subject: string
    description: string
    priority: string
    department: string
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          ...ticketData,
          customer_id: user.id,
          status: 'open'
        })
        .select(`
          *,
          customer:profiles!tickets_customer_id_fkey(name, user_id),
          assignee:profiles!tickets_assignee_id_fkey(name, user_id)
        `)
        .single()

      if (error) throw error

      // Atualizar lista local
      setTickets(prev => [data, ...prev])
      
      return { data, error: null }

    } catch (err) {
      console.error('Erro ao criar ticket:', err)
      return { data: null, error: err.message }
    }
  }

  // Carregar tickets na inicialização
  useEffect(() => {
    fetchTickets()
  }, [])

  return {
    tickets,
    loading,
    error,
    fetchTickets,
    createTicket
  }
}
```

## 🚀 Como Usar nos Componentes

```tsx
import { useTickets } from './hooks/useTickets'

const MyTicketsPage = () => {
  const { tickets, loading, error, createTicket } = useTickets()

  const handleCreateTicket = async () => {
    const result = await createTicket({
      subject: 'Novo Ticket',
      description: 'Descrição do problema',
      priority: 'medium',
      department: 'TI'
    })

    if (result.data) {
      console.log('Ticket criado:', result.data)
    }
  }

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div>
      <button onClick={handleCreateTicket}>
        Criar Ticket
      </button>
      
      <div>
        {tickets.map(ticket => (
          <div key={ticket.id}>
            <h3>{ticket.subject}</h3>
            <p>Status: {ticket.status}</p>
            <p>Prioridade: {ticket.priority}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 📝 Notas Importantes

1. **Autenticação**: Todos os exemplos assumem que o usuário está autenticado
2. **Validação**: Implemente validação adequada nos formulários
3. **Tratamento de Erro**: Sempre trate erros adequadamente
4. **Loading States**: Use estados de loading para melhor UX
5. **RLS**: As políticas RLS do Supabase controlam o acesso aos dados
6. **Triggers**: O número do ticket é gerado automaticamente por trigger SQL

## 🔗 Links Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [TypeScript Types](https://supabase.com/docs/guides/api/generating-types) 