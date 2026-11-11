import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    headline: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    avatarUrl: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    interests: {
      type: [String],
      default: [],
    },

    githubUrl: {
      type: String,
      default: "",
    },

    linkedinUrl: {
      type: String,
      default: "",
    },

    portfolioUrl: {
      type: String,
      default: "",
    },

    profileVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["developer", "admin"],
      default: "developer",
    },

    profile: {
      type: profileSchema,
      default: () => ({}),
    },

    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    refreshTokenExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;