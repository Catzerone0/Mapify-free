import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().min(32),
    ENCRYPTION_KEY: z.string().min(32),
    REDIS_URL: z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().default("MindMap"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    REDIS_URL: process.env.REDIS_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
