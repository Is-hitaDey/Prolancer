
import * as evaluationService from "./evaluation.service.js";

export const createEvaluation = async (req, res, next) => {
  try {
    const evaluation = await evaluationService.createEvaluation({
      submissionId: req.validated.params.submissionId,
      evaluatorId: req.user.userId,
      checks: req.validated.body.checks,
      summary: req.validated.body.summary,
    });

    res.status(201).json({
      success: true,
      message: "Submission evaluated successfully.",
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

export const getEvaluationBySubmission = async (
  req,
  res,
  next
) => {
  try {
    const evaluation =
      await evaluationService.getEvaluationBySubmission({
        submissionId: req.validated.params.submissionId,
        user: req.user,
      });

    res.status(200).json({
      success: true,
      message: "Evaluation fetched successfully.",
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};
