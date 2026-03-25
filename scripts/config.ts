if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile();
}

export const env = {
  HALOPSA_BASE_URL: process.env.HALOPSA_BASE_URL ?? "",
  HALOPSA_CLIENT_ID: process.env.HALOPSA_CLIENT_ID ?? "",
  HALOPSA_CLIENT_SECRET: process.env.HALOPSA_CLIENT_SECRET ?? "",
  HALOPSA_REPORT_OPEN_CLOSED_TODAY_ID:
    process.env.HALOPSA_REPORT_OPEN_CLOSED_TODAY_ID ?? "304"
};
