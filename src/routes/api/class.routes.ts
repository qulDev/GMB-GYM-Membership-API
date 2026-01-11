import { Router } from "express";
import { GymClassController } from "../../controllers/class.controller";
import { ClassBookingController } from "../../controllers/class-booking.controller";
import { authenticate, authorize } from "../../middlewares";

const router = Router();

// Public routes
router.get("/", GymClassController.getAll);
router.get("/my-bookings", authenticate, ClassBookingController.myBookings);
router.get("/:id", GymClassController.detail);

// User booking routes
router.post("/:classId/book", authenticate, ClassBookingController.book);
router.post("/:classId/cancel", authenticate, ClassBookingController.cancel);

// Admin routes
router.post("/", authenticate, authorize("ADMIN"), GymClassController.create);
router.put("/:id", authenticate, authorize("ADMIN"), GymClassController.update);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  GymClassController.delete
);
router.get(
  "/:classId/participants",
  authenticate,
  authorize("ADMIN"),
  ClassBookingController.participants
);

export default router;
