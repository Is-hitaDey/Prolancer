
import mongoose from "mongoose";

import Task from "./task.model.js";
import TaskTemplate from "./taskTemplate.model.js";
import Internship from "../internships/internship.model.js";
import Enrollment from "../internships/enrollment.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidId = (id) => mongoose.isValidObjectId(id);

// Check developer enrollment
const checkEnrollment = async (userId, internshipId) => {
  const enrollment = await Enrollment.findOne({
    user: userId,
    internship: internshipId,
    status: { $in: ["enrolled", "active"] },
  });

  if (!enrollment) {
    throw createError(
      "You are not enrolled in this internship.",
      403
    );
  }
};

// Create task
export const createTask = async (data, adminId) => {
  const internship = await Internship.findById(data.internship);

  if (!internship) {
    throw createError("Internship not found.", 404);
  }

  // Verify template if supplied
  if (data.template) {
    const template = await TaskTemplate.findOne({
      _id: data.template,
      status: "active",
    });

    if (!template) {
      throw createError(
        "Task template not found or inactive.",
        404
      );
    }
  }

  const task = await Task.create({
    ...data,
    createdBy: adminId,
  });

  return task;
};

// Update task
export const updateTask = async (taskId, data) => {
  if (!isValidId(taskId)) {
    throw createError("Invalid task ID.", 400);
  }

  const task = await Task.findById(taskId);

  if (!task) {
    throw createError("Task not found.", 404);
  }

  if (task.status === "archived") {
    throw createError(
      "Archived tasks cannot be edited.",
      400
    );
  }

  if (data.template) {
    const template = await TaskTemplate.findOne({
      _id: data.template,
      status: "active",
    });

    if (!template) {
      throw createError(
        "Task template not found or inactive.",
        404
      );
    }
  }

  Object.assign(task, data);

  await task.save();

  return task;
};

// Publish task
export const publishTask = async (taskId) => {
  if (!isValidId(taskId)) {
    throw createError("Invalid task ID.", 400);
  }

  const task = await Task.findById(taskId);

  if (!task) {
    throw createError("Task not found.", 404);
  }

  if (task.status !== "draft") {
    throw createError(
      "Only draft tasks can be published.",
      400
    );
  }

  task.status = "published";
  task.publishedAt = new Date();

  await task.save();

  return task;
};

// Archive task
export const archiveTask = async (taskId) => {
  if (!isValidId(taskId)) {
    throw createError("Invalid task ID.", 400);
  }

  const task = await Task.findById(taskId);

  if (!task) {
    throw createError("Task not found.", 404);
  }

  if (task.status === "archived") {
    throw createError("Task is already archived.", 400);
  }

  task.status = "archived";

  await task.save();

  return task;
};

// List tasks
export const getTasks = async (query, user) => {
  const {
    internshipId,
    page,
    limit,
    difficulty,
    category,
    sprint,
    status,
    search,
  } = query;

  const internship = await Internship.findById(internshipId);

  if (!internship) {
    throw createError("Internship not found.", 404);
  }

  const isAdmin = user.role === "admin";

  if (!isAdmin) {
    if (internship.status !== "published") {
      throw createError("Internship not found.", 404);
    }

    await checkEnrollment(user.userId, internshipId);
  }

  const filter = {
    internship: internshipId,
  };

  // Developers can only see published tasks
  if (!isAdmin) {
    filter.status = "published";
  } else if (status) {
    filter.status = status;
  }

  if (difficulty) {
    filter.difficulty = difficulty;
  }

  if (category) {
    filter.category = new RegExp(
      category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
  }

  if (sprint) {
    filter["sprint.number"] = sprint;
  }

  if (search) {
    const safeSearch = search.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    filter.$or = [
      { title: new RegExp(safeSearch, "i") },
      { description: new RegExp(safeSearch, "i") },
      { category: new RegExp(safeSearch, "i") },
    ];
  }

  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate("createdBy", "name")
      .populate("template", "title")
      .sort({
        "sprint.number": 1,
        order: 1,
        createdAt: 1,
      })
      .skip(skip)
      .limit(limit),

    Task.countDocuments(filter),
  ]);

  return {
    tasks,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get task details
export const getTaskById = async (taskId, user) => {
  if (!isValidId(taskId)) {
    throw createError("Invalid task ID.", 400);
  }

  const task = await Task.findById(taskId)
    .populate("internship", "title slug")
    .populate("createdBy", "name")
    .populate("template", "title");

  if (!task) {
    throw createError("Task not found.", 404);
  }

  if (user.role !== "admin") {
    if (task.status !== "published") {
      throw createError("Task not found.", 404);
    }

    const internship = await Internship.findOne({
      _id: task.internship._id,
      status: "published",
    });

    if (!internship) {
      throw createError("Task not found.", 404);
    }

    await checkEnrollment(
      user.userId,
      task.internship._id
    );
  }

  return task;
};
