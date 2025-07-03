# 🚀 Setup Completo do Supabase - Jobbs Service Desk

Este guia vai te ajudar a configurar completamente o Supabase para rodar o sistema Jobbs Service Desk.

## 📋 Pré-requisitos

- [ ] Conta no [Supabase](https://supabase.com)
- [ ] Node.js 18+ instalado
- [ ] Projeto Supabase criado

## 🎯 Passo a Passo

### 1. **Configurar o Banco de Dados**

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá para **SQL Editor**
3. Abra o arquivo `supabase_setup.sql` (na raiz do projeto)
4. **Copie e cole todo o conteúdo** no SQL Editor
5. Clique em **RUN** para executar

✅ **Verificação**: Vá para **Table Editor** e confirme que as seguintes tabelas foram criadas:
- `profiles`
- `user_roles` 
- `tickets`
- `ticket_updates`
- `ticket_attachments`

### 2. **Configurar Storage para Anexos**

1. No Supabase Dashboard, vá para **Storage**
2. Clique em **Create bucket**
3. Configure:
   - **Name**: `ticket-attachments`
   - **Public**: ❌ **Desabilitado** (privado)
4. Clique em **Create bucket**

### 3. **Aplicar Políticas de Storage**

1. Volte ao **SQL Editor**
2. Execute o seguinte SQL:

```sql
-- Políticas para storage de anexos
CREATE POLICY "Users can view attachments for their tickets" ON storage.objects FOR SELECT USING (
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

CREATE POLICY "Users can upload attachments" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. **Configurar Autenticação**

1. Vá para **Authentication > Settings**
2. Configure **Site URL**: `http://localhost:8080` (para desenvolvimento)
3. Em **Auth Providers**, certifique-se que **Email** está habilitado
4. **Email Templates**: Customize se desejar (opcional)

### 5. **Obter Credenciais do Projeto**

1. Vá para **Settings > API**
2. Copie:
   - **Project URL** 
   - **anon public key**

### 6. **Configurar o Projeto Local**

1. Abra `src/integrations/supabase/client.ts`
2. Substitua as credenciais:

```typescript
const SUPABASE_URL = "SUA_PROJECT_URL_AQUI";
const SUPABASE_PUBLISHABLE_KEY = "SUA_ANON_KEY_AQUI";
```

### 7. **Instalar Dependências e Executar**

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev
```

### 8. **Criar Primeiro Usuário Admin**

1. Acesse `http://localhost:8080`
2. **Registre uma conta** com seu email
3. No **SQL Editor** do Supabase, execute:

```sql
SELECT public.promote_user_to_admin('seu-email@exemplo.com');
```

4. **Faça logout e login novamente** para aplicar as permissões

## 🔧 Configurações Opcionais

### **Personalizar Email Templates**

1. Vá para **Authentication > Email Templates**
2. Personalize:
   - **Confirm signup**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**

### **Configurar RLS Policies Customizadas**

Se precisar ajustar as políticas de segurança, edite no **SQL Editor**.

### **Backup e Restore**

1. **Backup**: Use `pg_dump` ou o dashboard do Supabase
2. **Restore**: Use `psql` ou SQL Editor

## 🚨 Troubleshooting

### **Erro: "permission denied for schema public"**
- Execute o SQL como **superuser** no SQL Editor
- Verifique se está logado com as credenciais corretas

### **Erro: "relation does not exist"**
- Confirme que todas as tabelas foram criadas
- Execute novamente o `supabase_setup.sql`

### **Erro: "RLS policy violation"**
- Verifique se o usuário tem as roles corretas
- Execute `promote_user_to_admin` novamente

### **Upload de arquivos não funciona**
- Verifique se o bucket `ticket-attachments` foi criado
- Confirme que as políticas de storage foram aplicadas

## 📊 Estrutura do Banco

### **Tabelas Principais:**

```
profiles          → Perfis dos usuários
user_roles        → Roles (admin/support/user)  
tickets           → Tickets do sistema
ticket_updates    → Comentários/atualizações
ticket_attachments → Anexos dos tickets
```

### **Enums:**
- `app_role`: admin, support, user
- `ticket_status`: open, in_progress, resolved, closed  
- `ticket_priority`: low, medium, high, urgent

### **Funções Importantes:**
- `promote_user_to_admin()` - Promove usuário para admin
- `generate_ticket_number()` - Gera números TK-001, TK-002...
- `has_role()` - Verifica se usuário tem determinada role

## ✅ Checklist Final

- [ ] Banco de dados configurado (tabelas criadas)
- [ ] Storage bucket criado e configurado
- [ ] Credenciais atualizadas no código
- [ ] Primeiro usuário admin criado
- [ ] Sistema rodando em `http://localhost:8080`
- [ ] Login funcionando corretamente
- [ ] Criação de tickets funcionando
- [ ] Upload de anexos funcionando

## 🎉 Pronto!

Seu sistema Jobbs Service Desk está configurado e pronto para uso!

### **Próximos Passos:**
1. **Criar usuários de suporte**: Use a função `promote_user_to_admin`
2. **Personalizar departamentos**: Edite os componentes conforme necessário
3. **Configurar notificações**: Integre com serviços de email/SMS
4. **Deploy em produção**: Configure domínio e SSL

---

**📧 Suporte**: Se encontrar problemas, verifique os logs no console do navegador e no Supabase Dashboard. 