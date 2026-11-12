
import * as internshipService from "./internship.service.js";

const getUserId = (req) => req.user.id || req.user._id || req.user.userId;

// Admin: Create internship
export const createInternship = async (req, res, next) => {
  try {
    const internship = await internshipService.createInternship(
      req.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: "Internship created successfully",
      data: internship,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update internship
export const updateInternship = async (req, res) => {
    const internship = await internshipService.updateInternship(
        req.params.internshipId,
        req.body
    );

    res.status(200).json({
        success: true,
        message: "Internship updated successfully.",
        data: internship,
    });
};

// Admin: Change status
export const updateInternshipStatus = async (req, res) => {
    const internship = await internshipService.updateInternshipStatus(
        req.params.internshipId,
        req.body.status
    );

    res.status(200).json({
        success: true,
        message: "Internship status updated successfully.",
        data: internship,
    });
};

// Public: List internships
export const getInternships = async (req, res) => {
    const result = await internshipService.getInternships(
        req.validated.query
    );

    res.status(200).json({
        success: true,
        message: "Internships fetched successfully.",
        data: result,
    });
};

// Public: Get internship details
export const getInternshipById = async (req, res) => {
    const internship = await internshipService.getInternshipById(
        req.params.internshipId
    );

    if (internship.status !== "published") {
        const error = new Error("Internship not found.");
        error.statusCode = 404;
        throw error;
    }

    res.status(200).json({
        success: true,
        message: "Internship details fetched successfully.",
        data: internship,
    });
};

// Developer: Enroll
export const enrollDeveloper = async (req, res) => {
    const enrollment = await internshipService.enrollDeveloper(
        req.params.internshipId,
        getUserId(req)
    );

    res.status(201).json({
        success: true,
        message: "Successfully enrolled in internship.",
        data: enrollment,
    });
};

// Developer: Get own enrollments
export const getMyEnrollments = async (req, res) => {
    const result = await internshipService.getMyEnrollments(
        getUserId(req),
        req.validated.query
    );
    res.status(200).json({
        success: true,
        message: "Your enrollments fetched successfully.",
        data: result,
    });
};

// Developer: Withdraw enrollment
export const withdrawEnrollment = async (req, res) => {
    const enrollment = await internshipService.withdrawEnrollment(
        getUserId(req),
        req.params.enrollmentId
    );

    res.status(200).json({
        success: true,
        message: "Enrollment withdrawn successfully.",
        data: enrollment,
    });
};

// Admin: View participants
export const getInternshipParticipants = async (req, res) => {
    const result = await internshipService.getInternshipParticipants(
        req.params.internshipId,
        req.validated.query
    );

    res.status(200).json({
        success: true,
        message: "Internship participants fetched successfully.",
        data: result,
    });
};
