if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export const env = {
  HALOPSA_BASE_URL: process.env.HALOPSA_BASE_URL ?? "",
  HALOPSA_CLIENT_ID: process.env.HALOPSA_CLIENT_ID ?? "",
  HALOPSA_CLIENT_SECRET: process.env.HALOPSA_CLIENT_SECRET ?? "",
  HALOPSA_REPORT_OPEN_CLOSED_TODAY_ID:
    process.env.HALOPSA_REPORT_OPEN_CLOSED_TODAY_ID ?? "304",
  HALOPSA_REPORT_RESPONSE_TIME_ID:
    process.env.HALOPSA_REPORT_RESPONSE_TIME_ID ?? "352",
  HALOPSA_REPORT_RESOLUTION_TIME_ID:
    process.env.HALOPSA_REPORT_RESOLUTION_TIME_ID ?? "353",
  HALOPSA_REPORT_SLA_RESOLUTION_ID:
    process.env.HALOPSA_REPORT_SLA_RESOLUTION_ID ?? "349",
  HALOPSA_REPORT_SLA_RESPONSE_ID:
    process.env.HALOPSA_REPORT_SLA_RESPONSE_ID ?? "350"
};
