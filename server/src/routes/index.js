import { Router } from "express";

const router = Router();

// Health check
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

export default router;