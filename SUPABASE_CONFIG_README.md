# Configuração do Supabase - Jobbs Service Desk

## 🎯 Situação Atual

✅ **Este projeto está conectado corretamente ao**: `tjjpwsjrmoisowewebcs`

## 📋 Scripts de Configuração

### Para trabalhar APENAS neste projeto:
```bash
./setup-local-supabase.sh
```
- Aplica configuração local temporariamente
- Força uso do projeto `tjjpwsjrmoisowewebcs`

### Para voltar a usar outros projetos:
```bash
./restore-global-supabase.sh
```
- Restaura configuração global
- Outros projetos voltam a usar `nsbjkxbfkhauitmjnkxh`

## 🔧 Configurações

### Arquivo Local (cursor/mcp.json)
- **Projeto**: `tjjpwsjrmoisowewebcs`
- **Uso**: Apenas para este projeto

### Arquivo Global (~/.cursor/mcp.json)
- **Projeto**: `nsbjkxbfkhauitmjnkxh`
- **Uso**: Todos os outros projetos

## ⚠️ Importante

1. **Sempre execute** `./setup-local-supabase.sh` antes de trabalhar neste projeto
2. **Sempre execute** `./restore-global-supabase.sh` antes de fechar o projeto
3. **Não edite** o arquivo global manualmente

## 🔄 Fluxo de Trabalho

```bash
# Ao abrir este projeto
./setup-local-supabase.sh

# Trabalhar no projeto...

# Ao fechar este projeto
./restore-global-supabase.sh
```

## 📊 Status Atual

- ✅ Projeto correto: `tjjpwsjrmoisowewebcs`
- ✅ Configuração local aplicada
- ✅ Backup da configuração global criado
- ✅ Scripts de gerenciamento criados 