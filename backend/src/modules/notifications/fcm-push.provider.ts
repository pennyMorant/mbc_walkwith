import type { MemberPushDevice } from "@mbc/api-contracts";
import jwt from "jsonwebtoken";

import { appError } from "../../shared/http/app-error.js";
import type {
  PushMessage,
  PushProvider,
  PushSendResult
} from "./push.provider.js";

type FcmServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type AccessTokenCache = {
  token: string;
  expiresAt: number;
};

export class FcmPushProvider implements PushProvider {
  private accessTokenCache: AccessTokenCache | null = null;

  constructor(
    private readonly serviceAccount: FcmServiceAccount,
    private readonly options: {
      timeoutMs: number;
      onInvalidToken?: (pushToken: string) => Promise<void>;
    }
  ) {}

  async sendToDevices(
    devices: MemberPushDevice[],
    message: PushMessage
  ): Promise<PushSendResult> {
    validatePushMessage(message);
    if (devices.length === 0) {
      return {
        attempted: 0,
        sent: 0,
        failed: 0,
        revokedTokens: 0
      };
    }

    const accessToken = await this.getAccessToken();
    let sent = 0;
    let failed = 0;
    let revokedTokens = 0;
    const retryDeviceIds: string[] = [];

    for (const device of devices) {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${this.serviceAccount.project_id}/messages:send`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            message: messageForDevice(device, message)
          }),
          signal: AbortSignal.timeout(this.options.timeoutMs)
        }
      ).catch(() => null);

      if (response?.ok) {
        sent += 1;
        continue;
      }

      failed += 1;
      retryDeviceIds.push(device.id);
      const raw = response ? await response.text() : "";
      if (
        raw.includes("UNREGISTERED") ||
        raw.includes("registration-token-not-registered") ||
        raw.includes("SENDER_ID_MISMATCH")
      ) {
        revokedTokens += 1;
        await this.options.onInvalidToken?.(device.pushToken);
      }
    }

    return {
      attempted: devices.length,
      sent,
      failed,
      revokedTokens,
      retryDeviceIds
    };
  }

  private async getAccessToken() {
    const now = Date.now();
    if (
      this.accessTokenCache &&
      this.accessTokenCache.expiresAt - now > 60 * 1000
    ) {
      return this.accessTokenCache.token;
    }

    const issuedAt = Math.floor(now / 1000);
    const expiresAt = issuedAt + 3600;
    let assertion: string;
    try {
      assertion = jwt.sign(
        {
          iss: this.serviceAccount.client_email,
          scope: "https://www.googleapis.com/auth/firebase.messaging",
          aud:
            this.serviceAccount.token_uri ??
            "https://oauth2.googleapis.com/token",
          iat: issuedAt,
          exp: expiresAt
        },
        this.serviceAccount.private_key,
        { algorithm: "RS256" }
      );
    } catch (error) {
      throw notificationProviderUnavailable(
        "Failed to sign Firebase access token request.",
        error
      );
    }

    const response = await fetch(
      this.serviceAccount.token_uri ?? "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion
        }),
        signal: AbortSignal.timeout(this.options.timeoutMs)
      }
    ).catch((error: unknown) => {
      throw notificationProviderUnavailable(
        "Failed to fetch Firebase access token.",
        error
      );
    });
    if (!response.ok) {
      throw notificationProviderUnavailable(
        "Failed to fetch Firebase access token.",
        { status: response.status }
      );
    }
    const body = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!body.access_token) {
      throw notificationProviderUnavailable(
        "Firebase access token response was invalid."
      );
    }

    this.accessTokenCache = {
      token: body.access_token,
      expiresAt: now + (body.expires_in ?? 3600) * 1000
    };
    return body.access_token;
  }
}

function validatePushMessage(message: PushMessage) {
  if (
    !message.type.trim() ||
    !message.title.trim() ||
    !message.body.trim()
  ) {
    throw appError({
      code: "notification_payload_invalid",
      category: "validation_error",
      sourceLayer: "capability",
      statusCode: 400,
      message: "Push notification payload is invalid.",
      recoverable: true,
      retryable: false,
      evidence: { type: message.type },
      nextAction: "review_request"
    });
  }
}

function notificationProviderUnavailable(message: string, error?: unknown) {
  return appError({
    code: "notification_provider_unavailable",
    category: "external_dependency_failed",
    sourceLayer: "capability",
    statusCode: 503,
    message,
    recoverable: true,
    retryable: true,
    evidence: { provider: "fcm" },
    nextAction: "retry",
    details:
      error instanceof Error
        ? { message: error.message }
        : typeof error === "object" && error !== null
          ? (error as Record<string, unknown>)
          : {}
  });
}

function messageForDevice(device: MemberPushDevice, message: PushMessage) {
  const data = {
    type: message.type,
    ...(message.route ? { route: message.route } : {}),
    ...(message.data ?? {})
  };

  return {
    token: device.pushToken,
    notification: {
      title: message.title,
      body: message.body
    },
    data,
    android: {
      priority: "high",
      notification: {
        channelId: "church_updates",
        clickAction: "FLUTTER_NOTIFICATION_CLICK"
      }
    },
    apns: {
      headers: {
        "apns-priority": "10"
      },
      payload: {
        aps: {
          sound: "default"
        }
      }
    }
  };
}
