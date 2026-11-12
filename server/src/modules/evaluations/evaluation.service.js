
import mongoose from "mongoose";

import Evaluation from "./evaluation.model.js";
import Submission from "../submissions/submission.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Calculate weighted evaluation score.
const calculateScore = (checks, criteria) => {
  const totalWeight = criteria.reduce(
    (total, criterion) => total + criterion.weight,
    0
  );

  if (totalWeight <= 0) {
    throw createError(
      "Task evaluation criteria must have a total weight greater than zero."
    );
  }

  const earnedWeight = checks.reduce(
    (total, check) => {
      return total + (check.passed ? check.weight : 0);
    },
    0
  );

  return Number(
    ((earnedWeight / totalWeight) * 100).toFixed(2)
  );
};

// Determine the automated evaluation result.
const determineResult = (checks) => {
  const passedCount = checks.filter(
    (check) => check.passed
  ).length;

  if (passedCount === checks.length) {
    return "passed";
  }

  if (passedCount === 0) {
    return "failed";
  }

  return "needs_review";
};

// Create evaluation for a submission.
export const createEvaluation = async ({
  submissionId,
  evaluatorId,
  checks,
  summary,
}) => {
  if (!mongoose.isValidObjectId(submissionId)) {
    throw createError("Invalid submission ID.");
  }

  const submission = await Submission.findById(
    submissionId
  ).populate("task");

  if (!submission) {
    throw createError("Submission not found.", 404);
  }

  if (!submission.task) {
    throw createError("Associated task not found.", 404);
  }

  if (submission.status !== "submitted") {
    throw createError(
      "Only submitted submissions can be evaluated."
    );
  }

  // Prevent duplicate evaluations.
  const existingEvaluation = await Evaluation.findOne({
    submission: submissionId,
  });

  if (existingEvaluation) {
    throw createError(
      "This submission has already been evaluated.",
      409
    );
  }

  const criteria = submission.task.evaluationCriteria || [];

  if (criteria.length === 0) {
    throw createError(
      "No evaluation criteria are configured for this task."
    );
  }

  // Match checks against the task's predefined criteria.
  const normalizedCriteria = criteria.map((criterion) => ({
    title: criterion.title.trim(),
    weight: criterion.weight,
  }));

  const submittedTitles = checks.map((check) =>
    check.criterionTitle.trim().toLowerCase()
  );

  if (new Set(submittedTitles).size !== submittedTitles.length) {
    throw createError(
      "Duplicate evaluation criteria are not allowed."
    );
  }

  if (checks.length !== normalizedCriteria.length) {
    throw createError(
      "Every task evaluation criterion must be evaluated exactly once."
    );
  }

  const evaluatedChecks = [];

  for (const criterion of normalizedCriteria) {
    const submittedCheck = checks.find(
      (check) =>
        check.criterionTitle.trim().toLowerCase() ===
        criterion.title.toLowerCase()
    );

    if (!submittedCheck) {
      throw createError(
        `Missing evaluation criterion: ${criterion.title}`
      );
    }

    evaluatedChecks.push({
      criterionTitle: criterion.title,
      weight: criterion.weight,
      passed: submittedCheck.passed,
      feedback: submittedCheck.feedback || "",
    });
  }

  // Calculate score and result.
  const score = calculateScore(
    evaluatedChecks,
    normalizedCriteria
  );

  const result = determineResult(evaluatedChecks);

  const evaluation = await Evaluation.create({
    submission: submission._id,
    task: submission.task._id,
    assignment: submission.assignment,
    evaluatedBy: evaluatorId,
    checks: evaluatedChecks,
    score,
    result,
    summary: summary || "",
  });

  // Automated evaluation does not accept or reject a submission.
  submission.status = "under_review";
  submission.reviewedAt = new Date();

  await submission.save();

  return evaluation;
};

// Fetch evaluation by submission ID.
export const getEvaluationBySubmission = async ({
  submissionId,
  user,
}) => {
  if (!mongoose.isValidObjectId(submissionId)) {
    throw createError("Invalid submission ID.");
  }

  const evaluation = await Evaluation.findOne({
    submission: submissionId,
  })
    .populate("submission")
    .populate("task", "title difficulty category")
    .populate("assignment")
    .populate("evaluatedBy", "name email");

  if (!evaluation) {
    throw createError("Evaluation not found.", 404);
  }

  // Developers can only view evaluations of their own submissions.
  if (user.role === "developer") {
    if (
      evaluation.submission.user.toString() !==
      user.userId.toString()
    ) {
      throw createError(
        "You are not authorized to view this evaluation.",
        403
      );
    }
  }

  return evaluation;
};
