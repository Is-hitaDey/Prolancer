import {
  registerUser,
  loginUser,
  logoutUser,
  refreshUserTokens,
  getCurrentUser,
} from "./auth.service.js";

import ApiResponse from "../../utils/ApiResponse.js";

// Cookie configuration
const getCookieOptions = (path = "/") => {
  const sameSite = process.env.COOKIE_SAME_SITE || "lax";

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    sameSite,
    path,
  };
};

// Set authentication cookies
const setAuthCookies = (res, tokens) => {
  res.cookie("accessToken", tokens.accessToken, {
    ...getCookieOptions("/"),
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", tokens.refreshToken, {
    ...getCookieOptions("/api/v1/auth/refresh"),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Register
export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);

    setAuthCookies(res, result);

    res.status(201).json(
      new ApiResponse(
        201,
        "Account created successfully",
        result.user
      )
    );
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    setAuthCookies(res, result);

    res.status(200).json(
      new ApiResponse(
        200,
        "Login successful",
        result.user
      )
    );
  } catch (error) {
    next(error);
  }
};

// Refresh tokens
export const refresh = async (req, res, next) => {
  try {
    const result = await refreshUserTokens(
      req.cookies.refreshToken
    );

    setAuthCookies(res, result);

    res.status(200).json(
      new ApiResponse(
        200,
        "Session refreshed successfully",
        result.user
      )
    );
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (req, res, next) => {
  try {
    await logoutUser(req.user.userId);

    res.clearCookie("accessToken", getCookieOptions("/"));

    res.clearCookie(
      "refreshToken",
      getCookieOptions("/api/v1/auth/refresh")
    );

    res.status(200).json(
      new ApiResponse(200, "Logout successful")
    );
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getMe = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.userId);

    res.status(200).json(
      new ApiResponse(200, "User fetched successfully", user)
    );
  } catch (error) {
    next(error);
  }
};