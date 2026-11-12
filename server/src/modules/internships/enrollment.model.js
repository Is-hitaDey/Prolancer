
import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "enrolled",
        "active",
        "completed",
        "withdrawn",
      ],
      default: "enrolled",
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    withdrawnAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A developer can enroll only once per internship
enrollmentSchema.index(
  { user: 1, internship: 1 },
  { unique: true }
);

// Useful for fetching internship participants
enrollmentSchema.index({
  internship: 1,
  status: 1,
});

// Useful for fetching a developer's enrollments
enrollmentSchema.index({
  user: 1,
  status: 1,
});

const Enrollment = mongoose.model(
  "Enrollment",
  enrollmentSchema
);

export default Enrollment;
