import { Router } from "express";
import { SubscriptionController } from "../../controllers";
import { SubscriptionSchedulerController } from "../../controllers/subscription-scheduler.controller";
import { authenticate, authorize } from "../../middlewares";

const router = Router();

// USER
router.use(authenticate);
router.post("/", SubscriptionController.create);
router.get("/current", SubscriptionController.current);
router.post("/current/cancel", SubscriptionController.cancelMy);

// ADMIN
router.get("/", authorize("ADMIN"), SubscriptionController.getAll);
router.post(
  "/:id/activate",
  authorize("ADMIN"),
  SubscriptionController.activate
);
router.post("/:id/cancel", authorize("ADMIN"), SubscriptionController.cancel);

// ADMIN - Subscription Expiration Management
router.post(
  "/expire-check",
  authorize("ADMIN"),
  SubscriptionSchedulerController.triggerExpireCheck
);
router.get(
  "/expiring-soon",
  authorize("ADMIN"),
  SubscriptionSchedulerController.getExpiringSoon
);

export default router;
