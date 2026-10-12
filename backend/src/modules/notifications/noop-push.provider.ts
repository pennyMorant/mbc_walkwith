import type { MemberPushDevice } from "@mbc/api-contracts";

import { appError } from "../../shared/http/app-error.js";
import type { PushMessage, PushProvider, PushSendResult } from "./push.provider.js";

export class NoopPushProvider implements PushProvider {
  async sendToDevices(
    devices: MemberPushDevice[],
    _message: PushMessage
  ): Promise<PushSendResult> {
    if (devices.length > 0) {
      throw appError({
        code: "notification_provider_unavailable",
        category: "external_dependency_failed",
        sourceLayer: "capability",
        statusCode: 503,
        message: "Push delivery provider is not configured.",
        recoverable: true,
        retryable: true,
        evidence: { provider: "unconfigured" },
        nextAction: "retry"
      });
    }
    return {
      attempted: 0,
      sent: 0,
      failed: 0,
      revokedTokens: 0
    };
  }
}
