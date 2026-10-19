import express from "express";
import cors from "cors";
import productRouter from "./routes/product.routes.js";
import authRouter from "./routes/auth.routes.js";
import commerceRouter from "./routes/commerce.routes.js";
import adminRouter from "./routes/admin.routes.js";
import checkoutRouter from "./routes/checkout.routes.js";
import stripeWebhookRouter from "./routes/stripe-webhook.routes.js";

const app = express();

// ── Middleware
app.set("trust proxy", 1);
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  }),
);
// Stripe signs the exact raw request body, so this must precede JSON parsing.
app.use(
  "/api/v1/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter,
);
app.use(express.json());

// ── Routes
app.use("/api/v1", productRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1", commerceRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1", checkoutRouter);

// ── Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// ── 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message });
  },
);

export default app;
