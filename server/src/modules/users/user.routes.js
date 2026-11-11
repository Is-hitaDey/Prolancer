import { Router } from "express";

import {
  getProfile,
  updateProfile,
  getDeveloperProfile,
} from "./user.controller.js";

import { updateProfileSchema } from "./user.validation.js";

import validate from "../../middlewares/validate.middleware.js";

import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

// Protected routes
router.get("/me", authenticate, getProfile);

router.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  updateProfile
);

// Public developer profile
router.get("/:userId", getDeveloperProfile);

export default router;