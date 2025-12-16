// routes/api/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../../controllers";
import { authenticate } from "../../middlewares";

const authRoutes: Router = Router();

// Public routes
authRoutes.post("/register", AuthController.register);
authRoutes.post("/login", AuthController.login);
authRoutes.post("/refresh", AuthController.refresh);

// Protected routes
authRoutes.post("/logout", authenticate, AuthController.logout);

export default authRoutes;
