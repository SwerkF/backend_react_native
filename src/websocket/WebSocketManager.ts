import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';

interface WebSocketClient {
  ws: WebSocket;
  id: string;
  isAlive: boolean;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient>;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map();
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocket) => {
      try {
        // Générer un ID unique pour le client
        const clientId = this.generateClientId();

        // Créer un client WebSocket
        const client: WebSocketClient = {
          ws,
          id: clientId,
          isAlive: true
        };

        // Ajouter le client à la map
        this.clients.set(clientId, client);

        // Configurer les événements du client
        this.setupClientEvents(client);

        // Informer le client de son ID
        ws.send(JSON.stringify({
          type: 'CONNECTION_ESTABLISHED',
          payload: { clientId }
        }));

      } catch (error) {
        console.error('Erreur de connexion WebSocket:', error);
        ws.close();
      }
    });

    this.setupHeartbeat();
  }

  private setupClientEvents(client: WebSocketClient) {
    const { ws, id } = client;

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message) as WebSocketMessage;
        await this.handleMessage(id, data);
      } catch (error) {
        console.error('Erreur de traitement du message:', error);
      }
    });

    ws.on('close', () => {
      this.clients.delete(id);
      this.broadcast({
        type: 'CLIENT_DISCONNECTED',
        payload: { clientId: id }
      }, id);
    });

    ws.on('pong', () => {
      client.isAlive = true;
    });
  }

  private async handleMessage(clientId: string, message: WebSocketMessage) {
    switch (message.type) {
      case 'MESSAGE':
        this.broadcast({
          type: 'NEW_MESSAGE',
          payload: {
            ...message.payload,
            senderId: clientId,
            timestamp: new Date().toISOString()
          }
        });
        break;

      case 'TYPING':
        this.broadcast({
          type: 'USER_TYPING',
          payload: {
            clientId,
            ...message.payload
          }
        }, clientId);
        break;

      default:
        console.warn('Type de message non géré:', message.type);
    }
  }

  private setupHeartbeat() {
    setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client.id);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000);
  }

  public sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  public broadcast(data: any, excludeClientId?: string) {
    this.clients.forEach((client) => {
      if (client.id !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(data));
      }
    });
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  public getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  public getClientCount(): number {
    return this.clients.size;
  }
} 