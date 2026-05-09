import { EventEmitter } from "events";
import WebSocket, { WebSocketServer } from "ws";
import { SosMessage } from "../shared/sosTypes";

export declare interface SosWebSocketServer {
  on(event: "clientCount", listener: (count: number) => void): this;
  on(event: "status", listener: (status: string) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
}

export class SosWebSocketServer extends EventEmitter {
  private server?: WebSocketServer;

  constructor(private readonly host: string, private readonly port: number) {
    super();
  }

  start(): void {
    this.server = new WebSocketServer({ host: this.host, port: this.port });

    this.server.on("listening", () => {
      this.emit("status", "listening");
    });

    this.server.on("connection", (client) => {
      this.emitClientCount();
      client.on("close", () => this.emitClientCount());
    });

    this.server.on("error", (error) => {
      this.emit("error", error);
    });
  }

  stop(): void {
    this.server?.close();
    this.server = undefined;
    this.emitClientCount();
  }

  broadcast(message: SosMessage): void {
    const raw = JSON.stringify(message);
    for (const client of this.server?.clients || []) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  }

  private emitClientCount(): void {
    this.emit("clientCount", this.server?.clients.size || 0);
  }
}
