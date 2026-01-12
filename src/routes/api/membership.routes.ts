// routes/api/membership.routes.ts
import { Router } from "express";
import { MembershipPlanController } from "../../controllers";
import { authenticate, authorize } from "../../middlewares";

const membershipRoutes: Router = Router();

// Public routes - users can view plans without authentication
membershipRoutes.get("/", MembershipPlanController.getAllPlans);
membershipRoutes.get("/:id", MembershipPlanController.getPlanById);

// Admin only routes - require authentication
membershipRoutes.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  MembershipPlanController.createPlan
);
membershipRoutes.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  MembershipPlanController.updatePlan
);
membershipRoutes.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  MembershipPlanController.deletePlan
);

export default membershipRoutes;
