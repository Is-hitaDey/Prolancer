
import mongoose from "mongoose";
import Internship from "./internship.model.js";
import Enrollment from "./enrollment.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Generate URL-friendly slugs
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

// Create internship
export const createInternship = async (data, adminId) => {
  const slug = data.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const internship = await Internship.create({
    ...data,
    slug,
    createdBy: adminId,
  });

  return internship;
};

// Update internship
export const updateInternship = async (internshipId, data) => {
  const internship = await Internship.findById(internshipId);

  if (!internship) {
    throw createError("Internship not found.", 404);
  }

  if (
    ["cancelled", "closed"].includes(internship.status)
  ) {
    throw createError(
      "This internship can no longer be edited.",
      400
    );
  }

  const updatedFields = {
    ...data,
  };

  // Validate the combined date range, not just the changed field
  const startDate = data.startDate ?? internship.startDate;
  const endDate = data.endDate ?? internship.endDate;

  if (new Date(endDate) <= new Date(startDate)) {
    throw createError(
      "End date must be after start date.",
      400
    );
  }

  if (data.maxParticipants !== undefined) {
    const enrolledCount = await Enrollment.countDocuments({
      internship: internshipId,
      status: { $ne: "withdrawn" },
    });

    if (data.maxParticipants < enrolledCount) {
      throw createError(
        "Maximum participants cannot be less than current participants.",
        400
      );
    }
  }

  Object.assign(internship, updatedFields);

  await internship.save();

  return internship;
};

// Change internship status
export const updateInternshipStatus = async (
  internshipId,
  status
) => {
  const internship = await Internship.findById(internshipId);

  if (!internship) {
    throw createError("Internship not found.", 404);
  }

  const transitions = {
    draft: ["published", "cancelled"],
    published: ["closed", "cancelled"],
    closed: ["published", "cancelled"],
    cancelled: [],
  };

  if (!transitions[internship.status].includes(status)) {
    throw createError(
      `Cannot change status from ${internship.status} to ${status}.`,
      400
    );
  }

  if (status === "published") {
    if (internship.endDate <= new Date()) {
      throw createError(
        "An expired internship cannot be published.",
        400
      );
    }
  }

  internship.status = status;

  await internship.save();

  return internship;
};

// List published internships
export const getInternships = async (query) => {
  const {
    page = 1,
    limit = 10,
    category,
    difficulty,
    search,
    sort = "newest",
  } = query;

  const filter = {
    status: "published",
  };

  if (category) {
    filter.category = new RegExp(
      category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
  }

  if (difficulty) {
    filter.difficulty = difficulty;
  }

  if (search) {
    const safeSearch = search.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    filter.$or = [
      { title: new RegExp(safeSearch, "i") },
      { shortDescription: new RegExp(safeSearch, "i") },
      { category: new RegExp(safeSearch, "i") },
      { skills: new RegExp(safeSearch, "i") },
    ];
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    upcoming: { startDate: 1 },
  };

  const skip = (page - 1) * limit;

  const [internships, total] = await Promise.all([
    Internship.find(filter)
      .sort(sortOptions[sort])
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name"),

    Internship.countDocuments(filter),
  ]);

  return {
    internships,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get internship details
export const getInternshipById = async (internshipId) => {
  const internship = await Internship.findById(internshipId)
    .populate("createdBy", "name");

  if (!internship) {
    throw createError("Internship not found.", 404);
  }

  return internship;
};

// Enroll developer
export const enrollDeveloper = async (internshipId, userId) => {
  if (!mongoose.isValidObjectId(internshipId)) {
    throw createError("Invalid internship ID.", 400);
  }

  const internship = await Internship.findOne({
    _id: internshipId,
    status: "published",
  });

  if (!internship) {
    throw createError(
      "Internship not found or enrollment is closed.",
      404
    );
  }

  if (internship.startDate <= new Date()) {
    throw createError(
      "Enrollment is no longer available for this internship.",
      400
    );
  }

  const existingEnrollment = await Enrollment.findOne({
    user: userId,
    internship: internshipId,
  });

  if (existingEnrollment) {
    throw createError(
      "You have already enrolled in this internship.",
      409
    );
  }

  const currentParticipants = await Enrollment.countDocuments({
    internship: internshipId,
    status: { $ne: "withdrawn" },
  });

  if (currentParticipants >= internship.maxParticipants) {
    throw createError(
      "This internship has reached its participant limit.",
      400
    );
  }

  try {
    return await Enrollment.create({
      user: userId,
      internship: internshipId,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createError(
        "You have already enrolled in this internship.",
        409
      );
    }

    throw error;
  }
};

// Get logged-in developer's enrollments
export const getMyEnrollments = async (userId, query) => {
  const {
    page = 1,
    limit = 10,
    status,
  } = query;

  const filter = {
    user: userId,
  };

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate("internship")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit),

    Enrollment.countDocuments(filter),
  ]);

  return {
    enrollments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Withdraw from internship
export const withdrawEnrollment = async (userId, enrollmentId) => {
  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    user: userId,
  });

  if (!enrollment) {
    throw createError("Enrollment not found.", 404);
  }

  if (
    ["completed", "withdrawn"].includes(enrollment.status)
  ) {
    throw createError(
      "This enrollment cannot be withdrawn.",
      400
    );
  }

  enrollment.status = "withdrawn";
  enrollment.withdrawnAt = new Date();

  await enrollment.save();

  return enrollment;
};

// Admin: Get internship participants
export const getInternshipParticipants = async (
  internshipId,
  query
) => {
  const internship = await Internship.findById(internshipId);

  if (!internship) {
    throw createError("Internship not found.", 404);
  }

  const {
    page = 1,
    limit = 10,
    status,
  } = query;

  const filter = {
    internship: internshipId,
  };

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [participants, total] = await Promise.all([
    Enrollment.find(filter)
      .populate("user", "name email profile")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit),

    Enrollment.countDocuments(filter),
  ]);

  return {
    internship,
    participants,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
//start with task 5- developer enrollment