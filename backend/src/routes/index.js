import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import locationsRouter from "./locations.js";
import votesRouter from "./votes.js";
import scheduleRouter from "./schedule.js";
import messagesRouter from "./messages.js";
import contributionsRouter from "./contributions.js";
import lendingRouter from "./lending.js";
import notificationsRouter from "./notifications.js";
import dashboardRouter from "./dashboard.js";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(locationsRouter);
router.use(votesRouter);
router.use(scheduleRouter);
router.use(messagesRouter);
router.use(contributionsRouter);
router.use(lendingRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);

export default router;
