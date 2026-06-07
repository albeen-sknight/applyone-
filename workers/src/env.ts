export type ApplyOneEnv = Env & {
  AI_PROVIDER?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  OWNER_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
  ALLOWED_ORIGINS?: string;
};
