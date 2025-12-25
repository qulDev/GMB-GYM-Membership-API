import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { PaymentService } from "../services/payments.service";
import { ResponseHelper } from "../utils/response.helper";

export class PaymentController {

  static async midtransNotification(req: Request, res: Response) {
  const rawBody = req.body as Buffer;
  const text = rawBody.toString("utf8");
  const n = JSON.parse(text);

  const raw =
    n.order_id +
    n.status_code +
    n.gross_amount +
    process.env.MIDTRANS_SERVER_KEY;

  const localSignature = crypto
    .createHash("sha512")
    .update(raw)
    .digest("hex");

  console.log("LOCAL :", localSignature);
  console.log("REMOTE:", n.signature_key);

  if (localSignature !== n.signature_key) {
    return res.status(403).json({ error: "INVALID SIGNATURE" });
  }

  await PaymentService.handleNotification(n);
  return ResponseHelper.success(res, 200);
}

  
  

  static async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { subscriptionId } = req.params;
  
      const result = await PaymentService.createSnapPayment(userId, subscriptionId);
  
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
      const detail = await PaymentService.getDetail(id);
      ResponseHelper.success(res, detail, 200);
    } catch (e) {
      next(e);
    }
  }
  
}
