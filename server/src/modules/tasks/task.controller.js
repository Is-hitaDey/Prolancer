
import * as taskService from "./task.service.js";

// Admin: Create task
export const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(
      req.validated.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update task
export const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(
      req.validated.params.taskId,
      req.validated.body
    );

    res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Publish task
export const publishTask = async (req, res, next) => {
  try {
    const task = await taskService.publishTask(
      req.validated.params.taskId
    );

    res.status(200).json({
      success: true,
      message: "Task published successfully.",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Archive task
export const archiveTask = async (req, res, next) => {
  try {
    const task = await taskService.archiveTask(
      req.validated.params.taskId
    );

    res.status(200).json({
      success: true,
      message: "Task archived successfully.",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Admin / Developer: List tasks
export const getTasks = async (req, res, next) => {
  try {
    const result = await taskService.getTasks(
      req.validated.query,
      req.user
    );

    res.status(200).json({
      success: true,
      message: "Tasks fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Admin / Developer: Get task details
export const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(
      req.validated.params.taskId,
      req.user
    );

    res.status(200).json({
      success: true,
      message: "Task details fetched successfully.",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};
