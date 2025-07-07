#!/bin/bash

# Script para reverter configuração global do Supabase
# Restaura a configuração para outros projetos

echo "🔄 Revertendo configuração global do Supabase"
echo "📍 Restaurando projeto: nsbjkxbfkhauitmjnkxh para outros projetos"

# Reverter configuração global
if [ -f ~/.cursor/mcp.json.other_projects ]; then
    mv ~/.cursor/mcp.json.other_projects ~/.cursor/mcp.json
    echo "✅ Configuração global restaurada"
    echo "🎯 Outros projetos usarão: nsbjkxbfkhauitmjnkxh"
else
    echo "❌ Arquivo de backup não encontrado"
fi

echo ""
echo "📋 Status:"
echo "  - Este projeto (Jobbs Service Desk - Real): tjjpwsjrmoisowewebcs"
echo "  - Outros projetos: nsbjkxbfkhauitmjnkxh" 