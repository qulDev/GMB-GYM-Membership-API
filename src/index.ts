import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import path from "path";
import fs from "fs";
import { _PORT } from "./secret";
import rootRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares";

// Load API specification
const apiSpecPath = path.join(__dirname, "../docs/Api_spec.json");
const apiSpec = JSON.parse(fs.readFileSync(apiSpecPath, "utf-8"));

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
app.use("/api/v1/payments/webhook/midtrans", express.raw({ type: "*/*" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use("/api", rootRoutes);

// Swagger UI Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(apiSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "GMB API Documentation",
  })
);

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
  console.log(`📖 API Docs: http://localhost:${port}/api-docs`);
});
