
import { Router } from "express";

import * as taskController from "./task.controller.js";

import {
  validateCreateTask,
  validateUpdateTask,
  validateTaskQuery,
  validateTaskId,
} from "./task.validation.js";

import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

const router = Router();

// Admin: Create task
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  validateCreateTask,
  taskController.createTask
);

// Admin: List and filter tasks
// Admin / Developer
router.get(
  "/",
  authenticate,
  authorizeRoles("admin", "developer"),
  validateTaskQuery,
  taskController.getTasks
);

// Admin / Developer: Get task details
router.get(
  "/:taskId",
  authenticate,
  authorizeRoles("admin", "developer"),
  validateTaskId,
  taskController.getTaskById
);

// Admin: Update task
router.patch(
  "/:taskId",
  authenticate,
  authorizeRoles("admin"),
  validateTaskId,
  validateUpdateTask,
  taskController.updateTask
);

// Admin: Publish task
router.patch(
  "/:taskId/publish",
  authenticate,
  authorizeRoles("admin"),
  validateTaskId,
  taskController.publishTask
);

// Admin: Archive task
router.delete(
  "/:taskId",
  authenticate,
  authorizeRoles("admin"),
  validateTaskId,
  taskController.archiveTask
);

export default router;
