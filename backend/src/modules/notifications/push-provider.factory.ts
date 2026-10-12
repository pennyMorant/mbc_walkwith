import type { AppConfig } from "../../config/env.js";
import { FcmPushProvider } from "./fcm-push.provider.js";
import { NoopPushProvider } from "./noop-push.provider.js";
import type { PushProvider } from "./push.provider.js";

export function createPushProvider(
  config: AppConfig,
  options: {
    onInvalidToken?: (pushToken: string) => Promise<void>;
  } = {}
): PushProvider {
  const json = config.fcmServiceAccountJson?.trim();
  if (!json) {
    return new NoopPushProvider();
  }

  const parsed = JSON.parse(json) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
    token_uri?: string;
  };
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    return new NoopPushProvider();
  }

  return new FcmPushProvider(
    {
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      private_key: parsed.private_key,
      ...(parsed.token_uri ? { token_uri: parsed.token_uri } : {})
    },
    {
      timeoutMs: config.fcmHttpTimeoutMs,
      ...(options.onInvalidToken
        ? { onInvalidToken: options.onInvalidToken }
        : {})
    }
  );
}
