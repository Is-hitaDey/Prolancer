import { Router } from "express";

import {
  register,
  login,
  logout,
  refresh,
  getMe,
} from "./auth.controller.js";

import {
  registerSchema,
  loginSchema,
} from "./auth.validation.js";

import validate from "../../middlewares/validate.middleware.js";

import {
  authenticate,
} from "../../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.post("/refresh", refresh);

// Protected routes
router.post("/logout", authenticate, logout);

router.get("/me", authenticate, getMe);

export default router;