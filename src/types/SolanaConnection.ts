import { Connection, ConnectionConfig, Transaction } from "@solana/web3.js";

export class SolanaConnectionManager {
  private connection: Connection;

  constructor(endpoint: string) {
    this.connection = this.createConnection(endpoint);
  }

  private createConnection(endpoint: string): Connection {
    const config: ConnectionConfig = {
      commitment: "confirmed",
      httpHeaders: {
        "Content-Type": "application/json",
      },
      fetch: this.customFetch,
    };

    return new Connection(endpoint, config);
  }

  private customFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    if (init?.headers) {
      const headers = new Headers(init.headers);
      headers.delete("x-origin");
      init.headers = headers;
    }

    try {
      const response = await fetch(input, init);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (error instanceof Error && error.message.includes("CORS")) {
        console.error("CORS error detected, trying proxy...");
        if (import.meta.env.DEV) {
          const url = input instanceof URL ? input : new URL(input.toString());
          const proxyUrl = "/naas" + url.pathname;
          return fetch(proxyUrl, init);
        }
      }
      throw error;
    }
  };

  public getConnection(): Connection {
    return this.connection;
  }
}
