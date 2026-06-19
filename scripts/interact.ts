import { network } from "hardhat";

const { ethers } = await network.create({
  network: "localhost",
});


const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const toDoList = await ethers.getContractAt("ToDoList", contractAddress);
const [user1, user2] = await ethers.getSigners();


// Helper to format deadline
const getFutureDeadline = (days: number) => {
  return Math.floor(Date.now() / 1000) + (days * 86400);
};

// Helper function to print tasks in a clean tabular-like format
function printTasks(userLabel: string, tasks: any[]) {
  console.log(`--- Tasks for ${userLabel} ---`);
  if (tasks.length === 0) {
    console.log("  No tasks found.");
  } else {
    tasks.forEach((task) => {
      const deadlineStr = task.deadline === 0n ? "No deadline" : new Date(Number(task.deadline) * 1000).toLocaleString();
      console.log(
        `  [ID: ${task.id}] Title: "${task.title}" | Completed: ${task.isCompleted} | Deadline: ${deadlineStr}`
      );
    });
  }
  console.log("");
}

async function run() {
  console.log(`User 1 (Signer 1): ${user1.address}`);
  console.log(`User 2 (Signer 2): ${user2.address}\n`);

  // 1. Initial State
  console.log("=== 1. Initial State ===");
  let user1Tasks = await toDoList.connect(user1).getTasks();
  let user2Tasks = await toDoList.connect(user2).getTasks();
  printTasks("User 1", user1Tasks);
  printTasks("User 2", user2Tasks);

  // 2. Add multiple tasks for User 1
  console.log("=== 2. User 1 Adds Tasks ===");
  console.log("Adding task: 'Buy groceries'...");
  let tx = await toDoList.connect(user1).addTask("Buy groceries", getFutureDeadline(1));
  await tx.wait();

  console.log("Adding task: 'Submit blockchain project'...");
  tx = await toDoList.connect(user1).addTask("Submit blockchain project", getFutureDeadline(3));
  await tx.wait();

  user1Tasks = await toDoList.connect(user1).getTasks();
  printTasks("User 1 (After Additions)", user1Tasks);

  // 3. Tasks from different user
  console.log("=== 3. User 2 Adds Tasks ===");
  console.log("Adding task: 'Review pull requests'...");
  tx = await toDoList.connect(user2).addTask("Review pull requests", getFutureDeadline(2));
  await tx.wait();

  user1Tasks = await toDoList.connect(user1).getTasks();
  user2Tasks = await toDoList.connect(user2).getTasks();
  printTasks("User 1 (Should be unaffected)", user1Tasks);
  printTasks("User 2 (After Addition)", user2Tasks);

  // 4. Mark task as complete
  if (user1Tasks.length > 0) {
    const taskIdToComplete = user1Tasks[0].id;
    console.log(`=== 4. User 1 Marks Task ID ${taskIdToComplete} as Complete ===`);
    tx = await toDoList.connect(user1).markCompleted(taskIdToComplete);
    await tx.wait();
    console.log(`Task ID ${taskIdToComplete} marked as completed.`);

    user1Tasks = await toDoList.connect(user1).getTasks();
    printTasks("User 1 (After Completion)", user1Tasks);
  }

  // 5. Delete a task
  if (user1Tasks.length > 1) {
    const taskIdToDelete = user1Tasks[0].id;
    console.log(`=== 5. User 1 Deletes Task ID ${taskIdToDelete} ===`);
    tx = await toDoList.connect(user1).deleteTask(taskIdToDelete);
    await tx.wait();
    console.log(`Task ID ${taskIdToDelete} deleted.`);

    user1Tasks = await toDoList.connect(user1).getTasks();
    printTasks("User 1 (After Deletion)", user1Tasks);
  }

  // 6. Verify isolation
  console.log("=== 6. Verify User 2 Tasks are Unaffected ===");
  user2Tasks = await toDoList.connect(user2).getTasks();
  printTasks("User 2", user2Tasks);

  // 7. Negative Case: User 2 tries to modify a task they do not own
  console.log("=== 7. Negative Case: Unauthorized Access ===");
  try {
    console.log("User 2 attempting to mark task ID 0 (User 1's task) as complete...");
    await toDoList.connect(user2).markCompleted(0n);
    console.log("SUCCESS (Unexpected): Task completed by unauthorized user.");
  } catch (error: any) {
    console.log("EXPECTED REVERT/FAILURE: Transaction reverted as expected!");
    console.log(`Error: ${error.reason || error.message}`);
  }
  console.log("");

  console.log("=== Interaction Demo Finished Successfully ===");
}

try {
  await run();
} catch (error) {
  console.error("Error during interaction script execution:", error);
  process.exitCode = 1;
}


