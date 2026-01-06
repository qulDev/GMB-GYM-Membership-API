// routes/api/logs.routes.ts
import { Router } from "express";
import { LogsController } from "../../controllers";
import { authenticate, authorize } from "../../middlewares";

const logsRoutes: Router = Router();

// All routes require authentication
logsRoutes.use(authenticate);

// Create log - available for authenticated users (system use)
logsRoutes.post("/", LogsController.createLog);

// Admin only routes
logsRoutes.get("/", authorize("ADMIN"), LogsController.listLogs);
logsRoutes.get("/:logId", authorize("ADMIN"), LogsController.getLogById);
logsRoutes.delete("/:logId", authorize("ADMIN"), LogsController.deleteLog);

export default logsRoutes;
