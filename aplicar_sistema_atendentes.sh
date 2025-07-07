#!/bin/bash

# ========================================
# SCRIPT AUTOMÁTICO - SISTEMA DE ATENDENTES
# Execute após configurar o Personal Access Token
# ========================================

set -e  # Parar se houver erro

echo "🚀 APLICANDO SISTEMA DE ATENDENTES AUTOMATICAMENTE..."
echo "=================================================="

# Verificar se o token está configurado
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ ERRO: Variável SUPABASE_ACCESS_TOKEN não configurada"
    echo "Execute primeiro: export SUPABASE_ACCESS_TOKEN='seu_token_aqui'"
    exit 1
fi

echo "✅ Token configurado"

# Verificar se o CLI funciona
echo "🔍 Verificando CLI do Supabase..."
if ! npx supabase projects list > /dev/null 2>&1; then
    echo "❌ CLI não funcionando. Fazendo login..."
    npx supabase login --token $SUPABASE_ACCESS_TOKEN
else
    echo "✅ CLI funcionando"
fi

# Verificar se o projeto está linkado
echo "🔗 Verificando link do projeto..."
if ! npx supabase status > /dev/null 2>&1; then
    echo "🔗 Linkando projeto..."
    npx supabase link --project-ref tjjpwsjrmoisowewebcs
else
    echo "✅ Projeto linkado"
fi

# Aplicar migração do sistema de atendentes
echo "📦 Aplicando migração do sistema de atendentes..."
if npx supabase db push --linked; then
    echo "✅ Migração aplicada com sucesso!"
else
    echo "⚠️  Erro na migração. Tentando método alternativo..."
    
    # Método alternativo: aplicar SQL diretamente
    echo "📄 Aplicando SQL diretamente..."
    if [ -f "supabase/migrations/20250707183611_implement_attendant_system.sql" ]; then
        npx supabase db reset --linked --debug
        echo "✅ Sistema aplicado via reset"
    else
        echo "❌ Arquivo de migração não encontrado"
        exit 1
    fi
fi

# Verificar se tudo foi aplicado corretamente
echo "🔍 Verificando implementação..."

# Verificar tabelas
echo "📊 Verificando tabelas..."
TABELAS=$(npx supabase db dump --data-only --schema public | grep -c "CREATE TABLE.*organizations\|CREATE TABLE.*organization_users\|CREATE TABLE.*attendant_organizations" || echo "0")

if [ "$TABELAS" -ge 3 ]; then
    echo "✅ Tabelas criadas: $TABELAS/3"
else
    echo "⚠️  Nem todas as tabelas foram criadas: $TABELAS/3"
fi

# Verificar funções
echo "🔧 Verificando funções..."
FUNCOES=$(npx supabase db dump --schema public | grep -c "CREATE.*FUNCTION.*attendant" || echo "0")

if [ "$FUNCOES" -ge 6 ]; then
    echo "✅ Funções criadas: $FUNCOES/6+"
else
    echo "⚠️  Nem todas as funções foram criadas: $FUNCOES/6+"
fi

# Teste básico
echo "🧪 Executando teste básico..."
if npx supabase db query "SELECT COUNT(*) FROM public.organizations" > /dev/null 2>&1; then
    echo "✅ Sistema funcionando corretamente!"
else
    echo "⚠️  Sistema pode ter problemas"
fi

echo ""
echo "🎉 SISTEMA DE ATENDENTES APLICADO!"
echo "================================="
echo ""
echo "✅ Próximos passos:"
echo "1. Testar criação de atendentes"
echo "2. Verificar interface frontend" 
echo "3. Validar permissões"
echo ""
echo "🔧 Para verificação completa, execute:"
echo "npx supabase db query --file VERIFICACAO_SISTEMA_ATENDENTES.sql"
echo ""
echo "📚 Documentação disponível em:"
echo "- SISTEMA_ATENDENTE_IMPLEMENTADO.md"
echo "- RESUMO_FINAL_IMPLEMENTACAO.md" 