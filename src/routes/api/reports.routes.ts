// routes/api/reports.routes.ts
import { Router } from "express";
import { ReportsController } from "../../controllers";
import { authenticate, authorize } from "../../middlewares";

const reportsRoutes: Router = Router();

// All routes require authentication and admin role
reportsRoutes.use(authenticate);
reportsRoutes.use(authorize("ADMIN"));

// Dashboard statistics
reportsRoutes.get("/dashboard", ReportsController.getDashboard);

// Revenue report
reportsRoutes.get("/revenue", ReportsController.getRevenue);

// Attendance report
reportsRoutes.get("/attendance", ReportsController.getAttendance);

export default reportsRoutes;
