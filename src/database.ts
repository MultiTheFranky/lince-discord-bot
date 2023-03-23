import { existsSync, mkdirSync } from "fs";
import JSONdb from "simple-json-db";

// eslint-disable-next-line import/no-mutable-exports
export let db: JSONdb;
export const initDB = async () => {
  // Create folder if not exists
  if (!existsSync("./db")) {
    mkdirSync("./db");
  }
  db = new JSONdb("./db/db.json");
};

export const writeToDB = async (key: string, value: any) => {
  db.set(key, value);
};

export const readFromDB = async (key: string) => db.get(key);

export const deleteFromDB = async (key: string) => db.delete(key);

export const getAllFromDB = async () => db.JSON();
