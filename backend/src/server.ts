import app from "./app.js";
import { config } from "./config.js";
import { initializeDatabase } from "./db.js";

initializeDatabase()
  .then(() => {
    app.listen(config.port, "127.0.0.1", () => console.log(`${config.appName} running at http://127.0.0.1:${config.port}`));
  })
  .catch((error) => {
    console.error("Database initialization failed", error);
    process.exit(1);
  });
