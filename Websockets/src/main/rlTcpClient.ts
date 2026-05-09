import { EventEmitter } from "events";
import net from "net";
import { RlMessage } from "../shared/rlTypes";
import { JsonStreamParser } from "./jsonStreamParser";

interface RlTcpClientOptions {
  host: string;
  port: number;
  reconnectDelayMs: number;
}

export declare interface RlTcpClient {
  on(event: "message", listener: (message: RlMessage) => void): this;
  on(event: "status", listener: (status: string) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
}

export class RlTcpClient extends EventEmitter {
  private socket?: net.Socket;
  private reconnectTimer?: NodeJS.Timeout;
  private stopped = true;
  private parser = new JsonStreamParser();

  constructor(private readonly options: RlTcpClientOptions) {
    super();
  }

  start(): void {
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.socket?.destroy();
  }

  private connect(): void {
    this.emit("status", "connecting");
    this.parser = new JsonStreamParser();

    const socket = net.createConnection({
      host: this.options.host,
      port: this.options.port
    });

    this.socket = socket;

    socket.on("connect", () => {
      this.emit("status", "connected");
    });

    socket.on("data", (chunk) => {
      try {
        const messages = this.parser.push(chunk.toString("utf8"));
        for (const message of messages) {
          if (isRlMessage(message)) {
            this.emit("message", message);
          }
        }
      } catch (error) {
        this.emit("error", error instanceof Error ? error : new Error(String(error)));
      }
    });

    socket.on("error", (error) => {
      this.emit("error", error);
    });

    socket.on("close", () => {
      this.emit("status", "disconnected");
      if (!this.stopped) {
        this.reconnectTimer = setTimeout(() => this.connect(), this.options.reconnectDelayMs);
      }
    });
  }
}

function isRlMessage(value: unknown): value is RlMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RlMessage>;
  return typeof candidate.Event === "string" && "Data" in candidate;
}
