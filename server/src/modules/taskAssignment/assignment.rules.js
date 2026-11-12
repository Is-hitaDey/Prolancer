
const TOTAL_SPRINTS = 3;
const SPRINT_DURATION = 10;
const INTERNSHIP_DURATION = 30;

const DIFFICULTY_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
];

export const getSprintNumber = (startDate, currentDate = new Date()) => {
  const start = new Date(startDate);

  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid internship start date.");
  }

  const elapsedTime = currentDate.getTime() - start.getTime();
  const elapsedDays = Math.floor(
    elapsedTime / (1000 * 60 * 60 * 24)
  );

  if (elapsedDays < 0) return 0;

  return Math.min(
    Math.floor(elapsedDays / SPRINT_DURATION) + 1,
    TOTAL_SPRINTS
  );
};

export const getSprintDetails = (sprintNumber) => {
  if (
    sprintNumber < 1 ||
    sprintNumber > TOTAL_SPRINTS
  ) {
    throw new Error("Invalid sprint number.");
  }

  const startDay =
    (sprintNumber - 1) * SPRINT_DURATION + 1;

  return {
    number: sprintNumber,
    title: `Sprint ${sprintNumber}`,
    startDay,
    endDay: startDay + SPRINT_DURATION - 1,
  };
};

export const validateEnrollment = (enrollment) => {
  if (!enrollment) {
    throw new Error("Enrollment not found.");
  }

  if (
    !["enrolled", "active"].includes(enrollment.status)
  ) {
    throw new Error(
      "Enrollment is not eligible for task assignment."
    );
  }

  if (!enrollment.startedAt && !enrollment.enrolledAt) {
    throw new Error("Enrollment start date is missing.");
  }

  return true;
};

export const validateTaskAvailability = (tasks) => {
  if (!tasks || tasks.length === 0) {
    throw new Error(
      "No published tasks are available for this sprint."
    );
  }

  return true;
};

export const canAssignSprint = (
  sprintNumber,
  currentSprint
) => {
  return (
    sprintNumber >= 1 &&
    sprintNumber <= TOTAL_SPRINTS &&
    sprintNumber <= currentSprint
  );
};

export const canProgressToNextSprint = ({
  currentSprint,
  assignments,
  currentDay,
}) => {
  if (currentSprint >= TOTAL_SPRINTS) {
    return {
      eligible: false,
      reason: "All sprints have been completed.",
    };
  }

  const nextSprintStartDay =
    currentSprint * SPRINT_DURATION + 1;

  if (currentDay < nextSprintStartDay) {
    return {
      eligible: false,
      reason: "The next sprint is not scheduled yet.",
    };
  }

  if (!assignments || assignments.length === 0) {
    return {
      eligible: false,
      reason: "No assignments found for the current sprint.",
    };
  }

  const incompleteAssignments = assignments.filter(
    (assignment) => assignment.status !== "completed"
  );

  if (incompleteAssignments.length > 0) {
    return {
      eligible: false,
      reason: "Complete all current sprint tasks first.",
    };
  }

  return {
    eligible: true,
    reason: "Eligible for the next sprint.",
  };
};

export const validateDifficulty = (difficulty) => {
  if (!DIFFICULTY_LEVELS.includes(difficulty)) {
    throw new Error("Invalid difficulty level.");
  }

  return true;
};

export {
  TOTAL_SPRINTS,
  SPRINT_DURATION,
  INTERNSHIP_DURATION,
  DIFFICULTY_LEVELS,
};
