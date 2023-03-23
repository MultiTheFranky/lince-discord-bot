import { config } from "dotenv";
/**
 * Function to get the current environment.
 * @returns The current environment variables.
 */
export function loadEnvironmentVariables<T>(): T {
  config();
  return process.env as unknown as T;
}
