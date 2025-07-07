#!/bin/bash

# Script para configurar Supabase local apenas para este projeto
# Força o uso da configuração local em vez da global

echo "🔧 Configurando Supabase local para projeto Jobbs Service Desk - Real"
echo "📍 Projeto correto: tjjpwsjrmoisowewebcs"

# Backup da configuração global
if [ -f ~/.cursor/mcp.json ]; then
    cp ~/.cursor/mcp.json ~/.cursor/mcp.json.backup
    echo "✅ Backup da configuração global criado"
fi

# Aplicar configuração local temporariamente
cp cursor/mcp.json ~/.cursor/mcp.json.temp
mv ~/.cursor/mcp.json ~/.cursor/mcp.json.other_projects
mv ~/.cursor/mcp.json.temp ~/.cursor/mcp.json

echo "✅ Configuração local aplicada temporariamente"
echo "🎯 Projeto ativo: tjjpwsjrmoisowewebcs"
echo ""
echo "Para reverter:"
echo "  mv ~/.cursor/mcp.json.other_projects ~/.cursor/mcp.json" 