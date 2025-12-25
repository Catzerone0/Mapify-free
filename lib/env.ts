import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),

    NEXTAUTH_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().min(32),

    ENCRYPTION_KEY: z.string().min(32),

    REDIS_URL: z.string().url().optional(),

    TAVILY_API_KEY: z.string().optional(),
    SERPAPI_API_KEY: z.string().optional(),
    BING_SEARCH_API_KEY: z.string().optional(),

    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),

    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

    ALLOWED_ORIGINS: z.string().optional(),

    RATE_LIMIT_MAX_REQUESTS: z
      .string()
      .transform((v) => Number(v))
      .pipe(z.number().int().positive())
      .default("10"),
    RATE_LIMIT_WINDOW_MS: z
      .string()
      .transform((v) => Number(v))
      .pipe(z.number().int().positive())
      .default("60000"),
  },

  client: {
    NEXT_PUBLIC_APP_NAME: z.string().default("MindMap"),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_API_BASE: z.string().url().default("http://localhost:3000/api"),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,

    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,

    REDIS_URL: process.env.REDIS_URL,

    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
    BING_SEARCH_API_KEY: process.env.BING_SEARCH_API_KEY,

    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,

    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,

    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,

    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
  },

  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});

export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";

export const getAllowedOrigins = (): string[] => {
  if (!env.ALLOWED_ORIGINS) return [];
  return env.ALLOWED_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
};

export const hasRedis = (): boolean => {
  return !!env.REDIS_URL;
};

export const hasWebSearch = (): boolean => {
  return !!(env.TAVILY_API_KEY || env.SERPAPI_API_KEY || env.BING_SEARCH_API_KEY);
};

export const getWebSearchProviders = (): Array<"tavily" | "serpapi" | "bing"> => {
  const providers: Array<"tavily" | "serpapi" | "bing"> = [];
  if (env.TAVILY_API_KEY) providers.push("tavily");
  if (env.SERPAPI_API_KEY) providers.push("serpapi");
  if (env.BING_SEARCH_API_KEY) providers.push("bing");
  return providers;
};

if (typeof window === "undefined" && env.NODE_ENV === "development") {
  try {
    process.stdout.write(
      `[ENV] initialized ${JSON.stringify({
        nodeEnv: env.NODE_ENV,
        databaseConfigured: !!env.DATABASE_URL,
        nextAuthUrlConfigured: !!env.NEXTAUTH_URL,
        encryptionConfigured: !!env.ENCRYPTION_KEY,
        redisConfigured: !!env.REDIS_URL,
        webSearchProviders: getWebSearchProviders(),
        hasServerOpenAiKey: !!env.OPENAI_API_KEY,
        hasServerGeminiKey: !!env.GEMINI_API_KEY,
      })}\n`
    );
  } catch {
    // ignore
  }
}

export default env;
