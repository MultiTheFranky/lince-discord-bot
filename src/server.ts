import express from "express";
import { config } from "dotenv";
import { Client } from "discord.js";
import logger from "./utils/logger";
import { startDiscordBot } from "./discord";
import { initDB } from "./database";
import { startPterodactyl } from "./pterodactyl";

// eslint-disable-next-line import/no-mutable-exports
export let client: Client;

config();
(async () => {
  const app = express();

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  // Init database
  await initDB();

  // Discord bot
  client = await startDiscordBot();

  // Init pterodactyl
  await startPterodactyl();

  app.listen(process.env.PORT, () => {
    logger.info(`Listening on port ${process.env.PORT}`);
  });
})();
