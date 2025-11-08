import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { BallSortBot, BotCredentials } from './ballsort-bot';

let io: SocketIOServer | null = null;
const activeBots = new Map<string, BallSortBot>();

export function initializeSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io/',
  });

  io.on('connection', socket => {
    console.log('[Socket.IO] Cliente conectado:', socket.id);

    socket.on('start-bot', async (credentials: BotCredentials) => {
      console.log('[Socket.IO] Iniciando bot para:', socket.id);

      // Parar bot anterior se existir
      const existingBot = activeBots.get(socket.id);
      if (existingBot) {
        existingBot.stop();
        activeBots.delete(socket.id);
      }

      // Criar novo bot
      const bot = new BallSortBot(credentials, message => {
        socket.emit('log', message);
      });

      activeBots.set(socket.id, bot);

      // Iniciar bot em background
      bot.start().catch(error => {
        console.error('[Socket.IO] Erro ao executar bot:', error);
        socket.emit('log', `[ERRO] ${error.message}`);
        socket.emit('bot-stopped');
      });

      socket.emit('bot-started');
    });

    socket.on('stop-bot', () => {
      console.log('[Socket.IO] Parando bot para:', socket.id);
      const bot = activeBots.get(socket.id);
      if (bot) {
        bot.stop();
        activeBots.delete(socket.id);
        socket.emit('bot-stopped');
      }
    });

    socket.on('get-status', () => {
      const bot = activeBots.get(socket.id);
      if (bot) {
        socket.emit('status', bot.getStatus());
      } else {
        socket.emit('status', {
          isRunning: false,
          currentLevel: 0,
          gems: 0,
          cashBalance: 0,
          levelsCompleted: 0,
          totalEarned: 0,
          hasEnergy: true,
          waitingForEnergy: false,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Cliente desconectado:', socket.id);
      const bot = activeBots.get(socket.id);
      if (bot) {
        bot.stop();
        activeBots.delete(socket.id);
      }
    });
  });

  console.log('[Socket.IO] Servidor inicializado');
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO não foi inicializado');
  }
  return io;
}
