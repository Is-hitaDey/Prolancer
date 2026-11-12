
import mongoose from "mongoose";

const submissionDeliverableSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "github_repository",
        "deployment_url",
        "document",
        "other",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },

    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskAssignment",
      required: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    deliverables: {
      type: [submissionDeliverableSchema],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "At least one deliverable is required.",
      },
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "changes_requested",
        "accepted",
        "rejected",
      ],
      default: "submitted",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Each attempt must be unique.
submissionSchema.index(
  {
    assignment: 1,
    attemptNumber: 1,
  },
  {
    unique: true,
  }
);

// Fetch submission history for a developer's assignment.
submissionSchema.index({
  assignment: 1,
  createdAt: -1,
});

// Fetch all submissions belonging to an enrollment.
submissionSchema.index({
  enrollment: 1,
  createdAt: -1,
});

// Fetch submissions belonging to a user.
submissionSchema.index({
  user: 1,
  createdAt: -1,
});

const Submission = mongoose.model(
  "Submission",
  submissionSchema
);

export default Submission;
