
import mongoose from "mongoose";

import Submission from "./submission.model.js";
import TaskAssignment from "../taskAssignment/taskAssignment.model.js";
import Enrollment from "../internships/enrollment.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Validate external URLs.
const validateUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

// Validate submitted deliverables against task requirements.
const validateDeliverables = (requiredDeliverables, submitted) => {
  if (!Array.isArray(submitted) || submitted.length === 0) {
    throw createError("At least one deliverable is required.");
  }

  for (const item of submitted) {
    if (!item.type || !item.title || !item.url) {
      throw createError(
        "Every deliverable must contain type, title and URL."
      );
    }

    if (
      ![
        "github_repository",
        "deployment_url",
        "document",
        "other",
      ].includes(item.type)
    ) {
      throw createError("Invalid deliverable type.");
    }

    if (!validateUrl(item.url)) {
      throw createError(
        `Invalid URL provided for ${item.title}.`
      );
    }
  }

  for (const required of (requiredDeliverables || []).filter(
    (item) => item.required
  )) {
    const exists = submitted.some(
      (item) =>
        item.type === required.type &&
        item.title.trim().toLowerCase() ===
          required.title.trim().toLowerCase()
    );

    if (!exists) {
      throw createError(
        `Missing required deliverable: ${required.title}`
      );
    }
  }

  return true;
};

// Create a new submission attempt.
export const createSubmission = async ({
  assignmentId,
  userId,
  deliverables,
  notes,
}) => {
  if (!mongoose.isValidObjectId(assignmentId)) {
    throw createError("Invalid assignment ID.");
  }

  const assignment = await TaskAssignment.findById(
    assignmentId
  ).populate("task");

  if (!assignment) {
    throw createError("Task assignment not found.", 404);
  }

  const enrollment = await Enrollment.findById(
    assignment.enrollment
  );

  if (!enrollment) {
    throw createError("Enrollment not found.", 404);
  }

  // Verify assignment ownership.
  if (enrollment.user.toString() !== userId.toString()) {
    throw createError(
      "You are not authorized to submit this task.",
      403
    );
  }

  // Verify enrollment status.
  if (!["active", "enrolled"].includes(enrollment.status)) {
    throw createError("Your enrollment is not active.");
  }

  // Check assignment status.
  if (assignment.status === "completed") {
    throw createError("This task has already been completed.");
  }

  if (assignment.status === "blocked") {
    throw createError("This task is currently blocked.");
  }

  if (assignment.status === "submitted") {
    throw createError(
      "Your previous submission is awaiting review."
    );
  }

  if (!["todo", "in_progress"].includes(assignment.status)) {
    throw createError("This task is not eligible for submission.");
  }

  // Check whether this is a first submission or resubmission.
  const latestSubmission = await Submission.findOne({
    assignment: assignmentId,
  }).sort({ attemptNumber: -1 });

  if (
    latestSubmission &&
    latestSubmission.status !== "changes_requested"
  ) {
    throw createError(
      "Resubmission is only allowed after the evaluator requests changes."
    );
  }

  const task = assignment.task;

  if (!task) {
    throw createError("Associated task not found.", 404);
  }

  // Validate deliverables.
  validateDeliverables(task.deliverables, deliverables);

  // Determine the next attempt number.
  const attemptNumber = latestSubmission
    ? latestSubmission.attemptNumber + 1
    : 1;

  const submission = await Submission.create({
    enrollment: assignment.enrollment,
    assignment: assignment._id,
    task: task._id,
    user: userId,
    attemptNumber,
    deliverables,
    notes: notes || "",
    status: "submitted",
  });

  // Update assignment status.
  assignment.status = "submitted";
  assignment.evaluationOutcome = "pending";
  assignment.evaluationScore = null;

  await assignment.save();

  return submission;
};

// Fetch submission history for an assignment.
export const getSubmissionHistory = async ({
  assignmentId,
  userId,
}) => {
  if (!mongoose.isValidObjectId(assignmentId)) {
    throw createError("Invalid assignment ID.");
  }

  const assignment = await TaskAssignment.findById(
    assignmentId
  );

  if (!assignment) {
    throw createError("Task assignment not found.", 404);
  }

  const enrollment = await Enrollment.findById(
    assignment.enrollment
  );

  if (!enrollment) {
    throw createError("Enrollment not found.", 404);
  }

  if (enrollment.user.toString() !== userId.toString()) {
    throw createError(
      "You are not authorized to view this submission history.",
      403
    );
  }

  return Submission.find({
    assignment: assignmentId,
  })
    .populate("task", "title difficulty category")
    .sort({ attemptNumber: -1 });
};

// Fetch one submission.
export const getSubmissionById = async ({
  submissionId,
  userId,
}) => {
  if (!mongoose.isValidObjectId(submissionId)) {
    throw createError("Invalid submission ID.");
  }

  const submission = await Submission.findById(submissionId)
    .populate("task")
    .populate("assignment");

  if (!submission) {
    throw createError("Submission not found.", 404);
  }

  if (submission.user.toString() !== userId.toString()) {
    throw createError(
      "You are not authorized to view this submission.",
      403
    );
  }

  return submission;
};
