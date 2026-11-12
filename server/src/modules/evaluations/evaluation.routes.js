
import { Router } from "express";

import * as evaluationController from "./evaluation.controller.js";

import {
  validateCreateEvaluation,
  validateSubmissionId,
} from "./evaluation.validation.js";

import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Create evaluation.
router.post(
  "/submissions/:submissionId",
  authorizeRoles("admin"),
  validateCreateEvaluation,
  evaluationController.createEvaluation
);

// Get evaluation.
router.get(
  "/submissions/:submissionId",
  authorizeRoles("admin", "developer"),
  validateSubmissionId,
  evaluationController.getEvaluationBySubmission
);

export default router;
