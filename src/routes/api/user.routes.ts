// routes/api/user.routes.ts
import { Router } from "express";
import { UserController } from "../../controllers";
import { authenticate, authorize } from "../../middlewares";

const userRoutes: Router = Router();

// All routes require authentication
userRoutes.use(authenticate);

// Current user routes
userRoutes.get("/me", UserController.getProfile);
userRoutes.put("/me", UserController.updateProfile);

// Admin only routes
userRoutes.get("/", authorize("ADMIN"), UserController.listUsers);
userRoutes.get("/:userId", authorize("ADMIN"), UserController.getUserById);
userRoutes.put("/:userId", authorize("ADMIN"), UserController.updateUserById);
userRoutes.delete("/:userId", authorize("ADMIN"), UserController.deleteUser);

export default userRoutes;
