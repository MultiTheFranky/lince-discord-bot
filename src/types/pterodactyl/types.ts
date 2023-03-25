export enum WebsocketEvent {
  Sucess = "auth success",
  Status = "status",
  ConsoleOutput = "console output",
  Stats = "stats",
  TokenExpiring = "token expiring",
  TokenExpired = "token expired",
}

export interface WebsocketData {
  event: WebsocketEvent;
  args?: any;
}
