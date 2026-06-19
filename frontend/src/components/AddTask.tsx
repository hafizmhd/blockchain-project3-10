import { useState } from "react";
import { ethers } from "ethers";
import type { TxNotification } from "../App";

interface AddTaskProps {
  contract: ethers.Contract | null;
  onTaskAdded: () => void;
  notify: (msg: string, type: TxNotification["type"]) => void;
}

export default function AddTask({
  contract,
  onTaskAdded,
  notify,
}: AddTaskProps) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!contract) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!title.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    if (!deadline) {
      setError("Please select a deadline.");
      return;
    }

    const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

    if (deadlineTimestamp <= Math.floor(Date.now() / 1000)) {
      setError("Deadline must be in the future.");
      return;
    }

    setLoading(true);
    notify("Adding task... Please confirm in MetaMask.", "pending");

    try {
      const tx = await contract.addTask(title.trim(), deadlineTimestamp);
      notify("Transaction submitted. Waiting for confirmation...", "pending");
      await tx.wait();
      notify("Task added successfully!", "success");
      setTitle("");
      setDeadline("");
      onTaskAdded();
    } catch (err: unknown) {
      console.error("addTask error:", err);
      if (err instanceof Error) {
        if (err.message.includes("user rejected")) {
          const msg = "Transaction was rejected by the user.";
          setError(msg);
          notify(msg, "error");
        } else {
          const msg = err.message.slice(0, 150);
          setError(msg);
          notify("Failed to add task.", "error");
        }
      } else {
        setError("Transaction failed. Please try again.");
        notify("Transaction failed.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="add-task" className="add-task">
      <h2>Add New Task</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="add-task-form">
        <div className="form-group">
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            type="text"
            placeholder="Enter task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="task-deadline">Deadline</label>
          <input
            id="task-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={loading}
          />
        </div>
        <button
          id="add-task-btn"
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Sending transaction..." : "Add Task"}
        </button>
      </form>
    </div>
  );
}
