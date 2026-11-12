
import mongoose from "mongoose";

export const validateCreateSubmission = (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { deliverables, notes } = req.body;

    const errors = {};

    if (!mongoose.isValidObjectId(assignmentId)) {
      errors.assignmentId = "Invalid assignment ID.";
    }

    if (!Array.isArray(deliverables) || deliverables.length === 0) {
      errors.deliverables = "At least one deliverable is required.";
    } else {
      const allowedTypes = [
        "github_repository",
        "deployment_url",
        "document",
        "other",
      ];

      deliverables.forEach((item, index) => {
        if (!allowedTypes.includes(item.type)) {
          errors[`deliverables.${index}.type`] =
            "Invalid deliverable type.";
        }

        if (!item.title || typeof item.title !== "string") {
          errors[`deliverables.${index}.title`] =
            "Deliverable title is required.";
        }

        if (!item.url || typeof item.url !== "string") {
          errors[`deliverables.${index}.url`] =
            "Deliverable URL is required.";
        }
      });
    }

    if (
      notes !== undefined &&
      (typeof notes !== "string" || notes.length > 2000)
    ) {
      errors.notes = "Notes must be a string of at most 2000 characters.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors,
      });
    }

    req.validated = {
      params: { assignmentId },
      body: {
        deliverables,
        notes: notes || "",
      },
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const validateAssignmentId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.assignmentId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid assignment ID.",
    });
  }

  req.validated = {
    params: {
      assignmentId: req.params.assignmentId,
    },
  };

  next();
};

export const validateSubmissionId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.submissionId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid submission ID.",
    });
  }

  req.validated = {
    params: {
      submissionId: req.params.submissionId,
    },
  };

  next();
};
