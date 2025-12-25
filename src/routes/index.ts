// routes/index.ts
import { Router } from "express";
import authRoutes from "./api/auth.routes";
import userRoutes from "./api/user.routes";
import membershipRoutes from "./api/membership.routes";
import subscriptionRoutes from "./api/subscription.routes";
import paymentsRoutes from "./api/payments.routes";

const rootRoutes: Router = Router();

// API v1 routes
rootRoutes.use("/v1/auth", authRoutes);
rootRoutes.use("/v1/users", userRoutes);
rootRoutes.use("/v1/membership-plans", membershipRoutes);
rootRoutes.use("/v1/subscriptions", subscriptionRoutes);
rootRoutes.use("/v1/payments", paymentsRoutes);



export default rootRoutes;
