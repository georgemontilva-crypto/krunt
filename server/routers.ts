import { router } from "./appTrpc";
import { adminAuthRouter } from "./routers/adminAuth";
import { catalogRouter } from "./routers/catalog";
import { ordersRouter } from "./routers/orders";
import { siteRouter } from "./routers/site";
import { wholesaleRouter } from "./routers/wholesale";

export const appRouter = router({
  adminAuth: adminAuthRouter,
  catalog: catalogRouter,
  orders: ordersRouter,
  wholesale: wholesaleRouter,
  site: siteRouter,
});

export type AppRouter = typeof appRouter;
