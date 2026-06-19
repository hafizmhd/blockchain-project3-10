import { network } from "hardhat";
import { expect } from "chai";

const { ethers, networkHelpers } = await network.create();

// Helper: deadline 1 day from now (unix timestamp)
const futureDeadline = () => Math.floor(Date.now() / 1000) + 86400;

async function deployFixture() {
  const [user1, user2] = await ethers.getSigners();
  const toDoList = await ethers.deployContract("ToDoList");
  return { toDoList, user1, user2 };
}

describe("ToDoList", () => {
  // =============================================
  // DEPLOYMENT
  // =============================================

  describe("Deployment", () => {
    it("should deploy successfully", async () => {
      const { toDoList } = await networkHelpers.loadFixture(deployFixture);
      const address = await toDoList.getAddress();
      expect(address).to.be.properAddress;
    });

    it("should have 0 tasks for a new user", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(0);
    });
  });

  // =============================================
  // POSITIVE SCENARIOS
  // =============================================

  describe("addTask - Positive", () => {
    it("should add a task and return it via getTasks", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      const deadline = futureDeadline();
      await toDoList.connect(user1).addTask("Buy groceries", deadline);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(1);
      expect(tasks[0].title).to.equal("Buy groceries");
      expect(tasks[0].isCompleted).to.equal(false);
      expect(tasks[0].deadline).to.equal(BigInt(deadline));
    });

    it("should emit TaskAdded event with correct args", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await expect(toDoList.connect(user1).addTask("Study", futureDeadline()))
        .to.emit(toDoList, "TaskAdded")
        .withArgs(user1.address, 0n); // first task gets id 0
    });

    it("should assign incrementing IDs to tasks", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Task 1", futureDeadline());
      await toDoList.connect(user1).addTask("Task 2", futureDeadline());
      await toDoList.connect(user1).addTask("Task 3", futureDeadline());

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks[0].id).to.equal(0n);
      expect(tasks[1].id).to.equal(1n);
      expect(tasks[2].id).to.equal(2n);
    });

    it("should add multiple tasks correctly", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Task A", futureDeadline());
      await toDoList.connect(user1).addTask("Task B", futureDeadline());

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(2);
      expect(tasks[0].title).to.equal("Task A");
      expect(tasks[1].title).to.equal("Task B");
    });

    it("should allow adding a task with deadline = 0", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Only Task", 0);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(1);
      expect(tasks[0].deadline).to.equal(0n);
    });

    it("should allow adding a task with a future deadline", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      const deadline = futureDeadline();
      await toDoList.connect(user1).addTask("Only Task", deadline);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(1);
      expect(tasks[0].deadline).to.equal(BigInt(deadline));
    });
  });

  describe("markCompleted - Positive", () => {
    it("should mark a task as completed", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Finish homework", futureDeadline());
      await toDoList.connect(user1).markCompleted(0n);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks[0].isCompleted).to.equal(true);
    });

    it("should emit TaskCompleted event with correct task ID", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Test event", futureDeadline());

      await expect(toDoList.connect(user1).markCompleted(0n))
        .to.emit(toDoList, "TaskCompleted")
        .withArgs(user1.address, 0n); // task id 0
    });

    it("should only mark the specified task, leaving others unchanged", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Task 1", futureDeadline());
      await toDoList.connect(user1).addTask("Task 2", futureDeadline());
      await toDoList.connect(user1).markCompleted(0n);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks[0].isCompleted).to.equal(true);
      expect(tasks[1].isCompleted).to.equal(false);
    });
  });

  describe("deleteTask - Positive", () => {
    it("should delete a task and reduce array length", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("To delete", futureDeadline());
      await toDoList.connect(user1).deleteTask(0n);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(0);
    });

    it("should emit TaskDeleted event with correct task ID", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Delete me", futureDeadline());

      await expect(toDoList.connect(user1).deleteTask(0n))
        .to.emit(toDoList, "TaskDeleted")
        .withArgs(user1.address, 0n);
    });

    it("should swap-and-pop correctly when deleting non-last element", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Task A", futureDeadline());    // id 0, index 0
      await toDoList.connect(user1).addTask("Task B", futureDeadline());    // id 1, index 1
      await toDoList.connect(user1).addTask("Task C", futureDeadline());    // id 2, index 2

      // Delete Task A (ID 0) -> Task C should move to index 0
      await toDoList.connect(user1).deleteTask(0n);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(2);
      expect(tasks[0].title).to.equal("Task C"); // swapped from last position
      expect(tasks[0].id).to.equal(2n);
      expect(tasks[1].title).to.equal("Task B"); // unchanged
    });

    it("should handle deleting the last element without swap", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Task A", futureDeadline());
      await toDoList.connect(user1).addTask("Task B", futureDeadline());

      // Delete Task B (ID 1)
      await toDoList.connect(user1).deleteTask(1n);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(1);
      expect(tasks[0].title).to.equal("Task A"); // remains in place
    });
  });

  describe("getTasks - Positive", () => {
    it("should return empty array when no tasks exist", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(0);
    });
  });

  // =============================================
  // NEGATIVE SCENARIOS
  // =============================================

  describe("markCompleted - Negative", () => {
    it("should revert when marking a task that does not exist", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await expect(toDoList.connect(user1).markCompleted(0n))
        .to.be.revertedWith("Task not found or access denied");
    });

    it("should revert when task ID does not exist", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Only task", futureDeadline());

      await expect(toDoList.connect(user1).markCompleted(5n))
        .to.be.revertedWith("Task not found or access denied");
    });

    it("should revert when marking a task owned by another user", async () => {
      const { toDoList, user1, user2 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("User1 task", futureDeadline());
      await expect(toDoList.connect(user2).markCompleted(0n))
        .to.be.revertedWith("Task not found or access denied");
    });

    it("should revert when marking an already completed task as completed", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Task", futureDeadline());
      await toDoList.connect(user1).markCompleted(0n);
      await expect(toDoList.connect(user1).markCompleted(0n))
        .to.be.revertedWith("Already completed");
    });
  });

  describe("deleteTask - Negative", () => {
    it("should revert when deleting a task that does not exist", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await expect(toDoList.connect(user1).deleteTask(0n))
        .to.be.revertedWith("Task not found or access denied");
    });

    it("should revert when task ID does not exist", async () => {
      const { toDoList, user1 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("Only task", futureDeadline());

      await expect(toDoList.connect(user1).deleteTask(99n))
        .to.be.revertedWith("Task not found or access denied");
    });

    it("should revert when deleting a task owned by another user", async () => {
      const { toDoList, user1, user2 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("User 1 task", futureDeadline());
      await expect(toDoList.connect(user2).deleteTask(0n))
        .to.be.revertedWith("Task not found or access denied");
    });
  });

  // =============================================
  // PER-USER ISOLATION
  // =============================================

  describe("Per-user isolation", () => {
    it("should keep tasks separate between users", async () => {
      const { toDoList, user1, user2 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("User1 task", futureDeadline());
      await toDoList.connect(user2).addTask("User2 task", futureDeadline());

      const user1Tasks = await toDoList.connect(user1).getTasks();
      const user2Tasks = await toDoList.connect(user2).getTasks();

      expect(user1Tasks.length).to.equal(1);
      expect(user1Tasks[0].title).to.equal("User1 task");

      expect(user2Tasks.length).to.equal(1);
      expect(user2Tasks[0].title).to.equal("User2 task");
    });

    it("should not affect other user's tasks when deleting", async () => {
      const { toDoList, user1, user2 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("User1 task", futureDeadline());
      await toDoList.connect(user2).addTask("User2 task", futureDeadline());

      await toDoList.connect(user1).deleteTask(0n);

      const user1Tasks = await toDoList.connect(user1).getTasks();
      const user2Tasks = await toDoList.connect(user2).getTasks();

      expect(user1Tasks.length).to.equal(0);
      expect(user2Tasks.length).to.equal(1); // unaffected
    });

    it("should assign globally unique IDs across users", async () => {
      const { toDoList, user1, user2 } = await networkHelpers.loadFixture(deployFixture);
      await toDoList.connect(user1).addTask("User1 task", futureDeadline());  // id 0
      await toDoList.connect(user2).addTask("User2 task", futureDeadline()); // id 1

      const user1Tasks = await toDoList.connect(user1).getTasks();
      const user2Tasks = await toDoList.connect(user2).getTasks();

      expect(user1Tasks[0].id).to.equal(0n);
      expect(user2Tasks[0].id).to.equal(1n); // globally unique, not 0
    });
  });
});