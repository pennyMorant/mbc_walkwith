import type { AppConfig } from "../../../config/env.js";
import { appError } from "../../../shared/http/app-error.js";

export type MemberEmailVerificationInput = {
  email: string;
  code: string;
  expiresInSeconds: number;
  purpose: "registration" | "password_reset";
};

export interface MemberEmailVerificationProvider {
  sendVerificationCode(input: MemberEmailVerificationInput): Promise<void>;
}

export function createMemberEmailVerificationProvider(
  config: AppConfig
): MemberEmailVerificationProvider | undefined {
  if (config.nodeEnv !== "production") {
    return new DevelopmentMemberEmailVerificationProvider();
  }
  if (
    config.memberEmailProvider !== "resend" ||
    !config.memberEmailResendApiKey ||
    !config.memberEmailFrom
  ) {
    return undefined;
  }
  return new ResendMemberEmailVerificationProvider({
    apiKey: config.memberEmailResendApiKey,
    from: config.memberEmailFrom,
    replyTo: config.memberEmailReplyTo,
    timeoutMs: config.memberEmailHttpTimeoutMs
  });
}

class DevelopmentMemberEmailVerificationProvider
  implements MemberEmailVerificationProvider {
  async sendVerificationCode(_input: MemberEmailVerificationInput): Promise<void> {}
}

class ResendMemberEmailVerificationProvider
  implements MemberEmailVerificationProvider {
  constructor(
    private readonly config: {
      apiKey: string;
      from: string;
      replyTo: string | undefined;
      timeoutMs: number;
    }
  ) {}

  async sendVerificationCode(input: MemberEmailVerificationInput): Promise<void> {
    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.config.apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          from: this.config.from,
          to: [input.email],
          ...(this.config.replyTo ? { reply_to: this.config.replyTo } : {}),
          subject:
            input.purpose === "password_reset"
              ? "Reset your MBCG password"
              : "Verify your MBCG account",
          text:
            input.purpose === "password_reset"
              ? `Your password reset code is ${input.code}. It expires in ${Math.ceil(input.expiresInSeconds / 60)} minutes.`
              : `Your verification code is ${input.code}. It expires in ${Math.ceil(input.expiresInSeconds / 60)} minutes.`
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs)
      });
    } catch {
      throw emailDeliveryFailed("request_failed");
    }
    if (!response.ok) {
      throw emailDeliveryFailed(`http_${response.status}`);
    }
  }
}

function emailDeliveryFailed(reason: string) {
  return appError({
    code: "member_email_delivery_failed",
    category: "external_dependency_failed",
    sourceLayer: "capability",
    statusCode: 502,
    message: "Email verification delivery failed.",
    recoverable: true,
    retryable: true,
    evidence: { provider: "resend", reason },
    nextAction: "retry"
  });
}
