import { Router } from "express";
import { isValidObjectId, type Types } from "mongoose";
import {
  AdminNotification,
  type AdminNotificationType,
} from "../models/notification.model.js";
import {
  requireAuth,
  requireCsrf,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();
const notificationTypes = [
  "new_order",
  "order_status",
  "low_stock",
  "new_customer",
] as const;

function isNotificationType(value: string): value is AdminNotificationType {
  return notificationTypes.some((notificationType) => notificationType === value);
}

function positiveInteger(value: unknown, fallback: number, max: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, max)
    : fallback;
}

router.use(requireAuth, requireRole("admin"));

router.get("/", async (req, res, next) => {
  try {
    const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = positiveInteger(req.query.limit, 20, 50);
    const typeParam =
      typeof req.query.type === "string" ? req.query.type : undefined;
    const type =
      typeParam && isNotificationType(typeParam) ? typeParam : undefined;
    const unreadOnly = req.query.unread === "true";
    if (req.query.type !== undefined && !type)
      return res.status(400).json({
        success: false,
        error: { message: "Choose a valid notification type." },
      });
    const readFilter = { readBy: { $ne: req.user!._id } };
    const filter: {
      type?: AdminNotificationType;
      readBy?: { $ne: Types.ObjectId };
    } = {};
    if (type) filter.type = type;
    if (unreadOnly) filter.readBy = { $ne: req.user!._id };
    const [notifications, total, unreadCount] = await Promise.all([
      AdminNotification.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdminNotification.countDocuments(filter),
      AdminNotification.countDocuments(readFilter),
    ]);

    res.json({
      success: true,
      data: {
        notifications: notifications.map((notification) => ({
          id: String(notification._id),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          href: notification.href,
          createdAt: notification.createdAt,
          isRead: notification.readBy.some(
            (adminId) => String(adminId) === String(req.user!._id),
          ),
        })),
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          pageCount: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/read-all", requireCsrf, async (req, res, next) => {
  try {
    const result = await AdminNotification.updateMany(
      { readBy: { $ne: req.user!._id } },
      { $addToSet: { readBy: req.user!._id } },
    );
    res.json({
      success: true,
      data: { updated: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/read", requireCsrf, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({
        success: false,
        error: { message: "Choose a valid notification." },
      });
    const read = req.body?.read;
    if (typeof read !== "boolean")
      return res.status(400).json({
        success: false,
        error: { message: "Read status must be true or false." },
      });

    const update = read
      ? { $addToSet: { readBy: req.user!._id } }
      : { $pull: { readBy: req.user!._id } };
    const result = await AdminNotification.updateOne(
      { _id: req.params.id },
      update,
    );
    if (!result.matchedCount)
      return res.status(404).json({
        success: false,
        error: { message: "Notification not found." },
      });

    res.json({ success: true, data: { id: req.params.id, isRead: read } });
  } catch (error) {
    next(error);
  }
});

export default router;
