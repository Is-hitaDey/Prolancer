import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

// Verify user authentication
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const token = req.cookies?.accessToken || bearerToken;

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.userId || !decoded.role) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    next(new ApiError(401, "Invalid or expired access token"));
  }
};

// Role-based authorization
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You are not authorized to perform this action")
      );
    }

    next();
  };
};