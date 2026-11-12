
import * as submissionService from "./submission.service.js";

// Developer: Submit a task.
export const createSubmission = async (req, res, next) => {
  try {
    const submission = await submissionService.createSubmission({
      assignmentId: req.validated.params.assignmentId,
      userId: req.user.userId,
      deliverables: req.validated.body.deliverables,
      notes: req.validated.body.notes,
    });

    res.status(201).json({
      success: true,
      message: "Task submitted successfully.",
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

// Developer: Get submission history.
export const getSubmissionHistory = async (
  req,
  res,
  next
) => {
  try {
    const submissions =
      await submissionService.getSubmissionHistory({
        assignmentId: req.validated.params.assignmentId,
        userId: req.user.userId,
      });

    res.status(200).json({
      success: true,
      message: "Submission history fetched successfully.",
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

// Developer: Get submission details.
export const getSubmissionById = async (
  req,
  res,
  next
) => {
  try {
    const submission =
      await submissionService.getSubmissionById({
        submissionId: req.validated.params.submissionId,
        userId: req.user.userId,
      });

    res.status(200).json({
      success: true,
      message: "Submission details fetched successfully.",
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};
