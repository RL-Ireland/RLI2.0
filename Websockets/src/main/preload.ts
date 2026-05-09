import { contextBridge, ipcRenderer } from "electron";
import { BridgeStatus } from "./bridge";

contextBridge.exposeInMainWorld("bridgeApi", {
  onStatus(callback: (status: BridgeStatus) => void): void {
    ipcRenderer.on("bridge-status", (_event, status: BridgeStatus) => callback(status));
  }
});
