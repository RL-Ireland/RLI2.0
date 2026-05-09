import { BrowserWindow } from "electron";
import { mapRlEventToSosMessages } from "../shared/mapping/eventMapper";
import { config } from "./config";
import { RlTcpClient } from "./rlTcpClient";
import { SosWebSocketServer } from "./sosWebSocketServer";

export interface BridgeStatus {
  rlStatus: string;
  wsStatus: string;
  clientCount: number;
  logs: string[];
}

export class Bridge {
  private readonly rlClient = new RlTcpClient({
    host: config.rlHost,
    port: config.rlPort,
    reconnectDelayMs: config.reconnectDelayMs
  });

  private readonly wsServer = new SosWebSocketServer(config.sosWebSocketHost, config.sosWebSocketPort);
  private window?: BrowserWindow;
  private status: BridgeStatus = {
    rlStatus: "idle",
    wsStatus: "idle",
    clientCount: 0,
    logs: []
  };

  attachWindow(window: BrowserWindow): void {
    this.window = window;
    window.on("closed", () => {
      if (this.window === window) {
        this.window = undefined;
      }
    });
    this.pushStatus();
  }

  start(): void {
    this.wsServer.on("status", (status) => {
      this.status.wsStatus = status;
      this.log(`SOS WebSocket server ${status} on ${config.sosWebSocketHost}:${config.sosWebSocketPort}`);
    });

    this.wsServer.on("clientCount", (count) => {
      this.status.clientCount = count;
      this.pushStatus();
    });

    this.wsServer.on("error", (error) => this.log(`WebSocket error: ${error.message}`));

    this.rlClient.on("status", (status) => {
      this.status.rlStatus = status;
      this.log(`Rocket League API ${status} at ${config.rlHost}:${config.rlPort}`);
    });

    this.rlClient.on("error", (error) => this.log(`Rocket League API error: ${error.message}`));

    this.rlClient.on("message", (message) => {
      const outgoing = mapRlEventToSosMessages(message);
      for (const sosMessage of outgoing) {
        this.wsServer.broadcast(sosMessage);
      }
      this.pushStatus();
    });

    this.wsServer.start();
    this.rlClient.start();
  }

  stop(): void {
    this.rlClient.stop();
    this.wsServer.stop();
  }

  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.status.logs = [`${timestamp} ${message}`, ...this.status.logs].slice(0, 100);
    this.pushStatus();
  }

  private pushStatus(): void {
    if (!this.window || this.window.isDestroyed() || this.window.webContents.isDestroyed()) {
      return;
    }

    this.window.webContents.send("bridge-status", this.status);
  }
}
