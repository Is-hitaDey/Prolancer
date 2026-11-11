import {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
} from "./user.service.js";

import ApiResponse from "../../utils/ApiResponse.js";

// Get own profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await getMyProfile(req.user.userId);

    res.status(200).json(
      new ApiResponse(
        200,
        "Profile fetched successfully",
        user
      )
    );
  } catch (error) {
    next(error);
  }
};

// Update own profile
export const updateProfile = async (req, res, next) => {
  try {
    const user = await updateMyProfile(
      req.user.userId,
      req.body
    );

    res.status(200).json(
      new ApiResponse(
        200,
        "Profile updated successfully",
        user
      )
    );
  } catch (error) {
    next(error);
  }
};

// Get public developer profile
export const getDeveloperProfile = async (req, res, next) => {
  try {
    const user = await getPublicProfile(req.params.userId);

    res.status(200).json(
      new ApiResponse(
        200,
        "Developer profile fetched successfully",
        user
      )
    );
  } catch (error) {
    next(error);
  }
};