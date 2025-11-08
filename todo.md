# Ball Sort Bot - Web Interface TODO

## Backend Features
- [x] Criar classe BallSortBot no backend
- [x] Implementar endpoints tRPC para controle do bot
- [x] Configurar Socket.IO para logs em tempo real
- [x] Adicionar endpoint para iniciar bot
- [x] Adicionar endpoint para parar bot
- [x] Adicionar endpoint para obter status do bot
- [x] Implementar auto-detecção de nível

## Frontend Features
- [x] Criar página principal com formulário de credenciais
- [x] Adicionar campos: AUTHORIZATION, ACCOUNT_ID, DEVICE_ID, GAID
- [x] Implementar visualização de logs em tempo real
- [x] Adicionar botões Start/Stop
- [x] Mostrar estatísticas do bot (níveis completados, gems, etc)
- [x] Adicionar créditos dos criadores no topo (MadagascarMods em roxo, ABSOLUT1FF em azul)

## Estilização
- [x] Design moderno e responsivo
- [x] Tema escuro
- [x] Animações suaves
- [x] Console de logs estilizado

## Deploy
- [x] Criar Dockerfile
- [x] Criar arquivo render.yaml
- [x] Documentar processo de deploy
- [x] Testar build Docker

## Sistema de Energia
- [x] Implementar detecção de falta de energia
- [x] Adicionar sistema de espera automática (6 minutos)
- [x] Mostrar status de energia no frontend
- [x] Exibir contador de tempo de recarga
## Logo
- [x] Adicionar logo customizada no topo do site

## GitHub
- [x] Criar repositório no GitHub
- [x] Fazer push do código

## Correções
- [x] Corrigir Dockerfile para incluir pasta patches
- [x] Corrigir comando de start no Dockerfile
- [x] Corrigir comando de start para usar servidor Node.js direto
- [x] Adicionar tsconfig.json ao container de produção
- [x] Adicionar vite.config.ts ao container de produção
- [x] Criar servidor de produção sem dependência do Vite
