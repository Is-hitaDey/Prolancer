
import { Router } from "express";

import * as submissionController from "./submission.controller.js";

import {
  validateCreateSubmission,
  validateAssignmentId,
  validateSubmissionId,
} from "./submission.validation.js";

import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("developer"));

// Developer: Submit a task.
router.post(
  "/assignments/:assignmentId",
  validateCreateSubmission,
  submissionController.createSubmission
);

// Developer: Get all attempts for an assignment.
router.get(
  "/assignments/:assignmentId",
  validateAssignmentId,
  submissionController.getSubmissionHistory
);

// Developer: Get a particular submission.
router.get(
  "/:submissionId",
  validateSubmissionId,
  submissionController.getSubmissionById
);

export default router;
