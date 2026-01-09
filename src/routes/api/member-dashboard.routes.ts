// routes/api/member-dashboard.routes.ts
import { Router } from "express";
import { MemberDashboardController } from "../../controllers";
import { authenticate } from "../../middlewares";

const memberDashboardRoutes: Router = Router();

// All routes require authentication
memberDashboardRoutes.use(authenticate);

// Member dashboard statistics
memberDashboardRoutes.get("/dashboard", MemberDashboardController.getDashboard);

export default memberDashboardRoutes;
