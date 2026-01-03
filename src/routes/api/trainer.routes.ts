import { Router } from "express";
import { TrainerController } from "../../controllers";
import { authenticate, authorize } from "../../middlewares";

const router = Router();

// Public routes (no auth required)
// GET /api/v1/trainers - Get all trainers
router.get("/", TrainerController.getAllTrainers);

// GET /api/v1/trainers/:trainerId - Get trainer details
router.get("/:trainerId", TrainerController.getTrainerById);

// Admin only routes (auth required)
// POST /api/v1/trainers - Create trainer
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  TrainerController.createTrainer
);

// PUT /api/v1/trainers/:trainerId - Update trainer
router.put(
  "/:trainerId",
  authenticate,
  authorize("ADMIN"),
  TrainerController.updateTrainer
);

// DELETE /api/v1/trainers/:trainerId - Delete trainer
router.delete(
  "/:trainerId",
  authenticate,
  authorize("ADMIN"),
  TrainerController.deleteTrainer
);

export default router;
