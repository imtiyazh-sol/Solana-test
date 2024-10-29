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
