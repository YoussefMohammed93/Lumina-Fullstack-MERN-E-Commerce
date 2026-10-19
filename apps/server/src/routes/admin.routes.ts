import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard/overview", (_req, res) => {
  res.json({
    success: true,
    data: { message: "Admin dashboard access granted." },
  });
});

export default router;
