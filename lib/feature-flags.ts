export enum FeatureFlag {
  // Authentication
  PASSWORDLESS_AUTH = "passwordless-auth",
  OAUTH_GOOGLE = "oauth-google",
  OAUTH_GITHUB = "oauth-github",

  // Features
  MULTI_TENANT_ORGS = "multi-tenant-orgs",
  USAGE_METERING = "usage-metering",
  ADMIN_DASHBOARD = "admin-dashboard",
  EXPORT_MINDMAP = "export-mindmap",
  TEMPLATES = "templates",

  // LLM Features
  LLM_INTEGRATION = "llm-integration",
  OPENAI_MODELS = "openai-models",
  ANTHROPIC_MODELS = "anthropic-models",
  GOOGLE_MODELS = "google-models",
}

type FeatureFlagConfig = Record<FeatureFlag, boolean>;

const defaultFlags: FeatureFlagConfig = {
  // Authentication - basic passwordless for MVP
  [FeatureFlag.PASSWORDLESS_AUTH]: true,
  [FeatureFlag.OAUTH_GOOGLE]: false,
  [FeatureFlag.OAUTH_GITHUB]: false,

  // Features - core features for MVP
  [FeatureFlag.MULTI_TENANT_ORGS]: false, // Nice-to-have
  [FeatureFlag.USAGE_METERING]: false, // Nice-to-have
  [FeatureFlag.ADMIN_DASHBOARD]: false, // Nice-to-have
  [FeatureFlag.EXPORT_MINDMAP]: true,
  [FeatureFlag.TEMPLATES]: true,

  // LLM Features
  [FeatureFlag.LLM_INTEGRATION]: true,
  [FeatureFlag.OPENAI_MODELS]: true,
  [FeatureFlag.ANTHROPIC_MODELS]: true,
  [FeatureFlag.GOOGLE_MODELS]: false,
};

class FeatureFlagManager {
  private flags: FeatureFlagConfig = defaultFlags;

  isEnabled(flag: FeatureFlag): boolean {
    return this.flags[flag] ?? false;
  }

  setFlag(flag: FeatureFlag, enabled: boolean) {
    this.flags[flag] = enabled;
  }

  getAll(): FeatureFlagConfig {
    return { ...this.flags };
  }

  reset() {
    this.flags = { ...defaultFlags };
  }
}

export const featureFlags = new FeatureFlagManager();

// Hook for React components
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return featureFlags.isEnabled(flag);
}
