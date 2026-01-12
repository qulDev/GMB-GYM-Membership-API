import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { PaymentService } from "../services/payments.service";
import { ResponseHelper } from "../utils/response.helper";

export class PaymentController {
  static async midtransNotification(req: Request, res: Response) {
    try {
      let n: any;

      // Handle both Buffer and parsed JSON body
      if (Buffer.isBuffer(req.body)) {
        const text = req.body.toString("utf8");
        n = JSON.parse(text);
      } else {
        n = req.body;
      }

      console.log("=== MIDTRANS WEBHOOK RECEIVED ===");
      console.log("Order ID:", n.order_id);
      console.log("Transaction Status:", n.transaction_status);
      console.log("Status Code:", n.status_code);
      console.log("Gross Amount:", n.gross_amount);
      console.log("Fraud Status:", n.fraud_status);

      // Skip signature validation in development/testing mode when signature_key is not provided
      // or when NODE_ENV is not production
      const skipSignature =
        !n.signature_key || process.env.NODE_ENV !== "production";

      if (!skipSignature) {
        // Ensure gross_amount is formatted correctly (remove decimals if .00)
        const grossAmount = String(n.gross_amount).replace(".00", "");

        const raw =
          n.order_id +
          n.status_code +
          grossAmount +
          process.env.MIDTRANS_SERVER_KEY;

        const localSignature = crypto
          .createHash("sha512")
          .update(raw)
          .digest("hex");

        console.log("LOCAL SIGNATURE :", localSignature);
        console.log("REMOTE SIGNATURE:", n.signature_key);

        if (localSignature !== n.signature_key) {
          console.log("=== SIGNATURE MISMATCH ===");
          return res.status(403).json({ error: "INVALID SIGNATURE" });
        }
      } else {
        console.log("=== SIGNATURE VALIDATION SKIPPED (dev/test mode) ===");
      }

      console.log("=== PROCESSING WEBHOOK... ===");
      await PaymentService.handleNotification(n);

      console.log("=== WEBHOOK PROCESSED SUCCESSFULLY ===");
      return res.status(200).json({ status: "OK" });
    } catch (error) {
      console.error("=== WEBHOOK ERROR ===", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { subscriptionId } = req.params;

      const result = await PaymentService.createSnapPayment(
        userId,
        subscriptionId
      );

      ResponseHelper.success(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  static async history(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const history = await PaymentService.getHistory(userId);
      ResponseHelper.success(res, history, 200);
    } catch (e) {
      next(e);
    }
  }

  static async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const detail = await PaymentService.getDetail(id, userId);
      ResponseHelper.success(res, detail, 200);
    } catch (e) {
      next(e);
    }
  }
}
