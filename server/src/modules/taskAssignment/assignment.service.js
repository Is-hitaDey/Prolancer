
import Enrollment from "../internships/enrollment.model.js";
import Task from "../tasks/task.model.js";
import TaskAssignment from "./taskAssignment.model.js";

import {
    validateEnrollment,
    validateTaskAvailability,
    getSprintNumber,
    getSprintDetails,
    canAssignSprint,
    canProgressToNextSprint,
    DIFFICULTY_LEVELS,
} from "./assignment.rules.js";

import {
    getDifficultyForEnrollment,
} from "./difficulty.service.js";

const getCurrentDay = (startDate, currentDate) => {
    const start = new Date(startDate);

    return (
        Math.floor(
            (currentDate.getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
    );
};

const getEligibleTasks = (tasks, difficulty) => {
    const difficultyIndex =
        DIFFICULTY_LEVELS.indexOf(difficulty);

    // Prefer tasks at or below the developer's
    // current difficulty level.
    const eligibleTasks = tasks.filter((task) => {
        const taskIndex = DIFFICULTY_LEVELS.indexOf(
            task.difficulty
        );

        return taskIndex <= difficultyIndex;
    });

    // If no tasks match, retain the sprint's
    // curated tasks instead of assigning nothing.
    return eligibleTasks.length > 0
        ? eligibleTasks
        : tasks;
};

export const assignSprintTasks = async ({
    enrollmentId,
    sprintNumber,
    currentDate = new Date(),
}) => {
    const enrollment = await Enrollment.findById(
        enrollmentId
    );

    validateEnrollment(enrollment);

    const startDate =
        enrollment.startedAt || enrollment.enrolledAt;

    const currentDay = getCurrentDay(
        startDate,
        currentDate
    );

    const currentSprint = getSprintNumber(
        startDate,
        currentDate
    );

    if (!canAssignSprint(sprintNumber, currentSprint)) {
        throw new Error(
            "This sprint is not scheduled for assignment yet."
        );
    }

    // Check previous sprint completion.
    if (sprintNumber > 1) {
        const previousAssignments = await TaskAssignment.find({
            enrollment: enrollmentId,
            sprintNumber: sprintNumber - 1,
        }).lean();

        const progression = canProgressToNextSprint({
            currentSprint: sprintNumber - 1,
            assignments: previousAssignments,
            currentDay,
        });

        if (!progression.eligible) {
            throw new Error(progression.reason);
        }
    }

    const sprintDetails = getSprintDetails(sprintNumber);

    // Fetch internship-specific published tasks.
    const tasks = await Task.find({
        internship: enrollment.internship,
        "sprint.number": sprintNumber,
        status: "published",
    }).sort({ order: 1, createdAt: 1 });

    validateTaskAvailability(tasks);

    // Determine the developer's adaptive difficulty.
    const difficultyResult =
        await getDifficultyForEnrollment({
            TaskAssignment,
            enrollmentId,
            currentDifficulty: "beginner",
        });

    const selectedTasks = getEligibleTasks(
        tasks,
        difficultyResult.difficulty
    );

    const dueAt = new Date(startDate);

    dueAt.setDate(
        dueAt.getDate() + sprintDetails.endDay - 1
    );

    // Exclude tasks already assigned.
    const existingAssignments = await TaskAssignment.find({
        enrollment: enrollmentId,
        task: {
            $in: selectedTasks.map((task) => task._id),
        },
    })
        .select("task")
        .lean();

    const existingTaskIds = new Set(
        existingAssignments.map((assignment) =>
            assignment.task.toString()
        )
    );

    const newTasks = selectedTasks.filter(
        (task) => !existingTaskIds.has(task._id.toString())
    );

    if (newTasks.length === 0) {
        return {
            enrollmentId,
            sprintNumber,
            assignedCount: 0,
            assignments: [],
            message: "All eligible tasks are already assigned.",
        };
    }

    const assignmentDocuments = newTasks.map(
        (task, index) => ({
            enrollment: enrollment._id,
            internship: enrollment.internship,
            task: task._id,
            sprintNumber,
            difficultyAtAssignment: task.difficulty,
            order: index + 1,
            status: "todo",
            assignedAt: currentDate,
            dueAt,
        })
    );

    // Ordered false allows other valid assignments
    // to succeed if a duplicate is encountered.
    try {
        await TaskAssignment.insertMany(
            assignmentDocuments,
            { ordered: false }
        );
    } catch (error) {
        // Duplicate key errors can occur if two
        // assignment requests run simultaneously.
        if (
            error.code !== 11000 &&
            !error.writeErrors?.some(
                (item) => item.code === 11000
            )
        ) {
            throw error;
        }
    }

    const assignments = await TaskAssignment.find({
        enrollment: enrollmentId,
        sprintNumber,
    })
        .populate("task")
        .sort({ order: 1 });

    return {
        enrollmentId,
        internshipId: enrollment.internship,
        sprintNumber,
        sprint: sprintDetails,
        difficulty: difficultyResult.difficulty,
        difficultyAction: difficultyResult.action,
        assignedCount: assignments.length,
        assignments,
    };
};

// Assign the first sprint when a developer starts.
export const assignInitialTasks = async ({
    enrollmentId,
    currentDate = new Date(),
}) => {
    const enrollment = await Enrollment.findById(
        enrollmentId
    );

    validateEnrollment(enrollment);

    return assignSprintTasks({
        enrollmentId,
        sprintNumber: 1,
        currentDate,
    });
};

// Get all assignments for a developer.
export const getEnrollmentAssignments = async ({
    enrollmentId,
    sprintNumber,
}) => {
    const query = {
        enrollment: enrollmentId,
    };

    if (sprintNumber) {
        query.sprintNumber = sprintNumber;
    }

    return TaskAssignment.find(query)
        .populate("task")
        .sort({
            sprintNumber: 1,
            order: 1,
        });
};
