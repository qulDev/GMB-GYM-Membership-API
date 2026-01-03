import { Router } from "express";
import { CheckInController } from "../../controllers";
import { authenticate } from "../../middlewares";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/check-ins - Get check-in history
router.get("/", CheckInController.getHistory);

// POST /api/v1/check-ins - Check in to gym
router.post("/", CheckInController.checkIn);

// GET /api/v1/check-ins/current - Get current check-in status
router.get("/current", CheckInController.getCurrentStatus);

// POST /api/v1/check-ins/:checkInId/checkout - Check out from gym
router.post("/:checkInId/checkout", CheckInController.checkOut);

export default router;
