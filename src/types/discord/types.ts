import {
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  MessageReaction,
  User,
} from "discord.js";

export type DiscordCommand = ChatInputApplicationCommandData & {
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  onReaction: (reaction: MessageReaction, user: User) => Promise<void>;
};
