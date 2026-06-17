import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import locationsRouter from "./locations";
import votesRouter from "./votes";
import scheduleRouter from "./schedule";
import messagesRouter from "./messages";
import contributionsRouter from "./contributions";
import lendingRouter from "./lending";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

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
