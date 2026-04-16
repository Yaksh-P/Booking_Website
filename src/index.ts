import dotenv from "dotenv";

import { createApp } from "./app";
import { logger } from "./config/logger";

dotenv.config();

const app = createApp();
const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  logger.info("Booking API is running", { port });
});
