// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

struct Task {
    uint256 id;
    string title;
    bool isCompleted;
    uint256 deadline;
}

contract ToDoList {
    mapping(uint256 => Task) private tasks; // taskId -> task map
    mapping(address => uint256[]) private userTaskIds; // user -> taskId
    // Reverse Lookup
    mapping(uint256 => uint256) private taskIdToIndex; // taskId -> index
    mapping(uint256 => address) private taskOwner; // taskId -> address
    uint256 private globalTaskCounter;

    // Events
    event TaskAdded(address indexed user, uint256 taskId);
    event TaskCompleted(address indexed user, uint256 taskId);
    event TaskDeleted(address indexed user, uint256 taskId);

    // Modifier
    modifier onlyTaskOwner(uint256 _taskId) {
        require(
            taskOwner[_taskId] == msg.sender,
            "Task not found or access denied"
        );
        _;
    }

    constructor() {}

    function addTask(string calldata _title, uint256 _deadline) external {
        uint256 taskId = globalTaskCounter++;
        tasks[taskId] = Task(taskId, _title, false, _deadline);

        // Record the index where this ID will sit in the user's array
        taskIdToIndex[taskId] = userTaskIds[msg.sender].length;
        userTaskIds[msg.sender].push(taskId);
        taskOwner[taskId] = msg.sender;

        emit TaskAdded(msg.sender, taskId);
    }

    function markCompleted(uint256 _taskId) external onlyTaskOwner(_taskId) {
        require(!tasks[_taskId].isCompleted, "Already completed");
        tasks[_taskId].isCompleted = true;
        emit TaskCompleted(msg.sender, _taskId);
    }
}
