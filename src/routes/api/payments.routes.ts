// routes/api/user.routes.ts
import{ Router } from "express";
import { PaymentController } from "../../controllers";
import { authenticate } from "../../middlewares";

const paymentsRoutes: Router = Router();

// webhook
paymentsRoutes.post("/webhook/midtrans", PaymentController.midtransNotification);

// All routes require authentication
paymentsRoutes.use(authenticate);

paymentsRoutes.post("/:subscriptionId", authenticate, PaymentController.processPayment);
paymentsRoutes.get("/", authenticate, PaymentController.history);
paymentsRoutes.get("/:id", authenticate, PaymentController.detail);

export default paymentsRoutes;
