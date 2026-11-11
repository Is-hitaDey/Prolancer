import User from "./user.model.js";
import ApiError from "../../utils/ApiError.js";

// Get logged-in user's profile
export const getMyProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

// Update logged-in user's profile
export const updateMyProfile = async (userId, data) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (data.name !== undefined) {
    user.name = data.name;
  }

  if (data.profile) {
    for (const [key, value] of Object.entries(data.profile)) {
      user.set(`profile.${key}`, value);
    }
  }

  await user.save();

  return user;
};

// Get another developer's public profile
export const getPublicProfile = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    role: "developer",
    "profile.profileVisibility": "public",
  }).select("name profile createdAt");

  if (!user) {
    throw new ApiError(404, "Developer profile not found");
  }

  return user;
};