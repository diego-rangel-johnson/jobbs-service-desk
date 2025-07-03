# 🚀 Deploy no Vercel - Instruções Completas

## ✅ Preparação Concluída

O projeto já está configurado com:
- ✅ Variáveis de ambiente configuradas
- ✅ Arquivo `vercel.json` criado
- ✅ Build testado e funcionando
- ✅ `.gitignore` configurado

## 📋 Opções de Deploy

### Opção 1: Deploy via CLI (Recomendado)

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Fazer login:**
   ```bash
   vercel login
   ```

3. **Deploy do projeto:**
   ```bash
   vercel
   ```

4. **Configurar variáveis de ambiente no Vercel:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```
   
   **Valores das variáveis:**
   - `VITE_SUPABASE_URL`: `https://tjjpwsjrmoisowewebcs.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqanB3c2pybW9pc293ZXdlYmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0OTA5MTMsImV4cCI6MjA2NzA2NjkxM30.hcBhJ96I5WGmacQswHkb5O-3wymLo50QQ1zPLnTbsI8`

5. **Deploy final:**
   ```bash
   vercel --prod
   ```

### Opção 2: Deploy via Interface Web

1. **Acesse:** https://vercel.com
2. **Faça login** com sua conta
3. **Clique em "New Project"**
4. **Conecte seu repositório Git**:
   - Se o projeto não estiver no Git, você precisa primeiro:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin <sua-url-do-repositorio>
     git push -u origin main
     ```

5. **Configure as variáveis de ambiente:**
   - `VITE_SUPABASE_URL`: `https://tjjpwsjrmoisowewebcs.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqanB3c2pybW9pc293ZXdlYmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0OTA5MTMsImV4cCI6MjA2NzA2NjkxM30.hcBhJ96I5WGmacQswHkb5O-3wymLo50QQ1zPLnTbsI8`

6. **Clique em "Deploy"**

## 🔧 Configurações do Supabase para Produção

Após o deploy, você pode precisar configurar no Supabase:

1. **Site URLs Permitidas:**
   - Vá em: Authentication → URL Configuration
   - Adicione seu domínio do Vercel: `https://seu-projeto.vercel.app`

2. **Redirect URLs:**
   - Adicione: `https://seu-projeto.vercel.app/dashboard`

## 🔍 Verificações Pós-Deploy

- ✅ Site carregando corretamente
- ✅ Login funcionando
- ✅ Criação de tickets funcionando
- ✅ Interface admin funcionando

## 🆘 Troubleshooting

Se houver problemas:

1. **Verificar logs do Vercel:**
   ```bash
   vercel logs
   ```

2. **Verificar variáveis de ambiente:**
   ```bash
   vercel env ls
   ```

3. **Redeploy se necessário:**
   ```bash
   vercel --prod
   ``` 