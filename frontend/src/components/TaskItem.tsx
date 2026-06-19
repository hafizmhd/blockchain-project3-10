import { useState } from "react";
import { ethers } from "ethers";
import type { TxNotification } from "../App";

export interface Task {
  id: bigint;
  title: string;
  isCompleted: boolean;
  deadline: bigint;
}

interface TaskItemProps {
  task: Task;
  contract: ethers.Contract | null;
  onUpdate: () => void;
  notify: (msg: string, type: TxNotification["type"]) => void;
}

export default function TaskItem({
  task,
  contract,
  onUpdate,
  notify,
}: TaskItemProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDeadline = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const isOverdue = (): boolean => {
    return !task.isCompleted && Number(task.deadline) * 1000 < Date.now();
  };

  const handleComplete = async () => {
    if (!contract) return;
    setError(null);
    setLoading(true);
    notify("Completing task... Please confirm in MetaMask.", "pending");

    try {
      const tx = await contract.markCompleted(task.id);
      notify("Transaction submitted. Waiting for confirmation...", "pending");
      await tx.wait();
      notify("Task marked as completed!", "success");
      onUpdate();
    } catch (err: unknown) {
      console.error("markCompleted error:", err);
      if (err instanceof Error) {
        if (err.message.includes("user rejected")) {
          setError("Transaction rejected.");
          notify("Transaction rejected.", "error");
        } else if (err.message.includes("Already completed")) {
          setError("Task is already completed.");
          notify("Task is already completed.", "error");
        } else {
          setError(err.message.slice(0, 120));
          notify("Failed to complete task.", "error");
        }
      } else {
        setError("Failed to mark task as completed.");
        notify("Failed to complete task.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contract) return;
    setError(null);
    setLoading(true);
    notify("Deleting task... Please confirm in MetaMask.", "pending");

    try {
      const tx = await contract.deleteTask(task.id);
      notify("Transaction submitted. Waiting for confirmation...", "pending");
      await tx.wait();
      notify("Task deleted successfully!", "success");
      onUpdate();
    } catch (err: unknown) {
      console.error("deleteTask error:", err);
      if (err instanceof Error) {
        if (err.message.includes("user rejected")) {
          setError("Transaction rejected.");
          notify("Transaction rejected.", "error");
        } else {
          setError(err.message.slice(0, 120));
          notify("Failed to delete task.", "error");
        }
      } else {
        setError("Failed to delete task.");
        notify("Failed to delete task.", "error");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className={`task-item ${task.isCompleted ? "completed" : ""} ${isOverdue() ? "overdue" : ""}`}
    >
      {error && <p className="error-message">{error}</p>}

      <div className="task-content">
        <h3 className="task-title">{task.title}</h3>
        <div className="task-meta">
          <span className="task-deadline">
            Deadline: {formatDeadline(task.deadline)}
          </span>
          <span className="task-id">ID: {task.id.toString()}</span>
        </div>
      </div>

      <div className="task-actions">
        {!task.isCompleted && (
          <button
            className="btn btn-success"
            onClick={handleComplete}
            disabled={loading}
          >
            {loading ? "Processing..." : "Complete"}
          </button>
        )}
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Processing..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
