
import {
  DIFFICULTY_LEVELS,
  validateDifficulty,
} from "./assignment.rules.js";

const PROMOTION_SCORE = 80;
const REQUIRED_SUCCESSFUL_TASKS = 3;
const REQUIRED_FAILED_TASKS = 2;

const getDifficultyIndex = (difficulty) => {
  validateDifficulty(difficulty);

  return DIFFICULTY_LEVELS.indexOf(difficulty);
};

export const calculateDifficulty = ({
  currentDifficulty = "beginner",
  recentAssignments = [],
}) => {
  const currentIndex = getDifficultyIndex(currentDifficulty);

  if (!recentAssignments.length) {
    return {
      difficulty: currentDifficulty,
      action: "maintain",
      reason: "No previous evaluation history.",
    };
  }

  // Most recent evaluations first.
  const recent = [...recentAssignments]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    );

  const lastThree = recent.slice(
    0,
    REQUIRED_SUCCESSFUL_TASKS
  );

  const lastTwo = recent.slice(
    0,
    REQUIRED_FAILED_TASKS
  );

  const canPromote =
    lastThree.length === REQUIRED_SUCCESSFUL_TASKS &&
    lastThree.every(
      (assignment) =>
        assignment.evaluationOutcome === "accepted" &&
        assignment.evaluationScore !== null &&
        assignment.evaluationScore >= PROMOTION_SCORE
    );

  if (canPromote) {
    const nextIndex = Math.min(
      currentIndex + 1,
      DIFFICULTY_LEVELS.length - 1
    );

    return {
      difficulty: DIFFICULTY_LEVELS[nextIndex],
      action:
        nextIndex > currentIndex ? "promote" : "maintain",
      reason:
        nextIndex > currentIndex
          ? "Three consecutive high-scoring evaluations."
          : "Developer is already at maximum difficulty.",
    };
  }

  const canDemote =
    lastTwo.length === REQUIRED_FAILED_TASKS &&
    lastTwo.every(
      (assignment) =>
        ["changes_requested", "rejected"].includes(
          assignment.evaluationOutcome
        )
    );

  if (canDemote) {
    const previousIndex = Math.max(
      currentIndex - 1,
      0
    );

    return {
      difficulty: DIFFICULTY_LEVELS[previousIndex],
      action:
        previousIndex < currentIndex ? "reassess" : "maintain",
      reason:
        previousIndex < currentIndex
          ? "Two consecutive unsuccessful evaluations."
          : "Developer is already at minimum difficulty.",
    };
  }

  return {
    difficulty: currentDifficulty,
    action: "maintain",
    reason: "Performance requirements for adjustment not met.",
  };
};


export const getDifficultyForEnrollment = async ({
  TaskAssignment,
  enrollmentId,
  currentDifficulty,
}) => {
  const recentAssignments = await TaskAssignment.find({
    enrollment: enrollmentId,
    evaluationOutcome: {
      $in: ["accepted", "changes_requested", "rejected"],
    },
  })
    .sort({ updatedAt: -1 })
    .limit(3)
    .lean();

  const previousDifficulty =
    currentDifficulty ||
    recentAssignments[0]?.difficultyAtAssignment ||
    "beginner";

  return calculateDifficulty({
    currentDifficulty: previousDifficulty,
    recentAssignments,
  });
};

