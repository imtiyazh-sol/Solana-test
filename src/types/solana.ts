import { Connection, Commitment } from "@solana/web3.js";

export interface TransferFormProps {
  className?: string;
}

export interface TransactionConfirmation {
  signature: string;
  confirmation?: {
    value: {
      err: any;
    };
  };
}
