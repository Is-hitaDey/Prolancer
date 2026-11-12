
import mongoose from "mongoose";

const evaluationCheckSchema = new mongoose.Schema(
  {
    criterionTitle: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
      unique: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskAssignment",
      required: true,
    },

    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    checks: {
      type: [evaluationCheckSchema],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "At least one evaluation check is required.",
      },
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    result: {
      type: String,
      enum: ["passed", "failed", "needs_review"],
      required: true,
    },

    summary: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

evaluationSchema.index({ task: 1, createdAt: -1 });
evaluationSchema.index({ assignment: 1 });

const Evaluation = mongoose.model(
  "Evaluation",
  evaluationSchema
);

export default Evaluation;
