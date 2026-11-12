
import Enrollment from "../internships/enrollment.model.js";
import TaskAssignment from "./taskAssignment.model.js";

import {
  getSprintNumber,
  canProgressToNextSprint,
  SPRINT_DURATION,
} from "./assignment.rules.js";

import {
  assignSprintTasks,
} from "./assignment.service.js";

const getCurrentDay = (startDate, currentDate = new Date()) => {
  const start = new Date(startDate);

  const elapsed = Math.floor(
    (currentDate.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return elapsed + 1;
};

export const getProgressionStatus = async ({
  enrollmentId,
  currentDate = new Date(),
}) => {
  const enrollment = await Enrollment.findById(
    enrollmentId
  );

  if (!enrollment) {
    throw new Error("Enrollment not found.");
  }

  const startDate =
    enrollment.startedAt || enrollment.enrolledAt;

  const currentDay = getCurrentDay(
    startDate,
    currentDate
  );

  const scheduledSprint = getSprintNumber(
    startDate,
    currentDate
  );

  if (scheduledSprint === 0) {
    return {
      currentDay,
      scheduledSprint,
      eligible: false,
      reason: "Internship has not started yet.",
    };
  }

  const assignments = await TaskAssignment.find({
    enrollment: enrollmentId,
    sprintNumber: scheduledSprint,
  }).lean();

  if (scheduledSprint === 1) {
    return {
      currentDay,
      scheduledSprint,
      eligible: true,
      reason: "Sprint 1 is available.",
      assignments,
    };
  }

  const previousSprint = scheduledSprint - 1;

  const previousAssignments = await TaskAssignment.find({
    enrollment: enrollmentId,
    sprintNumber: previousSprint,
  }).lean();

  const result = canProgressToNextSprint({
    currentSprint: previousSprint,
    assignments: previousAssignments,
    currentDay,
  });

  return {
    currentDay,
    scheduledSprint,
    previousSprint,
    eligible: result.eligible,
    reason: result.reason,
    assignments,
  };
};

export const progressEnrollment = async ({
  enrollmentId,
  currentDate = new Date(),
}) => {
  const enrollment = await Enrollment.findById(
    enrollmentId
  );

  if (!enrollment) {
    throw new Error("Enrollment not found.");
  }

  if (!["active", "enrolled"].includes(enrollment.status)) {
    throw new Error("Enrollment cannot progress.");
  }

  const startDate =
    enrollment.startedAt || enrollment.enrolledAt;

  const currentDay = getCurrentDay(
    startDate,
    currentDate
  );

  const scheduledSprint = getSprintNumber(
    startDate,
    currentDate
  );

  if (scheduledSprint === 0) {
    return {
      success: false,
      message: "Internship has not started yet.",
    };
  }

  if (currentDay > SPRINT_DURATION * 3) {
    return {
      success: false,
      message: "Internship duration has ended.",
    };
  }

  // Sprint 1 is assigned when enrollment begins.
  if (scheduledSprint === 1) {
    const existing = await TaskAssignment.exists({
      enrollment: enrollmentId,
      sprintNumber: 1,
    });

    if (existing) {
      return {
        success: true,
        message: "Sprint 1 tasks are already assigned.",
        sprintNumber: 1,
      };
    }

    const result = await assignSprintTasks({
      enrollmentId,
      sprintNumber: 1,
      currentDate,
    });

    return {
      success: true,
      message: "Sprint 1 tasks assigned successfully.",
      ...result,
    };
  }

  // Check whether the previous sprint is complete.
  const previousSprint = scheduledSprint - 1;

  const previousAssignments = await TaskAssignment.find({
    enrollment: enrollmentId,
    sprintNumber: previousSprint,
  }).lean();

  const progression = canProgressToNextSprint({
    currentSprint: previousSprint,
    assignments: previousAssignments,
    currentDay,
  });

  if (!progression.eligible) {
    return {
      success: false,
      message: progression.reason,
      scheduledSprint,
      currentDay,
    };
  }

  const existing = await TaskAssignment.exists({
    enrollment: enrollmentId,
    sprintNumber: scheduledSprint,
  });

  if (existing) {
    return {
      success: true,
      message: `Sprint ${scheduledSprint} tasks are already assigned.`,
      sprintNumber: scheduledSprint,
    };
  }

  const result = await assignSprintTasks({
    enrollmentId,
    sprintNumber: scheduledSprint,
    currentDate,
  });

  return {
    success: true,
    message: `Sprint ${scheduledSprint} assigned successfully.`,
    ...result,
  };
};
