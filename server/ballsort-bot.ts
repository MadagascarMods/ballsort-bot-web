import axios from 'axios';

export interface BotCredentials {
  authorization: string;
  accountId: string;
  deviceId: string;
  gaid: string;
}

export interface BotStatus {
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

export type LogCallback = (message: string) => void;

export class BallSortBot {
  private baseUrl = 'https://api-ballsort.gobuzzbreak.com';
  private credentials: BotCredentials;
  private isRunning = false;
  private currentLevel = 1;
  private gems = 0;
  private cashBalance = 0;
  private levelsCompleted = 0;
  private totalEarned = 0;
  private batchId: string | null = null;
  private logCallback: LogCallback | null = null;
  private stopRequested = false;
  private hasEnergy = true;
  private waitingForEnergy = false;
  private energyRechargeTime: number | null = null;
  private consecutiveFailures = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private readonly ENERGY_WAIT_MINUTES = 6;

  constructor(credentials: BotCredentials, logCallback?: LogCallback) {
    this.credentials = credentials;
    this.logCallback = logCallback || null;
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    if (this.logCallback) {
      this.logCallback(logMessage);
    }
  }

  private getHeaders() {
    return {
      'Accept-Encoding': 'identity',
      'ballsort-account-id': this.credentials.accountId,
      'authorization': this.credentials.authorization,
      'ballsort-app-version': '28',
      'gaid': this.credentials.gaid,
      'ballsort-device-id': this.credentials.deviceId,
      'content-type': 'application/json',
      'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9; SM-G960N Build/PQ3A.190605.07021633)',
      'Host': 'api-ballsort.gobuzzbreak.com',
      'Connection': 'Keep-Alive',
    };
  }

  private async makeRequest(method: string, endpoint: string, params?: any, data?: any) {
    try {
      const config: any = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: this.getHeaders(),
        timeout: 30000,
      };

      if (params) config.params = params;
      if (data) config.data = data;

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      return { code: -1, error: error.message };
    }
  }

  private checkEnergyFromResponse(response: any): boolean {
    if (response.code === -1) {
      const errorMsg = (response.error || '').toLowerCase();
      if (errorMsg.includes('energy') || errorMsg.includes('energia')) {
        this.log('[ENERGIA] Sem energia detectada no erro');
        return false;
      }
    }

    if (response.code !== 0) {
      return false;
    }

    return true;
  }

  private async waitForEnergy() {
    this.waitingForEnergy = true;
    this.hasEnergy = false;
    const waitMinutes = this.ENERGY_WAIT_MINUTES;
    
    this.log('='.repeat(60));
    this.log('[ENERGIA] Sem energia disponível!');
    this.log(`[ENERGIA] Aguardando ${waitMinutes} minutos para recarga...`);
    this.log('='.repeat(60));

    const totalSeconds = waitMinutes * 60;
    this.energyRechargeTime = Date.now() + (totalSeconds * 1000);

    for (let i = 0; i < totalSeconds; i += 30) {
      if (this.stopRequested) break;
      
      const remaining = totalSeconds - i;
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      this.log(`[ENERGIA] Tempo restante: ${mins}m ${secs}s`);
      
      await this.sleep(30000);
    }

    this.log('[ENERGIA] Tentando retomar...');
    this.waitingForEnergy = false;
    this.hasEnergy = true;
    this.energyRechargeTime = null;
  }

  async detectCurrentLevel(): Promise<number> {
    this.log('Detectando nível atual da conta...');
    const result = await this.makeRequest('GET', '/gem/cache-game-level', {
      level: 1,
      cache_count: 1,
    });

    if (result.code === 0 && result.data) {
      const detectedLevel = result.data[0].id;
      this.log(`✓ Nível detectado: ${detectedLevel}`);
      return detectedLevel;
    }

    this.log('⚠ Não foi possível detectar o nível, iniciando do nível 1');
    return 1;
  }

  async getGameLevels(level: number, cacheCount = 2) {
    return await this.makeRequest('GET', '/gem/cache-game-level', {
      level,
      cache_count: cacheCount,
    });
  }

  async startLevel(level: number, key: string) {
    const result = await this.makeRequest('POST', '/gem/start-play-game', undefined, {
      level,
      key,
    });

    if (result.code === 0) {
      const updateData = result.data?.update_data || {};
      this.batchId = updateData.batch_id;
    }

    return result;
  }

  async completeLevel(level: number, enableClick = true) {
    if (!this.batchId) {
      this.batchId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    const result = await this.makeRequest('POST', '/gem/complete-level', undefined, {
      level,
      enableClick,
      batch_id: this.batchId,
    });

    if (result.code === 0) {
      const dataResult = result.data || {};
      const updateData = dataResult.update_data || {};

      this.currentLevel = dataResult.pass_level || this.currentLevel;
      this.gems = updateData.gems || this.gems;
      this.cashBalance = updateData.gems_to_cash || this.cashBalance;
    }

    return result;
  }

  private async playLevelAuto(level: number): Promise<boolean> {
    if (this.stopRequested) return false;

    // 1. Obter configuração do nível
    const levelsData = await this.getGameLevels(level);
    
    if (!this.checkEnergyFromResponse(levelsData)) {
      return false;
    }

    if (levelsData.code !== 0 || !levelsData.data) {
      this.log(`[ERRO] Falha ao obter dados do nível ${level}`);
      return false;
    }

    // Encontrar o nível específico
    const levelConfig = levelsData.data.find((lvl: any) => lvl.id === level);
    const availableLevels = levelsData.data.map((lvl: any) => lvl.id);

    if (!levelConfig) {
      this.log(`[INFO] Nível ${level} não encontrado. Níveis disponíveis: ${availableLevels.join(', ')}`);
      this.log(`[INFO] Você completou todos os níveis disponíveis!`);
      return false;
    }

    const levelKey = levelConfig.key;

    // 2. Iniciar o nível
    await this.sleep(500);
    const startResult = await this.startLevel(level, levelKey);
    
    if (!this.checkEnergyFromResponse(startResult)) {
      return false;
    }

    if (startResult.code !== 0) {
      this.log(`[ERRO] Falha ao iniciar nível ${level}`);
      return false;
    }

    // 3. Simular tempo de jogo
    await this.sleep(2000);

    // 4. Completar o nível
    const completeResult = await this.completeLevel(level);
    
    if (!this.checkEnergyFromResponse(completeResult)) {
      return false;
    }

    if (completeResult.code !== 0) {
      this.log(`[ERRO] Falha ao completar nível ${level}`);
      return false;
    }

    // Atualizar contadores
    this.levelsCompleted++;
    this.totalEarned += 20;

    // Log formatado
    this.log(`Level: ${level.toString().padStart(5)} | Balance: $${this.gems.toString().padStart(6)} | Reward: 20`);

    return true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async start() {
    if (this.isRunning) {
      this.log('Bot já está rodando!');
      return;
    }

    this.isRunning = true;
    this.stopRequested = false;
    this.consecutiveFailures = 0;
    
    this.log('='.repeat(60));
    this.log('Ball Sort - Bot Iniciado');
    this.log('='.repeat(60));

    // Auto-detectar nível
    this.currentLevel = await this.detectCurrentLevel();

    this.log(`Iniciando farm a partir do nível: ${this.currentLevel}`);
    this.log('='.repeat(60));

    let current = this.currentLevel;

    while (this.isRunning && !this.stopRequested) {
      const success = await this.playLevelAuto(current);

      if (success) {
        current++;
        this.consecutiveFailures = 0;
      } else {
        this.consecutiveFailures++;

        if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
          this.log(`[ENERGIA] ${this.consecutiveFailures} falhas consecutivas detectadas`);
          this.log(`[ENERGIA] Provavelmente sem energia. Aguardando recarga...`);
          await this.waitForEnergy();
          this.consecutiveFailures = 0;
          continue;
        }

        this.log(`[ERRO] Falha no nível ${current} (${this.consecutiveFailures}/${this.MAX_CONSECUTIVE_FAILURES})`);
        await this.sleep(5000);
        continue;
      }

      // Delay entre níveis
      await this.sleep(1500);
    }

    this.log('='.repeat(60));
    this.log('Bot interrompido');
    this.log(`Níveis completados: ${this.levelsCompleted}`);
    this.log(`Total ganho: ${this.totalEarned} moedas`);
    this.log(`Balance final: $${this.gems} gems ($${this.cashBalance.toFixed(4)} cash)`);
    this.log('='.repeat(60));

    this.isRunning = false;
  }

  stop() {
    if (!this.isRunning) {
      this.log('Bot não está rodando!');
      return;
    }

    this.log('Parando bot...');
    this.stopRequested = true;
    this.isRunning = false;
  }

  getStatus(): BotStatus {
    return {
      isRunning: this.isRunning,
      currentLevel: this.currentLevel,
      gems: this.gems,
      cashBalance: this.cashBalance,
      levelsCompleted: this.levelsCompleted,
      totalEarned: this.totalEarned,
      hasEnergy: this.hasEnergy,
      waitingForEnergy: this.waitingForEnergy,
      energyRechargeTime: this.energyRechargeTime || undefined,
    };
  }
}
