
import { Router } from "express";

import * as assignmentController from "./taskAssignment.controller.js";

import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("admin", "developer"));

// Assign initial Sprint 1 tasks.
router.post(
  "/:enrollmentId/initial",
  assignmentController.assignInitialTasks
);

// Assign a particular sprint.
router.post(
  "/:enrollmentId/sprints/:sprintNumber",
  assignmentController.assignSprintTasks
);

// Get all assignments.
router.get(
  "/:enrollmentId",
  assignmentController.getEnrollmentAssignments
);

// Check sprint progression.
router.get(
  "/:enrollmentId/progression",
  assignmentController.getProgressionStatus
);

// Process next sprint.
router.post(
  "/:enrollmentId/progress",
  assignmentController.progressEnrollment
);

export default router;
