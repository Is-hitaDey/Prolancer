
import express from "express";

import * as internshipController from "./internship.controller.js";

import {
  createInternshipSchema,
  updateInternshipSchema,
  internshipStatusSchema,
  internshipIdSchema,
  enrollmentQuerySchema,
  internshipListQuerySchema,
  enrollmentIdSchema,
} from "./internship.validation.js";

import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Validate request using Zod
const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  req.validated = result.data;

  next();
};

// ==========================================
// ADMIN ROUTES
// ==========================================

// Create internship
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  validateRequest(createInternshipSchema),
  internshipController.createInternship
);

// Update internship
router.patch(
  "/:internshipId",
  authenticate,
  authorizeRoles("admin"),
  validateRequest(updateInternshipSchema),
  internshipController.updateInternship
);

// Change internship status
router.patch(
  "/:internshipId/status",
  authenticate,
  authorizeRoles("admin"),
  validateRequest(internshipStatusSchema),
  internshipController.updateInternshipStatus
);

// View internship participants
router.get(
  "/:internshipId/participants",
  authenticate,
  authorizeRoles("admin"),
  validateRequest(internshipIdSchema),
  internshipController.getInternshipParticipants
);

// ==========================================
// DEVELOPER ROUTES
// ==========================================

// Get my enrollments
router.get(
  "/my-enrollments",
  authenticate,
  authorizeRoles("developer"),
  validateRequest(enrollmentQuerySchema),
  internshipController.getMyEnrollments
);

// Enroll in internship
router.post(
  "/:internshipId/enroll",
  authenticate,
  authorizeRoles("developer"),
  validateRequest(internshipIdSchema),
  internshipController.enrollDeveloper
);

// Withdraw enrollment
router.patch(
  "/enrollments/:enrollmentId/withdraw",
  authenticate,
  authorizeRoles("developer"),
  validateRequest(enrollmentIdSchema),
  internshipController.withdrawEnrollment
);

// ==========================================
// PUBLIC ROUTES
// ==========================================

// List published internships
router.get(
  "/",
  validateRequest(internshipListQuerySchema),
  internshipController.getInternships
);

// Get internship details
router.get(
  "/:internshipId",
  validateRequest(internshipIdSchema),
  internshipController.getInternshipById
);

export default router;
