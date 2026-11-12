
import mongoose from "mongoose";

const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: "Validation failed.",
    errors,
  });
};

export const validateCreateEvaluation = (req, res, next) => {
  const errors = [];
  const { submissionId } = req.params;
  const { checks, summary } = req.body;

  if (!mongoose.isValidObjectId(submissionId)) {
    errors.push({
      field: "submissionId",
      message: "Invalid submission ID.",
    });
  }

  if (!Array.isArray(checks) || checks.length === 0) {
    errors.push({
      field: "checks",
      message: "At least one evaluation check is required.",
    });
  } else {
    checks.forEach((check, index) => {
      if (
        typeof check.criterionTitle !== "string" ||
        !check.criterionTitle.trim()
      ) {
        errors.push({
          field: `checks[${index}].criterionTitle`,
          message: "Criterion title is required.",
        });
      }

      if (typeof check.passed !== "boolean") {
        errors.push({
          field: `checks[${index}].passed`,
          message: "Passed must be a boolean.",
        });
      }

      if (
        check.feedback !== undefined &&
        typeof check.feedback !== "string"
      ) {
        errors.push({
          field: `checks[${index}].feedback`,
          message: "Feedback must be a string.",
        });
      }
    });
  }

  if (
    summary !== undefined &&
    (typeof summary !== "string" || summary.length > 2000)
  ) {
    errors.push({
      field: "summary",
      message: "Summary must be a string of at most 2000 characters.",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.validated = {
    params: { submissionId },
    body: {
      checks: checks.map((check) => ({
        criterionTitle: check.criterionTitle.trim(),
        passed: check.passed,
        feedback: check.feedback || "",
      })),
      summary: summary || "",
    },
  };

  next();
};

export const validateSubmissionId = (req, res, next) => {
  const { submissionId } = req.params;

  if (!mongoose.isValidObjectId(submissionId)) {
    return sendValidationError(res, [
      {
        field: "submissionId",
        message: "Invalid submission ID.",
      },
    ]);
  }

  req.validated = {
    params: { submissionId },
  };

  next();
};
