import { useState, useCallback } from "react";
import { ethers } from "ethers";
import ConnectWallet from "./components/ConnectWallet";
import AddTask from "./components/AddTask";
import TaskList from "./components/TaskList";
import ToDoListArtifact from "./utils/ToDoList.json";
import { CONTRACT_ADDRESS, HARDHAT_CHAIN_ID } from "./utils/contract";
import "./App.css";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (
        event: string,
        handler: (...args: unknown[]) => void
      ) => void;
    };
  }
}

export interface TxNotification {
  message: string;
  type: "pending" | "success" | "error";
}

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [txNotification, setTxNotification] = useState<TxNotification | null>(
    null
  );

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  /** Show a transaction notification. Success/error auto-dismiss after 3s. */
  const notify = useCallback((msg: string, type: TxNotification["type"]) => {
    setTxNotification({ message: msg, type });
    if (type !== "pending") {
      setTimeout(() => setTxNotification(null), 3000);
    }
  }, []);

  const clearNotification = () => setTxNotification(null);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed. Please install it to use this dApp."
      );
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    // Request accounts
    const accounts = await provider.send("eth_requestAccounts", []);
    if (accounts.length === 0) {
      throw new Error("No accounts found. Please unlock MetaMask.");
    }

    // Check we are on the Hardhat network
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== HARDHAT_CHAIN_ID) {
      throw new Error(
        `Please switch MetaMask to the local Hardhat network (chainId ${HARDHAT_CHAIN_ID}). ` +
          `Currently on chainId ${network.chainId}.`
      );
    }

    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Fetch balance (read operation #2)
    const rawBalance = await provider.getBalance(address);
    const formatted = ethers.formatEther(rawBalance);
    const shortBalance = parseFloat(formatted).toFixed(4);

    // Create contract instance with signer for write operations
    const todoContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ToDoListArtifact.abi,
      signer
    );

    setAccount(address);
    setBalance(shortBalance);
    setContract(todoContract);

    // Listen for account changes
    if (window.ethereum.on) {
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  const disconnectWallet = () => {
    setAccount(null);
    setBalance(null);
    setContract(null);
    setTxNotification(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ToDoList dApp</h1>
        <ConnectWallet
          account={account}
          balance={balance}
          onConnect={connectWallet}
          onDisconnect={disconnectWallet}
        />
      </header>

      {/* Global transaction notification banner */}
      {txNotification && (
        <div
          id="tx-notification"
          className={`tx-notification tx-${txNotification.type}`}
        >
          <span>{txNotification.message}</span>
          {txNotification.type !== "pending" && (
            <button
              className="tx-dismiss"
              onClick={clearNotification}
              aria-label="Dismiss"
            >
              &times;
            </button>
          )}
        </div>
      )}

      <main className="app-main">
        {account && (
          <AddTask
            contract={contract}
            onTaskAdded={triggerRefresh}
            notify={notify}
          />
        )}
        <TaskList
          contract={contract}
          refreshKey={refreshKey}
          notify={notify}
        />
      </main>

      <footer className="app-footer">
        <p>
          Contract:{" "}
          <code title={CONTRACT_ADDRESS}>
            {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
          </code>{" "}
          &middot; Hardhat Local Network
        </p>
      </footer>
    </div>
  );
}

export default App;
