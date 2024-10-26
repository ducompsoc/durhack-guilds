"use client";

import { io, type Socket } from "socket.io-client";

import { fetchMegateamsApi } from "./api";

class SocketManager {
  private socket: Socket;
  private authenticated = false;

  constructor() {
    this.socket = io();
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
    const token = await fetchMegateamsApi("/auth/socket-token");
    const res = await this.emitAsync("authenticate", token.token);
    this.authenticated = res as boolean;
    return res;
  }
}

export const socketManager = new SocketManager();
