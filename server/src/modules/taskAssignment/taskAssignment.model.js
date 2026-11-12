
import mongoose from "mongoose";

const taskAssignmentSchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },

    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    sprintNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },

    difficultyAtAssignment: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "todo",
        "in_progress",
        "submitted",
        "completed",
        "blocked",
      ],
      default: "todo",
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },

    dueAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // Evaluation snapshot used by progression logic.
    evaluationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    evaluationOutcome: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "changes_requested",
        "rejected",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate assignment of the same task.
taskAssignmentSchema.index(
  {
    enrollment: 1,
    task: 1,
  },
  {
    unique: true,
  }
);

// Fetch assignments by enrollment and sprint.
taskAssignmentSchema.index({
  enrollment: 1,
  sprintNumber: 1,
  status: 1,
});

// Fetch assignments by internship.
taskAssignmentSchema.index({
  internship: 1,
  sprintNumber: 1,
});

const TaskAssignment = mongoose.model(
  "TaskAssignment",
  taskAssignmentSchema
);

export default TaskAssignment;
