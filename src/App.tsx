import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  TrustWalletAdapter,
  PhantomWalletAdapter,
  // Add other wallets if needed
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { FC, useMemo, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import TransferForm from "./components/TransferFrom";

// Use a public RPC endpoint that allows CORS
const CUSTOM_RPC_ENDPOINT =
  "https://solana-mainnet.g.alchemy.com/v2/RRdw6JV5Vh4hLplKpmY8Pq3vp7Mlu7WH"; // or your preferred RPC endpoint

const App: FC = () => {
  const network = WalletAdapterNetwork.Mainnet;

  // Use custom RPC endpoint
  const endpoint = useMemo(
    () => CUSTOM_RPC_ENDPOINT || clusterApiUrl(network),
    [network]
  );

  // Configure wallets with specific options
  const wallets = useMemo(
    () => [
      new TrustWalletAdapter({
        network: network,
        config: {
          chainId: "1",
          rpcTarget: endpoint,
        },
      }),
      new PhantomWalletAdapter(),
    ],
    [network, endpoint]
  );

  // Error handler
  const onError = useCallback((error: WalletError) => {
    let message = error.message ?? "Unknown error";

    // Handle specific Trust Wallet errors
    if (message.includes("cors")) {
      message =
        "Connection blocked. Please try using Trust Wallet app directly.";
    }

    toast.error(message);
  }, []);

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{
        commitment: "confirmed",
        wsEndpoint: endpoint.replace("https", "wss"),
        disableRetryOnRateLimit: true,
        httpHeaders: {
          // Only include necessary headers
          "Content-Type": "application/json",
        },
      }}
    >
      <WalletProvider wallets={wallets} autoConnect={true} onError={onError}>
        <WalletModalProvider>
          <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
              <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                <div className="max-w-md mx-auto">
                  <div className="divide-y divide-gray-200">
                    <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                      <h1 className="text-2xl font-bold mb-8 text-center">
                        Solana Transfer
                      </h1>
                      <div className="text-sm text-center text-gray-500 mb-4">
                        For best results with Trust Wallet:
                        <ul className="list-disc list-inside mt-2">
                          <li>Use Trust Wallet mobile app</li>
                          <li>Connect via WalletConnect</li>
                          <li>Ensure you're on the correct network</li>
                        </ul>
                      </div>
                      <TransferForm />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ToastContainer position="bottom-right" />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
