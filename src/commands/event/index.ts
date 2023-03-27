import {
  ApplicationCommandOptionType,
  Collection,
  EmbedBuilder,
  Guild,
  TextChannel,
  User,
} from "discord.js";
import { DiscordCommand } from "../../types/discord/types";
import { writeToDB } from "../../database";

const TEAMS = ["Aegis", "Bravo", "Delta", "Strider"];

const getPlayers = async (guild: Guild, team: string) => {
  // The players are on a role with the name of the team
  const role = (await guild.roles.fetch())
    .filter((roleFetch) => roleFetch.name === team)
    .first();
  if (!role) return [];

  // Get the members of the role
  const members = await role.members;

  // Get the name of the members
  const players = members.map(
    (member) => member.nickname ?? member.user.username
  );

  // Return the players
  return players;
};

const getPlayersId = async (guild: Guild, team: string) => {
  // The players are on a role with the name of the team
  const role = (await guild.roles.fetch())
    .filter((roleFetch) => roleFetch.name === team)
    .first();
  if (!role) return [];

  // Get the members of the role
  const members = await role.members;

  // Get the name of the members
  const players = members.map((member) => member.id);

  // Return the players
  return players;
};

// Create a new command with the slash command builder
export const command: DiscordCommand = {
  name: "event",
  nameLocalizations: {
    "en-US": "event",
    de: "ereignis",
    "es-ES": "evento",
  },
  description: "Creates a new event",
  descriptionLocalizations: {
    "en-US": "Creates a new event",
    de: "Erstellt ein neues Ereignis",
    "es-ES": "Crea un nuevo evento",
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
      name: "name",
      description: "Name of the event",
      nameLocalizations: {
        "en-US": "name",
        de: "name",
        "es-ES": "nombre",
      },
      descriptionLocalizations: {
        "en-US": "Name of the event",
        de: "Name des Ereignisses",
        "es-ES": "Nombre del evento",
      },
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "date",
      description: "Date of the event",
      nameLocalizations: {
        "en-US": "date",
        de: "datum",
        "es-ES": "fecha",
      },
      descriptionLocalizations: {
        "en-US": "Date of the event",
        de: "Datum des Ereignisses",
        "es-ES": "Fecha del evento",
      },
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "editor",
      description: "Editor of the event",
      nameLocalizations: {
        "en-US": "editor",
        de: "editor",
        "es-ES": "editor",
      },
      descriptionLocalizations: {
        "en-US": "Editor of the event",
        de: "Editor des Ereignisses",
        "es-ES": "Editor del evento",
      },
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "description",
      description: "Description of the event",
      descriptionLocalizations: {
        "en-US": "Description of the event",
        de: "Beschreibung des Ereignisses",
        "es-ES": "Descripción del evento",
      },
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "image",
      description: "Image of the event",
      nameLocalizations: {
        "en-US": "image",
        de: "bild",
        "es-ES": "imagen",
      },
      descriptionLocalizations: {
        "en-US": "Image of the event",
        de: "Bild des Ereignisses",
        "es-ES": "Imagen del evento",
      },
      type: ApplicationCommandOptionType.Attachment,
      required: true,
    },
    {
      name: "link",
      description: "Link of the briefing",
      nameLocalizations: {
        "en-US": "link",
        de: "link",
        "es-ES": "enlace",
      },
      descriptionLocalizations: {
        "en-US": "Link of the briefing",
        de: "Link des Briefings",
        "es-ES": "Enlace del briefing",
      },
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  execute: async (interaction) => {
    // Get the interaction options
    const channel = interaction.options.getChannel("channel") as TextChannel;
    const name = interaction.options.getString("name");
    const date = interaction.options.getString("date");
    const editor = interaction.options.getUser("editor");
    const description = interaction.options.getString("description");
    const image = interaction.options.getAttachment("image");
    const link = interaction.options.getString("link");

    // Checks if any option is null
    let errorMessage = "";
    let error = false;
    if (!channel) {
      errorMessage += "Channel is null\n";
      error = true;
    }
    if (!name) {
      errorMessage += "Name is null\n";
      error = true;
    }
    if (!date) {
      errorMessage += "Date is null\n";
      error = true;
    }
    if (!editor) {
      errorMessage += "Editor is null\n";
      error = true;
    }
    if (!description) {
      errorMessage += "Description is null\n";
      error = true;
    }
    if (!image) {
      errorMessage += "Image is null\n";
      error = true;
    }
    if (!link) {
      errorMessage += "Link is null\n";
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
    const guildMember = await interaction.guild?.members.fetch(editor!.id);
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

    const listOfPlayers = TEAMS.map(async (team) => {
      const players = await getPlayers(guild, team);
      return {
        name: team,
        value: players.map((player) => `- ${player} => ❔`).join("\n"),
        inline: false,
      };
    });

    const players = await Promise.all(listOfPlayers);

    const CLRole = await guild.roles.cache.find((role) => role.name === "CL");

    let title = name;

    if (CLRole) {
      title = `${CLRole} ${name}`;
    }

    // Create the event embed
    const eventEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(title)
      .setURL(link)
      .setAuthor({
        name: guildMember.nickname,
      })
      .setDescription(description)
      .addFields(
        { name: "Date", value: date!, inline: true },
        { name: "Editor", value: guildMember.nickname, inline: true }
      )
      .addFields(players)
      .setImage(image!.url)
      .setTimestamp()
      .setFooter({
        text: "Mission Briefing",
      });

    // Reply to the interaction
    await interaction.reply({
      content: `Event created in ${channel.name}`,
      ephemeral: true,
    });

    // Send the event embed to the channel
    const message = await channel?.send({
      embeds: [eventEmbed],
    });

    // Add the reactions to the embed
    if (message) {
      await message.reactions.removeAll();
      await message.react("👍");
      await message.react("👎");
      await writeToDB(message.id, "event");
    }
  },
  onReaction: async (reaction, user) => {
    // Avoid the bot to react
    if (user.bot) return;

    // Get the message
    const { message } = reaction;

    // Get the list of users that reacted with '👍'
    let usersThatReactedWithLike = new Collection<string, User>();

    const messageReaction = await reaction.message.fetch();
    const reactions = messageReaction.reactions.cache;
    const likeReaction = reactions.get("👍");
    if (likeReaction) {
      const usersLikeReact = await likeReaction.users.fetch();
      usersThatReactedWithLike =
        usersThatReactedWithLike.concat(usersLikeReact);
    }

    // Get the list of users that reacted with '👎'
    let usersThatReactedWithDisLike = new Collection<string, User>();
    const disLikeReaction = reactions.get("👎");
    if (disLikeReaction) {
      const usersDisLikeReact = await disLikeReaction.users.fetch();
      usersThatReactedWithDisLike =
        usersThatReactedWithDisLike.concat(usersDisLikeReact);
    }

    const { guild } = reaction.message;
    if (!guild) {
      return;
    }

    const listOfPlayers = TEAMS.map(async (team) => {
      const players = await getPlayers(guild, team);
      const playersId = await getPlayersId(guild, team);
      // Create a map with key playersId and value players
      const playersMap = new Map(
        playersId.map((id, index) => [id, players[index]])
      );
      const valueOfTeam: string[] = Array.from(playersMap.keys()).map((key) =>
        // eslint-disable-next-line no-nested-ternary
        usersThatReactedWithLike.has(key) &&
        usersThatReactedWithDisLike.has(key)
          ? `- ${playersMap.get(key)} => ❔`
          : // eslint-disable-next-line no-nested-ternary
          usersThatReactedWithLike.has(key)
          ? `- ${playersMap.get(key)} => ✅`
          : usersThatReactedWithDisLike.has(key)
          ? `- ${playersMap.get(key)} => ❌`
          : `- ${playersMap.get(key)} => ❔`
      );

      return {
        name: team,
        value: valueOfTeam.join("\n"),
        inline: false,
      };
    });

    const players = await Promise.all(listOfPlayers);

    // Update the embed
    const eventEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(message.embeds[0].title)
      .setURL(message.embeds[0].url)
      .setAuthor({
        name: message.embeds[0].author?.name ?? "",
      })
      .setDescription(message.embeds[0].description)
      .addFields(
        {
          name: "Date",
          value: message.embeds[0].fields[0].value,
          inline: true,
        },
        {
          name: "Editor",
          value: message.embeds[0].fields[1].value,
          inline: true,
        }
      )
      .addFields(players)
      .setImage(message.embeds[0].image?.url ?? "")
      .setTimestamp()
      .setFooter({
        text: "Mission Briefing",
      });

    // Edit the message
    await message.edit({
      embeds: [eventEmbed],
    });
  },
};
