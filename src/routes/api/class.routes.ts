import { Router } from "express";
import { GymClassController } from "../../controllers/class.controller";
import { authenticate, authorize } from "../../middlewares";

const router = Router();

router.get("/", GymClassController.getAll);
router.get("/:id", GymClassController.detail);

router.post("/", authenticate, authorize("ADMIN"), GymClassController.create);
router.put("/:id", authenticate, authorize("ADMIN"), GymClassController.update);
router.delete("/:id", authenticate, authorize("ADMIN"), GymClassController.delete);

export default router;
