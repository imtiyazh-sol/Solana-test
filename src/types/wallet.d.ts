import { Transaction, PublicKey } from "@solana/web3.js";

export interface TrustWallet {
  publicKey: PublicKey;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}

declare global {
  interface Window {
    trustwallet?: TrustWallet;
  }
}
