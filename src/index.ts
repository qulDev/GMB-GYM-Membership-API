import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { _PORT } from "./secret";
import rootRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares";

const app: Express = express();

// port
const port = _PORT ? parseInt(_PORT, 10) : 3000;

// Security middlewares
app.use(helmet());
app.use(cors());
app.use(compression());

// Logging
app.use(morgan("dev"));

// Body parsing
app.use("/api/v1/payments/webhook/midtrans",
  express.raw({ type: "*/*" })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use("/api", rootRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`📍 API Base URL: http://localhost:${port}/api/v1`);
});
