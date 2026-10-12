import { buildApp } from "./app.js";
import { loadConfig } from "./config/env.js";

const config = loadConfig();
const app = await buildApp(config);

try {
  await app.listen({ host: config.host, port: config.port });
  app.log.info(
    {
      host: config.host,
      port: config.port,
      publicApiBaseUrl: config.publicApiBaseUrl,
      dataMode: config.useMockData ? "mock" : "postgres",
      databaseConfigured: Boolean(config.databaseUrl)
    },
    "backend started"
  );
} catch (error) {
  app.log.error(error, "backend failed to start");
  process.exit(1);
}
