import { Client, GatewayIntentBits } from "discord.js";
import logger from "./utils/logger";
import {
  listenerOnInteractionCreate,
  registerCommandsOnReady,
  reactionListener,
} from "./commands";

export const startDiscordBot = async () => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.GuildWebhooks,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.DirectMessageTyping,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildScheduledEvents,
      GatewayIntentBits.AutoModerationConfiguration,
      GatewayIntentBits.AutoModerationExecution,
    ],
  });

  // Register all commands
  await registerCommandsOnReady(client);

  // Listen for interactions
  await listenerOnInteractionCreate(client);

  // Listen for reactions
  await reactionListener(client);

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    logger.error("No token provided!");
    process.exit(1);
  }

  // Login to Discord
  await client.login();

  return client;
};
