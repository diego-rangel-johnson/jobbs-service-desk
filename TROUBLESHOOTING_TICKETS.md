# 🔧 Troubleshooting - Problemas na Criação de Tickets

## 🚨 Problemas Reportados

### 1. **Erro: "Could not find a relationship between 'tickets' and 'profiles'"**

**Descrição:** Erro 400 ao tentar criar tickets com mensagem sobre foreign keys não encontradas.

**Causa:** As foreign keys entre as tabelas `tickets` e `profiles` não estão configuradas corretamente no Supabase.

**Soluções:**

#### ✅ **Solução Rápida (Implementada)**
O código foi modificado para não fazer joins desnecessários durante a criação de tickets.

#### 🛠️ **Verificação Manual**

1. **Abra o arquivo de teste:**
   ```
   http://localhost:8081/teste-supabase.html
   ```

2. **Teste a criação simples:**
   - Clique em "🎫 Criar Ticket Simples"
   - Verifique se aparece sucesso ou erro

3. **Verificar no Console do Navegador:**
   ```javascript
   // Abra F12 > Console e execute:
   console.log('Logs de debug aparecerão aqui');
   ```

#### 🗄️ **Verificar Banco de Dados**

Execute no **SQL Editor do Supabase**:

```sql
-- Verificar se a tabela tickets existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'tickets';

-- Verificar se a tabela profiles existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Verificar foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'tickets';
```

### 2. **Warning: Missing Description for DialogContent**

**Solução:** ✅ **Corrigido**
- Adicionado `DialogDescription` em todos os dialogs
- Warning não deve mais aparecer

### 3. **Problemas de Storage/Upload**

#### 🔍 **Verificar Storage**

1. **Teste automático:**
   ```
   http://localhost:8081/teste-supabase.html
   ```
   - Clique em "📎 Testar Storage"

2. **Verificar manualmente no Supabase Dashboard:**
   - Storage > Buckets
   - Deve existir: `ticket-attachments` (privado)

#### 🛠️ **Criar Bucket Manualmente**

Se o bucket não existir:

```sql
-- No SQL Editor do Supabase
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ticket-attachments', 'ticket-attachments', false);
```

## 🧪 **Passos de Debug**

### **Passo 1: Verificar Autenticação**
```javascript
// No console do navegador (F12)
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

### **Passo 2: Teste de Inserção Simples**
```javascript
// Teste direto no console
const { data, error } = await supabase
  .from('tickets')
  .insert({
    subject: 'Teste Manual',
    description: 'Teste via console',
    priority: 'medium',
    department: 'TI',
    customer_id: 'USER_ID_AQUI', // Substitua pelo ID real
    status: 'open'
  })
  .select('*')
  .single();

console.log('Data:', data);
console.log('Error:', error);
```

### **Passo 3: Verificar RLS**
```sql
-- No SQL Editor
-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tickets';

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'tickets';
```

### **Passo 4: Desabilitar RLS Temporariamente (APENAS PARA DEBUG)**
```sql
-- ⚠️ APENAS PARA TESTES - REABILITE DEPOIS
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;

-- Depois de testar, reabilite:
-- ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
```

## 📋 **Checklist de Verificação**

- [ ] ✅ Usuário está autenticado no Supabase
- [ ] ✅ Tabela `tickets` existe no banco
- [ ] ✅ Tabela `profiles` existe no banco
- [ ] ✅ Bucket `ticket-attachments` existe no Storage
- [ ] ✅ Trigger para gerar `ticket_number` está funcionando
- [ ] ✅ RLS está configurado corretamente
- [ ] ✅ Console do navegador não mostra erros de CORS
- [ ] ✅ Credenciais do Supabase estão corretas

## 🆘 **Se Nada Funcionar**

1. **Execute o setup completo novamente:**
   ```sql
   -- Execute todo o arquivo: supabase_setup.sql
   ```

2. **Verifique as credenciais:**
   ```typescript
   // src/integrations/supabase/client.ts
   const SUPABASE_URL = "SUA_URL_AQUI";
   const SUPABASE_PUBLISHABLE_KEY = "SUA_CHAVE_AQUI";
   ```

3. **Recreate o projeto no Supabase:**
   - Se necessário, crie um novo projeto
   - Execute novamente o `supabase_setup.sql`

## 📊 **Logs Úteis**

### **Console do Navegador:**
```javascript
// Habilitar logs detalhados
localStorage.setItem('debug', 'true');

// Ver todos os erros do Supabase
supabase.realtime.setAuth('YOUR_TOKEN');
```

### **No Componente NewTicketForm:**
Os logs agora aparecem automaticamente no console quando você tenta criar um ticket.

## 🎯 **Status das Correções**

- ✅ **Dialog warnings corrigidos**
- ✅ **Queries simplificadas (sem joins problemáticos)**
- ✅ **Logs de debug adicionados**
- ✅ **Storage verification melhorada**
- ✅ **Teste HTML melhorado**

---

**💡 Dica:** Sempre verifique o console do navegador (F12) para logs detalhados durante a criação de tickets. 