import { Router } from "express";
import { SubscriptionController } from "../../controllers";
import { authenticate, authorize } from "../../middlewares";

const router = Router();

// USER
router.use(authenticate);
router.post("/", SubscriptionController.create);
router.get("/current", SubscriptionController.current);

// ADMIN
router.get("/", authorize("ADMIN"), SubscriptionController.getAll);
router.post("/:id/activate", authorize("ADMIN"), SubscriptionController.activate);
router.post("/:id/cancel", authorize("ADMIN"), SubscriptionController.cancel);

export default router;
