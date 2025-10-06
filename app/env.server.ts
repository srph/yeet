import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // AWS S3 Configuration
  AWS_REGION: z.string().min(1, "AWS_REGION is required"),
  AWS_ENDPOINT: z.string().url("AWS_ENDPOINT must be a valid URL"),
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
  AWS_BUCKET_NAME: z.string().min(1, "AWS_BUCKET_NAME is required"),
  AWS_BASE_DIRECTORY: z.string().min(1, "AWS_BASE_DIRECTORY is required"),

  // YouTube Player ID (for youtubei.js)
  PLAYER_ID: z.string().min(1, "PLAYER_ID is required"),
});

export const env = envSchema.parse(process.env);
