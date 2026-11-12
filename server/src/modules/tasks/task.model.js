
import mongoose from "mongoose";

// Sprint details
const sprintSchema = new mongoose.Schema(
    {
        number: {
            type: Number,
            required: true,
            min: 1,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        startDay: {
            type: Number,
            required: true,
            min: 1,
        },

        endDay: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { _id: false }
);

// Expected deliverables
const deliverableSchema = new mongoose.Schema(
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

        description: {
            type: String,
            trim: true,
        },

        required: {
            type: Boolean,
            default: true,
        },
    },
    { _id: false }
);

// Evaluation criteria
const evaluationCriteriaSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        weight: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
    },
    { _id: false }
);

const taskSchema = new mongoose.Schema(
    {
        // Internship reference
        internship: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Internship",
            required: true,
        },
        template: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TaskTemplate",
            default: null,
        },

        // Basic task information
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 150,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        // Sprint information
        sprint: {
            type: sprintSchema,
            required: true,
        },

        // Task classification
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            required: true,
        },

        category: {
            type: String,
            required: true,
            trim: true,
        },

        // Detailed implementation instructions
        instructions: {
            type: [String],
            default: [],
        },

        // Conditions for successful completion
        acceptanceCriteria: {
            type: [String],
            default: [],
        },

        // Expected submission requirements
        deliverables: {
            type: [deliverableSchema],
            default: [],
        },

        // Estimated completion time in hours
        estimatedHours: {
            type: Number,
            required: true,
            min: 1,
        },

        // How the task will be evaluated
        evaluationCriteria: {
            type: [evaluationCriteriaSchema],
            default: [],
        },

        // Display ordering within a sprint
        order: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Task lifecycle
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft",
        },

        publishedAt: {
            type: Date,
            default: null,
        },

        // Admin who created the task
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Validate sprint day range
taskSchema.pre("validate", function () {
    if (
        this.sprint &&
        this.sprint.startDay &&
        this.sprint.endDay &&
        this.sprint.endDay < this.sprint.startDay
    ) {
        this.invalidate(
            "sprint.endDay",
            "Sprint end day must be greater than or equal to start day."
        );
    }
});

// Index for fetching tasks belonging to an internship
taskSchema.index({
    internship: 1,
    status: 1,
});

// Index for sprint-wise task retrieval
taskSchema.index({
    internship: 1,
    "sprint.number": 1,
    status: 1,
});

// Index for filtering by difficulty
taskSchema.index({
    internship: 1,
    difficulty: 1,
    status: 1,
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
