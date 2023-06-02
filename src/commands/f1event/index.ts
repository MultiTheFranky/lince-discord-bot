import {
  APIEmbedField,
  ApplicationCommandOptionType,
  EmbedBuilder,
  TextChannel,
  User,
} from "discord.js";
import { DiscordCommand } from "../../types/discord/types";
import { writeToDB } from "../../database";

const DATES = {
  viernes: {
    hours: ["16:30", "18:30", "22:00"],
    reactions: ["1⃣", "2⃣", "3⃣"],
  },
  sabado: {
    hours: ["16:30", "18:30", "22:00"],
    reactions: ["4⃣", "5⃣", "6⃣"],
  },
  domingo: {
    hours: ["16:30"],
    reactions: ["7⃣"],
  },
};

// Create a new command with the slash command builder
export const command: DiscordCommand = {
  name: "f1event",
  nameLocalizations: {
    "en-US": "f1event",
    de: "ereignis",
    "es-ES": "eventof1",
  },
  description: "Creates a new f1 event",
  descriptionLocalizations: {
    "en-US": "Creates a new f1 event",
    de: "Erstellt ein neues Ereignis",
    "es-ES": "Crea un nuevo evento de f1",
  },
  options: [
    {
      name: "channel",
      description: "Channel of the event",
      nameLocalizations: {
        "en-US": "channel",
        de: "kanal",
        "es-ES": "canal",
      },
      descriptionLocalizations: {
        "en-US": "Channel of the event",
        de: "Kanal des Ereignisses",
        "es-ES": "Canal del evento",
      },
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
    {
      name: "circuit",
      description: "Circuit of the event",
      nameLocalizations: {
        "en-US": "circuit",
        de: "strecke",
        "es-ES": "circuito",
      },
      descriptionLocalizations: {
        "en-US": "Circuit of the event",
        de: "Strecke des Ereignisses",
        "es-ES": "Circuito del evento",
      },
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  execute: async (interaction) => {
    // Get the interaction options
    const channel = interaction.options.getChannel("channel") as TextChannel;
    const circuit = interaction.options.getString("circuit");

    // Checks if any option is null
    let errorMessage = "";
    let error = false;
    if (!channel) {
      errorMessage += "Channel is null\n";
      error = true;
    }
    if (!circuit) {
      errorMessage += "Circuit is null\n";
      error = true;
    }

    if (error) {
      await interaction.reply({
        content: errorMessage,
        ephemeral: true,
      });
      return;
    }

    // Get the name of the user in the same way as is on the guild
    const guildMember = await interaction.guild?.members.fetch(
      "227383506605441024"
    );
    if (!guildMember || !guildMember.nickname) {
      await interaction.reply({
        content: "Something went wrong. Please try again.",
        ephemeral: true,
      });
      return;
    }

    const { guild } = interaction;
    if (!guild) {
      await interaction.reply({
        content: "Something went wrong. Please try again.",
        ephemeral: true,
      });
      return;
    }

    const dates: APIEmbedField[] = [];
    Object.keys(DATES).forEach((day) => {
      if (Object.prototype.hasOwnProperty.call(DATES, day)) {
        const hours = DATES[day as keyof typeof DATES];
        dates.push({ name: `============`, value: "\u200b", inline: false });
        hours.hours.forEach((hour) => {
          dates.push({
            name: `${day} - ${hour} (0)`,
            value: "\u200b",
            inline: false,
          });
        });
      }
    });
    dates.push({ name: `============`, value: "\u200b", inline: false });

    const CLRole = await guild.roles.cache.find(
      (role) => role.name === "Lynx F1 Cup"
    );
    let mentionedDescription = "\u200b";
    if (CLRole) {
      mentionedDescription = `${CLRole}`;
    }

    // Create the event embed
    const eventEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(circuit)
      .setDescription(mentionedDescription)
      .addFields(dates)
      .addFields(
        { name: "Viernes 16:30", value: ":one:", inline: true },
        { name: "Viernes 18:30", value: ":two:", inline: true },
        { name: "Viernes 22:00", value: ":three:", inline: true },
        { name: "Sábado 16:30", value: ":four:", inline: true },
        { name: "Sábado 18:30", value: ":five:", inline: true },
        { name: "Sábado 22:00", value: ":six:", inline: true },
        { name: "Domingo 16:30", value: ":seven:", inline: true }
      )
      .setTimestamp()
      .setFooter({
        text: "F1 Race",
      });

    // Reply to the interaction
    await interaction.reply({
      content: `F1 Event created in ${channel.name}`,
      ephemeral: true,
    });

    // Send the event embed to the channel
    const message = await channel?.send({
      embeds: [eventEmbed],
    });

    // Add the reactions to the embed
    if (message) {
      await message.reactions.removeAll();
      await message.react("1⃣");
      await message.react("2⃣");
      await message.react("3⃣");
      await message.react("4⃣");
      await message.react("5⃣");
      await message.react("6⃣");
      await message.react("7⃣");
      await writeToDB(message.id, "f1event");
    }
  },
  onReaction: async (reaction, user) => {
    // Avoid the bot to react
    if (user.bot) return;

    // Get the message
    const { message } = reaction;

    const REACTIONSATTACHED = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣"];

    // Create a map with the reactions as keys and the users that reacted as values
    const usersReactions = new Map<string, User[]>();
    REACTIONSATTACHED.forEach((reactionAttached) => {
      const users = message.reactions.cache
        .get(reactionAttached)
        ?.users.cache.filter((userReaction) => !userReaction.bot)
        .map((userReaction) => userReaction);
      if (users) {
        usersReactions.set(reactionAttached, users);
      }
    });

    const { guild } = reaction.message;
    if (!guild) {
      return;
    }

    const dates: APIEmbedField[] = [];
    let counter = 0;
    let daySelected = "";
    // eslint-disable-next-line no-restricted-syntax
    for (const day of Object.keys(DATES)) {
      if (Object.prototype.hasOwnProperty.call(DATES, day)) {
        const hours = DATES[day as keyof typeof DATES];
        dates.push({ name: `============`, value: "\u200b", inline: false });
        for (let i = 0; i < hours.hours.length; i += 1) {
          const hour = hours.hours[i];
          const reactionSelected = hours.reactions[i];
          const usersThatReacted = usersReactions.get(reactionSelected);
          if (!usersThatReacted) {
            return;
          }
          const { length } = usersThatReacted;
          if (length >= counter) {
            counter = length;
            daySelected = `${day} - ${hour} (${length})`;
          }
          dates.push({
            name: `${day} - ${hour} (${length})`,
            value:
              length > 0
                ? `${usersThatReacted.map(
                    (userReact) => `<@${userReact.id}>\n`
                  )}`
                : "\u200b",
            inline: false,
          });
        }
      }
    }
    dates.push({ name: `============`, value: "\u200b", inline: false });
    dates.push({ name: `Date Selected`, value: daySelected, inline: false });
    dates.push({ name: `============`, value: "\u200b", inline: false });

    // Update the embed
    const eventEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(message.embeds[0].title)
      .setDescription(message.embeds[0].description)
      .addFields(dates)
      .addFields(
        { name: "Viernes 16:30", value: ":one:", inline: true },
        { name: "Viernes 18:30", value: ":two:", inline: true },
        { name: "Viernes 22:00", value: ":three:", inline: true },
        { name: "Sábado 16:30", value: ":four:", inline: true },
        { name: "Sábado 18:30", value: ":five:", inline: true },
        { name: "Sábado 22:00", value: ":six:", inline: true },
        { name: "Domingo 16:30", value: ":seven:", inline: true }
      )
      .setTimestamp()
      .setFooter({
        text: "F1 Race",
      });

    // Edit the message
    await message.edit({
      embeds: [eventEmbed],
    });
  },
};
