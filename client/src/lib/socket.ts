"use client";

import { io, type Socket } from "socket.io-client";

import { fetchGuildsApi } from "./api";

class SocketManager {
  private socket: Socket;
  private authenticated = false;
  private qrCallback?: (qr: any) => void;

  constructor() {
    this.socket = io();
    this.socket.on("qr", this.qrChange.bind(this));
  }

  private emitAsync(ev: string, ...args: any[]) {
    return new Promise((resolve) => {
      this.socket.emit(ev, ...args, (res: any) => {
        resolve(res);
      });
    });
  }

  async ensureConnected() {
    if (!this.socket.connected) return false;
    if (!(await this.authenticateSocket())) return false;
    return true;
  }

  async authenticateSocket() {
    if (this.authenticated) return true;
    const token = await fetchGuildsApi("/auth/socket-token");
    const res = await this.emitAsync("authenticate", token.token);
    this.authenticated = res as boolean;
    return res;
  }

  async listenForQR(id: number) {
    this.socket.emit("qr", id);
  }

  stopListeningForQR() {
    this.socket.emit("end_listen");
    this.qrCallback = undefined;
  }

  onQRChange(cb: (qr: any) => void) {
    this.qrCallback = cb;
  }

  qrChange(qr: any) {
    if (this.qrCallback !== undefined) this.qrCallback(qr);
  }
}

export const socketManager = new SocketManager();