// routes/api/user.routes.ts
import { Router } from "express";
import { MembershipPlanController } from "../../controllers";
import { authenticate, authorize } from "../../middlewares";

const membershipRoutes: Router = Router();

// All routes require authentication
membershipRoutes.use(authenticate);

// Current membership routes
// membershipRoutes.get("/current", MembershipPlanController.getCurrentMembership);
membershipRoutes.get("/", MembershipPlanController.getAllPlans);


// Admin only routes
membershipRoutes.get("/:id", authorize("ADMIN"), MembershipPlanController.getPlanById);
membershipRoutes.post("/", authorize("ADMIN"), MembershipPlanController.createPlan);
membershipRoutes.put("/:id", authorize("ADMIN"), MembershipPlanController.updatePlan);
membershipRoutes.delete("/:id", authorize("ADMIN"), MembershipPlanController.deletePlan);

export default membershipRoutes;
