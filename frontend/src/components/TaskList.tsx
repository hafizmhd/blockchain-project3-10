import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import TaskItem, { type Task } from "./TaskItem";
import type { TxNotification } from "../App";

interface TaskListProps {
  contract: ethers.Contract | null;
  refreshKey: number;
  notify: (msg: string, type: TxNotification["type"]) => void;
}

export default function TaskList({
  contract,
  refreshKey,
  notify,
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!contract) {
      setTasks([]);
      return;
    }
    setError(null);
    setLoading(true);
    console.log("[fetchTasks] calling contract.getTasks()...");
    try {
      const rawTasks = await contract.getTasks();
      console.log("[fetchTasks] raw result:", rawTasks);
      const parsed: Task[] = rawTasks.map(
        (t: [bigint, string, boolean, bigint]) => ({
          id: t[0],
          title: t[1],
          isCompleted: t[2],
          deadline: t[3],
        })
      );
      setTasks(parsed);
    } catch (err: unknown) {
      console.error("[fetchTasks] getTasks error:", err);
      if (err instanceof Error) {
        setError(err.message.slice(0, 150));
      } else {
        setError("Failed to load tasks from the contract.");
      }
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshKey]);

  if (!contract) {
    return (
      <div id="task-list" className="task-list">
        <h2>My Tasks</h2>
        <p className="info-message">Connect your wallet to view tasks.</p>
      </div>
    );
  }

  return (
    <div id="task-list" className="task-list">
      <h2>
        My Tasks ({tasks.length}){" "}
        <button
          id="refresh-btn"
          className="btn btn-secondary btn-sm"
          onClick={fetchTasks}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </h2>

      {error && <p className="error-message">{error}</p>}

      {loading && tasks.length === 0 && (
        <p className="info-message">Loading tasks...</p>
      )}

      {!loading && tasks.length === 0 && (
        <p className="info-message">No tasks yet. Add one above!</p>
      )}

      <div className="task-items">
        {tasks.map((task) => (
          <TaskItem
            key={task.id.toString()}
            task={task}
            contract={contract}
            onUpdate={fetchTasks}
            notify={notify}
          />
        ))}
      </div>
    </div>
  );
}
