import mqtt, { MqttClient } from 'mqtt';
import { LobbyState, ScoreReport, PlayerStatus } from '../types/tournament';

export type NetworkMessage =
  | { type: 'STATE_SYNC'; state: LobbyState; senderId: string }
  | { type: 'REQUEST_STATE'; senderId: string }
  | { type: 'PLAYER_JOIN'; player: { id: string; name: string }; senderId: string }
  | { type: 'PLAYER_LEAVE'; playerId: string; senderId: string }
  | { type: 'PLAYER_STATUS_CHANGE'; playerId: string; status: PlayerStatus; senderId: string }
  | { type: 'SCORE_REPORT'; matchId: string; report: ScoreReport; senderId: string }
  | { type: 'HOST_SCORE_OVERRIDE'; matchId: string; blueScore: number; orangeScore: number; senderId: string }
  | { type: 'ADVANCE_ROUND'; roundNumber: number; senderId: string }
  | { type: 'END_TOURNAMENT'; senderId: string }
  | { type: 'RESUME_TOURNAMENT'; senderId: string }
  | { type: 'RESET_TOURNAMENT'; senderId: string };

export interface NetworkAdapterOptions {
  lobbyCode: string;
  myPlayerId: string;
  onMessage: (message: NetworkMessage) => void;
  onConnectionChange?: (status: { mqttConnected: boolean; localConnected: boolean }) => void;
}

const PUBLIC_BROKERS = [
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://broker.emqx.io:8084/mqtt',
];

export class LobbyNetwork {
  private lobbyCode: string;
  private myPlayerId: string;
  private broadcastChannel: BroadcastChannel | null = null;
  private mqttClient: MqttClient | null = null;
  private onMessageCallback: (message: NetworkMessage) => void;
  private onConnectionChangeCallback?: (status: { mqttConnected: boolean; localConnected: boolean }) => void;
  private isDestroyed = false;
  private mqttConnected = false;
  private localConnected = false;
  private seenMessageIds = new Set<string>();

  constructor(options: NetworkAdapterOptions) {
    this.lobbyCode = options.lobbyCode;
    this.myPlayerId = options.myPlayerId;
    this.onMessageCallback = options.onMessage;
    this.onConnectionChangeCallback = options.onConnectionChange;

    this.initBroadcastChannel();
    this.initMqtt();
  }

  private notifyStatus() {
    if (this.onConnectionChangeCallback) {
      this.onConnectionChangeCallback({
        mqttConnected: this.mqttConnected,
        localConnected: this.localConnected,
      });
    }
  }

  private initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(`rlrr_${this.lobbyCode}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleRawMessage(event.data);
        };
        this.localConnected = true;
        this.notifyStatus();
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment', e);
    }
  }

  private initMqtt(brokerIndex = 0) {
    if (this.isDestroyed || brokerIndex >= PUBLIC_BROKERS.length) return;

    const brokerUrl = PUBLIC_BROKERS[brokerIndex];
    const topic = `rlrr/usask/lobby/${this.lobbyCode.toLowerCase()}`;

    try {
      const client = mqtt.connect(brokerUrl, {
        keepalive: 30,
        reconnectPeriod: 4000,
        connectTimeout: 7000,
        clean: true,
        clientId: `rlrr_${Math.random().toString(16).slice(2, 10)}`,
      });

      this.mqttClient = client;

      client.on('connect', () => {
        if (this.isDestroyed) {
          client.end();
          return;
        }
        this.mqttConnected = true;
        this.notifyStatus();
        client.subscribe(topic, { qos: 0 });

        // Request initial state from anyone who is already in room
        this.send({ type: 'REQUEST_STATE', senderId: this.myPlayerId });
      });

      client.on('message', (_t, payload) => {
        try {
          const parsed = JSON.parse(payload.toString());
          this.handleRawMessage(parsed);
        } catch {
          // Ignore invalid JSON payloads
        }
      });

      client.on('error', () => {
        // Failover to next broker if initial connection errors
        if (!this.mqttConnected && brokerIndex + 1 < PUBLIC_BROKERS.length) {
          client.end(true);
          this.initMqtt(brokerIndex + 1);
        }
      });

      client.on('close', () => {
        this.mqttConnected = false;
        this.notifyStatus();
      });
    } catch {
      // Graceful fallback to local BroadcastChannel
      this.mqttConnected = false;
      this.notifyStatus();
    }
  }

  private handleRawMessage(raw: { msgId: string; data: NetworkMessage }) {
    if (!raw || !raw.msgId || !raw.data) return;

    // Deduplicate messages across transports (BroadcastChannel + MQTT)
    if (this.seenMessageIds.has(raw.msgId)) return;
    this.seenMessageIds.add(raw.msgId);
    if (this.seenMessageIds.size > 200) {
      // Keep seen set bounded
      const first = this.seenMessageIds.values().next().value;
      if (first) this.seenMessageIds.delete(first);
    }

    // Ignore self-echoes
    if (raw.data.senderId === this.myPlayerId) return;

    this.onMessageCallback(raw.data);
  }

  public send(message: NetworkMessage): void {
    const msgId = `${this.myPlayerId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const payload = { msgId, data: message };

    // 1. Send via local BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (e) {
        console.warn('BroadcastChannel send error', e);
      }
    }

    // 2. Send via MQTT if connected
    if (this.mqttClient && this.mqttConnected) {
      const topic = `rlrr/usask/lobby/${this.lobbyCode.toLowerCase()}`;
      try {
        this.mqttClient.publish(topic, JSON.stringify(payload));
      } catch (e) {
        console.warn('MQTT publish error', e);
      }
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.mqttClient) {
      this.mqttClient.end(true);
      this.mqttClient = null;
    }
    this.mqttConnected = false;
    this.localConnected = false;
    this.notifyStatus();
  }
}
