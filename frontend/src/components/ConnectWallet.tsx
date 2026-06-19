import { useState } from "react";

interface ConnectWalletProps {
  account: string | null;
  balance: string | null;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
}

export default function ConnectWallet({
  account,
  balance,
  onConnect,
  onDisconnect,
}: ConnectWalletProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);
    try {
      await onConnect();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect wallet");
      }
    } finally {
      setConnecting(false);
    }
  };

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div id="connect-wallet" className="connect-wallet">
      {error && <p className="error-message">{error}</p>}

      {account ? (
        <div className="wallet-info">
          <span className="wallet-address" title={account}>
            {shortenAddress(account)}
          </span>
          {balance && <span className="wallet-balance">{balance} ETH</span>}
          <button
            id="disconnect-btn"
            className="btn btn-secondary"
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          id="connect-btn"
          className="btn btn-primary"
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}
