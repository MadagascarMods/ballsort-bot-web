# Deploy no Render.com

Este guia explica como fazer deploy do Ball Sort Bot Web no Render.com.

## Pré-requisitos

1. Conta no [Render.com](https://render.com)
2. Repositório Git com o código do projeto (GitHub, GitLab ou Bitbucket)

## Opção 1: Deploy Automático (Recomendado)

### Passo 1: Preparar Repositório

1. Crie um repositório Git (GitHub, GitLab, etc.)
2. Faça push de todos os arquivos do projeto:

```bash
git init
git add .
git commit -m "Initial commit - Ball Sort Bot Web"
git remote add origin <URL_DO_SEU_REPOSITORIO>
git push -u origin main
```

### Passo 2: Conectar ao Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório Git
4. Selecione o repositório do Ball Sort Bot

### Passo 3: Configurar o Serviço

O Render detectará automaticamente o `render.yaml` e configurará:

- **Name**: ballsort-bot-web
- **Environment**: Docker
- **Plan**: Free
- **Port**: 3000

Clique em **"Create Web Service"**

### Passo 4: Aguardar Deploy

O Render irá:
1. Clonar o repositório
2. Construir a imagem Docker
3. Fazer deploy da aplicação

Isso pode levar 5-10 minutos na primeira vez.

### Passo 5: Acessar a Aplicação

Após o deploy, você receberá uma URL como:
```
https://ballsort-bot-web.onrender.com
```

## Opção 2: Deploy Manual via Dockerfile

Se preferir configurar manualmente:

### Passo 1: Criar Web Service

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório

### Passo 2: Configurações

- **Name**: `ballsort-bot-web`
- **Environment**: `Docker`
- **Dockerfile Path**: `./Dockerfile`
- **Docker Build Context Directory**: `.`
- **Plan**: `Free`

### Passo 3: Variáveis de Ambiente (Opcional)

Se necessário, adicione variáveis de ambiente em **"Environment"**:

- `NODE_ENV`: `production`
- `PORT`: `3000`

### Passo 4: Deploy

Clique em **"Create Web Service"** e aguarde o build.

## Estrutura de Arquivos Necessários

Certifique-se de que estes arquivos estão no repositório:

```
ballsort-bot-web/
├── Dockerfile              # Configuração Docker
├── render.yaml            # Configuração automática Render
├── package.json           # Dependências Node.js
├── pnpm-lock.yaml        # Lock file do pnpm
├── client/               # Frontend React
├── server/               # Backend Node.js
├── drizzle/              # Database schema
└── shared/               # Código compartilhado
```

## Verificação de Funcionamento

Após o deploy, teste:

1. **Acesse a URL fornecida pelo Render**
2. **Verifique se a interface carrega**
3. **Teste o bot com suas credenciais**
4. **Monitore os logs no dashboard do Render**

## Logs e Monitoramento

Para ver os logs da aplicação:

1. Acesse o dashboard do Render
2. Clique no seu serviço "ballsort-bot-web"
3. Vá para a aba **"Logs"**

## Troubleshooting

### Build Falha

Se o build falhar:

1. Verifique os logs de build no Render
2. Certifique-se de que todos os arquivos estão commitados
3. Teste o build localmente:

```bash
docker build -t ballsort-bot-web .
docker run -p 3000:3000 ballsort-bot-web
```

### Aplicação Não Inicia

1. Verifique se a porta 3000 está exposta no Dockerfile
2. Confirme que o comando de start está correto
3. Verifique os logs de runtime no Render

### WebSocket Não Conecta

1. Certifique-se de usar `wss://` para HTTPS
2. Verifique se o Socket.IO está configurado corretamente
3. Teste a conexão com ferramentas de debug

## Atualizações

Para atualizar a aplicação:

1. Faça commit das mudanças no repositório
2. Push para o branch principal
3. O Render fará deploy automático

Ou force um redeploy manual:

1. Acesse o dashboard do Render
2. Clique em **"Manual Deploy"** → **"Deploy latest commit"**

## Limitações do Plano Free

O plano gratuito do Render tem algumas limitações:

- **Sleep após inatividade**: Aplicação hiberna após 15 minutos sem uso
- **750 horas/mês**: Tempo de execução limitado
- **Build time**: Builds podem ser mais lentos
- **Bandwidth**: 100 GB/mês

Para uso contínuo, considere upgrade para plano pago.

## Custos

- **Free Plan**: $0/mês (com limitações)
- **Starter Plan**: $7/mês (sem hibernação)
- **Standard Plan**: $25/mês (mais recursos)

## Suporte

Para problemas com o Render:
- [Documentação Oficial](https://render.com/docs)
- [Community Forum](https://community.render.com)
- [Status Page](https://status.render.com)

## Alternativas ao Render

Se preferir outras plataformas:

- **Railway.app**: Similar ao Render, deploy fácil
- **Fly.io**: Boa performance global
- **Heroku**: Tradicional, mas mais caro
- **DigitalOcean App Platform**: Mais controle
- **Vercel**: Melhor para frontend (requer adaptações)

## Segurança

**IMPORTANTE**: Nunca commite credenciais no repositório!

- Use variáveis de ambiente para dados sensíveis
- Adicione `.env` no `.gitignore`
- Configure secrets no dashboard do Render

## Próximos Passos

Após o deploy bem-sucedido:

1. Configure um domínio customizado (opcional)
2. Configure SSL/HTTPS (automático no Render)
3. Monitore uso e performance
4. Configure alertas de downtime

---

**Criado por**: MadagascarMods & ABSOLUT1FF
