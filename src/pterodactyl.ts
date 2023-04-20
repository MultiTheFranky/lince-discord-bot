import { Client } from "@elastic/elasticsearch";
import axios from "axios";
import { Builder } from "pterodactyl.js";
import WebSocket from "ws";
import stripAnsi from "strip-ansi";
import { WebsocketData, WebsocketEvent } from "./types/pterodactyl/types";

export const getWebsocketData = async (
  pterodactylURL: string,
  pterodactylClientToken: string,
  serverId: string
) => {
  const wsData = await axios.get(
    `${pterodactylURL}/api/client/servers/${serverId}/websocket`,
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.pterodactyl.v1+json",
        Authorization: `Bearer ${pterodactylClientToken}`,
      },
    }
  );
  return wsData as { data: { data: { socket: string; token: string } } };
};

const parseMessage = (message: string) => {
  let messageToReturn = stripAnsi(message);
  if (messageToReturn.includes(">", messageToReturn.indexOf(">") + 1))
    messageToReturn = messageToReturn
      .substring(
        messageToReturn.indexOf(">", messageToReturn.indexOf(">") + 1) + 1
      )
      .trim();

  return messageToReturn;
};

/**
 * Middleware to send pterodactyl logs to elastic search
 */
export const startPterodactyl = async () => {
  const elasticSearchUrl = process.env.ELASTIC_SEARCH_URL;
  const elasticSearchUsername = process.env.ELASTIC_SEARCH_USERNAME;
  const elasticSearchPassword = process.env.ELASTIC_SEARCH_PASSWORD;
  if (!elasticSearchUrl || !elasticSearchUsername || !elasticSearchPassword)
    throw new Error("Elastic Search URL not set in environment variables");
  const elasticClient = new Client({
    node: elasticSearchUrl,
    auth: {
      username: elasticSearchUsername,
      password: elasticSearchPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  const pterodactylURL = process.env.PTERODACTYL_URL;
  const pterodactylClientToken = process.env.PTERODACTYL_CLIENT_TOKEN;
  if (!pterodactylURL || !pterodactylClientToken)
    throw new Error(
      "Pterodactyl URL or Client Token not set in environment variables"
    );
  const pterodactyl = new Builder()
    .setURL(pterodactylURL)
    .setAPIKey(pterodactylClientToken)
    .asAdmin();

  const servers = await pterodactyl.getServers();
  servers.forEach(async (server) => {
    const serverId = server.identifier;
    const { data } = await getWebsocketData(
      pterodactylURL,
      pterodactylClientToken,
      serverId
    );
    const { socket, token } = data.data;
    const ws = new WebSocket(socket);
    if (!ws) throw new Error("Websocket not connected");

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          event: "auth",
          args: [token],
        })
      );
    });
    ws.on("message", async (messageData) => {
      const { event, args } = JSON.parse(
        messageData.toString()
      ) as WebsocketData;
      switch (event) {
        case WebsocketEvent.ConsoleOutput:
          {
            const message = args[0];
            if (message) {
              await elasticClient.index({
                index: "pterodactyl-logs",
                body: {
                  date: new Date(),
                  server: server.name,
                  serverId,
                  message: parseMessage(message),
                },
              });
            }
          }
          break;
        case WebsocketEvent.TokenExpiring:
          {
            const wsData = await getWebsocketData(
              pterodactylURL,
              pterodactylClientToken,
              serverId
            );

            ws.send(
              JSON.stringify({
                event: "auth",
                args: [wsData.data.data.token],
              })
            );
          }
          break;
        default:
          break;
      }
    });
  });
};
