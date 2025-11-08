import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayCircle, StopCircle, Loader2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface BotStatus {
  isRunning: boolean;
  currentLevel: number;
  gems: number;
  cashBalance: number;
  levelsCompleted: number;
  totalEarned: number;
  hasEnergy: boolean;
  waitingForEnergy: boolean;
  energyRechargeTime?: number;
}

export default function Home() {
  const [authorization, setAuthorization] = useState('');
  const [accountId, setAccountId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [gaid, setGaid] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<BotStatus>({
    isRunning: false,
    currentLevel: 0,
    gems: 0,
    cashBalance: 0,
    levelsCompleted: 0,
    totalEarned: 0,
    hasEnergy: true,
    waitingForEnergy: false,
  });

  const socketRef = useRef<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    // Conectar ao Socket.IO com reconexão automática
    const socket = io(window.location.origin, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado ao servidor Socket.IO');
      setIsConnected(true);
      setReconnectAttempts(0);
      if (logs.length > 0) {
        addLog('✓ Reconectado ao servidor');
      } else {
        addLog('✓ Conectado ao servidor');
      }
    });

    socket.on('log', (message: string) => {
      addLog(message);
    });

    socket.on('bot-started', () => {
      setIsRunning(true);
      addLog('✓ Bot iniciado com sucesso');
    });

    socket.on('bot-stopped', () => {
      setIsRunning(false);
      addLog('✓ Bot parado');
    });

    socket.on('status', (newStatus: BotStatus) => {
      setStatus(newStatus);
    });

    socket.on('disconnect', (reason) => {
      console.log('Desconectado do servidor Socket.IO:', reason);
      setIsConnected(false);
      addLog('✗ Desconectado do servidor');
      if (reason === 'io server disconnect') {
        // Servidor desconectou, tentar reconectar manualmente
        socket.connect();
      }
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('Tentativa de reconexão:', attempt);
      setReconnectAttempts(attempt);
      addLog(`⟳ Tentando reconectar... (tentativa ${attempt})`);
    });

    socket.on('reconnect', (attempt) => {
      console.log('Reconectado após', attempt, 'tentativas');
      addLog(`✓ Reconectado com sucesso após ${attempt} tentativa(s)`);
      setReconnectAttempts(0);
    });

    socket.on('reconnect_error', (error) => {
      console.error('Erro ao reconectar:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Falha ao reconectar');
      addLog('✗ Falha ao reconectar. Verifique sua conexão.');
    });

    // Solicitar status a cada 2 segundos
    const statusInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('get-status');
      }
    }, 2000);

    return () => {
      clearInterval(statusInterval);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll para o final dos logs
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const handleStart = () => {
    if (!authorization || !accountId || !deviceId || !gaid) {
      addLog('[ERRO] Preencha todos os campos de credenciais');
      return;
    }

    if (!socketRef.current) {
      addLog('[ERRO] Socket não conectado');
      return;
    }

    socketRef.current.emit('start-bot', {
      authorization,
      accountId,
      deviceId,
      gaid,
    });

    addLog('Iniciando bot...');
  };

  const handleStop = () => {
    if (!socketRef.current) {
      addLog('[ERRO] Socket não conectado');
      return;
    }

    socketRef.current.emit('stop-bot');
    addLog('Parando bot...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Header com Créditos */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6">
            <img src="/logo.jpeg" alt="Logo" className="w-16 h-16 rounded-full" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 text-2xl font-bold">
                <span className="text-purple-400">MadagascarMods</span>
                <span className="text-white">&</span>
                <span className="text-blue-400">ABSOLUT1FF</span>
              </div>
              <p className="text-center text-gray-400 text-sm mt-1">Ball Sort Bot - Web Interface</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Controle */}
          <div className="space-y-6">
            {/* Status de Conexão */}
            {!isConnected && (
              <Card className="bg-yellow-900/40 backdrop-blur-sm border-yellow-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
                    <div>
                      <p className="text-yellow-400 font-bold">
                        {reconnectAttempts > 0
                          ? `Reconectando... (tentativa ${reconnectAttempts})`
                          : 'Conectando ao servidor...'}
                      </p>
                      <p className="text-yellow-300 text-sm">
                        Aguarde enquanto restabelecemos a conexão
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Credenciais */}
            <Card className="bg-black/40 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Credenciais</CardTitle>
                <CardDescription className="text-gray-400">
                  Insira suas credenciais do Ball Sort
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="authorization" className="text-white">
                    Authorization (Bearer Token)
                  </Label>
                  <Input
                    id="authorization"
                    type="text"
                    placeholder="Bear eyJhbGc..."
                    value={authorization}
                    onChange={e => setAuthorization(e.target.value)}
                    disabled={isRunning}
                    className="bg-black/50 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountId" className="text-white">
                    Account ID
                  </Label>
                  <Input
                    id="accountId"
                    type="text"
                    placeholder="5078220"
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    disabled={isRunning}
                    className="bg-black/50 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceId" className="text-white">
                    Device ID
                  </Label>
                  <Input
                    id="deviceId"
                    type="text"
                    placeholder="150ed128-57e8-4436-9b86-75fe13b64baf"
                    value={deviceId}
                    onChange={e => setDeviceId(e.target.value)}
                    disabled={isRunning}
                    className="bg-black/50 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gaid" className="text-white">
                    GAID (Google Advertising ID)
                  </Label>
                  <Input
                    id="gaid"
                    type="text"
                    placeholder="a1fb1e73-3822-4651-a618-a03fc875b2c4"
                    value={gaid}
                    onChange={e => setGaid(e.target.value)}
                    disabled={isRunning}
                    className="bg-black/50 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleStart}
                    disabled={isRunning}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rodando...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Iniciar Bot
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleStop}
                    disabled={!isRunning}
                    variant="destructive"
                    className="flex-1"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Parar Bot
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card className="bg-black/40 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Nível Atual</p>
                    <p className="text-white text-2xl font-bold">{status.currentLevel}</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Níveis Completados</p>
                    <p className="text-white text-2xl font-bold">{status.levelsCompleted}</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Gems</p>
                    <p className="text-white text-2xl font-bold">${status.gems}</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Total Ganho</p>
                    <p className="text-white text-2xl font-bold">{status.totalEarned}</p>
                  </div>
                  <div className="col-span-2 bg-black/30 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Status de Energia</p>
                    <div className="flex items-center gap-2 mt-2">
                      {status.waitingForEnergy ? (
                        <>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                          <p className="text-yellow-400 font-bold">
                            Aguardando recarga...
                            {status.energyRechargeTime && (
                              <span className="text-sm ml-2">
                                ({Math.max(0, Math.ceil((status.energyRechargeTime - Date.now()) / 60000))}min restantes)
                              </span>
                            )}
                          </p>
                        </>
                      ) : status.hasEnergy ? (
                        <>
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          <p className="text-green-400 font-bold">Energia disponível</p>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-red-500 rounded-full" />
                          <p className="text-red-400 font-bold">Sem energia</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Console de Logs */}
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 lg:row-span-2">
            <CardHeader>
              <CardTitle className="text-white">Console de Logs</CardTitle>
              <CardDescription className="text-gray-400">
                Acompanhe a execução do bot em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full rounded-md bg-black/50 p-4">
                <div className="font-mono text-sm space-y-1">
                  {logs.length === 0 ? (
                    <p className="text-gray-500">Aguardando início do bot...</p>
                  ) : (
                    logs.map((log, index) => (
                      <div
                        key={index}
                        className={`${
                          log.includes('[ERRO]')
                            ? 'text-red-400'
                            : log.includes('✓')
                            ? 'text-green-400'
                            : log.includes('Level:')
                            ? 'text-blue-300'
                            : 'text-gray-300'
                        }`}
                      >
                        {log}
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
