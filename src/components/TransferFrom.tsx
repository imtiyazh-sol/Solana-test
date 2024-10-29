// src/components/TransferForm.tsx
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { FC, FormEvent, useState, useEffect } from "react";
import { toast } from "react-toastify";

const TransferForm: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet, connected } = useWallet();
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [balance, setBalance] = useState<number | null>(null);

  const isTrustWallet = wallet?.adapter.name === "Trust Wallet";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!publicKey || !wallet) {
      toast.error("Please connect your wallet first!");
      return;
    }

    try {
      setIsLoading(true);

      // Validate recipient address
      let recipientPubKey: PublicKey;
      try {
        recipientPubKey = new PublicKey(recipient);
      } catch (error) {
        toast.error("Invalid recipient address");
        return;
      }

      // Validate amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error("Invalid amount");
        return;
      }

      // Check balance
      const userBalance = await connection.getBalance(publicKey);
      if (userBalance < parsedAmount * LAMPORTS_PER_SOL) {
        toast.error("Insufficient balance");
        return;
      }

      // Get latest blockhash with retry
      let blockhash;
      let lastValidBlockHeight;
      try {
        const result = await connection.getLatestBlockhash("confirmed");
        blockhash = result.blockhash;
        lastValidBlockHeight = result.lastValidBlockHeight;
      } catch (error) {
        console.error("Error getting blockhash:", error);
        toast.error("Network error. Please try again.");
        return;
      }

      // Create transaction
      const transaction = new Transaction({
        feePayer: publicKey,
        recentBlockhash: blockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubKey,
          lamports: parsedAmount * LAMPORTS_PER_SOL,
        })
      );

      // Special handling for Trust Wallet
      const options = {
        skipPreflight: false,
        preflightCommitment: "confirmed" as const,
        maxRetries: 5,
      };

      if (isTrustWallet) {
        options.skipPreflight = true; // Skip preflight for Trust Wallet
      }

      // Send and confirm transaction
      const signature = await sendTransaction(transaction, connection, options);
      console.log(signature);

      console.log("Transaction sent:", signature);

      toast.info("Confirming transaction...", { autoClose: false });

      // Wait for confirmation with timeout
      const confirmationPromise = connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Transaction confirmation timeout")),
          30000
        )
      );

      const confirmation = await Promise.race([
        confirmationPromise,
        timeoutPromise,
      ]);
      //@ts-ignore
      if (confirmation && "value" in confirmation && confirmation.value.err) {
        throw new Error("Transaction failed to confirm");
      }

      toast.dismiss(); // Clear the confirming message
      toast.success("Transfer successful!");
      setRecipient("");
      setAmount("");
      updateBalance(); // Refresh balance after successful transfer
    } catch (error) {
      console.error("Error:", error);

      let errorMessage = "Transfer failed: ";
      if (error instanceof Error) {
        if (error.message.includes("insufficient funds")) {
          errorMessage += "Insufficient funds in wallet";
        } else if (error.message.includes("blockhash")) {
          errorMessage += "Transaction timeout - please try again";
        } else if (error.message.includes("cors")) {
          errorMessage += "Please use Trust Wallet mobile app";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "Unknown error occurred";
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBalance = async () => {
    if (publicKey && connected) {
      try {
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    } else {
      setBalance(null);
    }
  };

  useEffect(() => {
    updateBalance();
    const intervalId = setInterval(updateBalance, 10000);
    return () => clearInterval(intervalId);
  }, [publicKey, connected, connection]);

  return (
    <div className="space-y-6">
      <div className="flex justify-center flex-col items-center gap-4">
        <WalletMultiButton />
        {balance !== null && publicKey && (
          <div className="text-sm text-gray-600">
            Balance: {balance.toFixed(4)} SOL
          </div>
        )}
        {isTrustWallet && (
          <div className="text-xs text-orange-600">Using Trust Wallet</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter recipient's wallet address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount (SOL)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter amount in SOL"
            step="0.000000001"
            min="0"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !publicKey}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {isLoading ? "Processing..." : "Transfer SOL"}
        </button>
      </form>
    </div>
  );
};

export default TransferForm;
