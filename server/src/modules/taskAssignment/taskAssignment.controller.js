
import mongoose from "mongoose";

import Enrollment from "../internships/enrollment.model.js";
import * as assignmentService from "./assignment.service.js";
import * as progressionService from "./progression.service.js";
import TaskAssignment from "./taskAssignment.model.js";

// Verify enrollment ownership.
const verifyEnrollmentAccess = async (enrollmentId, user) => {
  if (!mongoose.isValidObjectId(enrollmentId)) {
    const error = new Error("Invalid enrollment ID.");
    error.statusCode = 400;
    throw error;
  }

  const enrollment = await Enrollment.findById(enrollmentId);

  if (!enrollment) {
    const error = new Error("Enrollment not found.");
    error.statusCode = 404;
    throw error;
  }

  if (
    user.role !== "admin" &&
    enrollment.user.toString() !== user.userId
  ) {
    const error = new Error("You cannot access this enrollment.");
    error.statusCode = 403;
    throw error;
  }

  return enrollment;
};

// POST: Assign initial Sprint 1 tasks.
export const assignInitialTasks = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;

    await verifyEnrollmentAccess(enrollmentId, req.user);

    const result = await assignmentService.assignInitialTasks({
      enrollmentId,
    });

    res.status(201).json({
      success: true,
      message: "Initial tasks assigned successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// POST: Assign a particular sprint.
export const assignSprintTasks = async (req, res, next) => {
  try {
    const { enrollmentId, sprintNumber } = req.params;

    await verifyEnrollmentAccess(enrollmentId, req.user);

    const sprint = Number(sprintNumber);

    if (![1, 2, 3].includes(sprint)) {
      return res.status(400).json({
        success: false,
        message: "Sprint number must be 1, 2 or 3.",
      });
    }

    const result = await assignmentService.assignSprintTasks({
      enrollmentId,
      sprintNumber: sprint,
    });

    res.status(201).json({
      success: true,
      message: `Sprint ${sprint} tasks assigned successfully.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// GET: Fetch all assignments for an enrollment.
export const getEnrollmentAssignments = async (
  req,
  res,
  next
) => {
  try {
    const { enrollmentId } = req.params;

    await verifyEnrollmentAccess(enrollmentId, req.user);

    const sprintNumber = req.query.sprint
      ? Number(req.query.sprint)
      : undefined;

    if (
      sprintNumber !== undefined &&
      ![1, 2, 3].includes(sprintNumber)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sprint filter.",
      });
    }

    const assignments =
      await assignmentService.getEnrollmentAssignments({
        enrollmentId,
        sprintNumber,
      });

    res.status(200).json({
      success: true,
      message: "Assignments fetched successfully.",
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

// GET: Check progression eligibility.
export const getProgressionStatus = async (
  req,
  res,
  next
) => {
  try {
    const { enrollmentId } = req.params;

    await verifyEnrollmentAccess(enrollmentId, req.user);

    const result =
      await progressionService.getProgressionStatus({
        enrollmentId,
      });

    res.status(200).json({
      success: true,
      message: "Progression status fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// POST: Process progression and assign next sprint.
export const progressEnrollment = async (
  req,
  res,
  next
) => {
  try {
    const { enrollmentId } = req.params;

    await verifyEnrollmentAccess(enrollmentId, req.user);

    const result =
      await progressionService.progressEnrollment({
        enrollmentId,
      });

    res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
