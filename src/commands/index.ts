import { readdirSync } from "fs";
import { join } from "path";
import {
  ChatInputCommandInteraction,
  Client,
  Events,
  MessageReaction,
  User,
} from "discord.js";
import logger from "../utils/logger/index";
import { DiscordCommand } from "../types/discord/types";
import { readFromDB } from "../database";

/**
 * Function to get all commands in the commands directory
 * @returns {DiscordCommand[]} - The commands
 */
export const getCommands = async () => {
  // Get all files in the commands directory
  const subDirectories = await readdirSync(__dirname, {
    withFileTypes: true,
  }).filter((dirent) => dirent.isDirectory());
  const files = await subDirectories.map((subDirectory) => {
    const subDirectoryFile = readdirSync(
      join(__dirname, subDirectory.name)
    ).filter(
      (file) =>
        file.includes(".js") ||
        (file.includes(".ts") && !file.includes(".d.ts"))
    )[0];

    return join(subDirectory.name, subDirectoryFile);
  });
  // Get all commands
  const commands: Promise<DiscordCommand>[] = await files.map(async (file) => {
    // Get the command
    const { command } = await import(join(__dirname, file));
    // Return the command
    return command as DiscordCommand;
  });

  // Resolve all commands
  const resolvedCommands = await Promise.all(commands);

  return resolvedCommands;
};

/**
 * Function to register all commands
 * @param {Discord.Client} client - The client to register the commands to
 */
export const registerCommands = async (client: Client) => {
  // Get all commands in the commands directory
  const commands = await getCommands();
  // Register all commands
  const { user } = client;
  if (!user) {
    throw new Error("No user found!");
  }
  const app = client.application;
  if (!app) {
    throw new Error("No application found!");
  }
  const guildID = process.env.DISCORD_GUILD_ID;
  if (!guildID) {
    throw new Error("No guild ID found!");
  }
  await app.commands.set(commands, guildID);
  logger.info(
    `Registered ${commands.length} commands. Commands: ${commands
      .map((command) => command.name)
      .join(", ")}`
  );
};

export const registerCommandsOnReady = async (client: Client) => {
  client.on(Events.ClientReady, async () => {
    logger.info("Ready!");
    // Register all commands
    await registerCommands(client);
  });
};

export const listenerOnInteractionCreate = async (client: Client) => {
  client.on(Events.InteractionCreate, async (interaction) => {
    // Check if the interaction is a command
    if (
      !interaction.isCommand() &&
      !(interaction instanceof ChatInputCommandInteraction)
    ) {
      return;
    }

    // Get the command
    const commands = await getCommands();
    const command = commands.find(
      (commandFind) => commandFind.name === interaction.commandName
    );
    if (!command) {
      return;
    }

    // Execute the command
    try {
      command.execute(interaction as ChatInputCommandInteraction);
    } catch (error) {
      logger.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });
};

export const reactionListener = async (client: Client) => {
  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    // Get the command
    const commands = (await getCommands()) as DiscordCommand[];
    const getMessageCommand = await readFromDB(reaction.message.id);
    const command = commands.find(
      (commandFind) => commandFind.name === getMessageCommand
    );
    if (!command) {
      return;
    }

    // Execute the command
    try {
      command.onReaction(reaction as MessageReaction, user as User);
    } catch (error) {
      logger.error(error);
      await reaction.message.reply({
        content: "There was an error while executing this command!",
      });
    }
  });

  client.on(Events.MessageReactionRemove, async (reaction, user) => {
    // Get the command
    const commands = (await getCommands()) as DiscordCommand[];
    const getMessageCommand = await readFromDB(reaction.message.id);
    const command = commands.find(
      (commandFind) => commandFind.name === getMessageCommand
    );
    if (!command) {
      return;
    }

    // Execute the command
    try {
      command.onReaction(reaction as MessageReaction, user as User);
    } catch (error) {
      logger.error(error);
      await reaction.message.reply({
        content: "There was an error while executing this command!",
      });
    }
  });
};
