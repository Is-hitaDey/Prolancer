import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../users/user.model.js";
import ApiError from "../../utils/ApiError.js";

// Generate access and refresh tokens
const generateTokens = (userId, role) => {
    const payload = { userId, role };

    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
        }
    );

    const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
        }
    );

    return { accessToken, refreshToken };
};

// Hash refresh token before storing it
const hashToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

// Remove sensitive fields from user response
const sanitizeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
});

// Register user
export const registerUser = async ({ name, email, password }) => {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new ApiError(409, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "developer",
    });

    const tokens = generateTokens(
        user._id.toString(),
        user.role
    );

    user.refreshTokenHash = hashToken(tokens.refreshToken);
    user.refreshTokenExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await user.save();

    return {
        user: sanitizeUser(user),
        ...tokens,
    };
};

// Login user
export const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    const tokens = generateTokens(
        user._id.toString(),
        user.role
    );
    user.refreshTokenHash = hashToken(tokens.refreshToken);
    user.refreshTokenExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await user.save();

    return {
        user: sanitizeUser(user),
        ...tokens,
    };
};

// Refresh tokens
export const refreshUserTokens = async (refreshToken) => {
    if (!refreshToken) {
        throw new ApiError(401, "Refresh token required");
    }

    let decoded;

    try {
        decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decoded.userId)
        .select("+refreshTokenHash +refreshTokenExpiresAt");

    if (!user || !user.refreshTokenHash) {
        throw new ApiError(401, "Session expired. Please login again");
    }

    const tokenHash = hashToken(refreshToken);

    if (
        user.refreshTokenHash !== tokenHash ||
        !user.refreshTokenExpiresAt ||
        user.refreshTokenExpiresAt <= new Date()
    ) {
        throw new ApiError(401, "Invalid or expired session");
    }

    // Rotate both tokens
    const tokens = generateTokens(
        user._id.toString(),
        user.role
    );

    user.refreshTokenHash = hashToken(tokens.refreshToken);
    user.refreshTokenExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await user.save();

    return {
        user: sanitizeUser(user),
        ...tokens,
    };
};

// Logout user
export const logoutUser = async (userId) => {
    await User.findByIdAndUpdate(userId, {
        $set: {
            refreshTokenHash: null,
            refreshTokenExpiresAt: null,
        },
    });
};

// Get current authenticated user
export const getCurrentUser = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return sanitizeUser(user);
};