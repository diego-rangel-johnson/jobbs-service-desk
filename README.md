# 🎫 Jobbs Service Desk

Sistema completo de help desk com funcionalidades modernas de gestão de tickets e anexos de evidências.

## ✨ Funcionalidades Principais

### 🎯 Sistema de Tickets
- ✅ Criação automatizada de tickets com numeração sequencial (TK-001, TK-002...)
- ✅ Diferentes níveis de prioridade (Baixa, Média, Alta, Urgente)
- ✅ Gestão por departamentos (TI, Suporte, RH, Financeiro, etc.)
- ✅ Sistema de status (Aberto, Em Andamento, Resolvido, Fechado)
- ✅ Timeline completa de atualizações

### 📎 Sistema de Anexos de Evidências
- ✅ **Upload de arquivos** direto no Supabase Storage
- ✅ **Tipos suportados**: Imagens (JPG, PNG, GIF), PDF, DOC, DOCX, TXT, XLS, XLSX
- ✅ **Limite de tamanho**: 10MB por arquivo
- ✅ **Download seguro** de anexos
- ✅ **Visualização** com ícones por tipo de arquivo
- ✅ **Informações** de tamanho e data de upload

### 👥 Controle de Acesso
- ✅ **Três níveis de usuário**: Admin, Support, User
- ✅ **Autenticação** completa via Supabase Auth
- ✅ **Row Level Security (RLS)** em todas as tabelas
- ✅ **Permissões específicas** por tipo de usuário

### 📱 Interface Moderna
- ✅ **Design responsivo** para mobile e desktop
- ✅ **Interface drag-and-drop** para anexos
- ✅ **Feedback visual** durante uploads
- ✅ **Toasts de notificação** para todas as ações

## 🚀 Como Usar o Sistema de Anexos

### Para Usuários

#### 1. **Anexar Evidência ao Criar Ticket**
1. Clique em "Novo Ticket"
2. Preencha os campos obrigatórios
3. Na seção "Anexar Evidência", clique na área pontilhada
4. Selecione seu arquivo (máx. 10MB)
5. Visualize o arquivo selecionado com opção de remover
6. Clique em "Criar Ticket"

#### 2. **Visualizar Anexos em Tickets Existentes**
1. Selecione um ticket na lista
2. No painel de detalhes, procure a seção "Anexos"
3. Veja informações do arquivo (nome, tamanho, data)
4. Clique em "Baixar" para fazer download

### Para Desenvolvedores

#### 1. **Estrutura do Banco de Dados**

```sql
-- Tabela de anexos
CREATE TABLE public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 2. **Hook useTickets - Novas Funções**

```typescript
const {
  // Função para upload de arquivos
  uploadFile,
  
  // Criar registro de anexo
  createTicketAttachment,
  
  // Buscar anexos de um ticket
  getTicketAttachments,
  
  // Download de anexo
  downloadAttachment,
  
  // Verificar configuração do storage
  checkStorageConfiguration
} = useTickets();
```

#### 3. **Criar Ticket com Anexo**

```typescript
const createTicketWithAttachment = async () => {
  const result = await createTicket({
    subject: "Problema no sistema",
    description: "Descrição detalhada...",
    priority: "high",
    department: "TI",
    attachment: fileObject // File object do input
  });
};
```

#### 4. **Listar e Baixar Anexos**

```typescript
// Buscar anexos
const { data: attachments } = await getTicketAttachments(ticketId);

// Download de anexo
await downloadAttachment(attachment);
```

## ⚙️ Configuração do Storage

### Bucket Supabase
- **Nome**: `ticket-attachments`
- **Tipo**: Privado (não público)
- **Políticas de RLS**: Configuradas automaticamente
- **Criação**: Automática na primeira execução

### Políticas de Segurança
```sql
-- Usuários podem ver anexos de seus tickets
CREATE POLICY "Users can view attachments for their tickets" 
ON storage.objects FOR SELECT USING (
  bucket_id = 'ticket-attachments' AND
  EXISTS (
    SELECT 1 FROM public.ticket_attachments ta
    JOIN public.tickets t ON ta.ticket_id = t.id
    WHERE ta.file_url = name AND (
      t.customer_id = auth.uid() OR 
      t.assignee_id = auth.uid() OR
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'support')
    )
  )
);
```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Upload**: Supabase Storage com RLS
- **Hooks**: Custom hooks para gestão de estado

## 📋 Tipos de Arquivo Suportados

| Categoria | Extensões | Ícone |
|-----------|-----------|-------|
| **Imagens** | JPG, JPEG, PNG, GIF, WEBP | 🖼️ |
| **Documentos** | PDF, DOC, DOCX | 📄 |
| **Planilhas** | XLS, XLSX, CSV | 📊 |
| **Texto** | TXT, MD | 📝 |
| **Outros** | Qualquer tipo | 📁 |

## 🔧 Configuração de Desenvolvimento

### 1. Configurar Supabase
```bash
# Execute o SQL de configuração
# Arquivo: supabase_setup.sql
```

### 2. Configurar Variáveis
```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = "sua-url-aqui";
const SUPABASE_PUBLISHABLE_KEY = "sua-chave-aqui";
```

### 3. Executar o Projeto
```bash
npm install
npm run dev
```

## 🧪 Teste do Sistema de Anexos

### Verificação Automática
- O sistema verifica automaticamente se o bucket existe
- Cria o bucket se necessário
- Testa upload e download

### Teste Manual
1. Crie um ticket com anexo
2. Verifique se aparece na lista de anexos
3. Teste o download
4. Verifique os logs do console

## 📊 Estatísticas de Uso

- **Limite por arquivo**: 10MB
- **Tipos suportados**: 8+ formatos
- **Storage**: Supabase (ilimitado no plano Pro)
- **Segurança**: RLS + Políticas customizadas

## 🎯 Próximas Funcionalidades

- [ ] Preview de imagens inline
- [ ] Compressão automática de imagens
- [ ] Upload múltiplo de arquivos
- [ ] Histórico de versões de anexos
- [ ] Integração com antivírus
- [ ] Assinatura digital de documentos

---

## 📞 Suporte

Para dúvidas sobre o sistema de anexos ou qualquer outra funcionalidade, consulte:
- Documentação do Supabase Storage
- Logs do navegador (F12 > Console)
- Arquivo de configuração `supabase_setup.sql`

**Sistema atualizado em**: Janeiro 2025
**Versão dos anexos**: 1.0.0
