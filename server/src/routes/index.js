import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import internshipRoutes from "../modules/internships/internship.routes.js";
import taskRoutes from "../modules/tasks/task.routes.js";
import taskAssignmentRoutes from "../modules/taskAssignment/taskAssignment.routes.js";


const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Prolancer API is running",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

router.use("/auth", authRoutes);

router.use("/users", userRoutes);

router.use("/internships", internshipRoutes);

router.use("/tasks", taskRoutes);

router.use("/task-assignments", taskAssignmentRoutes);

export default router;