// routes/index.ts
import { Router } from "express";
import authRoutes from "./api/auth.routes";

const rootRoutes: Router = Router();

// API v1 routes
rootRoutes.use("/v1/auth", authRoutes);

export default rootRoutes;
